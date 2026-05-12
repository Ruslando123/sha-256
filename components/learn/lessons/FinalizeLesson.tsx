"use client";

import { H0, K } from "@/lib/sha256/constants";
import { bytesToHex, hashFull } from "@/lib/sha256/hashFull";
import { padMessage } from "@/lib/sha256/preprocess";
import {
  Ch,
  Maj,
  Sigma0,
  Sigma1,
  add32,
  gamma0,
  gamma1,
  readU32BE,
} from "@/lib/sha256/primitives";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LessonShell } from "../LessonShell";

type Props = {
  index: number;
  total: number;
  completed: boolean;
  hasNext: boolean;
  hasPrev: boolean;
  onComplete: () => void;
  onNext: () => void;
  onPrev: () => void;
};

const SAMPLE = "abc";
const REGISTER_NAMES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

function toHex32(n: number): string {
  return n.toString(16).padStart(8, "0");
}

function workingRegisters(message: Uint8Array): Uint32Array {
  const padded = padMessage(message);
  const W = new Uint32Array(64);
  let a = H0[0]!,
    b = H0[1]!,
    c = H0[2]!,
    d = H0[3]!,
    e = H0[4]!,
    f = H0[5]!,
    g = H0[6]!,
    h = H0[7]!;

  for (let bi = 0; bi < padded.length / 64; bi++) {
    const off = bi * 64;
    for (let i = 0; i < 16; i++) W[i] = readU32BE(padded, off + i * 4);
    for (let t = 16; t < 64; t++) {
      W[t] = add32(gamma1(W[t - 2]!), W[t - 7]!, gamma0(W[t - 15]!), W[t - 16]!);
    }
    for (let t = 0; t < 64; t++) {
      const s1 = Sigma1(e);
      const ch = Ch(e, f, g);
      const t1 = add32(h, s1, ch, K[t]!, W[t]!);
      const s0 = Sigma0(a);
      const maj = Maj(a, b, c);
      const t2 = add32(s0, maj);
      h = g; g = f; f = e;
      e = add32(d, t1);
      d = c; c = b; b = a;
      a = add32(t1, t2);
    }
  }

  return new Uint32Array([a, b, c, d, e, f, g, h]);
}

export function FinalizeLesson(props: Props) {
  const { initialH, working, finalDigest } = useMemo(() => {
    const msg = new TextEncoder().encode(SAMPLE);
    return {
      initialH: new Uint32Array(H0),
      working: workingRegisters(msg),
      finalDigest: bytesToHex(hashFull(msg)),
    };
  }, []);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [merged, setMerged] = useState<boolean[]>(() => Array(8).fill(false));
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [hint, setHint] = useState("");
  const fired = useRef(false);

  const allDone = merged.every(Boolean);
  const filled = merged.filter(Boolean).length;
  const percent = Math.round((filled / 8) * 100);

  useEffect(() => {
    if (allDone) {
      props.onComplete();
      if (!fired.current) {
        fired.current = true;
        const t = window.setTimeout(() => {
          confetti({ particleCount: 90, spread: 70, origin: { y: 0.7 } });
        }, 250);
        return () => window.clearTimeout(t);
      }
    } else {
      fired.current = false;
    }
  }, [allDone, props]);

  const checkAnswer = useCallback(() => {
    const expected = add32(initialH[currentIdx]!, working[currentIdx]!);
    const guess = answer.trim().toLowerCase().replace(/^0x/, "");
    if (guess === toHex32(expected)) {
      setMerged((prev) => {
        const copy = prev.slice();
        copy[currentIdx] = true;
        return copy;
      });
      setCurrentIdx((c) => Math.min(c + 1, 7));
      setAnswer("");
      setStatus("ok");
      setHint("");
    } else {
      setStatus("fail");
      setHint(
        `Incorrect. Add H[${currentIdx}] and working[${currentIdx}] and take the result mod 2³² (discard everything above 0xFFFFFFFF). Use the calculator!`,
      );
    }
  }, [answer, currentIdx, initialH, working]);

  const reset = () => {
    setMerged(Array(8).fill(false));
    setCurrentIdx(0);
    setAnswer("");
    setStatus("idle");
    setHint("");
    fired.current = false;
  };

  const digestSoFar = merged
    .map((done, i) => (done ? toHex32(add32(initialH[i]!, working[i]!)) : ""))
    .join("");

  return (
    <LessonShell
      index={props.index}
      total={props.total}
      title="Finalization: H += state"
      simpleWords="After 64 rounds, the 8 working registers are added to the 8 initial H values. These 8 numbers, concatenated together, form the final hash."
      whyMatters="Adding the initial H makes the function more robust: even if an attacker controlled the working registers, they would need to guess the original H."
      taskTitle={allDone ? "Digest assembled!" : `Compute H[${currentIdx}] + working[${currentIdx}] (mod 2³²)`}
      status={allDone ? "ok" : status}
      successText={`Done! SHA-256 for "${SAMPLE}" has been assembled byte by byte.`}
      hintText={hint}
      completed={props.completed}
      canGoNext={props.completed}
      hasNext={props.hasNext}
      hasPrev={props.hasPrev}
      onNext={props.onNext}
      onPrev={props.onPrev}
      onReset={reset}
    >
      <div className="flex flex-col gap-5">
        <p className="text-xs text-zinc-500">
          Message: <span className="font-mono">"{SAMPLE}"</span>. Assembling a 256-bit digest from 8 sums of 32 bits each.
        </p>

        {/* Current computation */}
        {!allDone && (
          <div className="rounded-xl border-2 border-dashed border-cyan-300 bg-cyan-50/50 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-sm font-bold text-white">
                {currentIdx + 1}
              </span>
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-zinc-900">
                  Add <strong>H[{currentIdx}]</strong> ({REGISTER_NAMES[currentIdx]}) and <strong>working[{currentIdx}]</strong>
                </p>
                <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
                  <div className="grid grid-cols-[auto_1fr] items-center gap-x-3 gap-y-1 font-mono text-sm">
                    <span className="text-zinc-500">H[{currentIdx}]</span>
                    <span className="rounded bg-cyan-100 px-2 py-1 text-cyan-900">
                      0x{toHex32(initialH[currentIdx]!)}
                    </span>
                    <span className="text-right text-lg font-bold text-zinc-400">+</span>
                    <span className="rounded bg-amber-100 px-2 py-1 text-amber-900">
                      0x{toHex32(working[currentIdx]!)}
                    </span>
                    <span className="text-right text-zinc-400">=</span>
                    <span className="rounded border-2 border-dashed border-zinc-300 px-2 py-1 text-zinc-400">
                      0x????????
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-400">
                    Sum mod 2³² (= if result {'>'} 0xFFFFFFFF, discard the upper bits)
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">0x</span>
                  <input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="????????"
                    maxLength={10}
                    className="w-36 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                  <button
                    type="button"
                    onClick={checkAnswer}
                    disabled={!answer.trim()}
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:bg-zinc-300"
                  >
                    Check
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 8 cards */}
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => {
            const done = merged[i];
            const value = done ? add32(initialH[i]!, working[i]!) : initialH[i]!;
            const isCurrent = !done && i === currentIdx;
            return (
              <div
                key={i}
                className={`rounded-lg border p-3 text-left text-xs transition ${
                  done
                    ? "border-emerald-300 bg-emerald-50 text-emerald-900"
                    : isCurrent
                      ? "border-cyan-500 bg-cyan-50 text-cyan-900 shadow-md shadow-cyan-200"
                      : "border-zinc-300 bg-white text-zinc-700"
                }`}
              >
                <span className="font-mono font-semibold">
                  H[{i}] ({REGISTER_NAMES[i]})
                </span>
                <br />
                <span className="font-mono text-[11px]">{toHex32(value)}</span>
                <br />
                {done ? (
                  <span className="text-[11px] text-emerald-600">✓ computed</span>
                ) : (
                  <span className="text-[11px] text-zinc-400">+ {toHex32(working[i]!)}</span>
                )}
              </div>
            );
          })}
        </div>

        {/* Progress bar */}
        <section>
          <div className="flex items-center justify-between text-xs text-zinc-600">
            <span>Bits assembled</span>
            <span className="font-mono">{filled * 32} / 256</span>
          </div>
          <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-zinc-100">
            <motion.div
              className="h-full bg-gradient-to-r from-cyan-400 to-emerald-400"
              animate={{ width: `${percent}%` }}
              transition={{ duration: 0.45 }}
            />
          </div>
        </section>

        {/* Digest assembly */}
        <section className="rounded-2xl border border-zinc-200 bg-zinc-900 p-4">
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-400">
            Final digest (assembled piece by piece)
          </p>
          <div className="grid grid-cols-4 gap-1 font-mono sm:grid-cols-8">
            {Array.from({ length: 8 }).map((_, i) => {
              const done = merged[i];
              const hex = done ? toHex32(add32(initialH[i]!, working[i]!)) : "········";
              return (
                <div
                  key={i}
                  className={`overflow-hidden rounded px-2 py-1 text-center text-[11px] ${
                    done ? "bg-emerald-500/20 text-emerald-200" : "bg-zinc-800 text-zinc-500"
                  }`}
                >
                  <AnimatePresence mode="wait">
                    {done ? (
                      <motion.span
                        key="done"
                        initial={{ y: -16, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ duration: 0.4, ease: "easeOut" }}
                        className="block"
                      >
                        {hex}
                      </motion.span>
                    ) : (
                      <motion.span key="pending" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="block">
                        {hex}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
              );
            })}
          </div>

          {filled > 0 && (
            <div className="mt-3 flex items-start gap-2 text-[11px]">
              <span className="text-zinc-500">Reference:</span>
              <span className="break-all font-mono">
                {finalDigest.split("").map((ch, i) => {
                  const matches = i < digestSoFar.length && digestSoFar[i] === ch;
                  return (
                    <span key={i} className={matches ? "text-emerald-300" : "text-zinc-500"}>
                      {ch}
                    </span>
                  );
                })}
              </span>
            </div>
          )}
        </section>

        {allDone && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="rounded-2xl border-2 border-emerald-300 bg-emerald-50 p-4"
          >
            <p className="text-sm font-semibold text-emerald-800">SHA-256 assembled!</p>
            <p className="mt-1 text-xs text-emerald-700">
              This digest is identical to the result of crypto.subtle, Node crypto, openssl.
              You computed every sum by hand!
            </p>
          </motion.div>
        )}
      </div>
    </LessonShell>
  );
}
