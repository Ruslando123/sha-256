"use client";

import { EduTooltip } from "./EduTooltip";

function fmt32(x: number | undefined): string {
  if (x === undefined) return "—";
  return (x >>> 0).toString(16).padStart(8, "0");
}

type RoundDetailPanelProps = {
  round?: number;
  K_t?: number;
  s0?: number;
  s1?: number;
  Ch?: number;
  Maj?: number;
  T1?: number;
  T2?: number;
};

export function RoundDetailPanel({
  round,
  K_t,
  s0,
  s1,
  Ch,
  Maj,
  T1,
  T2,
}: RoundDetailPanelProps) {
  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
      <h3 className="mb-3 text-sm font-semibold text-zinc-800 dark:text-zinc-100">
        Промежуточные значения
        {round !== undefined ? (
          <span className="ml-2 font-mono text-xs font-normal text-zinc-500">раунд {round + 1}/64</span>
        ) : null}
      </h3>
      <dl className="grid grid-cols-1 gap-2 font-mono text-xs text-zinc-800 sm:grid-cols-2 dark:text-zinc-200">
        <div className="flex justify-between gap-2 rounded bg-zinc-50 px-2 py-1 dark:bg-zinc-900">
          <dt className="flex items-center gap-1 text-zinc-500">
            <EduTooltip glossaryKey="constants_kt" label="Kₜ" />
          </dt>
          <dd>0x{fmt32(K_t)}</dd>
        </div>
        <div className="flex justify-between gap-2 rounded bg-zinc-50 px-2 py-1 dark:bg-zinc-900">
          <dt className="flex items-center gap-1 text-zinc-500">
            <EduTooltip glossaryKey="compress_ch_sig1" label="Σ₁(e)" />
          </dt>
          <dd>0x{fmt32(s1)}</dd>
        </div>
        <div className="flex justify-between gap-2 rounded bg-zinc-50 px-2 py-1 dark:bg-zinc-900">
          <dt className="text-zinc-500">Ch</dt>
          <dd>0x{fmt32(Ch)}</dd>
        </div>
        <div className="flex justify-between gap-2 rounded bg-zinc-50 px-2 py-1 dark:bg-zinc-900">
          <dt className="flex items-center gap-1 text-zinc-500">
            <EduTooltip glossaryKey="compress_maj_sig0" label="Σ₀(a)" />
          </dt>
          <dd>0x{fmt32(s0)}</dd>
        </div>
        <div className="flex justify-between gap-2 rounded bg-zinc-50 px-2 py-1 dark:bg-zinc-900">
          <dt className="text-zinc-500">Maj</dt>
          <dd>0x{fmt32(Maj)}</dd>
        </div>
        <div className="flex justify-between gap-2 rounded bg-zinc-50 px-2 py-1 dark:bg-zinc-900">
          <dt className="text-zinc-500">T₁</dt>
          <dd>0x{fmt32(T1)}</dd>
        </div>
        <div className="flex justify-between gap-2 rounded bg-zinc-50 px-2 py-1 dark:bg-zinc-900">
          <dt className="text-zinc-500">T₂</dt>
          <dd>0x{fmt32(T2)}</dd>
        </div>
      </dl>
    </section>
  );
}
