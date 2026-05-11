"use client";

import { glossaryText } from "@/content/glossary";
import { useSha256Steps } from "@/hooks/useSha256Steps";
import confetti from "canvas-confetti";
import { AnimatePresence, motion, useMotionValue, useTransform } from "framer-motion";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { MessageSchedulePanel } from "./MessageSchedulePanel";
import { RegistersPanel } from "./RegistersPanel";
import { RoundDetailPanel } from "./RoundDetailPanel";
import { DiffusionHeatmap } from "./DiffusionHeatmap";
import { RoundDiagram } from "./RoundDiagram";
import { StepNavigator } from "./StepNavigator";

const PRESETS = [
  { label: "abc", value: "abc" },
  { label: "empty", value: "" },
  { label: "hello", value: "hello world" },
  { label: "55 bytes", value: "A".repeat(55) },
  { label: "64 bytes", value: "B".repeat(64) },
];

type ByteKind = "msg" | "sep" | "zero" | "len";

function classifyPaddingByte(
  i: number,
  msgLen: number,
  totalLen: number,
): ByteKind {
  if (i < msgLen) return "msg";
  if (i === msgLen) return "sep";
  if (i >= totalLen - 8) return "len";
  return "zero";
}

const BYTE_COLOR: Record<ByteKind, string> = {
  msg: "bg-cyan-300 text-cyan-950",
  sep: "bg-amber-300 text-amber-950",
  zero: "bg-zinc-200 text-zinc-600",
  len: "bg-emerald-300 text-emerald-950",
};

function toHex(b: number): string {
  return b.toString(16).padStart(2, "0");
}

function digestBitGrid(hex: string): boolean[] {
  const bits: boolean[] = [];
  for (const ch of hex) {
    const nibble = Number.parseInt(ch, 16);
    bits.push(!!(nibble & 8), !!(nibble & 4), !!(nibble & 2), !!(nibble & 1));
  }
  return bits;
}


export function ShaLab() {
  const [inputText, setInputText] = useState("abc");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [binaryMode, setBinaryMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const confettiFired = useRef(false);
  const containerRef = useRef<HTMLDivElement>(null);

  const message = useMemo(() => new TextEncoder().encode(inputText), [inputText]);
  const { step, index, count, goNext, goBack, setIndex, getStep, digestHex } = useSha256Steps(message);

  const handleNext = useCallback(() => goNext(), [goNext]);
  const handleBack = useCallback(() => goBack(), [goBack]);

  const prev = index > 0 ? getStep(index - 1) : undefined;
  const prevRegs =
    prev && prev.phase !== "padding"
      ? { a: prev.a, b: prev.b, c: prev.c, d: prev.d, e: prev.e, f: prev.f, g: prev.g, h: prev.h }
      : undefined;

  const desc = step?.descriptionKey ? glossaryText(step.descriptionKey) : null;

  const highlightW =
    step?.phase === "schedule"
      ? step.scheduleIndex
      : step?.phase === "compress_ch_sig1" ||
          step?.phase === "compress_maj_sig0" ||
          step?.phase === "compress_t1" ||
          step?.phase === "compress_t2_update"
        ? step.scheduleIndex
        : undefined;

  const registerFocus = step?.phase.startsWith("compress") ?? false;
  const scheduleFocus = step?.phase === "schedule" || step?.phase === "parse_block";
  const detailsFocus = step?.phase.startsWith("compress") || step?.phase === "block_finalize";

  // Smooth auto-play with variable speed
  useEffect(() => {
    if (!isPlaying || index >= count - 1) {
      if (isPlaying && index >= count - 1) setIsPlaying(false);
      return;
    }
    const ms = Math.max(300, Math.floor(1400 / playbackSpeed));
    const timer = window.setTimeout(handleNext, ms);
    return () => window.clearTimeout(timer);
  }, [count, handleNext, index, isPlaying, playbackSpeed]);

  useEffect(() => {
    if (step?.phase === "complete" && !confettiFired.current) {
      confettiFired.current = true;
      const t = window.setTimeout(() => {
        confetti({ particleCount: 120, spread: 80, origin: { y: 0.7 } });
      }, 300);
      return () => window.clearTimeout(t);
    }
    if (step?.phase !== "complete") confettiFired.current = false;
  }, [step?.phase]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;
      if (e.key === " ") { e.preventDefault(); setIsPlaying((v) => !v); }
      if (e.key === "ArrowRight") handleNext();
      if (e.key === "ArrowLeft") handleBack();
      if (e.key === "b" || e.key === "B") setBinaryMode((v) => !v);
      if (e.key === "d" || e.key === "D") setShowDetails((v) => !v);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [handleNext, handleBack]);

  const digestBits = useMemo(
    () => (step?.phase === "complete" && step.digestHex ? digestBitGrid(step.digestHex) : null),
    [step],
  );

  // Mouse parallax for ambient background
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const bgX = useTransform(mouseX, [0, 1], [-10, 10]);
  const bgY = useTransform(mouseY, [0, 1], [-10, 10]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left) / rect.width);
    mouseY.set((e.clientY - rect.top) / rect.height);
  }, [mouseX, mouseY]);

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      className="relative mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8 text-zinc-900"
    >
      {/* Animated grid background */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-0 opacity-[0.03]"
        style={{ x: bgX, y: bgY }}
      >
        <div
          className="h-full w-full"
          style={{
            backgroundImage:
              "linear-gradient(rgba(0,0,0,1) 1px, transparent 1px), linear-gradient(90deg, rgba(0,0,0,1) 1px, transparent 1px)",
            backgroundSize: "24px 24px",
          }}
        />
      </motion.div>

      {/* Ambient glow that follows the active phase */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <motion.div
          animate={{
            background: step?.phase === "complete"
              ? "radial-gradient(ellipse 600px 400px at 50% 60%, rgba(16,185,129,0.06), transparent)"
              : step?.phase.startsWith("compress")
                ? "radial-gradient(ellipse 600px 400px at 50% 60%, rgba(245,158,11,0.05), transparent)"
                : "radial-gradient(ellipse 600px 400px at 50% 60%, rgba(6,182,212,0.05), transparent)",
          }}
          transition={{ duration: 1.5, ease: "easeInOut" }}
          className="h-full w-full"
        />
      </div>

      <div className="relative z-10 flex flex-col gap-6">
        <header className="flex flex-col gap-1">
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
            className="text-2xl font-bold tracking-tight text-zinc-900"
          >
            SHA-256 Visualizer
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="max-w-3xl text-sm leading-relaxed text-zinc-500"
          >
            Пошаговая визуализация. Клавиши: Space — play, ← → — шаг, B — бинарный, D — детали.
          </motion.p>
        </header>

        {/* Input panel */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1, ease: [0.4, 0, 0.2, 1] }}
          className="grid gap-4 rounded-2xl border border-zinc-200 bg-white/80 p-4 shadow-sm backdrop-blur-sm md:grid-cols-[1fr_200px]"
        >
          <label className="flex flex-col gap-2 text-sm">
            <span className="font-medium text-zinc-700">Сообщение (text → UTF-8)</span>
            <textarea
              value={inputText}
              onChange={(e) => { setIsPlaying(false); setInputText(e.target.value); }}
              className="min-h-[80px] rounded-lg border border-zinc-300 bg-zinc-50 p-3 font-mono text-sm text-zinc-900 placeholder:text-zinc-400 outline-none transition-all focus:border-cyan-400 focus:ring-2 focus:ring-cyan-100"
              placeholder="введи текст..."
            />
            <div className="flex flex-wrap gap-1">
              {PRESETS.map((p) => (
                <motion.button
                  key={p.label}
                  type="button"
                  onClick={() => { setIsPlaying(false); setInputText(p.value); }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  className={`rounded-md px-2 py-1 font-mono text-[11px] transition ${
                    inputText === p.value
                      ? "bg-cyan-600 text-white shadow-md shadow-cyan-300/40"
                      : "bg-zinc-100 text-zinc-600 hover:bg-cyan-50 hover:text-cyan-700"
                  }`}
                >
                  {p.label}
                </motion.button>
              ))}
            </div>
          </label>
          <div className="flex flex-col justify-center gap-2 text-[11px] font-mono text-zinc-500">
            <div className="flex justify-between">
              <span>bytes</span>
              <span className="font-semibold text-cyan-700">{message.length}</span>
            </div>
            <div className="flex justify-between">
              <span>bits</span>
              <span className="font-semibold text-cyan-700">{message.length * 8}</span>
            </div>
            <div className="flex justify-between">
              <span>blocks</span>
              <span className="font-semibold text-cyan-700">{step?.totalBlocks ?? "—"}</span>
            </div>
            <div className="flex justify-between">
              <span>steps</span>
              <span className="font-semibold text-cyan-700">{count}</span>
            </div>
            <div className="mt-2 flex flex-wrap items-center gap-2 text-zinc-600">
              <label className="flex cursor-pointer items-center gap-1">
                <input type="checkbox" checked={binaryMode} onChange={(e) => setBinaryMode(e.target.checked)} className="accent-cyan-600" />
                <span>BIN</span>
              </label>
              <label className="flex cursor-pointer items-center gap-1">
                <input type="checkbox" checked={showDetails} onChange={(e) => setShowDetails(e.target.checked)} className="accent-cyan-600" />
                <span>DETAIL</span>
              </label>
            </div>
          </div>
        </motion.div>

        {step && (
          <>
            <StepNavigator
              index={index}
              count={count}
              phase={step.phase}
              title={step.title}
              isPlaying={isPlaying}
              speed={playbackSpeed}
              onNext={handleNext}
              onBack={handleBack}
              onSeek={(i) => { setIsPlaying(false); setIndex(i); }}
              onTogglePlay={() => setIsPlaying((v) => !v)}
              onSpeedChange={setPlaybackSpeed}
              nextDisabled={false}
            />

            <div className="flex flex-col gap-6">
                {/* Phase info - text changes in-place */}
                <motion.section
                  layout
                  className="relative overflow-hidden rounded-xl border border-cyan-200/60 bg-gradient-to-r from-cyan-50/80 to-white p-4"
                >
                  <motion.div
                    key={`shimmer-${step.phase}`}
                    className="absolute inset-0 bg-gradient-to-r from-cyan-200/20 to-transparent"
                    initial={{ x: "-100%" }}
                    animate={{ x: "200%" }}
                    transition={{ duration: 1.5, ease: "easeInOut" }}
                  />
                  <AnimatePresence mode="popLayout">
                    <motion.p
                      key={step.phase}
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -6 }}
                      transition={{ duration: 0.25 }}
                      className="relative text-[10px] font-semibold uppercase tracking-widest text-cyan-700"
                    >
                      {step.phase.replace(/_/g, " ")}
                    </motion.p>
                  </AnimatePresence>
                  <AnimatePresence mode="popLayout">
                    <motion.p
                      key={step.title}
                      initial={{ opacity: 0, x: -8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 8 }}
                      transition={{ duration: 0.2 }}
                      className="relative mt-1 text-sm text-cyan-950"
                    >
                      {step.title}
                    </motion.p>
                  </AnimatePresence>
                  {desc ? <p className="relative mt-1 text-sm text-cyan-800/80">{desc.body}</p> : null}
                </motion.section>

                {/* Padding bytes-grid */}
                <AnimatePresence>
                  {step.phase === "padding" && step.paddedPreview && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.3 }}
                      className="overflow-hidden rounded-xl border border-zinc-200 bg-white/80 p-4 backdrop-blur-sm"
                    >
                      <div className="mb-3 flex flex-wrap items-center gap-4 text-xs">
                        <p className="font-medium text-zinc-800">Padding блока ({step.paddedLengthBytes ?? step.paddedPreview.length} байт)</p>
                        <div className="flex gap-2 text-[10px]">
                          <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-cyan-300" /> данные</span>
                          <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-amber-300" /> 0x80</span>
                          <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-zinc-200" /> нули</span>
                          <span className="inline-flex items-center gap-1"><span className="inline-block h-2.5 w-2.5 rounded-sm bg-emerald-300" /> длина</span>
                        </div>
                      </div>
                      <div className="grid gap-1" style={{ gridTemplateColumns: "repeat(16, minmax(0, 1fr))" }}>
                        {Array.from(step.paddedPreview).map((byte, i) => {
                          const kind = classifyPaddingByte(i, step.inputLengthBytes ?? 0, step.paddedPreview!.length);
                          return (
                            <motion.div
                              key={i}
                              initial={{ opacity: 0, scale: 0.5 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{
                                duration: 0.2,
                                delay: i * 0.01,
                                type: "spring" as const,
                                stiffness: 400,
                                damping: 25,
                              }}
                              className={`flex h-7 items-center justify-center rounded font-mono text-[10px] ${BYTE_COLOR[kind]}`}
                              title={`byte ${i}: 0x${toHex(byte)} (${kind})`}
                            >
                              {toHex(byte)}
                            </motion.div>
                          );
                        })}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Round diagram - visible during compression */}
                <AnimatePresence>
                  {(step.phase.startsWith("compress") || step.phase === "block_finalize") && (
                    <motion.div
                      key="round-diagram"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <RoundDiagram
                        phase={step.phase}
                        a={step.a} b={step.b} c={step.c} d={step.d}
                        e={step.e} f={step.f} g={step.g} h={step.h}
                        s0={step.s0} s1={step.s1}
                        Ch={step.Ch} Maj={step.Maj}
                        T1={step.T1} T2={step.T2}
                        K_t={step.K_t}
                        W={step.W}
                        scheduleIndex={step.scheduleIndex}
                        round={step.round}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Diffusion heatmap - visible during compression */}
                <AnimatePresence>
                  {(step.phase.startsWith("compress") || step.phase === "block_finalize") && (
                    <motion.div
                      key="diffusion-heatmap"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
                      className="overflow-hidden"
                    >
                      <DiffusionHeatmap
                        getStep={getStep}
                        stepCount={count}
                        currentRound={step.round}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Main panels - stay mounted, content animates in-place */}
                <div className="grid gap-4 lg:grid-cols-3">
                  <div className="lg:col-span-2">
                    <AnimatePresence mode="popLayout">
                      {(step.phase === "schedule" || step.phase === "parse_block") && (
                        <motion.div
                          key="schedule"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <MessageSchedulePanel W={step.W} highlightIndex={highlightW} guidedFocus={scheduleFocus} />
                        </motion.div>
                      )}
                      {(step.phase.startsWith("compress") || step.phase === "block_finalize") && (
                        <motion.div
                          key="registers"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <RegistersPanel
                            stepIndex={index}
                            a={step.a} b={step.b} c={step.c} d={step.d}
                            e={step.e} f={step.f} g={step.g} h={step.h}
                            prev={prevRegs}
                            binaryMode={binaryMode}
                            guidedFocus={registerFocus}
                          />
                        </motion.div>
                      )}
                      {step.phase === "padding" && (
                        <motion.div
                          key="placeholder"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.25 }}
                        >
                          <div className="rounded-xl border border-zinc-200 bg-white/80 p-4 text-sm text-zinc-500 backdrop-blur-sm">
                            Основная визуализация появится на следующих шагах.
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  <div className="flex flex-col gap-4">
                    {showDetails && (
                      <RoundDetailPanel
                        round={step.round} K_t={step.K_t}
                        s0={step.s0} s1={step.s1}
                        Ch={step.Ch} Maj={step.Maj}
                        T1={step.T1} T2={step.T2}
                        guidedFocus={detailsFocus}
                        phase={step.phase}
                      />
                    )}

                    <div className="rounded-xl border border-zinc-200 bg-white/80 p-4 backdrop-blur-sm">
                      <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Этапы</p>
                      <div className="mt-2 flex flex-wrap gap-2 text-xs">
                        {([
                          ["padding", "Padding"],
                          ["parse_block", "Parse"],
                          ["schedule", "W[t]"],
                          ["compress_start", "Compress"],
                          ["block_finalize", "H += state"],
                          ["complete", "Digest"],
                        ] as const).map(([phaseName, label]) => {
                          const active =
                            phaseName === "compress_start"
                              ? step.phase.startsWith("compress")
                              : step.phase === phaseName;
                          return (
                            <motion.span
                              key={phaseName}
                              animate={active ? { scale: [1, 1.08, 1] } : { scale: 1 }}
                              transition={{ duration: 0.5, ease: "easeOut" }}
                              className={`relative overflow-hidden rounded-full px-3 py-1 transition-colors ${
                                active
                                  ? "bg-cyan-600 text-white shadow-lg shadow-cyan-300/40"
                                  : "bg-zinc-100 text-zinc-600"
                              }`}
                            >
                              {active && (
                                <motion.span
                                  className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0"
                                  animate={{ x: ["-100%", "200%"] }}
                                  transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                                />
                              )}
                              <span className="relative">{label}</span>
                            </motion.span>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Digest + heatmap */}
                <AnimatePresence>
                  {step.phase === "complete" && step.digestHex && (
                    <motion.div
                      initial={{ opacity: 0, scale: 0.95, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95, y: 20 }}
                      transition={{ type: "spring" as const, stiffness: 200, damping: 20 }}
                      className="relative overflow-hidden rounded-2xl border-2 border-emerald-300 bg-gradient-to-br from-emerald-50 to-white p-5 shadow-xl shadow-emerald-200/50"
                    >
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-r from-emerald-200/0 via-emerald-200/30 to-emerald-200/0"
                        animate={{ x: ["-100%", "100%"] }}
                        transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
                      />
                      <div className="relative flex flex-col gap-4 md:flex-row md:items-start md:gap-6">
                        <div className="flex-1">
                          <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Итоговый SHA-256</p>
                          <p className="mt-2 break-all font-mono text-sm leading-relaxed text-emerald-950">
                            {step.digestHex}
                          </p>
                          <p className="mt-1 text-xs text-emerald-800">
                            Совпадает с hashFull: {digestHex === step.digestHex ? "да" : "нет"}
                          </p>
                        </div>
                        {digestBits ? (
                          <div className="flex flex-col items-center gap-1">
                            <p className="text-[10px] font-semibold uppercase tracking-wide text-emerald-600">256 бит</p>
                            <div className="grid gap-px" style={{ gridTemplateColumns: "repeat(16, 1fr)" }}>
                              {digestBits.map((bit, i) => (
                                <motion.div
                                  key={i}
                                  initial={{ opacity: 0, scale: 0 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  transition={{
                                    duration: 0.2,
                                    delay: i * 0.006,
                                    type: "spring" as const,
                                    stiffness: 500,
                                    damping: 25,
                                  }}
                                  className={`h-2.5 w-2.5 rounded-[2px] ${
                                    bit ? "bg-cyan-500 shadow-sm shadow-cyan-300/50" : "bg-zinc-200"
                                  }`}
                                  title={`bit ${i}: ${bit ? "1" : "0"}`}
                                />
                              ))}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
          </>
        )}
      </div>
    </div>
  );
}
