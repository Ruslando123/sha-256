"use client";

import { AnimatePresence, motion } from "framer-motion";
import { type ReactNode } from "react";

type Status = "ok" | "fail" | "idle";

type Props = {
  index: number;
  total: number;
  title: string;
  simpleWords: string;
  whyMatters: string;
  taskTitle: string;
  status?: Status;
  successText?: string;
  hintText?: string;
  completed: boolean;
  canGoNext: boolean;
  hasNext: boolean;
  hasPrev: boolean;
  onNext: () => void;
  onPrev: () => void;
  onReset?: () => void;
  children: ReactNode;
};

const sectionVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      type: "spring" as const,
      stiffness: 300,
      damping: 30,
      delay: i * 0.08,
    },
  }),
};

export function LessonShell({
  index,
  total,
  title,
  simpleWords,
  whyMatters,
  taskTitle,
  status = "idle",
  successText,
  hintText,
  completed,
  canGoNext,
  hasNext,
  hasPrev,
  onNext,
  onPrev,
  onReset,
  children,
}: Props) {
  return (
    <article className="flex flex-col gap-5 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      {/* Header */}
      <motion.header
        custom={0}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="flex flex-col gap-1"
      >
        <div className="flex items-center gap-2">
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-100 text-[10px] font-bold text-cyan-700">
            {index + 1}
          </span>
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">
            Lesson {index + 1} of {total}
          </p>
        </div>
        <h2 className="text-xl font-semibold text-zinc-900">{title}</h2>
      </motion.header>

      {/* Explainers */}
      <motion.section
        custom={1}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="grid gap-3 md:grid-cols-2"
      >
        <div className="rounded-xl border border-cyan-200 bg-cyan-50/70 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">In Simple Terms</p>
          <p className="mt-2 text-sm text-cyan-950">{simpleWords}</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
          <p className="text-xs font-semibold uppercase tracking-wide text-zinc-600">Why It Matters</p>
          <p className="mt-2 text-sm text-zinc-800">{whyMatters}</p>
        </div>
      </motion.section>

      {/* Task area */}
      <motion.section
        custom={2}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="rounded-xl border border-amber-200 bg-amber-50/50 p-4"
      >
        <p className="text-xs font-semibold uppercase tracking-wide text-amber-800">
          Your Turn: {taskTitle}
        </p>
        <div className="mt-3">{children}</div>

        <AnimatePresence mode="wait">
          {status === "ok" && successText ? (
            <motion.p
              key="success"
              initial={{ opacity: 0, y: 8, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ type: "spring" as const, stiffness: 400, damping: 25 }}
              className="mt-3 rounded-lg bg-emerald-100 px-3 py-2 text-sm text-emerald-900"
            >
              {successText}
            </motion.p>
          ) : status === "fail" && hintText ? (
            <motion.p
              key="fail"
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 8 }}
              transition={{ duration: 0.2 }}
              className="mt-3 rounded-lg bg-rose-100 px-3 py-2 text-sm text-rose-900"
            >
              Almost. {hintText}
            </motion.p>
          ) : null}
        </AnimatePresence>

        <AnimatePresence>
          {completed && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              className="mt-3 flex items-center gap-2 overflow-hidden"
            >
              <motion.span
                initial={{ scale: 0, rotate: -90 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring" as const, stiffness: 400, damping: 15, delay: 0.1 }}
                className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500 text-[10px] text-white"
              >
                ✓
              </motion.span>
              <p className="text-xs font-medium text-emerald-700">Lesson Complete. You can proceed.</p>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.section>

      {/* Footer */}
      <motion.footer
        custom={3}
        variants={sectionVariants}
        initial="hidden"
        animate="visible"
        className="mt-2 flex flex-wrap items-center justify-between gap-2"
      >
        <div className="flex gap-2">
          <button
            type="button"
            onClick={onPrev}
            disabled={!hasPrev}
            className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Back
          </button>
          {onReset ? (
            <button
              type="button"
              onClick={onReset}
              className="rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-50"
            >
              Start Over
            </button>
          ) : null}
        </div>
        <motion.button
          type="button"
          onClick={onNext}
          disabled={!canGoNext || !hasNext}
          whileHover={canGoNext && hasNext ? { scale: 1.03 } : {}}
          whileTap={canGoNext && hasNext ? { scale: 0.97 } : {}}
          className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition-colors hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
          title={!canGoNext ? "Complete the task first" : undefined}
        >
          {hasNext ? "Next →" : "Finish"}
        </motion.button>
      </motion.footer>
    </article>
  );
}
