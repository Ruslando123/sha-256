"use client";

import { useState } from "react";

type Mode = "hex" | "dec" | "bin";
type Op = "xor" | "and" | "or" | "add" | "rotr" | "not";

const OP_LABELS: Record<Op, string> = {
  xor: "XOR (⊕)",
  and: "AND (∧)",
  or: "OR (∨)",
  add: "ADD mod 2³²",
  rotr: "ROTR",
  not: "NOT (¬)",
};

function parseNum(str: string, mode: Mode): number {
  const s = str.replace(/\s/g, "");
  if (!s) return 0;
  try {
    if (mode === "hex") return parseInt(s, 16) >>> 0;
    if (mode === "bin") return parseInt(s, 2) >>> 0;
    return parseInt(s, 10) >>> 0;
  } catch {
    return 0;
  }
}

function fmt(n: number, mode: Mode): string {
  if (mode === "hex") return n.toString(16).padStart(8, "0");
  if (mode === "bin") return n.toString(2).padStart(32, "0");
  return n.toString(10);
}

function compute(a: number, b: number, op: Op): number {
  switch (op) {
    case "xor": return (a ^ b) >>> 0;
    case "and": return (a & b) >>> 0;
    case "or":  return (a | b) >>> 0;
    case "add": return (a + b) >>> 0;
    case "rotr": return ((a >>> (b & 31)) | (a << (32 - (b & 31)))) >>> 0;
    case "not": return (~a) >>> 0;
  }
}

export function HexCalculator() {
  const [open, setOpen] = useState(false);
  const [modeA, setModeA] = useState<Mode>("hex");
  const [modeB, setModeB] = useState<Mode>("dec");
  const [valueA, setValueA] = useState("");
  const [valueB, setValueB] = useState("");
  const [op, setOp] = useState<Op>("xor");

  const numA = parseNum(valueA, modeA);
  const numB = parseNum(valueB, modeB);
  const result = compute(numA, numB, op);
  const hasInput = valueA.trim().length > 0;

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-5 right-5 z-50 flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-300/40 transition-all hover:scale-105 hover:shadow-xl hover:shadow-indigo-300/60"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
        </svg>
        Калькулятор
      </button>
    );
  }

  const modeBtn = (current: Mode, target: Mode, label: string, set: (m: Mode) => void) => (
    <button
      type="button"
      onClick={() => set(target)}
      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition ${
        current === target
          ? "bg-indigo-600 text-white"
          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="fixed bottom-5 right-5 z-50 w-[360px] overflow-hidden rounded-2xl border border-white/40 bg-white/95 shadow-2xl shadow-indigo-200/50 backdrop-blur-xl">
      <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2.5">
        <span className="text-sm font-bold text-white">Hex/Bin/Dec Калькулятор</span>
        <button
          type="button"
          onClick={() => setOpen(false)}
          className="rounded-lg p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      <div className="flex flex-col gap-3 p-4">
        {/* Value A */}
        <div>
          <div className="mb-1 flex items-center gap-1">
            <span className="text-[11px] font-semibold text-zinc-500">A</span>
            {modeBtn(modeA, "hex", "HEX", setModeA)}
            {modeBtn(modeA, "dec", "DEC", setModeA)}
            {modeBtn(modeA, "bin", "BIN", setModeA)}
          </div>
          <input
            value={valueA}
            onChange={(e) => setValueA(e.target.value)}
            placeholder={modeA === "hex" ? "ff00abcd" : modeA === "bin" ? "10110010..." : "42"}
            className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
          />
          {hasInput && (
            <div className="mt-1.5 grid grid-cols-3 gap-1 text-[10px]">
              <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-indigo-700">
                HEX {fmt(numA, "hex")}
              </span>
              <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-emerald-700">
                DEC {fmt(numA, "dec")}
              </span>
              <span className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-amber-700 overflow-hidden text-ellipsis">
                BIN {fmt(numA, "bin").slice(-16)}…
              </span>
            </div>
          )}
        </div>

        {/* Operation */}
        <div>
          <p className="mb-1 text-[11px] font-semibold text-zinc-500">Операция</p>
          <div className="flex flex-wrap gap-1">
            {(Object.keys(OP_LABELS) as Op[]).map((o) => (
              <button
                key={o}
                type="button"
                onClick={() => setOp(o)}
                className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                  op === o
                    ? "border-indigo-400 bg-indigo-50 text-indigo-800"
                    : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300"
                }`}
              >
                {OP_LABELS[o]}
              </button>
            ))}
          </div>
        </div>

        {/* Value B (hidden for NOT) */}
        {op !== "not" && (
          <div>
            <div className="mb-1 flex items-center gap-1">
              <span className="text-[11px] font-semibold text-zinc-500">
                B {op === "rotr" ? "(сдвиг, бит)" : ""}
              </span>
              {op !== "rotr" && modeBtn(modeB, "hex", "HEX", setModeB)}
              {op !== "rotr" && modeBtn(modeB, "dec", "DEC", setModeB)}
              {op !== "rotr" && modeBtn(modeB, "bin", "BIN", setModeB)}
            </div>
            <input
              value={valueB}
              onChange={(e) => setValueB(e.target.value)}
              placeholder={op === "rotr" ? "7" : "0"}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        )}

        {/* Result */}
        {hasInput && (
          <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-cyan-50 p-3">
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">Результат</p>
            <div className="grid gap-1">
              <p className="font-mono text-sm font-bold text-indigo-900">
                HEX: {fmt(result, "hex")}
              </p>
              <p className="font-mono text-xs text-zinc-700">
                DEC: {fmt(result, "dec")}
              </p>
              <p className="break-all font-mono text-[10px] text-zinc-500">
                BIN: {fmt(result, "bin")}
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
