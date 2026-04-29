"use client";

import { animate, motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { digestBitOptions, practicalNotes, securityAnalysisCopy } from "@/content/securityAnalysis";
import Link from "next/link";
import {
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
  type ReactNode,
} from "react";

const MotionLink = motion(Link);

const pipelineContainer = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.05 },
  },
} as const;

const pipelineStep = {
  hidden: { opacity: 0, y: 12, scale: 0.92 },
  show: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { type: "spring" as const, stiffness: 380, damping: 26 },
  },
} as const;

function collisionProbability(bits: number, messages: number): number {
  const domain = 2 ** bits;
  const lambda = (messages * (messages - 1)) / (2 * domain);
  if (lambda > 50) return 1;
  return 1 - Math.exp(-lambda);
}

function formatProbability(value: number): string {
  if (value <= 0) return "≈ 0%";
  if (value >= 1) return "≈ 100%";
  if (value < 0.000001) return "< 0.0001%";
  return `${(value * 100).toFixed(4)}%`;
}

function AnimatedSection({
  children,
  delay = 0.1,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.section
      initial={reduceMotion ? undefined : { opacity: 0, y: 48, rotateX: 4 }}
      whileInView={{ opacity: 1, y: 0, rotateX: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: reduceMotion ? 0 : 0.65, delay: reduceMotion ? 0 : delay, ease: [0.22, 1, 0.36, 1] }}
      style={{ transformPerspective: 900 }}
      className={className}
    >
      {children}
    </motion.section>
  );
}

function AnimatedCard({
  children,
  className = "",
  ...props
}: {
  children: ReactNode;
  className?: string;
} & React.ComponentProps<typeof motion.div>) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? undefined : { opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: reduceMotion ? 0 : 0.6 }}
      whileHover={
        reduceMotion
          ? undefined
          : { scale: 1.02, y: -2, boxShadow: "0 12px 40px -12px rgba(6,182,212,0.25)" }
      }
      className={`${className} transition-shadow`}
      {...props}
    >
      {children}
    </motion.div>
  );
}

function AmbientBackdrop() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) {
    return <div className="pointer-events-none fixed inset-0 -z-10 bg-zinc-50" aria-hidden />;
  }
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-zinc-50" aria-hidden>
      <motion.div
        className="absolute -left-32 -top-32 h-[420px] w-[420px] rounded-full bg-gradient-to-br from-cyan-200/50 via-sky-100/40 to-transparent blur-3xl"
        animate={{ x: [0, 40, 0], y: [0, 24, 0], scale: [1, 1.08, 1] }}
        transition={{ duration: 18, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="absolute -right-20 top-1/3 h-[380px] w-[380px] rounded-full bg-gradient-to-bl from-violet-200/45 via-fuchsia-100/35 to-transparent blur-3xl"
        animate={{ x: [0, -36, 0], y: [0, -20, 0], opacity: [0.5, 0.85, 0.5] }}
        transition={{ duration: 22, repeat: Infinity, ease: "easeInOut", delay: 1 }}
      />
      <motion.div
        className="absolute bottom-0 left-1/3 h-[320px] w-[320px] rounded-full bg-gradient-to-t from-emerald-200/30 to-transparent blur-3xl"
        animate={{ scale: [1, 1.12, 1], rotate: [0, 8, 0] }}
        transition={{ duration: 26, repeat: Infinity, ease: "easeInOut", delay: 2 }}
      />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(244,244,245,0.7)_1px,transparent_1px),linear-gradient(to_bottom,rgba(244,244,245,0.7)_1px,transparent_1px)] bg-[size:48px_48px] opacity-[0.35]" />
    </div>
  );
}

function ComputingShimmer() {
  const reduceMotion = useReducedMotion();
  if (reduceMotion) return null;
  return (
    <motion.div
      className="pointer-events-none absolute inset-0 z-10 overflow-hidden rounded-lg"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2 }}
    >
      <motion.div
        className="absolute inset-y-0 w-2/5 bg-gradient-to-r from-transparent via-white/55 to-transparent"
        initial={{ x: "-120%" }}
        animate={{ x: "220%" }}
        transition={{ duration: 1.1, repeat: Infinity, ease: "linear", repeatDelay: 0.15 }}
      />
    </motion.div>
  );
}

function ProcessStep({
  stepIndex,
  label,
  active,
  children,
  colorActive,
}: {
  stepIndex: number;
  label: string;
  active: boolean;
  children?: ReactNode;
  colorActive: string;
}) {
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      className="relative flex flex-col items-center gap-2"
      initial={false}
      animate={{
        opacity: active ? 1 : 0.5,
        scale: active ? 1.06 : 1,
        filter: active ? "drop-shadow(0 0 12px rgba(34,211,238,0.35))" : "none",
      }}
      transition={{ type: "spring", stiffness: 300, damping: 26 }}
    >
      <div className="relative">
        {active && !reduceMotion ? (
          <motion.span
            className="absolute inset-0 rounded-full border-2 border-cyan-400/40"
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: [1, 1.25], opacity: [0.55, 0] }}
            transition={{ repeat: Infinity, duration: 1.8, ease: "easeOut" }}
          />
        ) : null}
        <motion.div
          className={`relative flex h-11 w-11 items-center justify-center rounded-full border-2 font-bold shadow-sm transition-colors ${
            active ? colorActive : "border border-zinc-200 bg-zinc-100 text-zinc-400"
          }`}
          animate={{
            boxShadow: active ? "0 0 0 4px rgba(34,211,238,0.2)" : "none",
            rotate: active && !reduceMotion ? [0, -4, 4, 0] : 0,
          }}
          transition={{
            boxShadow: { duration: 0.4 },
            rotate: { duration: 0.65, ease: "easeInOut" },
          }}
        >
          {stepIndex}
        </motion.div>
      </div>
      <span className="min-w-[72px] text-center text-[11px] font-semibold leading-tight text-zinc-600">{label}</span>
      {children ? <div className="mt-2 w-full">{children}</div> : null}
    </motion.div>
  );
}

function AnimatedFormattedProbability({ probability }: { probability: number }) {
  const [text, setText] = useState(() => formatProbability(probability));
  const fromRef = useRef(probability);

  useEffect(() => {
    const controls = animate(fromRef.current, probability, {
      duration: 0.55,
      ease: "easeOut",
      onUpdate: (latest) => {
        fromRef.current = latest;
        setText(formatProbability(latest));
      },
    });
    return () => controls.stop();
  }, [probability]);

  return <span className="tabular-nums">{text}</span>;
}

function SecurityBadge({ probability }: { probability: number }) {
  let color = "bg-emerald-600";
  let label = "Безопасно";
  if (probability >= 0.1) {
    color = "bg-red-500";
    label = "Уязвимо";
  } else if (probability >= 0.001) {
    color = "bg-amber-500";
    label = "Риск";
  }
  const reduceMotion = useReducedMotion();
  return (
    <motion.div
      initial={reduceMotion ? undefined : { scale: 0.75, opacity: 0, rotate: -6 }}
      animate={{ scale: 1, opacity: 1, rotate: 0 }}
      transition={{ bounce: 0.28, type: "spring", duration: 0.55 }}
      whileHover={reduceMotion ? undefined : { scale: 1.06, y: -1 }}
      className={`inline-flex items-center gap-2 rounded-full px-3 py-1.5 text-xs font-bold text-white shadow-lg ${color}`}
    >
      <motion.span
        className="inline-block h-2 w-2 rounded-full bg-white/80"
        animate={reduceMotion ? undefined : { scale: [1, 1.35, 1], opacity: [0.85, 1, 0.85] }}
        transition={{ repeat: Infinity, duration: 1.4, ease: "easeInOut" }}
      />
      {label}
    </motion.div>
  );
}

function BirthdayCollisionPipeline({
  bits,
  logMessages,
  loading,
}: {
  bits: number;
  logMessages: number;
  loading: boolean;
}) {
  const reduceMotion = useReducedMotion();
  const containerVariants = useMemo(
    () =>
      reduceMotion
        ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
        : pipelineContainer,
    [reduceMotion],
  );
  const stepVariants = useMemo(
    () =>
      reduceMotion
        ? { hidden: { opacity: 1, y: 0, scale: 1 }, show: { opacity: 1, y: 0, scale: 1 } }
        : pipelineStep,
    [reduceMotion],
  );

  const stepMap: { label: string; colorActive: string }[] = [
    { label: "Ввод данных", colorActive: "bg-cyan-500 text-white border-cyan-600" },
    { label: "Хэширование", colorActive: "bg-violet-500 text-white border-violet-600" },
    { label: "Атака/Анализ", colorActive: "bg-rose-500 text-white border-rose-600" },
    { label: "Результат", colorActive: "bg-emerald-500 text-white border-emerald-600" },
  ];

  let activeStep = 0;
  if (loading) activeStep = 2;
  else if (bits && logMessages !== undefined) activeStep = 3;

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      whileInView="show"
      viewport={{ once: true, amount: 0.35 }}
      className="relative select-none px-1 py-4"
    >
      <div className="pointer-events-none absolute inset-x-4 top-[34px] hidden h-1 sm:block">
        <motion.div
          className="h-full rounded-full bg-gradient-to-r from-cyan-400/90 via-violet-400/90 to-emerald-400/90 shadow-[0_0_12px_rgba(6,182,212,0.35)]"
          initial={{ scaleX: 0 }}
          whileInView={{ scaleX: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.95, ease: [0.22, 1, 0.36, 1] }}
          style={{ transformOrigin: "left" }}
        />
      </div>

      <div className="relative z-20 flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between sm:gap-1">
        {stepMap.map((step, i) => (
          <motion.div
            key={step.label}
            variants={stepVariants}
            className="relative flex flex-1 items-center gap-0.5 sm:gap-1"
          >
            <div className="flex min-w-0 flex-1 justify-center">
              <ProcessStep
                stepIndex={i + 1}
                label={step.label}
                colorActive={step.colorActive}
                active={activeStep === i}
              />
            </div>
            {i < stepMap.length - 1 && (
              <motion.div
                initial={{ scaleX: 0, opacity: 0 }}
                animate={{
                  scaleX: activeStep > i ? 1 : 0.35,
                  opacity: activeStep >= i ? 1 : 0.2,
                }}
                transition={{ duration: 0.45, ease: "easeInOut" }}
                style={{ transformOrigin: "left" }}
                className="hidden h-1.5 w-6 shrink-0 rounded-full bg-gradient-to-r from-cyan-400 via-violet-400 to-rose-400 shadow-sm sm:block"
              />
            )}
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}

function BirthdayFormulaReveal({ formula }: { formula: string }) {
  const reduceMotion = useReducedMotion();
  /** Mirrors native details open state for AnimatePresence; avoid controlled open={open} together with toggle (browser conflict). */
  const [open, setOpen] = useState(false);
  const detailsRef = useRef<HTMLDetailsElement>(null);

  const contentMotion = reduceMotion
    ? {
        initial: { opacity: 1 },
        animate: { opacity: 1 },
        exit: { opacity: 1 },
        transition: { duration: 0 },
      }
    : {
        initial: { opacity: 0, y: 36, scale: 0.98 },
        animate: { opacity: 1, y: 0, scale: 1 },
        exit: { opacity: 0, y: 10, scale: 0.98 },
        transition: { duration: 0.42, ease: [0.22, 1, 0.36, 1] as const },
      };

  return (
    <details
      ref={detailsRef}
      className="group mt-3 overflow-hidden rounded-lg border border-zinc-200/80 bg-white/80 shadow-sm backdrop-blur-sm open:shadow-md"
      onToggle={() => setOpen(detailsRef.current?.open ?? false)}
    >
      <summary className="cursor-pointer list-none px-3 py-2.5 font-medium text-zinc-800 transition-colors hover:bg-white/90 focus:outline-cyan-400 group-open:text-cyan-700 group-open:underline [&::-webkit-details-marker]:hidden">
        <span className="inline-flex items-center gap-2">
          Показать формулу вероятности
          <motion.span
            initial={false}
            animate={{ rotate: open ? 90 : 0 }}
            transition={{ duration: 0.21 }}
            className="inline-block text-cyan-500"
          >
            <svg
              width={16}
              height={16}
              viewBox="0 0 16 16"
              fill="none"
              className="inline"
              aria-hidden
            >
              <path
                d="M5.25 6l2.75 2.75L10.75 6"
                stroke="currentColor"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
          </motion.span>
        </span>
      </summary>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="formula"
            {...contentMotion}
            className="border-t border-zinc-100 bg-zinc-50/95 px-3 py-4"
          >
            <p
              className="break-words font-mono text-lg sm:text-xl leading-relaxed font-semibold text-cyan-800 drop-shadow-sm transition-all duration-200"
              style={{
                letterSpacing: "0.01em",
                textShadow:
                  "0 2px 8px rgba(14,165,233,0.08), 0 1px 0 rgba(16,185,129,0.04)",
                wordBreak: "break-word",
              }}
            >
              {formula}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </details>
  );
}

export default function SecurityAnalysisPage() {
  const reduceMotion = useReducedMotion();
  const [bits, setBits] = useState(256);
  const [logMessages, setLogMessages] = useState(6);
  /** Short “computing…” pulse when inputs change; math stays synchronous. */
  const [computingPulse, setComputingPulse] = useState(false);

  const messages = useMemo(() => 10 ** logMessages, [logMessages]);
  const probability = useMemo(() => collisionProbability(bits, messages), [bits, messages]);
  const birthdayThreshold = useMemo(() => 2 ** (bits / 2), [bits]);

  useEffect(() => {
    const startId = window.requestAnimationFrame(() => {
      setComputingPulse(true);
    });
    const endId = window.setTimeout(() => setComputingPulse(false), 480);
    return () => {
      cancelAnimationFrame(startId);
      clearTimeout(endId);
    };
  }, [bits, logMessages]);

  const barWidthPct = Math.min(100, probability * 100);
  const barGradient: CSSProperties["background"] =
    probability > 0.1
      ? "linear-gradient(90deg,#ef4444, #fb7185 40%,#fbbf24 70%,#22d3ee 100%)"
      : "linear-gradient(90deg, #22d3ee 70%, #10b981 100%)";

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-zinc-50 px-4 py-8 text-zinc-900">
      <AmbientBackdrop />
      <div className="relative z-10 mx-auto flex w-full max-w-6xl flex-col gap-6">
        <nav className="flex items-center justify-between gap-4 rounded-xl border border-zinc-200/80 bg-white/90 px-4 py-3 shadow-sm shadow-cyan-500/5 backdrop-blur-sm">
          <div className="min-w-0">
            <motion.h1
              initial={reduceMotion ? undefined : { opacity: 0, y: -18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: reduceMotion ? 0 : 0.7 }}
              className="bg-gradient-to-r from-zinc-900 via-cyan-800 to-violet-800 bg-clip-text text-lg font-bold text-transparent"
            >
              {securityAnalysisCopy.title}
            </motion.h1>
            <motion.p
              initial={reduceMotion ? undefined : { opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: reduceMotion ? 0 : 0.2, duration: 0.5 }}
              className="mt-0.5 text-xs font-medium text-zinc-500"
            >
              Birthday bound · коллизии · оценка риска
            </motion.p>
          </div>
          <MotionLink
            href="/"
            whileHover={reduceMotion ? undefined : { scale: 1.03, x: -2 }}
            whileTap={reduceMotion ? undefined : { scale: 0.98 }}
            className="shrink-0 text-sm font-medium text-cyan-700 transition-colors hover:text-cyan-900 hover:underline"
          >
            ← На главную
          </MotionLink>
        </nav>

        {/* Updated: Section - Collision resistance и Birthday paradox */}
        <AnimatedSection
          delay={0.03}
          className="rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-cyan-50 to-lime-50 p-6 shadow-sm"
        >
          <div className="flex items-start gap-3">
            <motion.span
              className="mt-0.5 text-2xl"
              animate={reduceMotion ? undefined : { rotate: [0, 8, -6, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
              aria-hidden
            >
              🎂
            </motion.span>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-semibold text-zinc-900">Collision resistance и Birthday paradox</h2>
              <p className="mt-2 text-sm text-zinc-700">{securityAnalysisCopy.birthdayIntro}</p>
              {/* Formula reveal: Modern animated gradient block */}
              <BirthdayFormulaReveal formula={securityAnalysisCopy.birthdayFormula} />
            </div>
          </div>
        </AnimatedSection>

        <section className="grid gap-4 lg:grid-cols-3">
          {/* Updated: Card - Интерактивная оценка коллизии */}
          <AnimatedCard className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 p-6 shadow-sm lg:col-span-2">
            <div className="pointer-events-none absolute -right-12 -top-12 h-32 w-32 rounded-full bg-gradient-to-br from-cyan-200/40 to-transparent blur-2xl" />
            <h3 className="relative text-sm font-semibold text-zinc-900">Интерактивная оценка коллизии</h3>
            <BirthdayCollisionPipeline bits={bits} logMessages={logMessages} loading={computingPulse} />

            <div className="mt-2 grid gap-3 md:grid-cols-2">
              <motion.label
                className="flex flex-col gap-1 text-sm"
                whileHover={reduceMotion ? undefined : { scale: 1.015 }}
                transition={{ type: "spring", duration: 0.23 }}
              >
                <span className="font-medium text-zinc-800">Размер дайджеста (n)</span>
                <select
                  value={bits}
                  onChange={(e) => setBits(Number(e.target.value))}
                  className="rounded-lg border border-zinc-300 px-3 py-2 transition-all focus:border-cyan-500"
                >
                  {digestBitOptions.map((option) => (
                    <option key={option} value={option}>
                      {option} бит
                    </option>
                  ))}
                </select>
              </motion.label>
              <motion.label
                className="flex flex-col gap-1 text-sm"
                whileHover={reduceMotion ? undefined : { scale: 1.015 }}
                transition={{ type: "spring", duration: 0.23 }}
              >
                <span className="font-medium text-zinc-800">Число сообщений k = 10^x</span>
                <input
                  type="range"
                  min={1}
                  max={24}
                  value={logMessages}
                  onChange={(e) => setLogMessages(Number(e.target.value))}
                  className="accent-cyan-600"
                />
                <span className="font-mono text-xs text-zinc-600">x={logMessages}</span>
              </motion.label>
            </div>

            <motion.div
              key={`${bits}-${logMessages}-${probability}`}
              className="relative mt-4 overflow-hidden rounded-lg border border-zinc-200 bg-zinc-50 p-3"
              initial={reduceMotion ? undefined : { opacity: 0, scale: 0.98, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{
                duration: reduceMotion ? 0 : 0.45,
                delay: reduceMotion ? 0 : computingPulse ? 0 : 0.08,
                type: "spring",
                stiffness: 150,
              }}
            >
              <AnimatePresence mode="wait">{computingPulse ? <ComputingShimmer key="shimmer" /> : null}</AnimatePresence>
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Результат</p>
              <p className="mt-1 text-sm text-zinc-700">
                Для <span className="font-mono">{messages.toExponential(2)}</span> сообщений и n={bits} бит:
              </p>

              <AnimatePresence mode="wait">
                {computingPulse ? (
                  <motion.div
                    key="loader"
                    className="mt-3 mb-2 flex items-center gap-2 text-zinc-500"
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 12 }}
                    transition={{ duration: 0.28 }}
                  >
                    <motion.span
                      className="flex h-5 w-5 items-center justify-center"
                      animate={{ rotate: 360 }}
                      transition={{ repeat: Infinity, duration: 1.2, ease: "linear" }}
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="#06b6d4" strokeWidth={2}>
                        <circle className="opacity-20" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" />
                        <path
                          d="M12 2a10 10 0 0 1 10 10"
                          stroke="currentColor"
                          strokeWidth="3"
                          strokeLinecap="round"
                        />
                      </svg>
                    </motion.span>
                    <span>Вычисления...</span>
                  </motion.div>
                ) : (
                  <motion.div
                    key="prob"
                    initial={reduceMotion ? undefined : { opacity: 0, scale: 0.96 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.35, type: "spring" }}
                    className="mt-3 flex flex-wrap items-end gap-2"
                  >
                    <span className="text-lg font-semibold text-zinc-900">
                      <AnimatedFormattedProbability probability={probability} />
                    </span>
                    <SecurityBadge probability={probability} />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div className="relative mt-2 h-3 overflow-hidden rounded bg-zinc-200">
                <motion.div
                  className="h-3 origin-left rounded"
                  initial={{ width: "0%" }}
                  animate={{
                    width: `${computingPulse ? 0 : barWidthPct}%`,
                    background: computingPulse ? "#a5b4fc" : barGradient,
                    boxShadow:
                      !computingPulse && barWidthPct > 30
                        ? "0 0 14px rgba(6,182,212,0.45)"
                        : "none",
                  }}
                  transition={{ duration: computingPulse ? 0.25 : 0.65, ease: "easeOut" }}
                />
              </motion.div>
            </motion.div>
          </AnimatedCard>

          {/* Updated: Card - Порог birthday bound */}
          <AnimatedCard className="relative overflow-hidden rounded-2xl border border-sky-100 bg-gradient-to-br from-sky-50 via-cyan-50 to-blue-50 p-6 shadow-sm">
            <div className="pointer-events-none absolute -left-8 bottom-0 h-24 w-24 rounded-full bg-gradient-to-tr from-emerald-200/50 to-transparent blur-2xl" />
            <h3 className="relative text-sm font-semibold text-zinc-900">Порог birthday bound</h3>
            <p className="mt-2 text-sm text-zinc-700">
              Около <span className="font-mono">2^(n/2)</span> сообщений:
            </p>
            <motion.p
              key={bits}
              className="mt-1 font-mono text-sm text-zinc-900"
              initial={reduceMotion ? undefined : { opacity: 0.5, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: reduceMotion ? 0 : 0.45 }}
            >
              {birthdayThreshold.toExponential(3)}
            </motion.p>
            <p className="mt-2 text-xs text-zinc-500">
              Именно поэтому “половина битов” становится практической границей для оценки коллизий.
            </p>
          </AnimatedCard>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <AnimatedCard className="group relative overflow-hidden rounded-xl border border-rose-200 bg-rose-50/60 p-4 transition hover:shadow-lg">
            <motion.div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.5) 50%, transparent 60%)",
                backgroundSize: "200% 100%",
              }}
              animate={reduceMotion ? undefined : { backgroundPosition: ["200% 0", "-200% 0"] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2, ease: "linear" }}
            />
            <h3 className="relative text-sm font-semibold text-rose-900">Length Extension Attack</h3>
            <motion.p
              className="mt-2 text-sm text-rose-900"
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: reduceMotion ? 0 : 0.57, delay: reduceMotion ? 0 : 0.07 }}
            >
              {securityAnalysisCopy.lengthExtensionIntro}
            </motion.p>
            <motion.pre
              className="mt-3 overflow-auto rounded-lg border border-rose-200 bg-white p-3 text-xs text-zinc-800 transition group-hover:border-rose-400"
              initial={reduceMotion ? undefined : { opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: reduceMotion ? 0 : 0.66, delay: reduceMotion ? 0 : 0.15 }}
            >
{`// Уязвимый MAC-подобный подход:
tag = SHA256(secret || message)

// Злоумышленник может построить:
message' = message || gluePadding || extra
tag' = valid_without_secret`}
            </motion.pre>
          </AnimatedCard>
          <AnimatedCard className="group relative overflow-hidden rounded-xl border border-emerald-200 bg-emerald-50/60 p-4 transition hover:shadow-lg">
            <motion.div
              className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
              style={{
                background:
                  "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.45) 50%, transparent 60%)",
                backgroundSize: "200% 100%",
              }}
              animate={reduceMotion ? undefined : { backgroundPosition: ["200% 0", "-200% 0"] }}
              transition={{ duration: 1.6, repeat: Infinity, repeatDelay: 2.3, ease: "linear" }}
            />
            <h3 className="relative text-sm font-semibold text-emerald-900">Безопасный подход</h3>
            <motion.p
              className="mt-2 text-sm text-emerald-900"
              initial={reduceMotion ? undefined : { opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: reduceMotion ? 0 : 0.46, delay: reduceMotion ? 0 : 0.07 }}
            >
              {securityAnalysisCopy.lengthExtensionFix}
            </motion.p>
            <motion.pre
              className="mt-3 overflow-auto rounded-lg border border-emerald-200 bg-white p-3 text-xs text-zinc-800 transition group-hover:border-emerald-400"
              initial={reduceMotion ? undefined : { opacity: 0, y: 25 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: reduceMotion ? 0 : 0.5, delay: reduceMotion ? 0 : 0.15 }}
            >
{`// Рекомендуется:
tag = HMAC_SHA256(secret, message)

// Альтернатива в новых системах:
tag = KMAC/SHA3-based MAC`}
            </motion.pre>
          </AnimatedCard>
        </section>

        <AnimatedSection delay={0.06} className="rounded-xl border border-zinc-200 bg-white/95 p-4 shadow-md shadow-zinc-200/50 backdrop-blur-sm">
          <h3 className="text-sm font-semibold text-zinc-900">Практические рекомендации</h3>
          <motion.ul
            className="mt-3 flex flex-col gap-2 text-sm text-zinc-700"
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, amount: 0.4 }}
            variants={
              reduceMotion
                ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
                : {
                    hidden: { opacity: 0 },
                    show: {
                      opacity: 1,
                      transition: { staggerChildren: 0.1, delayChildren: 0.06 },
                    },
                  }
            }
          >
            {practicalNotes.map((note, index) => (
              <motion.li
                key={note}
                variants={
                  reduceMotion
                    ? { hidden: { opacity: 1 }, show: { opacity: 1 } }
                    : {
                        hidden: { opacity: 0, x: -24, scale: 0.98 },
                        show: {
                          opacity: 1,
                          x: 0,
                          scale: 1,
                          transition: { type: "spring", stiffness: 350, damping: 24 },
                        },
                      }
                }
                className="flex items-start gap-2 rounded-lg border border-zinc-100 bg-zinc-50/80 px-3 py-2.5 shadow-sm transition-colors hover:border-cyan-200/80 hover:bg-cyan-50/50"
              >
                <motion.span
                  className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-cyan-500 to-violet-500 text-[11px] font-bold text-white shadow-sm"
                  whileHover={reduceMotion ? undefined : { rotate: [0, -10, 10, 0], scale: 1.08 }}
                  transition={{ duration: 0.4 }}
                >
                  {index + 1}
                </motion.span>
                <span className="min-w-0 leading-relaxed">{note}</span>
              </motion.li>
            ))}
          </motion.ul>
        </AnimatedSection>
      </div>
    </div>
  );
}
