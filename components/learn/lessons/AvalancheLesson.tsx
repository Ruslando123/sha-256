"use client";

import { bytesToHex, hashFull } from "@/lib/sha256/hashFull";
import { motion } from "framer-motion";
import { useEffect, useMemo, useState } from "react";
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

function hashBytes(value: string): Uint8Array {
  return hashFull(new TextEncoder().encode(value));
}

function differingBits(a: Uint8Array, b: Uint8Array): number {
  let count = 0;
  for (let i = 0; i < a.length; i++) {
    let x = (a[i]! ^ b[i]!) >>> 0;
    while (x) {
      count += x & 1;
      x >>>= 1;
    }
  }
  return count;
}

function getBitGrid(hash: Uint8Array): boolean[] {
  const bits: boolean[] = [];
  for (let i = 0; i < hash.length; i++) {
    for (let b = 7; b >= 0; b--) {
      bits.push(!!((hash[i]! >> b) & 1));
    }
  }
  return bits;
}

function getDiffGrid(a: Uint8Array, b: Uint8Array): boolean[] {
  const xor: boolean[] = [];
  for (let i = 0; i < a.length; i++) {
    const x = (a[i]! ^ b[i]!) >>> 0;
    for (let bit = 7; bit >= 0; bit--) {
      xor.push(!!((x >> bit) & 1));
    }
  }
  return xor;
}

export function AvalancheLesson(props: Props) {
  const [textA, setTextA] = useState("hello");
  const [textB, setTextB] = useState("Hello");
  const [guess, setGuess] = useState("");
  const [verdict, setVerdict] = useState<{ status: "ok" | "fail"; actual: number } | null>(null);

  const { hashA, hashB, hashAHex, hashBHex, diff, sameInput, diffGrid } = useMemo(() => {
    const ha = hashBytes(textA);
    const hb = hashBytes(textB);
    const same = textA === textB;
    return {
      hashA: ha,
      hashB: hb,
      hashAHex: bytesToHex(ha),
      hashBHex: bytesToHex(hb),
      diff: differingBits(ha, hb),
      sameInput: same,
      diffGrid: getDiffGrid(ha, hb),
    };
  }, [textA, textB]);

  useEffect(() => {
    if (verdict?.status === "ok") props.onComplete();
  }, [verdict, props]);

  const check = () => {
    const guessNum = Number.parseInt(guess, 10);
    if (!Number.isFinite(guessNum)) {
      setVerdict({ status: "fail", actual: diff });
      return;
    }
    const ok = Math.abs(guessNum - diff) <= 20 && !sameInput;
    setVerdict({ status: ok ? "ok" : "fail", actual: diff });
  };

  const reset = () => {
    setGuess("");
    setVerdict(null);
  };

  const diffPct = ((diff / 256) * 100).toFixed(1);

  return (
    <LessonShell
      index={props.index}
      total={props.total}
      title="Avalanche effect"
      simpleWords="Changing even a single bit in the message flips approximately half the bits in the hash."
      whyMatters="This property makes SHA-256 resistant to tampering: finding a 'similar' document with the same hash is practically impossible."
      taskTitle="Enter two similar strings and guess how many bits out of 256 will change"
      status={verdict ? verdict.status : "idle"}
      successText={`On average, ~128 out of 256 bits change. Your result: ${verdict?.actual ?? 0}.`}
      hintText={
        sameInput
          ? "The strings are currently identical. Change at least one letter."
          : "Hint: usually about half the bits change. Acceptable margin of error is ±20."
      }
      completed={props.completed}
      canGoNext={props.completed}
      hasNext={props.hasNext}
      hasPrev={props.hasPrev}
      onNext={props.onNext}
      onPrev={props.onPrev}
      onReset={reset}
    >
      <div className="flex flex-col gap-5">
        {/* Input fields */}
        <div className="grid gap-3 md:grid-cols-2">
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-800">Message A</span>
            <input
              value={textA}
              onChange={(e) => setTextA(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition-colors focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            />
          </label>
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-800">Message B</span>
            <input
              value={textB}
              onChange={(e) => setTextB(e.target.value)}
              className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none transition-colors focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
            />
          </label>
        </div>

        {/* Hash outputs with character-level diff highlighting */}
        <div className="grid gap-3 md:grid-cols-2">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">H(A)</p>
            <p className="break-all font-mono text-[11px] leading-relaxed">
              {hashAHex.split("").map((ch, i) => (
                <span
                  key={i}
                  className={hashAHex[i] !== hashBHex[i] ? "text-rose-600 font-bold" : "text-zinc-600"}
                >
                  {ch}
                </span>
              ))}
            </p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-2.5">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wide text-zinc-500">H(B)</p>
            <p className="break-all font-mono text-[11px] leading-relaxed">
              {hashBHex.split("").map((ch, i) => (
                <span
                  key={i}
                  className={hashAHex[i] !== hashBHex[i] ? "text-rose-600 font-bold" : "text-zinc-600"}
                >
                  {ch}
                </span>
              ))}
            </p>
          </div>
        </div>

        {/* Bit-diff heatmap visualization */}
        <div className="rounded-xl border border-zinc-200 bg-white p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">
              256 bits: difference map
            </p>
            <div className="flex items-center gap-2 text-[10px]">
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-zinc-200" /> matches
              </span>
              <span className="flex items-center gap-1">
                <span className="inline-block h-2.5 w-2.5 rounded-sm bg-rose-500" /> differs
              </span>
            </div>
          </div>
          <div className="grid gap-[2px]" style={{ gridTemplateColumns: "repeat(32, 1fr)" }}>
            {diffGrid.map((isDiff, i) => (
              <motion.div
                key={i}
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{
                  scale: 1,
                  opacity: 1,
                  backgroundColor: isDiff ? "rgb(244,63,94)" : "rgb(228,228,231)",
                }}
                transition={{
                  scale: { delay: i * 0.002, duration: 0.2 },
                  backgroundColor: { duration: 0.3 },
                }}
                className="aspect-square rounded-[2px]"
                title={`bit ${i}: ${isDiff ? "differs" : "matches"}`}
              />
            ))}
          </div>

          {/* Stats bar */}
          <div className="mt-3 flex items-center gap-3">
            <div className="flex-1">
              <div className="h-2 overflow-hidden rounded-full bg-zinc-200">
                <motion.div
                  className="h-full rounded-full bg-gradient-to-r from-rose-400 to-rose-600"
                  animate={{ width: `${(diff / 256) * 100}%` }}
                  transition={{ type: "spring" as const, stiffness: 200, damping: 25 }}
                />
              </div>
            </div>
            <motion.span
              key={diff}
              initial={{ scale: 1.3, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="min-w-[80px] text-right font-mono text-xs font-bold text-rose-700"
            >
              {diff}/256 ({diffPct}%)
            </motion.span>
          </div>
        </div>

        {/* Guess input */}
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-zinc-800">How many bits out of 256 will change (your guess)?</span>
          <input
            value={guess}
            onChange={(e) => setGuess(e.target.value)}
            inputMode="numeric"
            placeholder="e.g. 128"
            className="w-40 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition-colors focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
          />
        </label>
        <div>
          <button
            type="button"
            onClick={check}
            disabled={sameInput || guess.length === 0}
            className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-amber-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
          >
            Check
          </button>
        </div>
      </div>
    </LessonShell>
  );
}
