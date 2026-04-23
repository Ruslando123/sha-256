"use client";

import { EduTooltip } from "./EduTooltip";

const names = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

function fmt32(x: number): string {
  return (x >>> 0).toString(16).padStart(8, "0");
}

function fmtBin32(x: number): string {
  const v = x >>> 0;
  let s = "";
  for (let i = 31; i >= 0; i--) {
    s += ((v >>> i) & 1).toString();
    if (i > 0 && i % 8 === 0) s += " ";
  }
  return s;
}

type RegistersPanelProps = {
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
  prev?: {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
    g: number;
    h: number;
  };
  binaryMode: boolean;
};

export function RegistersPanel({ a, b, c, d, e, f, g, h, prev, binaryMode }: RegistersPanelProps) {
  const vals = [a, b, c, d, e, f, g, h];
  const prevs = prev ? [prev.a, prev.b, prev.c, prev.d, prev.e, prev.f, prev.g, prev.h] : null;

  return (
    <section className="rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 dark:border-zinc-700 dark:bg-zinc-900/50">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Рабочие регистры</h3>
        <EduTooltip glossaryKey="mod32" label="mod 2³²" />
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-8">
        {names.map((name, i) => {
          const v = vals[i]!;
          const changed = prevs && (v >>> 0) !== (prevs[i]! >>> 0);
          return (
            <div
              key={name}
              className={`rounded-lg border px-2 py-2 font-mono text-xs ${
                changed
                  ? "border-amber-400 bg-amber-50 dark:border-amber-600 dark:bg-amber-950/40"
                  : "border-zinc-200 bg-white dark:border-zinc-600 dark:bg-zinc-950"
              }`}
            >
              <div className="mb-1 text-[10px] font-sans font-medium uppercase tracking-wide text-zinc-500">
                {name}
              </div>
              <div className="break-all text-zinc-900 dark:text-zinc-100">
                {binaryMode ? fmtBin32(v) : fmt32(v)}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
