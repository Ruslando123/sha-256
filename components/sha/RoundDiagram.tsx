"use client";

import type { ShaPhase } from "@/lib/sha256/types";
import { motion } from "framer-motion";

function hex8(x: number | undefined): string {
  if (x === undefined) return "--------";
  return (x >>> 0).toString(16).padStart(8, "0");
}

type RoundDiagramProps = {
  phase: ShaPhase;
  a: number; b: number; c: number; d: number;
  e: number; f: number; g: number; h: number;
  s0?: number; s1?: number;
  Ch?: number; Maj?: number;
  T1?: number; T2?: number;
  K_t?: number;
  W?: Uint32Array;
  scheduleIndex?: number;
  round?: number;
};

const ACTIVE_PHASES: Record<string, string[]> = {
  compress_start: ["reg_a", "reg_b", "reg_c", "reg_d", "reg_e", "reg_f", "reg_g", "reg_h"],
  compress_ch_sig1: ["reg_e", "reg_f", "reg_g", "fn_sig1", "fn_ch", "arrow_e_sig1", "arrow_efg_ch"],
  compress_maj_sig0: ["reg_a", "reg_b", "reg_c", "fn_sig0", "fn_maj", "arrow_a_sig0", "arrow_abc_maj"],
  compress_t1: ["fn_sig1", "fn_ch", "fn_t1", "val_kt", "val_wt", "reg_h", "arrow_to_t1"],
  compress_t2_update: ["fn_sig0", "fn_maj", "fn_t1", "fn_t2", "add_a", "add_e", "reg_d", "arrow_to_t2", "arrow_t1_a", "arrow_t2_a", "arrow_t1_e", "arrow_d_e", "arrow_shifts"],
};

function isActive(phase: ShaPhase, id: string): boolean {
  const ids = ACTIVE_PHASES[phase];
  if (!ids) return false;
  return ids.includes(id);
}

const GLOW_AMBER = "drop-shadow(0 0 6px rgba(245,158,11,0.7))";
const GLOW_CYAN = "drop-shadow(0 0 6px rgba(6,182,212,0.7))";
const GLOW_EMERALD = "drop-shadow(0 0 6px rgba(16,185,129,0.7))";
const GLOW_VIOLET = "drop-shadow(0 0 6px rgba(139,92,246,0.7))";

function RegBox({ x, y, label, value, active, glow }: {
  x: number; y: number; label: string; value: string; active: boolean; glow: string;
}) {
  return (
    <motion.g
      animate={{ filter: active ? glow : "none" }}
      transition={{ duration: 0.4 }}
    >
      <motion.rect
        x={x - 38} y={y - 16} width={76} height={32} rx={6}
        fill={active ? "#fef3c7" : "#f4f4f5"}
        stroke={active ? "#f59e0b" : "#d4d4d8"}
        strokeWidth={active ? 1.5 : 1}
        animate={{ scale: active ? 1.03 : 1 }}
        transition={{ duration: 0.3 }}
        style={{ transformOrigin: `${x}px ${y}px` }}
      />
      <text x={x} y={y - 4} textAnchor="middle" fontSize={9} fontWeight={700} fill="#71717a">{label}</text>
      <text x={x} y={y + 9} textAnchor="middle" fontSize={8} fontFamily="monospace" fill={active ? "#92400e" : "#3f3f46"}>{value}</text>
    </motion.g>
  );
}

function FnBox({ x, y, label, value, active, fillColor, strokeColor, glow }: {
  x: number; y: number; label: string; value?: string; active: boolean;
  fillColor: string; strokeColor: string; glow: string;
}) {
  const w = value ? 80 : 56;
  const ht = value ? 32 : 24;
  return (
    <motion.g
      animate={{ filter: active ? glow : "none" }}
      transition={{ duration: 0.4 }}
    >
      <motion.rect
        x={x - w / 2} y={y - ht / 2} width={w} height={ht} rx={ht / 2}
        fill={active ? fillColor : "#fafafa"}
        stroke={active ? strokeColor : "#e4e4e7"}
        strokeWidth={active ? 1.5 : 1}
        animate={{ scale: active ? 1.06 : 1 }}
        transition={{ duration: 0.3 }}
        style={{ transformOrigin: `${x}px ${y}px` }}
      />
      <text x={x} y={value ? y - 3 : y + 3} textAnchor="middle" fontSize={9} fontWeight={600} fill={active ? strokeColor : "#71717a"}>{label}</text>
      {value && <text x={x} y={y + 10} textAnchor="middle" fontSize={7} fontFamily="monospace" fill={active ? strokeColor : "#a1a1aa"}>{value}</text>}
    </motion.g>
  );
}

function AddCircle({ x, y, active, glow }: { x: number; y: number; active: boolean; glow: string }) {
  return (
    <motion.g
      animate={{ filter: active ? glow : "none" }}
      transition={{ duration: 0.4 }}
    >
      <motion.circle
        cx={x} cy={y} r={12}
        fill={active ? "#ecfdf5" : "#fafafa"}
        stroke={active ? "#10b981" : "#d4d4d8"}
        strokeWidth={active ? 1.5 : 1}
        animate={{ scale: active ? 1.15 : 1 }}
        transition={{ duration: 0.3 }}
        style={{ transformOrigin: `${x}px ${y}px` }}
      />
      <text x={x} y={y + 4} textAnchor="middle" fontSize={12} fontWeight={700} fill={active ? "#059669" : "#a1a1aa"}>+</text>
    </motion.g>
  );
}

function Arrow({ d, active, color = "#d4d4d8", activeColor = "#f59e0b" }: {
  d: string; active: boolean; color?: string; activeColor?: string;
}) {
  return (
    <>
      {/* Base path */}
      <motion.path
        d={d}
        fill="none"
        strokeWidth={active ? 1.8 : 1}
        strokeLinecap="round"
        markerEnd="url(#arrowhead)"
        animate={{ stroke: active ? activeColor : color }}
        transition={{ duration: 0.3 }}
      />
      {/* Flowing particle overlay */}
      {active && (
        <motion.path
          d={d}
          fill="none"
          stroke={activeColor}
          strokeWidth={2.5}
          strokeLinecap="round"
          strokeDasharray="4 16"
          animate={{ strokeDashoffset: [0, -40] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}
          opacity={0.7}
        />
      )}
    </>
  );
}

export function RoundDiagram({
  phase, a, b, c, d, e, f, g, h,
  s0, s1, Ch: chVal, Maj: majVal, T1, T2,
  K_t, W, scheduleIndex, round,
}: RoundDiagramProps) {
  const W_t = W && scheduleIndex !== undefined ? W[scheduleIndex] : undefined;
  const isCompress = phase.startsWith("compress");

  const RY = 30;
  const FY = 115;
  const TY = 195;
  const AY = 275;
  const OY = 345;

  const rx = [52, 142, 232, 322, 412, 502, 592, 682];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white/90 p-3 backdrop-blur-sm">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-600">
          Compression round diagram
          {round !== undefined && (
            <span className="ml-2 font-mono font-normal text-zinc-400">
              round {round + 1}/64
            </span>
          )}
        </h3>
        <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[9px] font-semibold text-amber-700">
          {phase.replace(/_/g, " ")}
        </span>
      </div>

      <svg viewBox="0 0 734 380" className="w-full" style={{ maxHeight: 420 }}>
        <defs>
          <marker id="arrowhead" markerWidth="6" markerHeight="4" refX="5" refY="2" orient="auto">
            <polygon points="0 0, 6 2, 0 4" fill="#a1a1aa" />
          </marker>
          <filter id="glow-cyan">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#06b6d4" floodOpacity="0.4" />
            <feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
          <filter id="glow-amber">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feFlood floodColor="#f59e0b" floodOpacity="0.4" />
            <feComposite in2="blur" operator="in" />
            <feMerge><feMergeNode /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>

        {/* ─── SECTION LABELS ─── */}
        <text x={367} y={RY - 14} textAnchor="middle" fontSize={8} fontWeight={600} fill="#a1a1aa" letterSpacing="2">INPUT REGISTERS</text>
        <text x={367} y={OY + 30} textAnchor="middle" fontSize={8} fontWeight={600} fill="#a1a1aa" letterSpacing="2">OUTPUT REGISTERS</text>
        <text x={14} y={FY + 3} textAnchor="middle" fontSize={7} fill="#8b5cf6" fontWeight={600}
          transform={`rotate(-90 14 ${FY})`}>T&#x2082; path</text>
        <text x={720} y={FY + 3} textAnchor="middle" fontSize={7} fill="#d97706" fontWeight={600}
          transform={`rotate(90 720 ${FY})`}>T&#x2081; path</text>

        {/* ─── SHIFT ARROWS (register cascade) — drawn first so behind boxes ─── */}
        {[0, 1, 2].map(i => (
          <Arrow key={`shift-l-${i}`}
            d={`M ${rx[i]!} ${RY + 16} Q ${rx[i]! + 45} ${(RY + OY) / 2} ${rx[i + 1]!} ${OY - 16}`}
            active={isActive(phase, "arrow_shifts")} activeColor="#a3a3a3" color="#e4e4e7" />
        ))}
        {[4, 5, 6].map(i => (
          <Arrow key={`shift-r-${i}`}
            d={`M ${rx[i]!} ${RY + 16} Q ${rx[i]! + 45} ${(RY + OY) / 2} ${rx[i + 1]!} ${OY - 16}`}
            active={isActive(phase, "arrow_shifts")} activeColor="#a3a3a3" color="#e4e4e7" />
        ))}

        {/* d → add_e (long arc) */}
        <Arrow d={`M ${rx[3]!} ${RY + 16} Q ${rx[3]! + 20} ${(RY + AY) / 2} ${rx[4]! - 12} ${AY - 14}`}
          active={isActive(phase, "arrow_d_e")} activeColor="#f59e0b" />

        {/* ─── ARROWS: registers → functions ─── */}
        <Arrow d={`M ${rx[0]!} ${RY + 16} L ${rx[0]!} ${FY - 16}`}
          active={isActive(phase, "arrow_a_sig0")} activeColor="#8b5cf6" />
        <Arrow d={`M ${rx[1]!} ${RY + 16} L ${rx[1]!} ${FY - 16}`}
          active={isActive(phase, "arrow_abc_maj")} activeColor="#8b5cf6" />
        <Arrow d={`M ${rx[4]!} ${RY + 16} L ${rx[4]!} ${FY - 16}`}
          active={isActive(phase, "arrow_e_sig1")} activeColor="#06b6d4" />
        <Arrow d={`M ${rx[5]!} ${RY + 16} L ${rx[5]!} ${FY - 16}`}
          active={isActive(phase, "arrow_efg_ch")} activeColor="#06b6d4" />
        {/* h → T1 */}
        <Arrow d={`M ${rx[7]!} ${RY + 16} Q ${rx[7]!} ${FY + 30} 560 ${TY - 16}`}
          active={isActive(phase, "arrow_to_t1")} activeColor="#f59e0b" />

        {/* ─── ARROWS: functions → T1, T2 ─── */}
        <Arrow d={`M ${rx[0]!} ${FY + 16} L 100 ${TY - 16}`}
          active={isActive(phase, "arrow_to_t2")} activeColor="#8b5cf6" />
        <Arrow d={`M ${rx[1]!} ${FY + 16} L 100 ${TY - 16}`}
          active={isActive(phase, "arrow_to_t2")} activeColor="#8b5cf6" />
        <Arrow d={`M ${rx[4]!} ${FY + 16} L 560 ${TY - 16}`}
          active={isActive(phase, "arrow_to_t1")} activeColor="#0891b2" />
        <Arrow d={`M ${rx[5]!} ${FY + 16} L 560 ${TY - 16}`}
          active={isActive(phase, "arrow_to_t1")} activeColor="#0891b2" />
        <Arrow d={`M ${rx[6]!} ${FY + 16} L 560 ${TY - 16}`}
          active={isActive(phase, "arrow_to_t1")} activeColor="#ca8a04" />
        <Arrow d={`M ${rx[7]!} ${FY - 14} Q ${rx[7]!} ${TY - 30} 600 ${TY - 16}`}
          active={isActive(phase, "arrow_to_t1")} activeColor="#ca8a04" />

        {/* ─── ARROWS: T1,T2 → addition nodes ─── */}
        <Arrow d={`M 100 ${TY + 16} L ${rx[0]!} ${AY - 14}`}
          active={isActive(phase, "arrow_t2_a")} activeColor="#16a34a" />
        <Arrow d={`M 520 ${TY + 10} Q 300 ${AY - 10} ${rx[0]! + 12} ${AY - 14}`}
          active={isActive(phase, "arrow_t1_a")} activeColor="#d97706" />
        <Arrow d={`M 560 ${TY + 16} L ${rx[4]!} ${AY - 14}`}
          active={isActive(phase, "arrow_t1_e")} activeColor="#d97706" />

        {/* ─── ARROWS: addition → output ─── */}
        <Arrow d={`M ${rx[0]!} ${AY + 12} L ${rx[0]!} ${OY - 16}`}
          active={isActive(phase, "add_a")} activeColor="#16a34a" />
        <Arrow d={`M ${rx[4]!} ${AY + 12} L ${rx[4]!} ${OY - 16}`}
          active={isActive(phase, "add_e")} activeColor="#16a34a" />

        {/* ─── INPUT REGISTERS ─── */}
        <RegBox x={rx[0]!} y={RY} label="a" value={hex8(a)} active={isActive(phase, "reg_a")} glow={GLOW_AMBER} />
        <RegBox x={rx[1]!} y={RY} label="b" value={hex8(b)} active={isActive(phase, "reg_b")} glow={GLOW_AMBER} />
        <RegBox x={rx[2]!} y={RY} label="c" value={hex8(c)} active={isActive(phase, "reg_c")} glow={GLOW_AMBER} />
        <RegBox x={rx[3]!} y={RY} label="d" value={hex8(d)} active={isActive(phase, "reg_d")} glow={GLOW_AMBER} />
        <RegBox x={rx[4]!} y={RY} label="e" value={hex8(e)} active={isActive(phase, "reg_e")} glow={GLOW_CYAN} />
        <RegBox x={rx[5]!} y={RY} label="f" value={hex8(f)} active={isActive(phase, "reg_f")} glow={GLOW_CYAN} />
        <RegBox x={rx[6]!} y={RY} label="g" value={hex8(g)} active={isActive(phase, "reg_g")} glow={GLOW_CYAN} />
        <RegBox x={rx[7]!} y={RY} label="h" value={hex8(h)} active={isActive(phase, "reg_h")} glow={GLOW_CYAN} />

        {/* ─── FUNCTION BOXES ─── */}
        <FnBox x={rx[0]!} y={FY} label="Σ₀(a)" value={hex8(s0)}
          active={isActive(phase, "fn_sig0")}
          fillColor="#ede9fe" strokeColor="#7c3aed" glow={GLOW_VIOLET} />
        <FnBox x={rx[1]!} y={FY} label="Maj" value={hex8(majVal)}
          active={isActive(phase, "fn_maj")}
          fillColor="#ede9fe" strokeColor="#7c3aed" glow={GLOW_VIOLET} />
        <FnBox x={rx[4]!} y={FY} label="Σ₁(e)" value={hex8(s1)}
          active={isActive(phase, "fn_sig1")}
          fillColor="#ecfeff" strokeColor="#0891b2" glow={GLOW_CYAN} />
        <FnBox x={rx[5]!} y={FY} label="Ch" value={hex8(chVal)}
          active={isActive(phase, "fn_ch")}
          fillColor="#ecfeff" strokeColor="#0891b2" glow={GLOW_CYAN} />

        {/* K_t and W_t */}
        <FnBox x={rx[6]!} y={FY} label="K_t" value={hex8(K_t)}
          active={isActive(phase, "val_kt")}
          fillColor="#fef9c3" strokeColor="#ca8a04" glow={GLOW_AMBER} />
        <FnBox x={rx[7]!} y={FY - 30} label="W_t" value={hex8(W_t)}
          active={isActive(phase, "val_wt")}
          fillColor="#fef9c3" strokeColor="#ca8a04" glow={GLOW_AMBER} />

        {/* ─── T1 and T2 BOXES ─── */}
        <FnBox x={100} y={TY} label="T₂" value={hex8(T2)}
          active={isActive(phase, "fn_t2")}
          fillColor="#f0fdf4" strokeColor="#16a34a" glow={GLOW_EMERALD} />
        <FnBox x={560} y={TY} label="T₁" value={hex8(T1)}
          active={isActive(phase, "fn_t1")}
          fillColor="#fffbeb" strokeColor="#d97706" glow={GLOW_AMBER} />

        {/* ─── ADDITION NODES ─── */}
        <AddCircle x={rx[0]!} y={AY} active={isActive(phase, "add_a")} glow={GLOW_EMERALD} />
        <text x={rx[0]!} y={AY + 24} textAnchor="middle" fontSize={7} fill="#71717a">T₁+T₂</text>
        <AddCircle x={rx[4]!} y={AY} active={isActive(phase, "add_e")} glow={GLOW_EMERALD} />
        <text x={rx[4]!} y={AY + 24} textAnchor="middle" fontSize={7} fill="#71717a">d+T₁</text>

        {/* ─── OUTPUT REGISTERS ─── */}
        {(() => {
          const isUpdate = phase === "compress_t2_update";
          const newA = T1 !== undefined && T2 !== undefined ? ((T1 + T2) >>> 0) : a;
          const newE = T1 !== undefined ? ((d + T1) >>> 0) : e;
          const outVals = [
            isUpdate ? newA : a,
            a, b, c,
            isUpdate ? newE : e,
            e, f, g
          ];
          const outLabels = ["a'", "b'", "c'", "d'", "e'", "f'", "g'", "h'"];
          return outLabels.map((lbl, i) => (
            <RegBox key={lbl} x={rx[i]!} y={OY} label={lbl} value={hex8(outVals[i])}
              active={isUpdate}
              glow={i === 0 || i === 4 ? GLOW_EMERALD : GLOW_AMBER} />
          ));
        })()}

        {/* ─── ACTIVE PHASE HIGHLIGHT OVERLAY ─── */}
        {isCompress && phase !== "compress_start" && (
          <motion.rect
            x={phase === "compress_ch_sig1" || phase === "compress_t1" ? 370 : 10}
            y={FY - 30}
            width={phase === "compress_t2_update" ? 714 : 354}
            height={TY - FY + 60}
            rx={12}
            fill="none"
            strokeWidth={1.5}
            strokeDasharray="6 4"
            animate={{
              stroke: phase === "compress_ch_sig1" ? "rgba(6,182,212,0.3)"
                : phase === "compress_maj_sig0" ? "rgba(139,92,246,0.3)"
                : phase === "compress_t1" ? "rgba(217,119,6,0.3)"
                : phase === "compress_t2_update" ? "rgba(16,163,127,0.3)"
                : "rgba(0,0,0,0)",
              strokeDashoffset: [0, -20],
            }}
            transition={{ strokeDashoffset: { duration: 2, repeat: Infinity, ease: "linear" }, stroke: { duration: 0.5 } }}
          />
        )}
      </svg>
    </div>
  );
}
