"use client";

import { difficultyLevels, expectedSeconds, expectedTries, miningDemoCopy } from "@/content/miningDemo";
import { estimateHashRate, hashWithNonce, meetsDifficulty } from "@/lib/sha256/pow";
import confetti from "canvas-confetti";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";

const BATCH_SIZE = 2500;
const MAX_ATTEMPTS = 2_000_000;
const DISPLAY_EVERY_ATTEMPTS = 500;
const MAX_SAMPLES = 60;

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

function difficultyTheme(difficulty: number): {
  accent: string;
  surface: string;
  glow: string;
} {
  if (difficulty >= 10) {
    return {
      accent: "from-rose-600 to-orange-500",
      surface: "bg-rose-50",
      glow: "shadow-rose-400/40",
    };
  }
  if (difficulty >= 6) {
    return {
      accent: "from-orange-500 to-amber-500",
      surface: "bg-orange-50",
      glow: "shadow-orange-300/40",
    };
  }
  return {
    accent: "from-cyan-500 to-sky-500",
    surface: "bg-cyan-50",
    glow: "shadow-cyan-300/40",
  };
}

function NonceReel({
  nonce,
  isSearching,
  reduceMotion,
}: {
  nonce: number;
  isSearching: boolean;
  reduceMotion: boolean;
}) {
  const digits = String(Math.max(0, Math.floor(nonce))).padStart(6, "0").slice(-6);
  const y = Number(digits[digits.length - 1] ?? 0) * -32;

  return (
    <div className="inline-flex items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2">
      <span className="text-xs text-zinc-500">Nonce reel</span>
      <div className={`relative h-8 w-8 overflow-hidden rounded border border-zinc-200 bg-zinc-50 ${isSearching ? "blur-[0.4px]" : ""}`}>
        <motion.div
          className="absolute inset-x-0 top-0"
          animate={{ y: reduceMotion ? y : y - (isSearching ? 12 : 0) }}
          transition={{
            duration: reduceMotion ? 0.05 : isSearching ? 0.16 : 0.28,
            ease: "easeOut",
            repeat: isSearching && !reduceMotion ? Infinity : 0,
            repeatType: "mirror",
          }}
        >
          {Array.from({ length: 10 }, (_, idx) => (
            <div key={idx} className="flex h-8 items-center justify-center font-mono text-base font-semibold text-zinc-800">
              {idx}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
}

function Sparkline({ samples }: { samples: Sample[] }) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const width = canvas.width;
    const height = canvas.height;
    ctx.clearRect(0, 0, width, height);

    if (samples.length < 2) return;
    const max = Math.max(...samples.map((s) => s.rate), 1);
    const min = Math.min(...samples.map((s) => s.rate), 0);
    const range = Math.max(1, max - min);

    ctx.beginPath();
    ctx.lineWidth = 2;
    ctx.strokeStyle = "#0891b2";
    samples.forEach((sample, idx) => {
      const x = (idx / (samples.length - 1)) * (width - 1);
      const y = height - ((sample.rate - min) / range) * (height - 4) - 2;
      if (idx === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    });
    ctx.stroke();
  }, [samples]);

  return <canvas ref={canvasRef} width={220} height={70} className="rounded border border-zinc-200 bg-white" />;
}

export default function BlockchainMiningPage() {
  const reduceMotion = useReducedMotion();
  const [data, setData] = useState("Alice -> Bob: 1 BTC");
  const [nonce, setNonce] = useState(0);
  const [difficulty, setDifficulty] = useState(4);
  const [displayDifficulty, setDisplayDifficulty] = useState(4);
  const [hashHex, setHashHex] = useState(() => hashWithNonce("Alice -> Bob: 1 BTC", 0));
  const [isValid, setIsValid] = useState(() => meetsDifficulty(hashWithNonce("Alice -> Bob: 1 BTC", 0), 4));

  const [isSearching, setIsSearching] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [startMs, setStartMs] = useState(0);
  const [elapsedMs, setElapsedMs] = useState(0);
  const [searchNonce, setSearchNonce] = useState(0);
  const [searchDone, setSearchDone] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [hashFlashSeed, setHashFlashSeed] = useState(0);
  const [pulseSeed, setPulseSeed] = useState(0);

  const lastHashRef = useRef(hashHex);
  const lastSampleMsRef = useRef(0);

  const hashRate = useMemo(() => estimateHashRate(attempts, elapsedMs), [attempts, elapsedMs]);
  const theme = useMemo(() => difficultyTheme(displayDifficulty), [displayDifficulty]);

  const checkNonce = (nextData = data, nextNonce = nonce, nextDifficulty = difficulty) => {
    const next = hashWithNonce(nextData, nextNonce);
    setHashHex(next);
    setIsValid(meetsDifficulty(next, nextDifficulty));
    setHashFlashSeed((v) => v + 1);
    lastHashRef.current = next;
  };

  const resetSearch = () => {
    setIsSearching(false);
    setIsPaused(false);
    setAttempts(0);
    setElapsedMs(0);
    setStartMs(0);
    setSearchNonce(0);
    setSearchDone(false);
    setSearchError(null);
    setSamples([]);
  };

  useEffect(() => {
    if (!isSearching || isPaused) return;

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
        setToast(`Nonce найден: ${foundNonce}`);
        if (!reduceMotion) {
          confetti({
            particleCount: 80,
            spread: 70,
            origin: { y: 0.25 },
          });
        }
        return;
      }

      if (nextAttempts >= MAX_ATTEMPTS) {
        setIsSearching(false);
        setSearchError("Лимит попыток достигнут. Уменьшите сложность или измените data.");
        return;
      }

      setSearchNonce(current);
    };

    const timer = window.setTimeout(runBatch, 0);
    return () => window.clearTimeout(timer);
  }, [attempts, data, difficulty, isPaused, isSearching, reduceMotion, searchNonce, startMs]);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 2200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const startSearch = () => {
    setIsSearching(true);
    setIsPaused(false);
    setSearchDone(false);
    setSearchError(null);
    setAttempts(0);
    setSearchNonce(0);
    setStartMs(performance.now());
    setElapsedMs(0);
    setSamples([]);
    lastSampleMsRef.current = performance.now();
  };

  const stopSearch = () => {
    setIsSearching(false);
    setIsPaused(false);
  };

  const expectedForCurrent = expectedTries(difficulty);
  const leadingTarget = "0".repeat(difficulty);

  return (
    <div
      className={`min-h-screen px-4 py-8 text-zinc-900 transition-colors duration-500 ${theme.surface} ${isSearching && displayDifficulty >= 10 && !reduceMotion ? "animate-[shake_0.2s_ease-in-out_infinite]" : ""}`}
    >
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <AnimatePresence>
          {toast ? (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              className="fixed left-1/2 top-4 z-40 -translate-x-1/2 rounded-full bg-emerald-600 px-4 py-2 text-sm font-semibold text-white shadow-lg"
            >
              {toast}
            </motion.div>
          ) : null}
        </AnimatePresence>

        <nav className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <h1 className="text-lg font-semibold">{miningDemoCopy.title}</h1>
          <Link href="/" className="text-sm font-medium text-cyan-700 hover:underline">
            ← На главную
          </Link>
        </nav>

        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-700">{miningDemoCopy.intro}</p>
          <p className="mt-2 text-xs text-zinc-500">{miningDemoCopy.disclaimer}</p>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <motion.div
            layout
            className={`rounded-xl border border-zinc-200 bg-white p-4 shadow-lg ${theme.glow} lg:col-span-2`}
            transition={{ duration: 0.3 }}
          >
            <label className="mb-3 flex flex-col gap-1 text-sm">
              <span className="font-medium text-zinc-800">Data</span>
              <textarea
                value={data}
                onChange={(e) => {
                  const nextData = e.target.value;
                  setData(nextData);
                  checkNonce(nextData, nonce, difficulty);
                  setPulseSeed((v) => v + 1);
                  resetSearch();
                }}
                className="min-h-[84px] rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm"
              />
            </label>
            <div className="grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-800">Nonce</span>
                <input
                  type="number"
                  value={nonce}
                  min={0}
                  onChange={(e) => {
                    const nextNonce = Math.max(0, Number(e.target.value) || 0);
                    setNonce(nextNonce);
                    checkNonce(data, nextNonce, difficulty);
                    setPulseSeed((v) => v + 1);
                    resetSearch();
                  }}
                  className="rounded-lg border border-zinc-300 px-3 py-2 font-mono text-sm"
                />
                <div className="mt-2">
                  <NonceReel nonce={nonce} isSearching={isSearching && !isPaused} reduceMotion={Boolean(reduceMotion)} />
                </div>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-800">Difficulty (leading zeros)</span>
                <input
                  type="range"
                  min={1}
                  max={10}
                  value={difficulty}
                  onChange={(e) => {
                    const nextDifficulty = Number(e.target.value);
                    setDifficulty(nextDifficulty);
                    setDisplayDifficulty(nextDifficulty);
                    checkNonce(data, nonce, nextDifficulty);
                    resetSearch();
                  }}
                  className="accent-cyan-600"
                />
                <span className="font-mono text-xs text-zinc-600">{difficulty}</span>
              </label>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              <motion.button
                type="button"
                onClick={() => checkNonce()}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className={`rounded-lg bg-gradient-to-r ${theme.accent} px-4 py-2 text-sm font-medium text-white`}
              >
                Check Nonce
              </motion.button>
              <motion.button
                type="button"
                onClick={startSearch}
                disabled={isSearching}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {isSearching ? "Searching..." : "Find for me"}
              </motion.button>
              <motion.button
                type="button"
                onClick={() => setIsPaused((v) => !v)}
                disabled={!isSearching}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                {isPaused ? "Resume" : "Pause"}
              </motion.button>
              <motion.button
                type="button"
                onClick={stopSearch}
                disabled={!isSearching}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium disabled:opacity-50"
              >
                Stop
              </motion.button>
              <motion.button
                type="button"
                onClick={resetSearch}
                whileHover={{ y: -2 }}
                whileTap={{ scale: 0.98 }}
                className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium"
              >
                Reset
              </motion.button>
            </div>

            <div className="relative mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <AnimatePresence>
                {pulseSeed > 0 ? (
                  <motion.span
                    key={pulseSeed}
                    initial={{ opacity: 0, x: 0 }}
                    animate={{ opacity: 1, x: 120 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeOut" }}
                    className="pointer-events-none absolute left-4 top-2 h-0.5 w-12 bg-cyan-400"
                  />
                ) : null}
              </AnimatePresence>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Hash(data + nonce)</p>
              <motion.p
                key={hashFlashSeed}
                initial={{ opacity: 0.5, filter: "blur(1px)" }}
                animate={{ opacity: 1, filter: "blur(0px)" }}
                className="mt-1 break-all font-mono text-sm text-zinc-900"
              >
                {hashHex ? (
                  <>
                    <span className={isValid ? "text-emerald-600 drop-shadow-[0_0_7px_rgba(16,185,129,0.7)]" : ""}>
                      {hashHex.slice(0, difficulty)}
                    </span>
                    {hashHex.slice(difficulty)}
                  </>
                ) : (
                  "—"
                )}
              </motion.p>
              <p className={`mt-2 text-sm font-medium ${isValid ? "text-emerald-700" : "text-rose-700"}`}>
                {isValid ? `Условие выполнено: хеш начинается с ${leadingTarget}` : "Условие не выполнено"}
              </p>
            </div>
          </motion.div>

          <aside className="rounded-xl border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-zinc-900">Поиск и метрики</h2>
            <div className="mt-3 space-y-2 text-sm">
              <p>
                Attempts: <span className="font-mono">{attempts}</span>
              </p>
              <p>
                Elapsed: <span className="font-mono">{elapsedMs.toFixed(0)} ms</span>
              </p>
              <p>
                Hash rate: <span className="font-mono">{hashRate.toFixed(0)} h/s</span>
              </p>
              <p>
                Expected tries (d={difficulty}): <span className="font-mono">{expectedForCurrent.toLocaleString()}</span>
              </p>
              <p>
                Expected time (current rate):{" "}
                <span className="font-mono">{formatSeconds(expectedSeconds(difficulty, hashRate))}</span>
              </p>
            </div>
            <div className="mt-3">
              <p className="mb-1 text-xs font-medium text-zinc-600">Hash rate sparkline</p>
              <Sparkline samples={samples} />
            </div>
            {searchDone ? <p className="mt-3 text-xs font-medium text-emerald-700">Nonce найден автоматически.</p> : null}
            {searchError ? <p className="mt-3 text-xs font-medium text-rose-700">{searchError}</p> : null}
          </aside>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Как сложность влияет на время поиска</h2>
          <p className="mt-1 text-xs text-zinc-600">Ожидаемое число попыток растет как 16^difficulty.</p>
          <div className="mt-4 space-y-2">
            {difficultyLevels.map((d) => {
              const tries = expectedTries(d);
              const width = Math.max(6, (tries / expectedTries(10)) * 100);
              return (
                <div key={d} className="grid grid-cols-[80px_1fr_180px] items-center gap-3 text-xs">
                  <span className="font-mono text-zinc-700">d={d}</span>
                  <div className="h-3 rounded bg-zinc-100">
                    <motion.div
                      className={`h-3 rounded bg-gradient-to-r ${theme.accent}`}
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ duration: 0.45, ease: "easeOut" }}
                    />
                  </div>
                  <span className="font-mono text-zinc-600">{tries.toLocaleString()} tries</span>
                </div>
              );
            })}
          </div>
        </section>
      </div>
    </div>
  );
}
