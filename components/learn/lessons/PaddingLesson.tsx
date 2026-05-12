"use client";

import { padMessage } from "@/lib/sha256/preprocess";
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

const SAMPLE = "abc";

function toHex(byte: number): string {
  return byte.toString(16).padStart(2, "0");
}

type Cell = { value: number; kind: "msg" | "sep" | "zero" | "length" | "empty" };

function buildInitial(message: Uint8Array): Cell[] {
  const cells: Cell[] = [];
  for (let i = 0; i < 64; i++) {
    if (i < message.length) {
      cells.push({ value: message[i]!, kind: "msg" });
    } else {
      cells.push({ value: 0, kind: "empty" });
    }
  }
  return cells;
}

type Phase = "calc-bits" | "calc-zeros" | "type-sep" | "type-length" | "done";

export function PaddingLesson(props: Props) {
  const message = useMemo(() => new TextEncoder().encode(SAMPLE), []);
  const expected = useMemo(() => padMessage(message), [message]);
  const [cells, setCells] = useState<Cell[]>(() => buildInitial(message));
  const [phase, setPhase] = useState<Phase>("calc-bits");
  const [status, setStatus] = useState<"idle" | "fail" | "ok">("idle");
  const [hint, setHint] = useState<string>("");

  const [bitsAnswer, setBitsAnswer] = useState("");
  const expectedBits = message.length * 8;

  const [zerosAnswer, setZerosAnswer] = useState("");
  const expectedZeros = 64 - message.length - 1 - 8;

  const [sepAnswer, setSepAnswer] = useState("");
  const [lengthAnswer, setLengthAnswer] = useState("");
  const expectedLengthHex = expectedBits.toString(16);

  const isComplete = phase === "done";

  useEffect(() => {
    if (isComplete) props.onComplete();
  }, [isComplete, props]);

  const checkBits = () => {
    const guess = parseInt(bitsAnswer.trim(), 10);
    if (guess === expectedBits) {
      setPhase("calc-zeros");
      setStatus("ok");
      setHint("");
    } else {
      setStatus("fail");
      setHint("Incorrect. Remember: each byte has 8 bits. Multiply the number of bytes by 8.");
    }
  };

  const checkZeros = () => {
    const guess = parseInt(zerosAnswer.trim(), 10);
    if (guess === expectedZeros) {
      setPhase("type-sep");
      setStatus("ok");
      setHint("");
    } else {
      setStatus("fail");
      setHint(
        "Not quite. Block = 64 bytes. Subtract all occupied space from 64: text + 1 (separator) + 8 (length). The rest is zeros.",
      );
    }
  };

  const checkSep = () => {
    const guess = sepAnswer.trim().toLowerCase().replace(/^0x/, "");
    if (guess === "80") {
      setCells((prev) => {
        const next = prev.map((c) => ({ ...c }));
        next[message.length] = { value: 0x80, kind: "sep" };
        for (let i = message.length + 1; i < 64 - 8; i++) {
          if (next[i]!.kind === "empty") next[i] = { value: 0x00, kind: "zero" };
        }
        return next;
      });
      setPhase("type-length");
      setStatus("ok");
      setHint("");
    } else {
      setStatus("fail");
      setHint(
        "The separator is a single byte where the most significant bit = 1, the rest = 0. Convert binary 10000000 to hex.",
      );
    }
  };

  const checkLength = () => {
    const guess = lengthAnswer.trim().toLowerCase().replace(/^0x/, "");
    if (guess === expectedLengthHex || guess === "0" + expectedLengthHex || guess === "00000000000000" + expectedLengthHex) {
      setCells((prev) => {
        const next = prev.map((c) => ({ ...c }));
        for (let i = 64 - 8; i < 64; i++) {
          next[i] = { value: expected[i]!, kind: "length" };
        }
        return next;
      });
      setPhase("done");
      setStatus("ok");
      setHint("");
    } else {
      setStatus("fail");
      setHint(
        `Length = ${expectedBits} bits. Convert ${expectedBits} to hex: divide by 16, quotient is the high digit, remainder is the low digit.`,
      );
    }
  };

  const reset = () => {
    setPhase("calc-bits");
    setCells(buildInitial(message));
    setStatus("idle");
    setHint("");
    setBitsAnswer("");
    setZerosAnswer("");
    setSepAnswer("");
    setLengthAnswer("");
  };

  const phaseNumber = phase === "calc-bits" ? 1 : phase === "calc-zeros" ? 2 : phase === "type-sep" ? 3 : phase === "type-length" ? 4 : 5;

  return (
    <LessonShell
      index={props.index}
      total={props.total}
      title="Padding: message preparation"
      simpleWords="To make all blocks the same size (64 bytes), extra bytes are added to the message: a separator, zeros, and the message length at the very end."
      whyMatters="Without padding, the algorithm wouldn't know where your text ends. This protects against tampering and length errors."
      taskTitle={`Build the padding for the word "${SAMPLE}" — compute each value yourself`}
      status={isComplete ? "ok" : status === "fail" ? "fail" : "idle"}
      successText="Excellent! You computed all the values and built the padding yourself. This is exactly how SHA-256 works."
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
        {/* Block visualization */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">
            Block of 64 bytes (fills up as you solve)
          </p>
          <div className="grid grid-cols-8 gap-1 rounded-xl border border-zinc-200 bg-white p-3 font-mono text-xs">
            {cells.map((cell, i) => (
              <div
                key={i}
                className={`flex h-9 items-center justify-center rounded transition-all ${
                  cell.kind === "msg"
                    ? "bg-cyan-100 text-cyan-900"
                    : cell.kind === "sep"
                      ? "bg-amber-200 text-amber-900 ring-2 ring-amber-400"
                      : cell.kind === "zero"
                        ? "bg-zinc-200 text-zinc-700"
                        : cell.kind === "length"
                          ? "bg-emerald-200 text-emerald-900"
                          : "bg-zinc-50 text-zinc-300"
                }`}
                title={`byte ${i}`}
              >
                {cell.kind === "empty" ? "·" : toHex(cell.value)}
              </div>
            ))}
          </div>
          <div className="mt-2 flex flex-wrap gap-3 text-[11px]">
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-cyan-100" /> Text
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-amber-200" /> Separator
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-zinc-200" /> Zeros
            </span>
            <span className="flex items-center gap-1">
              <span className="inline-block h-3 w-3 rounded bg-emerald-200" /> Length
            </span>
          </div>
        </div>

        {/* Phase 1: calc bits */}
        <StepCard
          step={1}
          title="Compute the message length in bits"
          active={phase === "calc-bits"}
          done={phaseNumber > 1}
          color="cyan"
        >
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <p className="text-xs text-zinc-600">
              Text: <code className="font-mono text-cyan-800">"{SAMPLE}"</code> = {message.length} bytes
            </p>
            <p className="mt-1 text-xs text-zinc-500">1 byte = 8 bits. How many bits total?</p>
          </div>
          {phase === "calc-bits" ? (
            <div className="flex items-center gap-2">
              <input
                value={bitsAnswer}
                onChange={(e) => setBitsAnswer(e.target.value)}
                inputMode="numeric"
                placeholder="?"
                className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
              />
              <span className="text-sm text-zinc-500">bits</span>
              <button
                type="button"
                onClick={checkBits}
                disabled={!bitsAnswer.trim()}
                className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:bg-zinc-300"
              >
                Check
              </button>
            </div>
          ) : (
            <p className="font-mono text-sm text-emerald-700">{message.length} × 8 = {expectedBits} bits ✓</p>
          )}
        </StepCard>

        {/* Phase 2: calc zeros */}
        <StepCard
          step={2}
          title="Compute the number of zero bytes"
          active={phase === "calc-zeros"}
          done={phaseNumber > 2}
          color="emerald"
        >
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <p className="text-xs text-zinc-600">Block = 64 bytes. Occupied:</p>
            <ul className="mt-1 space-y-0.5 text-xs text-zinc-500">
              <li>• Text: {message.length} bytes</li>
              <li>• Separator (0x80): 1 byte</li>
              <li>• Length at the end: 8 bytes</li>
            </ul>
            <p className="mt-2 text-xs font-medium text-zinc-700">
              64 − ({message.length} + 1 + 8) = ?
            </p>
          </div>
          {phase === "calc-zeros" ? (
            <div className="flex items-center gap-2">
              <input
                value={zerosAnswer}
                onChange={(e) => setZerosAnswer(e.target.value)}
                inputMode="numeric"
                placeholder="?"
                className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <span className="text-sm text-zinc-500">zeros</span>
              <button
                type="button"
                onClick={checkZeros}
                disabled={!zerosAnswer.trim()}
                className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:bg-zinc-300"
              >
                Check
              </button>
            </div>
          ) : phaseNumber > 2 ? (
            <p className="font-mono text-sm text-emerald-700">64 − {message.length + 9} = {expectedZeros} zeros ✓</p>
          ) : null}
        </StepCard>

        {/* Phase 3: type separator */}
        <StepCard
          step={3}
          title="Write the separator byte in hex"
          active={phase === "type-sep"}
          done={phaseNumber > 3}
          color="amber"
        >
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <p className="text-xs text-zinc-600">
              The separator is a special byte where the <strong>most significant bit = 1</strong>, remaining 7 bits = 0.
            </p>
            <p className="mt-2 text-xs text-zinc-500">In binary: <code className="font-mono text-amber-700">1000 0000</code></p>
            <p className="mt-1 text-xs text-zinc-500">Convert this number to hex.</p>
            <p className="mt-1 text-[11px] text-zinc-400">Hint: 1000₂ = 8₁₆, 0000₂ = 0₁₆</p>
          </div>
          {phase === "type-sep" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">0x</span>
              <input
                value={sepAnswer}
                onChange={(e) => setSepAnswer(e.target.value)}
                placeholder="??"
                maxLength={4}
                className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
              <button
                type="button"
                onClick={checkSep}
                disabled={!sepAnswer.trim()}
                className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-amber-700 disabled:bg-zinc-300"
              >
                Check
              </button>
            </div>
          ) : phaseNumber > 3 ? (
            <p className="font-mono text-sm text-emerald-700">10000000₂ = 0x80 ✓</p>
          ) : null}
        </StepCard>

        {/* Phase 4: type length */}
        <StepCard
          step={4}
          title="Write the message length in hex"
          active={phase === "type-length"}
          done={phase === "done"}
          color="indigo"
        >
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <p className="text-xs text-zinc-600">
              The last 8 bytes of the block = the original message length in bits (big-endian, 64-bit).
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              Length = {expectedBits} bits. Convert {expectedBits} to hex.
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">
              {expectedBits} ÷ 16 = {Math.floor(expectedBits / 16)} (remainder {expectedBits % 16}).
            </p>
          </div>
          {phase === "type-length" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">0x</span>
              <input
                value={lengthAnswer}
                onChange={(e) => setLengthAnswer(e.target.value)}
                placeholder="??"
                maxLength={20}
                className="w-32 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
              />
              <button
                type="button"
                onClick={checkLength}
                disabled={!lengthAnswer.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:bg-zinc-300"
              >
                Check
              </button>
            </div>
          ) : phase === "done" ? (
            <p className="font-mono text-sm text-emerald-700">{expectedBits} = 0x{expectedLengthHex} ✓</p>
          ) : null}
        </StepCard>

        {/* Done */}
        {phase === "done" && (
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Block assembled correctly!</p>
            <p className="mt-1 text-xs text-emerald-700">
              First {message.length} bytes are text ({Array.from(message).map(b => `0x${toHex(b)}`).join(" ")}),
              then 0x80, then {expectedZeros} zeros, and the last 8 bytes contain the number {expectedBits} (0x{expectedLengthHex}).
            </p>
          </div>
        )}

        {/* Reference */}
        <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
          <summary className="cursor-pointer font-medium text-zinc-800">Padding formula</summary>
          <div className="mt-2 space-y-1 font-mono text-[11px]">
            <p>message || 0x80 || zeros || length_64bit</p>
            <p>Number of zeros: (56 − len − 1) mod 64</p>
            <p>length_64bit = original length in bits (big-endian, 8 bytes)</p>
          </div>
        </details>
      </div>
    </LessonShell>
  );
}

function StepCard({
  step,
  title,
  active,
  done,
  color,
  children,
}: {
  step: number;
  title: string;
  active: boolean;
  done: boolean;
  color: string;
  children: React.ReactNode;
}) {
  const colors: Record<string, { border: string; bg: string; badge: string; doneBorder: string; doneBg: string }> = {
    cyan:    { border: "border-cyan-300",    bg: "bg-cyan-50/50",    badge: "bg-cyan-600",    doneBorder: "border-emerald-200", doneBg: "bg-emerald-50/30" },
    emerald: { border: "border-emerald-300", bg: "bg-emerald-50/50", badge: "bg-emerald-600", doneBorder: "border-emerald-200", doneBg: "bg-emerald-50/30" },
    amber:   { border: "border-amber-300",   bg: "bg-amber-50/50",   badge: "bg-amber-600",   doneBorder: "border-emerald-200", doneBg: "bg-emerald-50/30" },
    indigo:  { border: "border-indigo-300",  bg: "bg-indigo-50/50",  badge: "bg-indigo-600",  doneBorder: "border-emerald-200", doneBg: "bg-emerald-50/30" },
  };
  const c = colors[color] ?? colors.cyan!;

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all ${
        active
          ? `border-dashed ${c.border} ${c.bg}`
          : done
            ? `${c.doneBorder} ${c.doneBg}`
            : "border-zinc-200 bg-zinc-50/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <span
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
            active ? c.badge : done ? "bg-emerald-500" : "bg-zinc-300"
          }`}
        >
          {done ? "✓" : step}
        </span>
        <div className="flex w-full flex-col gap-2">
          <p className={`text-sm font-medium ${active || done ? "text-zinc-900" : "text-zinc-400"}`}>{title}</p>
          {(active || done) && children}
          {!active && !done && <p className="text-xs text-zinc-400">Solve previous steps first</p>}
        </div>
      </div>
    </div>
  );
}
