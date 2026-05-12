"use client";

import { AnimatePresence, motion } from "framer-motion";
import { useRef } from "react";

type MessageSchedulePanelProps = {
  W?: Uint32Array;
  highlightIndex?: number;
  guidedFocus?: boolean;
};

function fmt32(x: number): string {
  return (x >>> 0).toString(16).padStart(8, "0");
}

function tColor(isHi: boolean, isSrc: boolean): string {
  if (isHi) return "bg-cyan-200 text-cyan-950 ring-2 ring-cyan-500/60 font-semibold";
  if (isSrc) return "bg-violet-100 text-violet-900 ring-1 ring-violet-300/60";
  return "text-zinc-700";
}

export function MessageSchedulePanel({ W, highlightIndex, guidedFocus = false }: MessageSchedulePanelProps) {
  const gridRef = useRef<HTMLDivElement>(null);

  if (!W) {
    return (
      <section
        className={`rounded-xl border border-zinc-200 bg-white/80 p-4 backdrop-blur-sm transition-all ${
          guidedFocus ? "ring-2 ring-cyan-300/70 shadow-lg shadow-cyan-100/50" : ""
        }`}
      >
        <h3 className="mb-2 text-sm font-semibold text-zinc-800">Schedule W</h3>
        <p className="text-xs text-zinc-500">Will appear after the block parsing step.</p>
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
      className={`rounded-xl border border-zinc-200 bg-white/80 p-4 backdrop-blur-sm transition-all ${
        guidedFocus ? "ring-2 ring-cyan-300/70 shadow-lg shadow-cyan-100/50" : ""
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-800">Message schedule</h3>
        <span className="text-xs text-zinc-500">
          W<sub className="align-baseline">t</sub>
          {hi >= 0 ? <> — W[{hi}]</> : null}
        </span>
        {hi >= 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="ml-auto rounded-full bg-cyan-100 px-2 py-0.5 text-[10px] font-semibold text-cyan-700"
          >
            step {hi + 1}/64
          </motion.span>
        )}
      </div>

      {/* Current W value - cinematic highlight */}
      <AnimatePresence mode="wait">
        {hi >= 0 && (
          <motion.div
            key={`current-${hi}`}
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="relative mb-3 overflow-hidden rounded-lg border border-cyan-200 bg-gradient-to-r from-cyan-50 to-white p-3"
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-cyan-200/0 via-cyan-200/30 to-cyan-200/0"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
            <div className="relative">
              <p className="font-mono text-sm text-cyan-900">
                W[{hi}] ={" "}
                <motion.span
                  key={`val-${hi}`}
                  initial={{ opacity: 0, filter: "blur(4px)" }}
                  animate={{ opacity: 1, filter: "blur(0px)" }}
                  transition={{ duration: 0.3 }}
                  className="font-bold"
                >
                  0x{fmt32(W[hi]!)}
                </motion.span>
              </p>
              {hi >= 16 ? (
                <motion.p
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="mt-1 flex items-center gap-1 text-xs text-cyan-700"
                >
                  <span>= σ₁(</span>
                  <span className="rounded bg-violet-100 px-1 font-mono text-violet-800">W[{srcA}]</span>
                  <span>) +</span>
                  <span className="rounded bg-violet-100 px-1 font-mono text-violet-800">W[{srcB}]</span>
                  <span>+ σ₀(</span>
                  <span className="rounded bg-violet-100 px-1 font-mono text-violet-800">W[{srcC}]</span>
                  <span>) +</span>
                  <span className="rounded bg-violet-100 px-1 font-mono text-violet-800">W[{srcD}]</span>
                </motion.p>
              ) : (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.1 }}
                  className="mt-1 text-xs text-cyan-700"
                >
                  Directly from message block (M[{hi}])
                </motion.p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* W grid with flowing pulse effect */}
      <div
        ref={gridRef}
        className="max-h-56 overflow-auto rounded-lg border border-zinc-100 bg-zinc-50/80 p-2 font-mono text-[10px] leading-tight text-zinc-800 sm:text-xs"
      >
        <div className="grid grid-cols-8 gap-1">
          {Array.from({ length: 64 }, (_, t) => {
            const isHi = t === hi;
            const isSrc = t === srcA || t === srcB || t === srcC || t === srcD;
            const isPast = t < hi;

            return (
              <motion.span
                key={t}
                animate={
                  isHi
                    ? {
                        scale: [1, 1.15, 1.05],
                        boxShadow: [
                          "0 0 0 rgba(6,182,212,0)",
                          "0 0 16px rgba(6,182,212,0.7)",
                          "0 0 8px rgba(6,182,212,0.4)",
                        ],
                      }
                    : isSrc
                      ? {
                          scale: [1, 1.05, 1],
                          boxShadow: [
                            "0 0 0 rgba(139,92,246,0)",
                            "0 0 10px rgba(139,92,246,0.4)",
                            "0 0 0 rgba(139,92,246,0)",
                          ],
                        }
                      : { scale: 1, boxShadow: "0 0 0 rgba(0,0,0,0)" }
                }
                transition={
                  isHi
                    ? { duration: 0.5, ease: "easeOut" }
                    : isSrc
                      ? { duration: 0.6, ease: "easeInOut" }
                      : { duration: 0.3 }
                }
                className={`relative inline-block overflow-hidden rounded px-0.5 transition-colors duration-200 ${tColor(isHi, isSrc)} ${
                  isPast && !isHi && !isSrc ? "opacity-60" : ""
                }`}
                title={`W[${t}] = 0x${fmt32(W[t]!)}`}
              >
                {isHi && (
                  <motion.span
                    className="absolute inset-0 bg-gradient-to-r from-cyan-300/0 via-cyan-300/40 to-cyan-300/0"
                    animate={{ x: ["-100%", "200%"] }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  />
                )}
                <span className="relative">{fmt32(W[t]!)}</span>
              </motion.span>
            );
          })}
        </div>
      </div>

      <div className="mt-2 flex items-center gap-3 text-[10px] text-zinc-500">
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded-sm bg-cyan-200 ring-1 ring-cyan-500/30" /> current
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded-sm bg-violet-100 ring-1 ring-violet-300/30" /> sources
        </span>
        <span className="flex items-center gap-1">
          <span className="inline-block h-2 w-4 rounded-sm bg-zinc-200 opacity-60" /> processed
        </span>
      </div>
    </section>
  );
}
