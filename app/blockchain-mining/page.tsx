"use client";

import { expectedSeconds, expectedTries, miningDemoCopy } from "@/content/miningDemo";
import { estimateHashRate, hashWithNonce, meetsDifficulty } from "@/lib/sha256/pow";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { DM_Mono, DM_Sans } from "next/font/google";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const dmSans = DM_Sans({ subsets: ["latin", "latin-ext"], weight: ["400", "500", "600"], variable: "--font-dm-sans" });
const dmMono = DM_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-dm-mono" });

const BATCH_SIZE = 2500;
const MAX_ATTEMPTS = 2_000_000;
const DISPLAY_EVERY_ATTEMPTS = 500;
const MAX_SAMPLES = 60;
const MAX_DIFF = 8;
const SPARK_BARS = 12;
const TRIES_SHORT = ["16", "256", "4K", "65K", "1M", "16M", "268M", "4B"] as const;

type Sample = {
  t: number;
  rate: number;
};

function formatSeconds(seconds: number): string {
  if (!Number.isFinite(seconds)) return "∞";
  if (seconds < 1) return `${(seconds * 1000).toFixed(0)} ms`;
  if (seconds < 60) return `${seconds.toFixed(1)} s`;
  const minutes = seconds / 60;
  if (minutes < 60) return `${minutes.toFixed(1)} min`;
  return `${(minutes / 60).toFixed(2)} h`;
}

function formatAttempts(n: number): string {
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return String(n);
}

function formatRate(r: number): string {
  if (r >= 1_000_000) return `${Math.round(r / 1_000_000)}M`;
  if (r >= 1000) return `${Math.round(r / 1000)}k`;
  return String(Math.round(r));
}

function formatTime(ms: number): string {
  if (ms < 1000) return `${ms.toFixed(0)}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

type CardProps = { className?: string; accent?: boolean; children: React.ReactNode };

function Card({ className = "", accent, children }: CardProps) {
  return (
    <div
      className={`rounded-xl border border-zinc-200 bg-white p-5 ${accent ? "border-l-[3px] border-l-cyan-600" : ""} ${className} `}
      style={{ boxShadow: "0 2px 12px rgba(6, 182, 212, 0.08)" }}
    >
      {children}
    </div>
  );
}

function SparkBars({ samples }: { samples: Sample[] }) {
  const bars = useMemo(() => {
    const slice = samples.slice(-SPARK_BARS);
    const arr: number[] = Array.from({ length: SPARK_BARS }, () => 0);
    for (let i = 0; i < slice.length; i++) {
      arr[SPARK_BARS - slice.length + i] = slice[i]!.rate;
    }
    const max = Math.max(1, ...arr);
    return arr.map((v, i) => ({ v, h: Math.max(2, Math.round((v / max) * 40)), hot: v > max * 0.7, key: i }));
  }, [samples]);

  return (
    <div className="mt-2.5 flex h-10 items-end gap-[3px]">
      {bars.map(({ h, hot, key: barKey }) => (
        <div
          key={barKey}
          className="min-h-[2px] flex-1 rounded-t"
          style={{
            height: h,
            background: hot ? "#22c97a" : "rgb(207 250 254 / 0.9)" /* cyan-200/90 */,
            transition: "height 0.3s, background 0.2s",
            borderRadius: "3px 3px 0 0",
          }}
        />
      ))}
    </div>
  );
}

function DifficultyScale({ active: activeD }: { active: number }) {
  const tries8 = [1, 2, 3, 4, 5, 6, 7, 8].map((d) => expectedTries(d));
  const maxLog = Math.log10(tries8[7]!);

  return (
    <div className="mt-1.5">
      {tries8.map((t, i) => {
        const d = i + 1;
        const pct = Math.round((Math.log10(t) / maxLog) * 100);
        const active = d === activeD;
        return (
          <div key={d} className="flex items-center justify-between border-b border-zinc-100 py-1.5 last:border-b-0">
            <span className="text-[11px] text-zinc-500">{`d=${d}`}</span>
            <div className="mx-2.5 min-w-0 flex-1">
              <div
                className="h-1 rounded"
                style={{
                  width: `${pct}%`,
                  background: "linear-gradient(90deg, #0891b2, #22c97a)",
                  opacity: active ? 1 : 0.35,
                }}
              />
            </div>
            <span
              className="shrink-0 text-xs font-medium"
              style={{ color: active ? "#d97706" : "#a1a1aa" }}
            >
              {TRIES_SHORT[i]}
            </span>
          </div>
        );
      })}
    </div>
  );
}

export default function BlockchainMiningPage() {
  const [data, setData] = useState("Alice → Bob: 1 BTC");
  const [nonce, setNonce] = useState(0);
  const [difficulty, setDifficulty] = useState(4);
  const [hashHex, setHashHex] = useState(() => hashWithNonce("Alice → Bob: 1 BTC", 0));
  const [isValid, setIsValid] = useState(() => meetsDifficulty(hashWithNonce("Alice → Bob: 1 BTC", 0), 4));

  const [isSearching, setIsSearching] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startMs, setStartMs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [searchNonce, setSearchNonce] = useState(0);
  const [searchDone, setSearchDone] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [hashFlashSeed, setHashFlashSeed] = useState(0);
  const [statusMsg, setStatusMsg] = useState<"searching" | "idle" | "rejected" | "error">("idle");

  const lastHashRef = useRef(hashHex);
  const lastSampleMsRef = useRef(0);

  const hashRate = useMemo(() => estimateHashRate(attempts, elapsedMs), [attempts, elapsedMs]);
  const expectedForCurrent = expectedTries(difficulty);
  const leadingTarget = "0".repeat(difficulty);
  const maxTries = expectedTries(8);
  const maxLog = Math.log10(maxTries);
  const barWidthPct = Math.max(6, (Math.log10(expectedForCurrent) / maxLog) * 100);
  const hashZeroPrefix = hashHex.match(/^0*/)![0];
  const hashRest = hashHex.slice(hashZeroPrefix.length);

  const checkNonce = (nextData = data, nextNonce = nonce, nextDifficulty = difficulty) => {
    const next = hashWithNonce(nextData, nextNonce);
    setHashHex(next);
    const ok = meetsDifficulty(next, nextDifficulty);
    setIsValid(ok);
    setHashFlashSeed((v) => v + 1);
    lastHashRef.current = next;
    return ok;
  };

  const resetSearch = () => {
    setIsSearching(false);
    setAttempts(0);
    setElapsedMs(0);
    setStartMs(0);
    setSearchNonce(0);
    setSearchDone(false);
    setSearchError(null);
    setSamples([]);
  };

  const fullReset = () => {
    resetSearch();
    setNonce(0);
    setStatusMsg("idle");
    checkNonce(data, 0, difficulty);
  };

  useEffect(() => {
    if (difficulty > MAX_DIFF) {
      setDifficulty(MAX_DIFF);
    }
  }, [difficulty]);

  useEffect(() => {
    if (!isSearching) return;

    const runBatch = () => {
      let current = searchNonce;
      let localAttempts = 0;
      let displayHash = lastHashRef.current;
      let foundNonce = -1;

      for (let i = 0; i < BATCH_SIZE; i++) {
        const candidateHash = hashWithNonce(data, current);
        localAttempts++;
        if (localAttempts % DISPLAY_EVERY_ATTEMPTS === 0) {
          displayHash = candidateHash;
        }
        if (meetsDifficulty(candidateHash, difficulty)) {
          displayHash = candidateHash;
          foundNonce = current;
          break;
        }
        current++;
      }

      const now = performance.now();
      const nextAttempts = attempts + localAttempts;
      setAttempts(nextAttempts);
      const nextElapsed = now - startMs;
      setElapsedMs(nextElapsed);
      if (displayHash !== lastHashRef.current) {
        setHashHex(displayHash);
        setIsValid(meetsDifficulty(displayHash, difficulty));
        setHashFlashSeed((v) => v + 1);
        lastHashRef.current = displayHash;
      }

      if (now - lastSampleMsRef.current > 180) {
        const instantRate = estimateHashRate(nextAttempts, nextElapsed);
        setSamples((prev) => [...prev.slice(-(MAX_SAMPLES - 1)), { t: now, rate: instantRate }]);
        lastSampleMsRef.current = now;
      }

      if (foundNonce >= 0) {
        setNonce(foundNonce);
        setHashHex(displayHash);
        setIsValid(true);
        setIsSearching(false);
        setSearchDone(true);
        setStatusMsg("idle");
        setToast(`Valid nonce: ${foundNonce.toLocaleString()}`);
        setSearchNonce(current);
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.25 },
        });
        return;
      }

      if (nextAttempts >= MAX_ATTEMPTS) {
        setIsSearching(false);
        setSearchError("Лимит попыток достигнут. Уменьшите сложность или измените data.");
        setStatusMsg("error");
        return;
      }

      setSearchNonce(current);
    };

    const timer = window.setTimeout(runBatch, 0);
    return () => window.clearTimeout(timer);
  }, [attempts, data, difficulty, isSearching, searchNonce, startMs]);

  useEffect(() => {
    if (!toast) return;
    const t = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(t);
  }, [toast]);

  const startSearch = () => {
    if (isSearching) return;
    setIsSearching(true);
    setSearchDone(false);
    setSearchError(null);
    setAttempts(0);
    setSearchNonce(0);
    setStatusMsg("searching");
    setStartMs(performance.now());
    setElapsedMs(0);
    setSamples([]);
    lastSampleMsRef.current = performance.now();
  };

  const stopSearch = () => {
    setIsSearching(false);
    if (searchDone) return;
    setStatusMsg("idle");
  };

  const handleCheck = () => {
    const ok = checkNonce();
    setStatusMsg(ok ? "idle" : "rejected");
  };

  const onDataChange = (next: string) => {
    if (next.length > 120) return;
    setData(next);
    checkNonce(next, nonce, difficulty);
    setStatusMsg("idle");
    resetSearch();
  };

  const onDifficultyChange = (next: number) => {
    setDifficulty(next);
    setStatusMsg("idle");
    checkNonce(data, nonce, next);
    resetSearch();
  };

  const pips = Array.from({ length: 8 }, (_, i) => i < difficulty);

  return (
    <div
      className={`min-h-screen bg-zinc-50 px-4 py-6 text-zinc-900 ${dmSans.className} ${dmMono.variable}`}
    >
      <div className="sr-only">
        <h1>{miningDemoCopy.title}</h1>
      </div>
      <AnimatePresence>
        {toast ? (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -12 }}
            className="fixed left-1/2 top-4 z-50 -translate-x-1/2 rounded-full border border-emerald-300 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-800 shadow-md"
          >
            {toast}
          </motion.div>
        ) : null}
      </AnimatePresence>

      <div className="mx-auto mb-4 max-w-5xl text-right text-sm text-cyan-700">
        <Link href="/" className="font-medium hover:underline">
          ← На главную
        </Link>
      </div>

      <div className="relative mx-auto min-h-[520px] max-w-5xl overflow-hidden rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm md:p-8">
        <div className="pointer-events-none absolute -right-20 -top-20 h-64 w-64 rounded-full bg-gradient-to-br from-cyan-200/40 to-transparent" />
        <div className="pointer-events-none absolute -bottom-16 -left-16 h-52 w-52 rounded-full bg-gradient-to-tr from-emerald-100/50 to-transparent" />

        <div className="relative z-10">
          <p className="mb-1 text-center text-xs text-zinc-500">SDU Edu · {miningDemoCopy.title}</p>
          <p className="mb-4 text-center text-sm text-zinc-800">{miningDemoCopy.intro}</p>
          <p className="mb-6 text-center text-[10px] text-zinc-500">{miningDemoCopy.disclaimer}</p>

          <div className="mb-4 flex items-center gap-2">
            <div className="text-xl font-semibold leading-none tracking-[-0.5px] text-cyan-700">⬡ SHA-256 Mining</div>
            <div className="rounded-full border border-cyan-200 bg-cyan-50 px-2.5 py-0.5 text-[10px] font-medium uppercase tracking-wider text-cyan-800">
              PROOF OF WORK
            </div>
            <div className="ml-auto text-[11px] text-zinc-500">SDU Edu · Interactive Demo</div>
          </div>

          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <Card accent>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">
                  Block data{" "}
                  <span className="ml-1.5 rounded-full bg-cyan-50 px-2 py-0.5 text-[9px] tracking-wider text-cyan-800">EDITABLE</span>
                </div>
                <textarea
                  value={data}
                  onChange={(e) => onDataChange(e.target.value)}
                  maxLength={120}
                  rows={2}
                  placeholder="Type your transaction here…"
                  className="box-border w-full resize-none rounded-lg border border-zinc-300 bg-zinc-50 px-3 py-2.5 font-mono text-[13px] leading-relaxed text-zinc-900 outline-none transition focus:border-cyan-500 focus:shadow-[0_0_0_3px_rgba(6,182,212,0.2)]"
                />
                <div className="mt-1 flex items-center justify-between text-[10px] text-zinc-400">
                  <span>✏️ Edit block data — the hash will change completely</span>
                  <span>
                    {data.length}/120
                  </span>
                </div>
              </Card>

              <Card>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Nonce</div>
                <input
                  type="number"
                  min={0}
                  value={nonce}
                  onChange={(e) => {
                    const nextN = Math.max(0, Number(e.target.value) || 0);
                    setNonce(nextN);
                    setStatusMsg("idle");
                    checkNonce(data, nextN, difficulty);
                    resetSearch();
                  }}
                  className={`w-full min-w-0 border-0 bg-transparent p-0 text-5xl font-semibold leading-none tracking-[-2px] text-zinc-900 outline-none md:text-[3rem] ${dmMono.className}`}
                />
              </Card>

              <Card>
                <div className="mb-1 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Difficulty</div>
                <div className="flex items-center gap-3.5">
                  <div className="min-w-[3rem] text-4xl font-semibold text-amber-600 [font-family:var(--font-dm-mono),ui-monospace,monospace]">
                    {difficulty}
                  </div>
                  <div className="min-w-0 flex-1">
                    <input
                      type="range"
                      min={1}
                      max={MAX_DIFF}
                      value={difficulty}
                      onChange={(e) => onDifficultyChange(Number(e.target.value))}
                      className="w-full accent-cyan-600"
                    />
                    <div className="mt-1.5 flex gap-1.5">
                      {pips.map((on, i) => (
                        <div
                          key={i}
                          className="h-1.5 w-3 rounded"
                          style={{ background: on ? "#d97706" : "rgb(228 228 231)", transition: "background 0.2s" }}
                        />
                      ))}
                    </div>
                  </div>
                </div>
                <p className="mt-1.5 text-[11px] text-zinc-500">
                  Expected:{" "}
                  <span className="font-semibold text-amber-600">{expectedForCurrent.toLocaleString()}</span> attempts
                </p>
                <div className="mt-1 h-1.5 w-full max-w-sm rounded bg-zinc-200">
                  <div
                    className="h-1.5 rounded bg-gradient-to-r from-cyan-500 to-emerald-500"
                    style={{ width: `${barWidthPct}%` }}
                  />
                </div>
              </Card>

              <div className="mt-0 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={startSearch}
                  disabled={isSearching}
                  className="cursor-pointer rounded-lg border-2 border-cyan-600 bg-cyan-600 px-[18px] py-2 text-xs font-semibold text-white transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  ▶ Mine
                </button>
                <button
                  type="button"
                  onClick={handleCheck}
                  className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-[18px] py-2 text-xs font-semibold text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-50"
                >
                  Check
                </button>
                <button
                  type="button"
                  onClick={stopSearch}
                  className="cursor-pointer rounded-lg border border-rose-200 bg-white px-[18px] py-2 text-xs font-semibold text-rose-600 transition hover:bg-rose-50"
                >
                  ■ Stop
                </button>
                <button
                  type="button"
                  onClick={fullReset}
                  className="cursor-pointer rounded-lg border border-zinc-300 bg-white px-[18px] py-2 text-xs font-semibold text-cyan-700 transition hover:border-cyan-400 hover:bg-cyan-50"
                >
                  ↺ Reset
                </button>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Card>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Hash output</div>
                <div className="rounded-lg border border-zinc-200 bg-zinc-50 px-3.5 py-3">
                  {hashHex ? (
                    <p className={`${dmMono.className} break-all text-[11px] leading-8`} key={hashFlashSeed}>
                      {hashZeroPrefix ? (
                        <span className="font-semibold text-emerald-700 [box-decoration-break:clone] rounded-sm bg-emerald-50 px-0.5">
                          {hashZeroPrefix}
                        </span>
                      ) : null}
                      <span className="text-zinc-400">{hashRest}</span>
                    </p>
                  ) : (
                    <span className={`${dmMono.className} text-zinc-400`}>—</span>
                  )}
                </div>
                <div
                  className={`mt-2.5 flex items-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-medium ${
                    isValid && !isSearching
                      ? "border-emerald-200 bg-emerald-50 text-emerald-800"
                      : "border-zinc-200 bg-zinc-50 text-zinc-500"
                  }`}
                >
                  {isSearching ? <div className="h-2 w-2 flex-shrink-0 animate-pulse rounded-full bg-cyan-600" /> : null}
                  <span>
                    {searchError
                      ? searchError
                      : isSearching
                        ? "Searching for valid nonce…"
                        : searchDone && isValid
                          ? `Valid nonce: ${nonce.toLocaleString()}`
                          : statusMsg === "rejected" && !isValid
                            ? "Hash does not meet difficulty target"
                            : isValid
                              ? `Target met (leading ${leadingTarget})`
                              : "Run Mine or set nonce & Check"}
                  </span>
                </div>
              </Card>

              <Card>
                <div className="mb-2 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Live metrics</div>
                <div className="grid grid-cols-3 gap-2">
                  <div className="rounded-lg border border-zinc-200 bg-cyan-50/60 p-2.5 text-center">
                    <div className="text-lg font-semibold text-cyan-800 [font-family:var(--font-dm-mono),ui-monospace,monospace]">
                      {formatAttempts(attempts)}
                    </div>
                    <div className="mt-0.5 text-[9px] font-semibold tracking-widest text-zinc-500">ATTEMPTS</div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-cyan-50/60 p-2.5 text-center">
                    <div className="text-lg font-semibold text-cyan-800 [font-family:var(--font-dm-mono),ui-monospace,monospace]">
                      {formatRate(hashRate)}
                    </div>
                    <div className="mt-0.5 text-[9px] font-semibold tracking-widest text-zinc-500">H / S</div>
                  </div>
                  <div className="rounded-lg border border-zinc-200 bg-cyan-50/60 p-2.5 text-center">
                    <div className="text-lg font-semibold text-cyan-800 [font-family:var(--font-dm-mono),ui-monospace,monospace]">
                      {formatTime(elapsedMs)}
                    </div>
                    <div className="mt-0.5 text-[9px] font-semibold tracking-widest text-zinc-500">ELAPSED</div>
                  </div>
                </div>
                <SparkBars samples={samples} />
                <p className="mt-2 text-[10px] text-zinc-500">
                  Est. at current rate: <span className="font-mono text-cyan-800">{formatSeconds(expectedSeconds(difficulty, hashRate))}</span>
                </p>
              </Card>

              <Card>
                <div className="mb-0.5 text-[10px] font-semibold uppercase tracking-widest text-zinc-500">Difficulty scale (16^d)</div>
                <DifficultyScale active={difficulty} />
                <p className="mt-2 text-[10px] text-zinc-500">Сравнение d=1..{MAX_DIFF} в учебной модели.</p>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
