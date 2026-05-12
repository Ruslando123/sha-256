"use client";

import { clearProgress, readProgress, writeProgress } from "@/lib/learn/progress";
import confetti from "canvas-confetti";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { HexCalculator } from "./HexCalculator";
import { AvalancheLesson } from "./lessons/AvalancheLesson";
import { CompressionLesson } from "./lessons/CompressionLesson";
import { FinalizeLesson } from "./lessons/FinalizeLesson";
import { IntroLesson } from "./lessons/IntroLesson";
import { PaddingLesson } from "./lessons/PaddingLesson";
import { ParseLesson } from "./lessons/ParseLesson";
import { QuizLesson } from "./lessons/QuizLesson";
import { ScheduleLesson } from "./lessons/ScheduleLesson";

const LESSON_META = [
  { id: "intro", title: "What is a Hash", icon: "#" },
  { id: "padding", title: "Padding", icon: "+" },
  { id: "parse", title: "Block Parsing", icon: "M" },
  { id: "schedule", title: "Schedule W[t]", icon: "W" },
  { id: "compression", title: "Compression Round", icon: "σ" },
  { id: "finalize", title: "Finalization", icon: "H" },
  { id: "avalanche", title: "Avalanche Effect", icon: "~" },
  { id: "quiz", title: "Final Quiz", icon: "?" },
];

export function LearnExperience() {
  const [hydrated, setHydrated] = useState(false);
  const [completed, setCompleted] = useState<Set<number>>(new Set());
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const prevCompleted = useRef(new Set<number>());

  useEffect(() => {
    const state = readProgress();
    const c = new Set(state.completed);
    setCompleted(c);
    prevCompleted.current = c;
    setCurrent(Math.min(Math.max(state.current, 0), LESSON_META.length - 1));
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    writeProgress({ completed: Array.from(completed), current });
  }, [completed, current, hydrated]);

  const markComplete = useCallback((idx: number) => {
    setCompleted((prev) => {
      if (prev.has(idx)) return prev;
      const next = new Set(prev);
      next.add(idx);

      if (!prevCompleted.current.has(idx)) {
        setTimeout(() => {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 }, colors: ["#06b6d4", "#10b981", "#f59e0b"] });
        }, 200);
      }
      prevCompleted.current = next;
      return next;
    });
  }, []);

  const goNext = useCallback(() => {
    setDirection(1);
    setCurrent((c) => Math.min(c + 1, LESSON_META.length - 1));
  }, []);

  const goPrev = useCallback(() => {
    setDirection(-1);
    setCurrent((c) => Math.max(c - 1, 0));
  }, []);

  const goTo = useCallback(
    (idx: number) => {
      const allowed = idx === 0 || completed.has(idx - 1) || completed.has(idx);
      if (!allowed) return;
      setDirection(idx > current ? 1 : -1);
      setCurrent(Math.min(Math.max(idx, 0), LESSON_META.length - 1));
    },
    [completed, current],
  );

  const resetCourse = useCallback(() => {
    clearProgress();
    setCompleted(new Set());
    prevCompleted.current = new Set();
    setCurrent(0);
    setDirection(-1);
  }, []);

  const total = LESSON_META.length;
  const lessonProps = useMemo(
    () => ({
      index: current,
      total,
      completed: completed.has(current),
      hasNext: current < total - 1,
      hasPrev: current > 0,
      onNext: goNext,
      onPrev: goPrev,
      onComplete: () => markComplete(current),
    }),
    [current, total, completed, goNext, goPrev, markComplete],
  );

  const renderLesson = () => {
    switch (current) {
      case 0: return <IntroLesson {...lessonProps} />;
      case 1: return <PaddingLesson {...lessonProps} />;
      case 2: return <ParseLesson {...lessonProps} />;
      case 3: return <ScheduleLesson {...lessonProps} />;
      case 4: return <CompressionLesson {...lessonProps} />;
      case 5: return <FinalizeLesson {...lessonProps} />;
      case 6: return <AvalancheLesson {...lessonProps} />;
      default: return <QuizLesson {...lessonProps} onResetCourse={resetCourse} />;
    }
  };

  const progressPct = Math.round((completed.size / total) * 100);

  const slideVariants = {
    enter: (dir: number) => ({ x: dir > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (dir: number) => ({ x: dir > 0 ? -60 : 60, opacity: 0 }),
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
      {/* Animated sidebar */}
      <aside className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm lg:sticky lg:top-6 lg:self-start">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Progress</p>
          <div className="mt-2 h-2.5 w-full overflow-hidden rounded-full bg-zinc-100">
            <motion.div
              className="h-full rounded-full bg-gradient-to-r from-cyan-400 to-emerald-500"
              animate={{ width: `${progressPct}%` }}
              transition={{ type: "spring" as const, stiffness: 200, damping: 25 }}
            />
          </div>
          <div className="mt-1.5 flex items-center justify-between">
            <p className="text-xs text-zinc-500">
              {completed.size} of {total} completed
            </p>
            <motion.span
              key={completed.size}
              initial={{ scale: 1.4, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="text-xs font-bold text-cyan-600"
            >
              {progressPct}%
            </motion.span>
          </div>
        </div>

        <ol className="flex flex-col gap-1.5">
          {LESSON_META.map((lesson, i) => {
            const isDone = completed.has(i);
            const isActive = i === current;
            const locked = i > 0 && !completed.has(i - 1) && !isDone;
            return (
              <motion.li
                key={lesson.id}
                initial={false}
                animate={isActive ? { scale: 1.02 } : { scale: 1 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
              >
                <button
                  type="button"
                  onClick={() => goTo(i)}
                  disabled={locked}
                  className={`relative flex w-full items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left text-sm transition-all ${
                    isActive
                      ? "border-cyan-400 bg-cyan-50 text-cyan-900 shadow-sm shadow-cyan-200/50"
                      : isDone
                        ? "border-emerald-200 bg-emerald-50/80 text-emerald-900"
                        : locked
                          ? "border-zinc-200 bg-zinc-50 text-zinc-400"
                          : "border-zinc-200 bg-white text-zinc-700 hover:border-cyan-300 hover:bg-cyan-50/30"
                  }`}
                >
                  {/* Icon badge */}
                  <span className={`flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-lg font-mono text-xs font-bold ${
                    isDone
                      ? "bg-emerald-500 text-white"
                      : isActive
                        ? "bg-cyan-500 text-white"
                        : locked
                          ? "bg-zinc-200 text-zinc-400"
                          : "bg-zinc-100 text-zinc-500"
                  }`}>
                    {isDone ? (
                      <motion.span
                        initial={{ scale: 0, rotate: -180 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring" as const, stiffness: 400, damping: 15 }}
                      >
                        ✓
                      </motion.span>
                    ) : lesson.icon}
                  </span>

                  <span className="flex-1 leading-tight">
                    <span className="text-[10px] font-medium text-zinc-400">{i + 1}/{total}</span>
                    <br />
                    <span className="font-medium">{lesson.title}</span>
                  </span>

                  {isActive && (
                    <motion.span
                      layoutId="lesson-indicator"
                      className="absolute -left-px inset-y-2 w-1 rounded-full bg-cyan-500"
                      transition={{ type: "spring" as const, stiffness: 400, damping: 30 }}
                    />
                  )}
                </button>
              </motion.li>
            );
          })}
        </ol>

        <button
          type="button"
          onClick={resetCourse}
          className="mt-1 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-xs font-medium text-zinc-600 transition-colors hover:border-rose-300 hover:bg-rose-50 hover:text-rose-700"
        >
          Reset progress
        </button>
      </aside>

      {/* Lesson content with slide transition */}
      <main className="min-w-0">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={current}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ type: "spring" as const, stiffness: 300, damping: 30, mass: 0.8 }}
          >
            {hydrated ? renderLesson() : null}
          </motion.div>
        </AnimatePresence>
      </main>

      <HexCalculator />
    </div>
  );
}
