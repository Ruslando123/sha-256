"use client";

import { bytesToHex, hashFull } from "@/lib/sha256/hashFull";
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

function hashString(value: string): string {
  if (!value) return "";
  return bytesToHex(hashFull(new TextEncoder().encode(value)));
}

type Phase = "ascii" | "hex" | "compare";

export function IntroLesson(props: Props) {
  const [phase, setPhase] = useState<Phase>("ascii");
  const [asciiAnswer, setAsciiAnswer] = useState("");
  const [hexAnswer, setHexAnswer] = useState("");
  const [name, setName] = useState("");
  const [tweak, setTweak] = useState("");
  const [observed, setObserved] = useState(false);
  const [hint, setHint] = useState("");

  const letter = "a";
  const correctAscii = 97;
  const correctHex = "61";

  const original = useMemo(() => hashString(name), [name]);
  const altered = useMemo(() => hashString(tweak), [tweak]);

  const meaningfullyDifferent = name.length > 0 && tweak.length > 0 && name !== tweak;

  useEffect(() => {
    if (meaningfullyDifferent && original && altered && original !== altered) {
      setObserved(true);
    }
  }, [altered, meaningfullyDifferent, original]);

  const isComplete = phase === "compare" && observed;

  useEffect(() => {
    if (isComplete) props.onComplete();
  }, [isComplete, props]);

  const checkAscii = () => {
    const guess = parseInt(asciiAnswer.trim(), 10);
    if (guess === correctAscii) {
      setPhase("hex");
      setHint("");
    } else {
      setHint(
        "Not quite. Check the reference table: lowercase Latin letters (a-z) start at a specific number. 'A' = 65, so 'a' = ?",
      );
    }
  };

  const checkHex = () => {
    const guess = hexAnswer.trim().toLowerCase();
    if (guess === correctHex) {
      setPhase("compare");
      setHint("");
    } else {
      setHint(
        "Hint: divide the number by 16. The quotient is the first hex digit, the remainder is the second.",
      );
    }
  };

  const status = isComplete ? "ok" : hint ? "fail" : "idle";

  return (
    <LessonShell
      index={props.index}
      total={props.total}
      title="What is a hash"
      simpleWords="A hash is a short digital fingerprint of text. The computer first converts letters into numbers (ASCII → hex), then mixes them into a 'fingerprint'. If you change even one letter, the fingerprint changes completely."
      whyMatters="Hashes help verify file integrity, sign documents, and store passwords. SHA-256 is one of the most popular algorithms. Understanding encodings is the first step."
      taskTitle={
        phase === "ascii"
          ? `Step 1: Find the ASCII code of the letter "${letter}"`
          : phase === "hex"
            ? "Step 2: Convert the ASCII code to hexadecimal"
            : "Step 3: Compare two hashes — change one letter"
      }
      status={status}
      successText="Great! You learned how a letter becomes a number, and a number becomes part of a hash. Changed one letter — and the fingerprint became completely different."
      hintText={hint}
      completed={props.completed}
      canGoNext={props.completed}
      hasNext={props.hasNext}
      hasPrev={props.hasPrev}
      onNext={props.onNext}
      onPrev={props.onPrev}
    >
      <div className="flex flex-col gap-5">
        {/* Phase 1: ASCII */}
        <div
          className={`rounded-xl border-2 p-4 transition-all ${
            phase === "ascii"
              ? "border-dashed border-cyan-300 bg-cyan-50/50"
              : "border-emerald-200 bg-emerald-50/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                phase === "ascii" ? "bg-cyan-600" : "bg-emerald-500"
              }`}
            >
              {phase === "ascii" ? "1" : "✓"}
            </span>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-zinc-900">
                What is the <strong>decimal</strong> code of the letter <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-cyan-800">"{letter}"</code> in the ASCII table?
              </p>
              <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
                <p className="text-xs text-zinc-500">Hint: lowercase Latin letters in ASCII don't start at zero. Try to recall or look up the code.</p>
                <div className="mt-2 overflow-x-auto">
                  <table className="text-[11px]">
                    <thead>
                      <tr className="text-zinc-500">
                        <th className="pr-3 text-left font-medium">Symbol</th>
                        <th className="pr-3 text-left font-medium">ASCII</th>
                        <th className="text-left font-medium">Hex</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-zinc-700">
                      <tr><td className="pr-3">'0'</td><td className="pr-3">48</td><td>30</td></tr>
                      <tr><td className="pr-3">'A'</td><td className="pr-3">65</td><td>41</td></tr>
                      <tr className="text-cyan-800 font-semibold"><td className="pr-3">'a'</td><td className="pr-3">?</td><td>?</td></tr>
                      <tr><td className="pr-3">'b'</td><td className="pr-3">?</td><td>?</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {phase === "ascii" ? (
                <div className="flex items-center gap-2">
                  <input
                    value={asciiAnswer}
                    onChange={(e) => setAsciiAnswer(e.target.value)}
                    inputMode="numeric"
                    placeholder="?"
                    className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                  <button
                    type="button"
                    onClick={checkAscii}
                    disabled={!asciiAnswer.trim()}
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:bg-zinc-300"
                  >
                    Check
                  </button>
                </div>
              ) : (
                <p className="font-mono text-sm text-emerald-700">'{letter}' = {correctAscii} (decimal)</p>
              )}
            </div>
          </div>
        </div>

        {/* Phase 2: Hex */}
        <div
          className={`rounded-xl border-2 p-4 transition-all ${
            phase === "hex"
              ? "border-dashed border-indigo-300 bg-indigo-50/50"
              : phase === "compare"
                ? "border-emerald-200 bg-emerald-50/30"
                : "border-zinc-200 bg-zinc-50/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                phase === "hex"
                  ? "bg-indigo-600"
                  : phase === "compare"
                    ? "bg-emerald-500"
                    : "bg-zinc-300"
              }`}
            >
              {phase === "compare" ? "✓" : "2"}
            </span>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-zinc-900">
                Convert <strong>{correctAscii}</strong> to <strong>hexadecimal</strong> (hex)
              </p>
              {phase !== "ascii" && (
                <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
                  <p className="text-xs text-zinc-500">
                    Formula: number ÷ 16 = quotient (first hex digit) and remainder (second hex digit).
                  </p>
                  <p className="mt-1 font-mono text-xs text-zinc-600">
                    {correctAscii} ÷ 16 = ? (remainder ?)
                  </p>
                </div>
              )}
              {phase === "hex" ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">0x</span>
                  <input
                    value={hexAnswer}
                    onChange={(e) => setHexAnswer(e.target.value)}
                    placeholder="??"
                    maxLength={4}
                    className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={checkHex}
                    disabled={!hexAnswer.trim()}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:bg-zinc-300"
                  >
                    Check
                  </button>
                </div>
              ) : phase === "compare" ? (
                <p className="font-mono text-sm text-emerald-700">{correctAscii} = 0x{correctHex}</p>
              ) : (
                <p className="text-xs text-zinc-400">Solve step 1 first</p>
              )}
            </div>
          </div>
        </div>

        {/* Phase 3: Hash comparison */}
        <div
          className={`rounded-xl border-2 p-4 transition-all ${
            phase === "compare"
              ? "border-dashed border-amber-300 bg-amber-50/50"
              : "border-zinc-200 bg-zinc-50/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                phase === "compare"
                  ? observed
                    ? "bg-emerald-500"
                    : "bg-amber-600"
                  : "bg-zinc-300"
              }`}
            >
              {observed ? "✓" : "3"}
            </span>
            <div className="flex w-full flex-col gap-2">
              <p className="text-sm font-medium text-zinc-900">
                Now see what SHA-256 does with text. Enter two similar words and compare their hashes.
              </p>
              {phase === "compare" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-zinc-800">First word</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g.: hello"
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                    <div className="rounded-lg bg-zinc-900 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">SHA-256</p>
                      <code className="break-all font-mono text-[11px] text-emerald-300">
                        {original || "(enter a word)"}
                      </code>
                    </div>
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-zinc-800">Change one letter</span>
                    <input
                      value={tweak}
                      onChange={(e) => setTweak(e.target.value)}
                      placeholder="e.g.: Hello"
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                    <div className="rounded-lg bg-zinc-900 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">SHA-256</p>
                      <code className="break-all font-mono text-[11px] text-amber-300">
                        {altered || "(enter a modified word)"}
                      </code>
                    </div>
                  </label>
                </div>
              ) : (
                <p className="text-xs text-zinc-400">Solve steps 1 and 2 first</p>
              )}
            </div>
          </div>
        </div>

        {/* Encoding reference */}
        <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
          <summary className="cursor-pointer font-medium text-zinc-800">Reference: ASCII table (common characters)</summary>
          <div className="mt-2 grid grid-cols-4 gap-1 font-mono text-[11px]">
            {[
              ["0-9", "48-57", "30-39"],
              ["A-Z", "65-90", "41-5a"],
              ["a-z", "97-122", "61-7a"],
              ["space", "32", "20"],
            ].map(([sym, dec, hex]) => (
              <div key={sym} className="rounded bg-white p-1.5 text-center ring-1 ring-zinc-100">
                <span className="block text-zinc-500">{sym}</span>
                <span className="block text-zinc-800">{dec}</span>
                <span className="block text-indigo-600">0x{hex}</span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </LessonShell>
  );
}
