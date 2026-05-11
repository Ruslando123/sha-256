"use client";

import type { ShaStepSnapshot } from "@/lib/sha256/types";
import { motion } from "framer-motion";
import { useMemo } from "react";

const REG_NAMES = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

function popcount(x: number): number {
  x = x - ((x >> 1) & 0x55555555);
  x = (x & 0x33333333) + ((x >> 2) & 0x33333333);
  return (((x + (x >> 4)) & 0x0f0f0f0f) * 0x01010101) >> 24;
}

function hamming32(a: number, b: number): number {
  return popcount((a ^ b) >>> 0);
}

function heatColor(value: number, max: number): string {
  if (max === 0) return "rgb(244,244,245)";
  const t = Math.min(1, value / max);
  if (t === 0) return "rgb(244,244,245)";
  if (t < 0.25) return `rgb(${147 + 108 * (1 - t * 4)}, ${197 + 58 * (1 - t * 4)}, 253)`;
  if (t < 0.5) {
    const s = (t - 0.25) * 4;
    return `rgb(${Math.round(6 + 244 * s)}, ${Math.round(182 - 24 * s)}, ${Math.round(212 - 100 * s)})`;
  }
  if (t < 0.75) {
    const s = (t - 0.5) * 4;
    return `rgb(${Math.round(250 - 5 * s)}, ${Math.round(158 - 58 * s)}, ${Math.round(112 - 101 * s)})`;
  }
  const s = (t - 0.75) * 4;
  return `rgb(${Math.round(245 - 26 * s)}, ${Math.round(100 - 62 * s)}, ${Math.round(11 + 16 * s)})`;
}

type HeatmapData = {
  grid: number[][];
  maxVal: number;
  rounds: number;
};

function computeHeatmap(getStep: (i: number) => ShaStepSnapshot | undefined, stepCount: number): HeatmapData {
  const grid: number[][] = [];
  let maxVal = 0;

  let prevRegs: number[] | null = null;

  for (let i = 0; i < stepCount; i++) {
    const step = getStep(i);
    if (!step) continue;

    if (step.phase === "compress_start") {
      prevRegs = [step.a, step.b, step.c, step.d, step.e, step.f, step.g, step.h];
      continue;
    }

    if (step.phase === "compress_t2_update" && prevRegs) {
      const regs = [step.a, step.b, step.c, step.d, step.e, step.f, step.g, step.h];
      const row: number[] = [];
      for (let r = 0; r < 8; r++) {
        const h = hamming32(prevRegs[r]!, regs[r]!);
        row.push(h);
        if (h > maxVal) maxVal = h;
      }
      grid.push(row);
      prevRegs = regs;
    }
  }

  return { grid, maxVal, rounds: grid.length };
}

type DiffusionHeatmapProps = {
  getStep: (i: number) => ShaStepSnapshot | undefined;
  stepCount: number;
  currentRound?: number;
};

export function DiffusionHeatmap({ getStep, stepCount, currentRound }: DiffusionHeatmapProps) {
  const { grid, maxVal, rounds } = useMemo(
    () => computeHeatmap(getStep, stepCount),
    [getStep, stepCount],
  );

  if (rounds === 0) return null;

  const activeRound = currentRound ?? -1;

  const totalChanged = useMemo(() => {
    if (activeRound < 0 || activeRound >= grid.length) return 0;
    return grid[activeRound]!.reduce((s, v) => s + v, 0);
  }, [activeRound, grid]);

  const cumulativeChanged = useMemo(() => {
    let total = 0;
    for (let r = 0; r <= Math.min(activeRound, grid.length - 1); r++) {
      total += grid[r]!.reduce((s, v) => s + v, 0);
    }
    return total;
  }, [activeRound, grid]);

  return (
    <div className="rounded-xl border border-zinc-200 bg-white/90 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
          Диффузия битов
        </h3>
        <div className="flex items-center gap-3 text-[10px] font-mono text-zinc-500">
          {activeRound >= 0 && (
            <>
              <span>раунд: <span className="font-semibold text-amber-700">{activeRound + 1}</span>/64</span>
              <span>бит: <span className="font-semibold text-cyan-700">{totalChanged}</span></span>
              <span>всего: <span className="font-semibold text-violet-700">{cumulativeChanged}</span></span>
            </>
          )}
        </div>
      </div>

      <div className="flex gap-1">
        {/* Register labels */}
        <div className="flex flex-col gap-px pt-[14px]">
          {REG_NAMES.map((name) => (
            <div key={name} className="flex h-[10px] items-center text-[8px] font-bold text-zinc-400">
              {name}
            </div>
          ))}
        </div>

        {/* Heatmap grid */}
        <div className="flex-1 overflow-hidden">
          {/* Round numbers */}
          <div className="mb-0.5 flex">
            {Array.from({ length: rounds }, (_, r) => (
              <div
                key={r}
                className="flex-1 text-center text-[6px] text-zinc-400"
                style={{ minWidth: 0 }}
              >
                {(r + 1) % 8 === 0 ? r + 1 : ""}
              </div>
            ))}
          </div>

          {/* Grid cells */}
          {REG_NAMES.map((_, regIdx) => (
            <div key={regIdx} className="flex gap-px">
              {Array.from({ length: rounds }, (_, roundIdx) => {
                const val = grid[roundIdx]?.[regIdx] ?? 0;
                const isActive = roundIdx === activeRound;
                const isPast = roundIdx <= activeRound;
                const isFuture = activeRound >= 0 && roundIdx > activeRound;

                return (
                  <motion.div
                    key={roundIdx}
                    className="flex-1 rounded-[1px]"
                    style={{
                      minWidth: 0,
                      height: 10,
                      backgroundColor: isFuture ? "rgb(244,244,245)" : heatColor(val, maxVal),
                      opacity: isFuture ? 0.3 : isPast ? 1 : 0.5,
                    }}
                    animate={isActive ? {
                      boxShadow: [
                        "0 0 0px rgba(245,158,11,0)",
                        "0 0 6px rgba(245,158,11,0.8)",
                        "0 0 0px rgba(245,158,11,0)",
                      ],
                    } : {}}
                    transition={isActive ? { duration: 1, repeat: Infinity } : {}}
                    title={`Round ${roundIdx + 1}, ${REG_NAMES[regIdx]}: ${val} bits changed`}
                  />
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Scanline indicator */}
      {activeRound >= 0 && rounds > 0 && (
        <div className="relative mt-1 h-1 overflow-hidden rounded-full bg-zinc-100">
          <motion.div
            className="absolute inset-y-0 left-0 rounded-full bg-gradient-to-r from-cyan-400 via-amber-400 to-rose-400"
            animate={{ width: `${((activeRound + 1) / rounds) * 100}%` }}
            transition={{ type: "spring" as const, stiffness: 300, damping: 30 }}
          />
        </div>
      )}

      {/* Legend */}
      <div className="mt-2 flex items-center justify-between">
        <div className="flex items-center gap-1 text-[9px] text-zinc-500">
          <span>0 бит</span>
          <div className="flex h-2 gap-px">
            {[0, 4, 8, 12, 16, 20, 24, 28, 32].map(v => (
              <div
                key={v}
                className="w-3 rounded-[1px]"
                style={{ backgroundColor: heatColor(v, 32) }}
              />
            ))}
          </div>
          <span>32 бит</span>
        </div>
        <span className="text-[9px] text-zinc-400">Хэмминг расстояние между раундами</span>
      </div>
    </div>
  );
}
