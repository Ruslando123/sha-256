"use client";

type MessageSchedulePanelProps = {
  W?: Uint32Array;
  highlightIndex?: number;
  guidedFocus?: boolean;
};

function fmt32(x: number): string {
  return (x >>> 0).toString(16).padStart(8, "0");
}

export function MessageSchedulePanel({ W, highlightIndex, guidedFocus = false }: MessageSchedulePanelProps) {
  if (!W) {
    return (
      <section
        className={`rounded-xl border border-zinc-200 bg-white p-4 transition-all dark:border-zinc-700 dark:bg-zinc-950 ${
          guidedFocus ? "edu-panel-focus ring-2 ring-cyan-300/70" : ""
        }`}
      >
        <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Расписание W</h3>
        <p className="text-xs text-zinc-500">Появится после этапа разбора блока.</p>
      </section>
    );
  }

  const hi = highlightIndex ?? -1;
  const srcA = hi >= 16 ? hi - 2 : -1;
  const srcB = hi >= 16 ? hi - 7 : -1;
  const srcC = hi >= 16 ? hi - 15 : -1;
  const srcD = hi >= 16 ? hi - 16 : -1;

  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-white p-4 transition-all dark:border-zinc-700 dark:bg-zinc-950 ${
        guidedFocus ? "edu-panel-focus ring-2 ring-cyan-300/70" : ""
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Расписание сообщения</h3>
        <span className="text-xs text-zinc-500">
          W<sub className="align-baseline">t</sub>
          {hi >= 0 ? <> — текущее слово W[{hi}]</> : null}
        </span>
      </div>
      {hi >= 0 ? (
        <div className="mb-3 space-y-1 font-mono text-sm text-cyan-800 dark:text-cyan-200">
          <p>
            W[{hi}] = 0x{fmt32(W[hi]!)}
          </p>
          {hi >= 16 ? (
            <p className="text-xs text-cyan-700 dark:text-cyan-300">
              Источники: W[{srcA}], W[{srcB}], W[{srcC}], W[{srcD}]
            </p>
          ) : null}
        </div>
      ) : null}
      <div className="max-h-48 overflow-auto rounded border border-zinc-100 bg-zinc-50 p-2 font-mono text-[10px] leading-tight text-zinc-800 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-200 sm:text-xs">
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: 64 }, (_, t) => (
            <span
              key={t}
              className={
                t === hi
                  ? "edu-w-highlight inline-block rounded bg-cyan-200 px-0.5 font-semibold text-cyan-950 ring-2 ring-cyan-400/50 transition-shadow duration-200 dark:bg-cyan-900 dark:text-cyan-50 dark:ring-cyan-500/40"
                  : t === srcA || t === srcB || t === srcC || t === srcD
                    ? "inline-block rounded bg-violet-100 px-0.5 text-violet-900 dark:bg-violet-900/40 dark:text-violet-100"
                  : "inline-block transition-colors duration-200"
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
