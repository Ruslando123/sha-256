"use client";

import type { ShaPhase } from "@/lib/sha256/types";

function phaseLabel(p: ShaPhase): string {
  switch (p) {
    case "padding":
      return "Padding";
    case "parse_block":
      return "Parse";
    case "schedule":
      return "W[t]";
    case "compress_start":
    case "compress_ch_sig1":
    case "compress_maj_sig0":
    case "compress_t1":
    case "compress_t2_update":
      return "Compress";
    case "block_finalize":
      return "H += state";
    case "complete":
      return "Digest";
    default:
      return p;
  }
}

function roughPhase(phase: ShaPhase): number {
  if (phase === "padding") return 0;
  if (phase === "parse_block") return 1;
  if (phase === "schedule") return 2;
  if (
    phase === "compress_start" ||
    phase === "compress_ch_sig1" ||
    phase === "compress_maj_sig0" ||
    phase === "compress_t1" ||
    phase === "compress_t2_update"
  )
    return 3;
  if (phase === "block_finalize") return 4;
  return 5;
}

type StepNavigatorProps = {
  index: number;
  count: number;
  phase: ShaPhase;
  title: string;
  onNext: () => void;
  onBack: () => void;
  nextDisabled: boolean;
};

export function StepNavigator({
  index,
  count,
  phase,
  title,
  onNext,
  onBack,
  nextDisabled,
}: StepNavigatorProps) {
  const bar = roughPhase(phase);
  const segments = ["Pre", "Parse", "Schedule", "Compress", "H", "Out"];

  return (
    <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-zinc-800 dark:text-zinc-100">{title}</p>
        <span className="font-mono text-xs text-zinc-500">
          шаг {index + 1} / {count}
        </span>
      </div>
      <div className="flex gap-1">
        {segments.map((lab, i) => (
          <div
            key={lab}
            className={`h-1 flex-1 rounded-full ${
              i <= bar ? "bg-cyan-600 dark:bg-cyan-500" : "bg-zinc-200 dark:bg-zinc-700"
            }`}
            title={lab}
          />
        ))}
      </div>
      <p className="text-xs text-zinc-500">
        Фаза: <span className="font-medium text-zinc-700 dark:text-zinc-300">{phaseLabel(phase)}</span>
      </p>
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onBack}
          disabled={index <= 0}
          className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-800 disabled:opacity-40 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
        >
          Назад
        </button>
        <button
          type="button"
          onClick={onNext}
          disabled={index >= count - 1 || nextDisabled}
          className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white disabled:opacity-40 dark:bg-cyan-500"
        >
          Далее
        </button>
      </div>
    </div>
  );
}
