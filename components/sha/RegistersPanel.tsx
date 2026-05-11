"use client";

import { AnimatePresence, motion } from "framer-motion";
import { memo, useMemo } from "react";
import { EduTooltip } from "./EduTooltip";

const names = ["a", "b", "c", "d", "e", "f", "g", "h"] as const;

function fmt32(x: number): string {
  return (x >>> 0).toString(16).padStart(8, "0");
}

function fmtBin32(x: number): string {
  const v = x >>> 0;
  let s = "";
  for (let i = 31; i >= 0; i--) {
    s += ((v >>> i) & 1).toString();
    if (i > 0 && i % 8 === 0) s += " ";
  }
  return s;
}

function getBits(x: number): boolean[] {
  const bits: boolean[] = [];
  for (let i = 31; i >= 0; i--) {
    bits.push(!!((x >>> i) & 1));
  }
  return bits;
}

function diffBits(a: number, b: number): boolean[] {
  const diff = (a ^ b) >>> 0;
  const bits: boolean[] = [];
  for (let i = 31; i >= 0; i--) {
    bits.push(!!((diff >>> i) & 1));
  }
  return bits;
}

const RollingHexDigit = memo(function RollingHexDigit({
  char,
  changed,
  delay,
}: {
  char: string;
  changed: boolean;
  delay: number;
}) {
  return (
    <AnimatePresence mode="popLayout">
      <motion.span
        key={char}
        initial={changed ? { y: -12, opacity: 0, filter: "blur(2px)" } : false}
        animate={{ y: 0, opacity: 1, filter: "blur(0px)" }}
        exit={{ y: 12, opacity: 0, filter: "blur(2px)" }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 30,
          delay,
        }}
        className="inline-block"
      >
        {char}
      </motion.span>
    </AnimatePresence>
  );
});

type RegistersPanelProps = {
  stepIndex: number;
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
  prev?: {
    a: number;
    b: number;
    c: number;
    d: number;
    e: number;
    f: number;
    g: number;
    h: number;
  };
  binaryMode: boolean;
  guidedFocus?: boolean;
};

export function RegistersPanel({
  stepIndex,
  a,
  b,
  c,
  d,
  e,
  f,
  g,
  h,
  prev,
  binaryMode,
  guidedFocus = false,
}: RegistersPanelProps) {
  const vals = [a, b, c, d, e, f, g, h];
  const prevs = prev ? [prev.a, prev.b, prev.c, prev.d, prev.e, prev.f, prev.g, prev.h] : null;

  const changedIndices = useMemo(() => {
    if (!prevs) return new Set<number>();
    const set = new Set<number>();
    for (let i = 0; i < 8; i++) {
      if ((vals[i]! >>> 0) !== (prevs[i]! >>> 0)) set.add(i);
    }
    return set;
  }, [vals, prevs]);

  return (
    <section
      className={`rounded-xl border border-zinc-200 bg-zinc-50/80 p-4 backdrop-blur-sm transition-all ${
        guidedFocus ? "ring-2 ring-amber-300/70 shadow-lg shadow-amber-100/50" : ""
      }`}
    >
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <h3 className="text-sm font-semibold text-zinc-800">Рабочие регистры</h3>
        <EduTooltip glossaryKey="mod32" label="mod 2³²" />
        {changedIndices.size > 0 && (
          <motion.span
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-medium text-amber-700"
          >
            {changedIndices.size} changed
          </motion.span>
        )}
      </div>

      {/* Data flow arrows between registers */}
      <div className="mb-2 flex items-center justify-center gap-1 text-[9px] text-zinc-400">
        <span>a</span>
        {["→b", "→c", "→d", "→e", "→f", "→g", "→h"].map((arrow) => (
          <motion.span
            key={arrow}
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          >
            {arrow}
          </motion.span>
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-4">
        {names.map((name, i) => {
          const v = vals[i]!;
          const prevVal = prevs ? prevs[i]! : v;
          const changed = changedIndices.has(i);
          const bits = getBits(v);
          const diffs = prevs ? diffBits(prevVal, v) : null;
          const hexStr = fmt32(v);
          const prevHexStr = fmt32(prevVal);

          return (
            <motion.div
              key={`reg-${name}`}
              layout
              animate={
                changed
                  ? {
                      scale: [1, 1.04, 1],
                      boxShadow: [
                        "0 0 0 0px rgba(245,158,11,0)",
                        "0 0 20px 2px rgba(245,158,11,0.4)",
                        "0 0 0 0px rgba(245,158,11,0)",
                      ],
                    }
                  : { scale: 1 }
              }
              transition={{ duration: 0.6, ease: [0.4, 0, 0.2, 1] }}
              className={`relative overflow-hidden rounded-xl border p-3 transition-colors duration-300 ${
                changed
                  ? "border-amber-400 bg-amber-50/80"
                  : "border-zinc-200 bg-white"
              }`}
            >
              {/* Shine effect on change */}
              {changed && (
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-amber-200/0 via-amber-200/40 to-amber-200/0"
                  initial={{ x: "-100%" }}
                  animate={{ x: "200%" }}
                  transition={{ duration: 0.8, ease: "easeOut" }}
                />
              )}

              <div className="relative mb-1 flex items-center justify-between">
                <span className="text-[10px] font-bold uppercase tracking-wide text-zinc-500">{name}</span>
                {changed && (
                  <motion.span
                    initial={{ opacity: 0, x: 5 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="text-[9px] font-medium text-amber-600"
                  >
                    updated
                  </motion.span>
                )}
              </div>

              {/* Rolling hex value */}
              <div className="relative font-mono text-xs text-zinc-900">
                {binaryMode ? (
                  <motion.div
                    key={`bin-${name}-${stepIndex}`}
                    initial={{ opacity: changed ? 0 : 1, y: changed ? -4 : 0 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-[9px] leading-tight"
                  >
                    {fmtBin32(v)}
                  </motion.div>
                ) : (
                  <div className="flex">
                    <span className="text-zinc-400">0x</span>
                    {hexStr.split("").map((char, ci) => (
                      <RollingHexDigit
                        key={`${name}-${ci}`}
                        char={char}
                        changed={changed && prevHexStr[ci] !== char}
                        delay={ci * 0.02}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Animated bit strip */}
              <div className="mt-2 flex gap-px">
                {bits.map((bit, bi) => {
                  const isDiffBit = diffs && diffs[bi];
                  return (
                    <motion.div
                      key={bi}
                      animate={
                        isDiffBit
                          ? {
                              backgroundColor: ["rgb(251,191,36)", "rgb(245,158,11)", "rgb(251,191,36)"],
                              scaleY: [1, 1.8, 1],
                            }
                          : {}
                      }
                      transition={{ duration: 0.6, delay: bi * 0.01 }}
                      className={`h-1.5 flex-1 rounded-[1px] transition-colors duration-300 ${
                        isDiffBit
                          ? "bg-amber-400"
                          : bit
                            ? "bg-cyan-400"
                            : "bg-zinc-200"
                      }`}
                    />
                  );
                })}
              </div>
            </motion.div>
          );
        })}
      </div>
    </section>
  );
}
