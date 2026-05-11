"use client";

import type { ShaPhase } from "@/lib/sha256/types";
import { motion, useSpring, useTransform } from "framer-motion";
import { useEffect, useRef } from "react";

function phaseLabel(p: ShaPhase): string {
  switch (p) {
    case "padding": return "Padding";
    case "parse_block": return "Parse";
    case "schedule": return "W[t]";
    case "compress_start":
    case "compress_ch_sig1":
    case "compress_maj_sig0":
    case "compress_t1":
    case "compress_t2_update": return "Compress";
    case "block_finalize": return "H += state";
    case "complete": return "Digest";
    default: return p;
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
  ) return 3;
  if (phase === "block_finalize") return 4;
  return 5;
}

const PHASE_COLORS = [
  "from-sky-400 to-cyan-500",
  "from-cyan-400 to-teal-500",
  "from-teal-400 to-emerald-500",
  "from-amber-400 to-orange-500",
  "from-violet-400 to-purple-500",
  "from-emerald-400 to-green-500",
];

type StepNavigatorProps = {
  index: number;
  count: number;
  phase: ShaPhase;
  title: string;
  isPlaying: boolean;
  speed: number;
  onNext: () => void;
  onBack: () => void;
  onSeek: (index: number) => void;
  onTogglePlay: () => void;
  onSpeedChange: (speed: number) => void;
  nextDisabled: boolean;
};

export function StepNavigator({
  index,
  count,
  phase,
  isPlaying,
  speed,
  onNext,
  onBack,
  onSeek,
  onTogglePlay,
  onSpeedChange,
  nextDisabled,
}: StepNavigatorProps) {
  const bar = roughPhase(phase);
  const segments = [
    { label: "Pre", short: "P" },
    { label: "Parse", short: "Pa" },
    { label: "W[t]", short: "W" },
    { label: "Compress", short: "C" },
    { label: "H+=", short: "H" },
    { label: "Out", short: "D" },
  ];

  const progress = count > 1 ? index / (count - 1) : 0;
  const springProgress = useSpring(progress, { stiffness: 300, damping: 40 });
  const progressPercent = useTransform(springProgress, [0, 1], ["0%", "100%"]);

  useEffect(() => {
    springProgress.set(progress);
  }, [progress, springProgress]);

  const trackRef = useRef<HTMLDivElement>(null);

  const handleTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!trackRef.current) return;
    const rect = trackRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    onSeek(Math.round(x * (count - 1)));
  };

  return (
    <div className="sticky top-[49px] z-20 -mx-4 overflow-hidden rounded-b-2xl border border-zinc-200/80 bg-white/90 px-5 py-4 shadow-lg shadow-zinc-200/40 backdrop-blur-xl">
      <div className="flex flex-col gap-4">
        {/* Phase segments - cinematic style */}
        <div className="flex gap-1.5">
          {segments.map((seg, i) => (
            <div key={seg.label} className="relative flex-1">
              <div
                className={`relative h-1.5 overflow-hidden rounded-full transition-all duration-500 ${
                  i < bar ? "bg-cyan-500" : i === bar ? "bg-zinc-300" : "bg-zinc-200"
                }`}
              >
                {i === bar && (
                  <motion.div
                    className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${PHASE_COLORS[i]}`}
                    initial={{ width: "0%" }}
                    animate={{ width: "100%" }}
                    transition={{ duration: 0.8, ease: [0.4, 0, 0.2, 1] }}
                  />
                )}
                {i < bar && (
                  <div className={`absolute inset-0 rounded-full bg-gradient-to-r ${PHASE_COLORS[i]}`} />
                )}
              </div>
              <span
                className={`mt-1.5 block text-center text-[10px] font-medium transition-all duration-300 ${
                  i === bar ? "text-cyan-700 scale-105" : i < bar ? "text-zinc-500" : "text-zinc-400"
                }`}
              >
                {seg.label}
              </span>
            </div>
          ))}
        </div>

        {/* Controls - video player style */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onBack}
              disabled={index <= 0}
              className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 active:scale-90 disabled:opacity-30 disabled:hover:border-zinc-200 disabled:hover:bg-white"
              title="Назад (←)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z" />
              </svg>
            </button>

            <button
              type="button"
              onClick={onTogglePlay}
              className={`group relative flex h-11 w-11 items-center justify-center rounded-full border-2 transition-all active:scale-90 ${
                isPlaying
                  ? "border-amber-400 bg-amber-50 text-amber-600 shadow-lg shadow-amber-200/50"
                  : "border-cyan-400 bg-gradient-to-br from-cyan-50 to-white text-cyan-600 shadow-lg shadow-cyan-200/50"
              }`}
              title="Play / Pause (Space)"
            >
              {isPlaying ? (
                <motion.svg
                  width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <path d="M6 4h4v16H6zM14 4h4v16h-4z" />
                </motion.svg>
              ) : (
                <motion.svg
                  width="16" height="16" viewBox="0 0 24 24" fill="currentColor"
                  initial={{ scale: 0.5, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 500, damping: 25 }}
                >
                  <path d="M8 5v14l11-7z" />
                </motion.svg>
              )}
              {isPlaying && (
                <motion.div
                  className="absolute inset-0 rounded-full border-2 border-amber-400"
                  animate={{ scale: [1, 1.3], opacity: [0.6, 0] }}
                  transition={{ duration: 1.2, repeat: Infinity, ease: "easeOut" }}
                />
              )}
            </button>

            <button
              type="button"
              onClick={onNext}
              disabled={index >= count - 1 || nextDisabled}
              className="group relative flex h-9 w-9 items-center justify-center rounded-full border border-zinc-200 bg-white text-zinc-600 transition-all hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-700 active:scale-90 disabled:opacity-30 disabled:hover:border-zinc-200 disabled:hover:bg-white"
              title="Далее (→)"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                <path d="M16 18h2V6h-2zM4 6v12l8.5-6z" />
              </svg>
            </button>
          </div>

          {/* Speed selector */}
          <div className="flex items-center gap-0.5 rounded-full bg-zinc-100 p-0.5">
            {[1, 2, 4, 8].map((v) => (
              <button
                key={v}
                type="button"
                onClick={() => onSpeedChange(v)}
                className={`relative rounded-full px-2.5 py-1 font-mono text-[11px] font-medium transition-all ${
                  speed === v
                    ? "text-white"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {speed === v && (
                  <motion.div
                    layoutId="speed-pill"
                    className="absolute inset-0 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-600 shadow-sm"
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{v}x</span>
              </button>
            ))}
          </div>

          {/* Step counter + phase */}
          <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center gap-1.5 font-mono text-xs text-zinc-500">
              <motion.span
                key={index}
                initial={{ y: -8, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
                className="inline-block min-w-[2ch] text-right font-semibold text-zinc-800"
              >
                {index + 1}
              </motion.span>
              <span className="text-zinc-400">/</span>
              <span>{count}</span>
            </div>
            <motion.span
              key={phaseLabel(phase)}
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className={`rounded-full bg-gradient-to-r px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-white shadow-sm ${PHASE_COLORS[bar]}`}
            >
              {phaseLabel(phase)}
            </motion.span>
          </div>
        </div>

        {/* Cinematic progress bar */}
        <div
          ref={trackRef}
          onClick={handleTrackClick}
          className="group relative h-2 cursor-pointer rounded-full bg-zinc-200/80"
        >
          {/* Buffered-style background */}
          <div className="absolute inset-0 overflow-hidden rounded-full">
            <div
              className="h-full rounded-full bg-zinc-300/50 transition-all duration-700"
              style={{ width: `${Math.min(100, progress * 100 + 5)}%` }}
            />
          </div>

          {/* Active progress with gradient */}
          <motion.div
            className={`absolute inset-y-0 left-0 overflow-hidden rounded-full bg-gradient-to-r ${PHASE_COLORS[bar]} shadow-sm`}
            style={{ width: progressPercent }}
          >
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/30 to-white/0"
              animate={{ x: ["-100%", "200%"] }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            />
          </motion.div>

          {/* Thumb */}
          <motion.div
            className="absolute top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-2 border-white bg-cyan-500 opacity-0 shadow-lg transition-opacity group-hover:opacity-100"
            style={{ left: progressPercent }}
          />

          {/* Hover expand */}
          <div className="absolute inset-x-0 -inset-y-2 rounded-full transition-all group-hover:bg-zinc-100/50" />
        </div>
      </div>
    </div>
  );
}
