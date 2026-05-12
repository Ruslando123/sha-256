"use client";

import type { ShaPhase } from "@/lib/sha256/types";
import { motion } from "framer-motion";
import { EduTooltip } from "./EduTooltip";

function fmt32(x: number | undefined): string {
  if (x === undefined) return "—";
  return (x >>> 0).toString(16).padStart(8, "0");
}

type RoundDetailPanelProps = {
  round?: number;
  K_t?: number;
  s0?: number;
  s1?: number;
  Ch?: number;
  Maj?: number;
  T1?: number;
  T2?: number;
  guidedFocus?: boolean;
  phase?: ShaPhase;
};

const rowVariants = {
  hidden: { opacity: 0, x: -10 },
  visible: (i: number) => ({
    opacity: 1,
    x: 0,
    transition: {
      type: "spring" as const,
      stiffness: 400,
      damping: 30,
      delay: i * 0.05,
    },
  }),
};

export function RoundDetailPanel({
  round,
  K_t,
  s0,
  s1,
  Ch,
  Maj,
  T1,
  T2,
  guidedFocus = false,
  phase,
}: RoundDetailPanelProps) {
  const showSigmaAndCh = phase === "compress_ch_sig1" || phase === "compress_t1" || phase === "compress_t2_update";
  const showSigmaMaj = phase === "compress_maj_sig0" || phase === "compress_t2_update" || phase === "compress_t1";
  const showT1 = phase === "compress_t1" || phase === "compress_t2_update";
  const showT2 = phase === "compress_t2_update";

  const rows = [
    { key: "Kt", label: "Kₜ", glossaryKey: "constants_kt" as const, value: K_t, active: true },
    { key: "s1", label: "Σ₁(e)", glossaryKey: "compress_ch_sig1" as const, value: s1, active: showSigmaAndCh },
    { key: "Ch", label: "Ch", glossaryKey: undefined, value: Ch, active: showSigmaAndCh },
    { key: "s0", label: "Σ₀(a)", glossaryKey: "compress_maj_sig0" as const, value: s0, active: showSigmaMaj },
    { key: "Maj", label: "Maj", glossaryKey: undefined, value: Maj, active: showSigmaMaj },
    { key: "T1", label: "T₁", glossaryKey: undefined, value: T1, active: showT1 },
    { key: "T2", label: "T₂", glossaryKey: undefined, value: T2, active: showT2 },
  ];

  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-white/80 p-4 backdrop-blur-sm transition-all ${
        guidedFocus ? "ring-2 ring-fuchsia-300/70 shadow-lg shadow-fuchsia-100/50" : ""
      }`}
    >
      <h3 className="mb-3 flex items-center gap-2 text-sm font-semibold text-zinc-800">
        Intermediate values
        {round !== undefined ? (
          <motion.span
            key={round}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="rounded-full bg-zinc-100 px-2 py-0.5 font-mono text-xs font-normal text-zinc-500"
          >
            round {round + 1}/64
          </motion.span>
        ) : null}
      </h3>

      <dl className="grid grid-cols-1 gap-2 font-mono text-xs text-zinc-800 sm:grid-cols-2">
        {rows.map((row, i) => (
          <motion.div
            key={row.key}
            custom={i}
            variants={rowVariants}
            initial="hidden"
            animate="visible"
            className={`relative flex justify-between gap-2 overflow-hidden rounded px-2 py-1.5 transition-colors duration-300 ${
              row.active
                ? row.key === "T1"
                  ? "bg-amber-50 ring-1 ring-amber-200/60"
                  : row.key === "T2"
                    ? "bg-emerald-50 ring-1 ring-emerald-200/60"
                    : row.key === "s1" || row.key === "Ch"
                      ? "bg-cyan-50 ring-1 ring-cyan-200/60"
                      : row.key === "s0" || row.key === "Maj"
                        ? "bg-violet-50 ring-1 ring-violet-200/60"
                        : "bg-zinc-50"
                : "bg-zinc-50"
            }`}
          >
            {row.active && row.key !== "Kt" && (
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/50 to-white/0"
                initial={{ x: "-100%" }}
                animate={{ x: "200%" }}
                transition={{ duration: 1.2, ease: "easeInOut" }}
              />
            )}
            <dt className="relative flex items-center gap-1 text-zinc-500">
              {row.glossaryKey ? (
                <EduTooltip glossaryKey={row.glossaryKey} label={row.label} />
              ) : (
                row.label
              )}
            </dt>
            <motion.dd
              key={`${row.key}-${row.value}`}
              initial={{ opacity: 0, y: -4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: i * 0.03 }}
              className="relative"
            >
              0x{fmt32(row.value)}
            </motion.dd>
          </motion.div>
        ))}
      </dl>
    </section>
  );
}
