"use client";

type MessageSchedulePanelProps = {
  W?: Uint32Array;
  highlightIndex?: number;
};

function fmt32(x: number): string {
  return (x >>> 0).toString(16).padStart(8, "0");
}

export function MessageSchedulePanel({ W, highlightIndex }: MessageSchedulePanelProps) {
  if (!W) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
        <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Расписание W</h3>
        <p className="text-xs text-zinc-500">Появится после этапа разбора блока.</p>
      </section>
    );
  }

  const hi = highlightIndex ?? -1;

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Расписание сообщения</h3>
        <span className="text-xs text-zinc-500">
          W<sub className="align-baseline">t</sub>
          {hi >= 0 ? <> — текущее слово W[{hi}]</> : null}
        </span>
      </div>
      {hi >= 0 ? (
        <p className="mb-3 font-mono text-sm text-cyan-800 dark:text-cyan-200">
          W[{hi}] = 0x{fmt32(W[hi]!)}
        </p>
      ) : null}
      <div className="max-h-48 overflow-auto rounded border border-zinc-100 bg-zinc-50 p-2 font-mono text-[10px] leading-tight text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 sm:text-xs">
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: 64 }, (_, t) => (
            <span
              key={t}
              className={
                t === hi
                  ? "rounded bg-cyan-200 px-0.5 font-semibold text-cyan-950 dark:bg-cyan-900 dark:text-cyan-50"
                  : ""
              }
            >
              {fmt32(W[t]!)}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
