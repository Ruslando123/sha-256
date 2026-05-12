"use client";

import { H0, K } from "@/lib/sha256/constants";
import { padMessage, parseBlock } from "@/lib/sha256/preprocess";
import { Ch, Maj, Sigma0, Sigma1, add32 } from "@/lib/sha256/primitives";
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

const REGISTER_NAMES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

function toHex32(n: number): string {
  return n.toString(16).padStart(8, "0");
}

type StepId = "s1" | "ch" | "t1" | "s0" | "maj" | "t2";

type StepMeta = {
  label: string;
  formula: string;
  explain: string;
};

const STEP_META: Record<StepId, StepMeta> = {
  s1: {
    label: "Σ₁(e)",
    formula: "Σ₁(e) = ROTR⁶(e) ⊕ ROTR¹¹(e) ⊕ ROTR²⁵(e)",
    explain: "Take register e and rotate right by 6, 11, and 25 bits, then XOR.",
  },
  ch: {
    label: "Ch(e, f, g)",
    formula: "Ch(e,f,g) = (e ∧ f) ⊕ (¬e ∧ g)",
    explain: "If bit e = 1, take bit f. If e = 0, take bit g.",
  },
  t1: {
    label: "T₁",
    formula: "T₁ = h + Σ₁ + Ch + K[0] + W[0]  (mod 2³²)",
    explain: "Add 5 numbers: h, Σ₁, Ch, constant K, and word W.",
  },
  s0: {
    label: "Σ₀(a)",
    formula: "Σ₀(a) = ROTR²(a) ⊕ ROTR¹³(a) ⊕ ROTR²²(a)",
    explain: "Same as Σ₁, but for register a with different shift amounts.",
  },
  maj: {
    label: "Maj(a, b, c)",
    formula: "Maj(a,b,c) = (a ∧ b) ⊕ (a ∧ c) ⊕ (b ∧ c)",
    explain: "The result bit = the bit that appears more often (majority vote, 2 out of 3).",
  },
  t2: {
    label: "T₂",
    formula: "T₂ = Σ₀ + Maj  (mod 2³²)",
    explain: "Add two intermediate results.",
  },
};

const STEP_ORDER: StepId[] = ["s1", "ch", "t1", "s0", "maj", "t2"];

export function CompressionLesson(props: Props) {
  const round = useMemo(() => {
    const padded = padMessage(new TextEncoder().encode("abc"));
    const M = parseBlock(padded, 0);
    const W0 = M[0]!;
    const a = H0[0]!, b = H0[1]!, c = H0[2]!, d = H0[3]!;
    const e = H0[4]!, f = H0[5]!, g = H0[6]!, h = H0[7]!;
    const s1 = Sigma1(e);
    const ch = Ch(e, f, g);
    const t1 = add32(h, s1, ch, K[0]!, W0);
    const s0 = Sigma0(a);
    const maj = Maj(a, b, c);
    const t2 = add32(s0, maj);
    const newA = add32(t1, t2);
    const newE = add32(d, t1);
    return {
      regs: { a, b, c, d, e, f, g, h },
      W: W0, K: K[0]!,
      values: { s1, ch, t1, s0, maj, t2 } as Record<StepId, number>,
      after: [newA, a, b, c, newE, e, f, g] as const,
    };
  }, []);

  const [stepIdx, setStepIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [hint, setHint] = useState("");
  const [computed, setComputed] = useState<Record<string, number>>({});

  const finished = stepIdx >= STEP_ORDER.length;

  useEffect(() => {
    if (finished) props.onComplete();
  }, [finished, props]);

  const currentStep = finished ? null : STEP_ORDER[stepIdx]!;
  const currentMeta = currentStep ? STEP_META[currentStep] : null;

  const checkAnswer = () => {
    if (!currentStep) return;
    const expected = round.values[currentStep];
    const guess = answer.trim().toLowerCase().replace(/^0x/, "");
    if (guess === toHex32(expected)) {
      setComputed((prev) => ({ ...prev, [currentStep]: expected }));
      setStepIdx((s) => s + 1);
      setAnswer("");
      setStatus("ok");
      setHint("");
    } else {
      setStatus("fail");
      setHint("Incorrect. Double-check your calculations with the calculator. Make sure all operations are mod 2³².");
    }
  };

  const reset = () => {
    setStepIdx(0);
    setAnswer("");
    setStatus("idle");
    setHint("");
    setComputed({});
  };

  const regs = round.regs;

  return (
    <LessonShell
      index={props.index}
      total={props.total}
      title="One compression round"
      simpleWords="In each of the 64 rounds, 8 registers (a..h) are updated according to a strict formula. Here you will compute all intermediate values of round #1 yourself."
      whyMatters="Compression makes SHA-256 irreversible: each round increases the entanglement of data."
      taskTitle={finished ? "Round computed!" : `Step ${stepIdx + 1}/6: Compute ${currentMeta?.label}`}
      status={finished ? "ok" : status}
      successText="Round complete! You computed every step yourself. This happens 63 more times in the first block."
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
        {/* Registers */}
        <section>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Registers (round 0)</p>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-8">
            {REGISTER_NAMES.map((name) => {
              const isActive = currentStep === "s1" && name === "e"
                || currentStep === "ch" && ["e", "f", "g"].includes(name)
                || currentStep === "t1" && name === "h"
                || currentStep === "s0" && name === "a"
                || currentStep === "maj" && ["a", "b", "c"].includes(name);
              return (
                <div
                  key={name}
                  className={`rounded-lg border p-2 font-mono text-[11px] transition ${
                    isActive ? "border-amber-400 bg-amber-50 text-amber-900 ring-1 ring-amber-300" : "border-zinc-200 bg-white text-zinc-700"
                  }`}
                >
                  <div className="text-[10px] uppercase tracking-wide text-zinc-500">{name}</div>
                  <div>{toHex32(regs[name as keyof typeof regs])}</div>
                </div>
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-zinc-500">
            W[0] = <span className="font-mono text-zinc-700">{toHex32(round.W)}</span>,{" "}
            K[0] = <span className="font-mono text-zinc-700">{toHex32(round.K)}</span>
          </p>
        </section>

        {/* Steps */}
        {STEP_ORDER.map((id, i) => {
          const meta = STEP_META[id];
          const isDone = computed[id] !== undefined;
          const isActive = i === stepIdx && !finished;
          const isLocked = i > stepIdx;

          return (
            <div
              key={id}
              className={`rounded-xl border-2 p-4 transition-all ${
                isActive
                  ? "border-dashed border-cyan-300 bg-cyan-50/50"
                  : isDone
                    ? "border-emerald-200 bg-emerald-50/30"
                    : "border-zinc-200 bg-zinc-50/30"
              }`}
            >
              <div className="flex items-start gap-3">
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                    isActive ? "bg-cyan-600" : isDone ? "bg-emerald-500" : "bg-zinc-300"
                  }`}
                >
                  {isDone ? "✓" : i + 1}
                </span>
                <div className="flex w-full flex-col gap-2">
                  <p className={`text-sm font-medium ${isActive || isDone ? "text-zinc-900" : "text-zinc-400"}`}>
                    {meta.label}
                  </p>

                  {(isActive || isDone) && (
                    <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
                      <p className="font-mono text-xs text-zinc-700">{meta.formula}</p>
                      <p className="mt-1 text-[11px] text-zinc-500">{meta.explain}</p>
                      {isActive && (
                        <div className="mt-2 grid gap-1 text-[11px] font-mono text-zinc-600">
                          {id === "s1" && <span>e = 0x{toHex32(regs.e)}</span>}
                          {id === "ch" && (
                            <>
                              <span>e = 0x{toHex32(regs.e)}</span>
                              <span>f = 0x{toHex32(regs.f)}</span>
                              <span>g = 0x{toHex32(regs.g)}</span>
                            </>
                          )}
                          {id === "t1" && (
                            <>
                              <span>h = 0x{toHex32(regs.h)}</span>
                              <span>Σ₁ = 0x{toHex32(computed.s1!)}</span>
                              <span>Ch = 0x{toHex32(computed.ch!)}</span>
                              <span>K[0] = 0x{toHex32(round.K)}</span>
                              <span>W[0] = 0x{toHex32(round.W)}</span>
                            </>
                          )}
                          {id === "s0" && <span>a = 0x{toHex32(regs.a)}</span>}
                          {id === "maj" && (
                            <>
                              <span>a = 0x{toHex32(regs.a)}</span>
                              <span>b = 0x{toHex32(regs.b)}</span>
                              <span>c = 0x{toHex32(regs.c)}</span>
                            </>
                          )}
                          {id === "t2" && (
                            <>
                              <span>Σ₀ = 0x{toHex32(computed.s0!)}</span>
                              <span>Maj = 0x{toHex32(computed.maj!)}</span>
                            </>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {isActive && (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-zinc-500">0x</span>
                      <input
                        value={answer}
                        onChange={(e) => setAnswer(e.target.value)}
                        placeholder="????????"
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
                  )}

                  {isDone && (
                    <p className="font-mono text-sm text-emerald-700">
                      {meta.label} = 0x{toHex32(computed[id]!)} ✓
                    </p>
                  )}

                  {isLocked && <p className="text-xs text-zinc-400">Solve previous steps first</p>}
                </div>
              </div>
            </div>
          );
        })}

        {/* Shift result */}
        {finished && (
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
            <p className="text-sm font-semibold text-emerald-800">Register pipeline after the round:</p>
            <p className="mt-1 text-xs text-emerald-700">
              a' = T₁ + T₂ = <span className="font-mono">0x{toHex32(round.after[0])}</span>,{" "}
              e' = d + T₁ = <span className="font-mono">0x{toHex32(round.after[4])}</span>.
              The rest shift: b←a, c←b, d←c, f←e, g←f, h←g.
            </p>
            <div className="mt-2 grid grid-cols-4 gap-1 font-mono text-[11px] sm:grid-cols-8">
              {round.after.map((v, i) => (
                <div key={i} className="rounded bg-white px-2 py-1 text-center ring-1 ring-emerald-200">
                  <span className="text-emerald-600">{REGISTER_NAMES[i]}'</span>
                  <br />
                  {toHex32(v)}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reference */}
        <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
          <summary className="cursor-pointer font-medium text-zinc-800">Mini-explanation of Ch on 4 bits</summary>
          <div className="mt-2 grid grid-cols-3 gap-x-4 gap-y-1 font-mono text-[11px]">
            <span>e = 1010</span>
            <span>f = 1111</span>
            <span>g = 0000</span>
            <span className="col-span-3">Where e=1 → take f. Where e=0 → take g.</span>
            <span className="col-span-3">Ch = 1010 (matches f, because g is all zeros)</span>
          </div>
        </details>
      </div>
    </LessonShell>
  );
}
