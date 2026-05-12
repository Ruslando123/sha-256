"use client";

import { padMessage, parseBlock } from "@/lib/sha256/preprocess";
import { add32, gamma0, gamma1 } from "@/lib/sha256/primitives";
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

function toHex32(n: number): string {
  return n.toString(16).padStart(8, "0");
}

type Chip = { id: string; label: string; correct: boolean };

const CHIPS: Chip[] = [
  { id: "s1", label: "σ₁(W[t-2])", correct: true },
  { id: "w7", label: "W[t-7]", correct: true },
  { id: "s0", label: "σ₀(W[t-15])", correct: true },
  { id: "w16", label: "W[t-16]", correct: true },
  { id: "k", label: "K[t]", correct: false },
  { id: "h", label: "h", correct: false },
  { id: "ch", label: "Ch(e,f,g)", correct: false },
];

type Phase = "formula" | "identify" | "compute-g0" | "compute-g1" | "compute-sum" | "done";

export function ScheduleLesson(props: Props) {
  const { W, g0val, g1val, w16val } = useMemo(() => {
    const padded = padMessage(new TextEncoder().encode("abc"));
    const M = parseBlock(padded, 0);
    const words = Array.from(M);
    const g0 = gamma0(words[1]!);
    const g1 = gamma1(words[14]!);
    const w16 = add32(g1, words[9]!, g0, words[0]!);
    return { W: words, g0val: g0, g1val: g1, w16val: w16 };
  }, []);

  const chipOrder = useMemo(() => {
    const a = CHIPS.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j]!, a[i]!];
    }
    return a;
  }, []);

  const [phase, setPhase] = useState<Phase>("formula");
  const [selected, setSelected] = useState<string[]>([]);
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [hint, setHint] = useState("");

  const [identifyAnswers, setIdentifyAnswers] = useState<Record<string, string>>({});
  const [g0Answer, setG0Answer] = useState("");
  const [g1Answer, setG1Answer] = useState("");
  const [sumAnswer, setSumAnswer] = useState("");

  const correctSet = useMemo(
    () => new Set(CHIPS.filter((c) => c.correct).map((c) => c.id)),
    [],
  );

  const isComplete = phase === "done";
  useEffect(() => {
    if (isComplete) props.onComplete();
  }, [isComplete, props]);

  const toggle = (id: string) => {
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : prev.length < 4 ? [...prev, id] : prev,
    );
    setStatus("idle");
    setHint("");
  };

  const checkFormula = () => {
    const ok = selected.length === 4 && selected.every((id) => correctSet.has(id));
    if (ok) {
      setPhase("identify");
      setStatus("ok");
      setHint("");
    } else {
      setStatus("fail");
      setHint("K[t], h, and Ch are from the compression step, not from the schedule. You need to select 4 terms from the W[t] formula.");
    }
  };

  const checkIdentify = () => {
    const expected: Record<string, string> = {
      "W[t-2]": toHex32(W[14]!),
      "W[t-7]": toHex32(W[9]!),
      "W[t-15]": toHex32(W[1]!),
      "W[t-16]": toHex32(W[0]!),
    };
    let allCorrect = true;
    for (const [key, expectedVal] of Object.entries(expected)) {
      const guess = (identifyAnswers[key] ?? "").trim().toLowerCase().replace(/^0x/, "");
      if (guess !== expectedVal) {
        allCorrect = false;
        break;
      }
    }
    if (allCorrect) {
      setPhase("compute-g0");
      setStatus("ok");
      setHint("");
    } else {
      setStatus("fail");
      setHint(
        `For t=16: W[t-2]=W[14], W[t-7]=W[9], W[t-15]=W[1], W[t-16]=W[0]. Check the values table.`,
      );
    }
  };

  const checkG0 = () => {
    const guess = g0Answer.trim().toLowerCase().replace(/^0x/, "");
    if (guess === toHex32(g0val)) {
      setPhase("compute-g1");
      setStatus("ok");
      setHint("");
    } else {
      setStatus("fail");
      setHint("σ₀(W[1]) = ROTR⁷(W[1]) ⊕ ROTR¹⁸(W[1]) ⊕ SHR³(W[1]). Use the calculator for each operation separately.");
    }
  };

  const checkG1 = () => {
    const guess = g1Answer.trim().toLowerCase().replace(/^0x/, "");
    if (guess === toHex32(g1val)) {
      setPhase("compute-sum");
      setStatus("ok");
      setHint("");
    } else {
      setStatus("fail");
      setHint("σ₁(W[14]) = ROTR¹⁷(W[14]) ⊕ ROTR¹⁹(W[14]) ⊕ SHR¹⁰(W[14]). Use the calculator for each operation.");
    }
  };

  const checkSum = () => {
    const guess = sumAnswer.trim().toLowerCase().replace(/^0x/, "");
    if (guess === toHex32(w16val)) {
      setPhase("done");
      setStatus("ok");
      setHint("");
    } else {
      setStatus("fail");
      setHint(
        "W[16] = σ₁ + W[9] + σ₀ + W[0] (mod 2³²). Add all 4 numbers and take the remainder mod 2³². Use the calculator!",
      );
    }
  };

  const reset = () => {
    setPhase("formula");
    setSelected([]);
    setStatus("idle");
    setHint("");
    setIdentifyAnswers({});
    setG0Answer("");
    setG1Answer("");
    setSumAnswer("");
  };

  const phaseNum = phase === "formula" ? 1 : phase === "identify" ? 2 : phase === "compute-g0" ? 3 : phase === "compute-g1" ? 4 : phase === "compute-sum" ? 5 : 6;

  return (
    <LessonShell
      index={props.index}
      total={props.total}
      title="Message schedule W[t]"
      simpleWords="From 16 original words, 64 must be produced. Each new word is a sum of four components with small mixers σ₀ and σ₁. Here you will compute W[16] yourself."
      whyMatters="This way every bit affects many subsequent words. Without it, the hash would be predictable."
      taskTitle={
        phase === "formula" ? "Step 1: Select the 4 terms of the W[t] formula"
        : phase === "identify" ? "Step 2: Find the required values for t=16"
        : phase === "compute-g0" ? "Step 3: Compute σ₀(W[1])"
        : phase === "compute-g1" ? "Step 4: Compute σ₁(W[14])"
        : phase === "compute-sum" ? "Step 5: Add everything to get W[16]"
        : "W[16] computed!"
      }
      status={isComplete ? "ok" : status}
      successText={`You computed W[16] = 0x${toHex32(w16val)}. W[17]..W[63] are computed the same way.`}
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
        {/* W[0..15] reference table */}
        <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700" open={phaseNum >= 2 && phaseNum <= 5}>
          <summary className="cursor-pointer font-medium text-zinc-800">Table W[0]..W[15] (from the previous lesson)</summary>
          <div className="mt-2 grid grid-cols-2 gap-1 font-mono text-[11px] sm:grid-cols-4">
            {W.map((w, i) => {
              const highlight = phaseNum >= 2 && [0, 1, 9, 14].includes(i);
              return (
                <div
                  key={i}
                  className={`rounded px-2 py-1 ${highlight ? "bg-cyan-100 text-cyan-900 ring-1 ring-cyan-300" : "bg-white text-zinc-700 ring-1 ring-zinc-100"}`}
                >
                  <span className="text-zinc-500">W[{i}]</span> {toHex32(w)}
                </div>
              );
            })}
          </div>
        </details>

        {/* Phase 1: Formula */}
        <PhaseCard step={1} title="Select the 4 terms of the W[t] formula (t ≥ 16)" active={phase === "formula"} done={phaseNum > 1} color="cyan">
          <p className="rounded-lg bg-white p-3 font-mono text-sm text-zinc-800 ring-1 ring-zinc-200">
            W[t] ={" "}
            {Array.from({ length: 4 }).map((_, i) => {
              const chipId = selected[i];
              const chip = chipId ? CHIPS.find((c) => c.id === chipId) : undefined;
              return (
                <span key={i} className="inline-block">
                  <span className={`mx-1 inline-block rounded border px-2 py-1 text-sm ${chip ? "border-cyan-300 bg-cyan-50 text-cyan-900" : "border-dashed border-zinc-300 text-zinc-400"}`}>
                    {chip ? chip.label : "?"}
                  </span>
                  {i < 3 ? <span className="text-zinc-500"> + </span> : null}
                </span>
              );
            })}
          </p>
          {phase === "formula" && (
            <>
              <div className="flex flex-wrap gap-2">
                {chipOrder.map((c) => {
                  const isPicked = selected.includes(c.id);
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => toggle(c.id)}
                      className={`rounded-lg border px-3 py-2 text-sm transition ${isPicked ? "border-cyan-500 bg-cyan-100 text-cyan-900" : "border-zinc-300 bg-white text-zinc-800 hover:border-cyan-300"}`}
                    >
                      {c.label}
                    </button>
                  );
                })}
              </div>
              <button
                type="button"
                onClick={checkFormula}
                disabled={selected.length !== 4}
                className="w-fit rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white disabled:bg-zinc-300"
              >
                Check
              </button>
            </>
          )}
          {phaseNum > 1 && (
            <p className="font-mono text-sm text-emerald-700">W[t] = σ₁(W[t-2]) + W[t-7] + σ₀(W[t-15]) + W[t-16] ✓</p>
          )}
        </PhaseCard>

        {/* Phase 2: Identify values for t=16 */}
        <PhaseCard step={2} title="Substitute the values for t = 16" active={phase === "identify"} done={phaseNum > 2} color="indigo">
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <p className="text-xs text-zinc-600 mb-2">
              For t = 16: W[t-2] = W[14], W[t-7] = W[9], W[t-15] = W[1], W[t-16] = W[0].
              Find their values in the table above and enter them:
            </p>
            <div className="grid gap-2 sm:grid-cols-2">
              {["W[t-2]", "W[t-7]", "W[t-15]", "W[t-16]"].map((label) => {
                const idx = label === "W[t-2]" ? 14 : label === "W[t-7]" ? 9 : label === "W[t-15]" ? 1 : 0;
                return (
                  <div key={label} className="flex items-center gap-2">
                    <span className="w-16 text-xs font-medium text-zinc-600">{label} =</span>
                    {phase === "identify" ? (
                      <input
                        value={identifyAnswers[label] ?? ""}
                        onChange={(e) => setIdentifyAnswers((p) => ({ ...p, [label]: e.target.value }))}
                        placeholder={`W[${idx}] = ?`}
                        className="flex-1 rounded-lg border border-zinc-300 bg-zinc-50 px-2 py-1.5 font-mono text-xs outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                      />
                    ) : (
                      <span className="font-mono text-xs text-emerald-700">0x{toHex32(W[idx]!)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
          {phase === "identify" && (
            <button type="button" onClick={checkIdentify} className="w-fit rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white">
              Check
            </button>
          )}
          {phaseNum > 2 && <p className="text-xs text-emerald-600">Values found ✓</p>}
        </PhaseCard>

        {/* Phase 3: Compute σ₀ */}
        <PhaseCard step={3} title="Compute σ₀(W[1])" active={phase === "compute-g0"} done={phaseNum > 3} color="amber">
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <p className="text-xs text-zinc-600">
              σ₀(x) = ROTR<sup>7</sup>(x) ⊕ ROTR<sup>18</sup>(x) ⊕ SHR<sup>3</sup>(x)
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              x = W[1] = <code className="font-mono text-amber-700">0x{toHex32(W[1]!)}</code>
            </p>
            <p className="mt-1 text-[11px] text-zinc-400">
              Use the calculator (button at the bottom right) — ROTR and XOR operations.
            </p>
          </div>
          {phase === "compute-g0" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">0x</span>
              <input
                value={g0Answer}
                onChange={(e) => setG0Answer(e.target.value)}
                placeholder="????????"
                className="w-36 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-100"
              />
              <button type="button" onClick={checkG0} disabled={!g0Answer.trim()} className="rounded-lg bg-amber-600 px-4 py-2 text-sm font-medium text-white disabled:bg-zinc-300">
                Check
              </button>
            </div>
          ) : phaseNum > 3 ? (
            <p className="font-mono text-sm text-emerald-700">σ₀(W[1]) = 0x{toHex32(g0val)} ✓</p>
          ) : null}
        </PhaseCard>

        {/* Phase 4: Compute σ₁ */}
        <PhaseCard step={4} title="Compute σ₁(W[14])" active={phase === "compute-g1"} done={phaseNum > 4} color="rose">
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <p className="text-xs text-zinc-600">
              σ₁(x) = ROTR<sup>17</sup>(x) ⊕ ROTR<sup>19</sup>(x) ⊕ SHR<sup>10</sup>(x)
            </p>
            <p className="mt-1 text-xs text-zinc-500">
              x = W[14] = <code className="font-mono text-rose-700">0x{toHex32(W[14]!)}</code>
            </p>
          </div>
          {phase === "compute-g1" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">0x</span>
              <input
                value={g1Answer}
                onChange={(e) => setG1Answer(e.target.value)}
                placeholder="????????"
                className="w-36 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-100"
              />
              <button type="button" onClick={checkG1} disabled={!g1Answer.trim()} className="rounded-lg bg-rose-600 px-4 py-2 text-sm font-medium text-white disabled:bg-zinc-300">
                Check
              </button>
            </div>
          ) : phaseNum > 4 ? (
            <p className="font-mono text-sm text-emerald-700">σ₁(W[14]) = 0x{toHex32(g1val)} ✓</p>
          ) : null}
        </PhaseCard>

        {/* Phase 5: Sum */}
        <PhaseCard step={5} title="Add everything to get W[16]" active={phase === "compute-sum"} done={phase === "done"} color="emerald">
          <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
            <p className="text-xs text-zinc-600 mb-2">
              W[16] = σ₁(W[14]) + W[9] + σ₀(W[1]) + W[0] <span className="text-zinc-400">(mod 2³²)</span>
            </p>
            <div className="grid gap-1 font-mono text-xs">
              <span className="text-zinc-600">σ₁ = 0x{toHex32(g1val)}</span>
              <span className="text-zinc-600">W[9] = 0x{toHex32(W[9]!)}</span>
              <span className="text-zinc-600">σ₀ = 0x{toHex32(g0val)}</span>
              <span className="text-zinc-600">W[0] = 0x{toHex32(W[0]!)}</span>
            </div>
            <p className="mt-2 text-[11px] text-zinc-400">
              Add 4 numbers. If the sum exceeds 2³² (= 0x100000000), take the remainder.
            </p>
          </div>
          {phase === "compute-sum" ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-zinc-500">0x</span>
              <input
                value={sumAnswer}
                onChange={(e) => setSumAnswer(e.target.value)}
                placeholder="????????"
                className="w-36 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
              />
              <button type="button" onClick={checkSum} disabled={!sumAnswer.trim()} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white disabled:bg-zinc-300">
                Check
              </button>
            </div>
          ) : phase === "done" ? (
            <p className="font-mono text-sm text-emerald-700">W[16] = 0x{toHex32(w16val)} ✓</p>
          ) : null}
        </PhaseCard>

        {/* Formula reference */}
        <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
          <summary className="cursor-pointer font-medium text-zinc-800">Reference: σ₀ and σ₁</summary>
          <div className="mt-2 space-y-1 font-mono text-[11px]">
            <p>σ₀(x) = ROTR⁷(x) ⊕ ROTR¹⁸(x) ⊕ SHR³(x)</p>
            <p>σ₁(x) = ROTR¹⁷(x) ⊕ ROTR¹⁹(x) ⊕ SHR¹⁰(x)</p>
            <p>ROTR = circular right shift (bits wrap around)</p>
            <p>SHR = logical right shift (bits are lost, zeros fill from the left)</p>
          </div>
        </details>
      </div>
    </LessonShell>
  );
}

function PhaseCard({
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
  const borderColors: Record<string, string> = {
    cyan: "border-cyan-300", indigo: "border-indigo-300", amber: "border-amber-300",
    rose: "border-rose-300", emerald: "border-emerald-300",
  };
  const bgColors: Record<string, string> = {
    cyan: "bg-cyan-50/50", indigo: "bg-indigo-50/50", amber: "bg-amber-50/50",
    rose: "bg-rose-50/50", emerald: "bg-emerald-50/50",
  };
  const badgeColors: Record<string, string> = {
    cyan: "bg-cyan-600", indigo: "bg-indigo-600", amber: "bg-amber-600",
    rose: "bg-rose-600", emerald: "bg-emerald-600",
  };

  return (
    <div
      className={`rounded-xl border-2 p-4 transition-all ${
        active ? `border-dashed ${borderColors[color]} ${bgColors[color]}` : done ? "border-emerald-200 bg-emerald-50/30" : "border-zinc-200 bg-zinc-50/30"
      }`}
    >
      <div className="flex items-start gap-3">
        <span className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${active ? badgeColors[color] : done ? "bg-emerald-500" : "bg-zinc-300"}`}>
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
