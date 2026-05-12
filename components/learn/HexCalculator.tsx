"use client";

import { H0, K } from "@/lib/sha256/constants";
import { useEffect, useState, type ReactNode } from "react";

type Mode = "hex" | "dec" | "bin";
type Op = "xor" | "and" | "or" | "add" | "rotr" | "shr" | "not";

type DockPanel = "none" | "calc" | "tables";

const OP_LABELS: Record<Op, string> = {
  xor: "XOR (⊕)",
  and: "AND (∧)",
  or: "OR (∨)",
  add: "ADD mod 2³²",
  rotr: "ROTR",
  shr: "SHR",
  not: "NOT (¬)",
};

function parseNum(str: string, mode: Mode): number {
  const s = str.replace(/\s/g, "");
  if (!s) return 0;
  try {
    if (mode === "hex") return parseInt(s, 16) >>> 0;
    if (mode === "bin") return parseInt(s, 2) >>> 0;
    return parseInt(s, 10) >>> 0;
  } catch {
    return 0;
  }
}

function fmt(n: number, mode: Mode): string {
  if (mode === "hex") return n.toString(16).padStart(8, "0");
  if (mode === "bin") return n.toString(2).padStart(32, "0");
  return n.toString(10);
}

function u32hex(n: number): string {
  return `0x${(n >>> 0).toString(16).padStart(8, "0")}`;
}

function compute(a: number, b: number, op: Op): number {
  switch (op) {
    case "xor":
      return (a ^ b) >>> 0;
    case "and":
      return (a & b) >>> 0;
    case "or":
      return (a | b) >>> 0;
    case "add":
      return (a + b) >>> 0;
    case "rotr":
      return ((a >>> (b & 31)) | (a << (32 - (b & 31)))) >>> 0;
    case "shr":
      return (a >>> (b & 31)) >>> 0;
    case "not":
      return ~a >>> 0;
  }
}

const NIBBLE_ROWS = Array.from({ length: 16 }, (_, i) => ({
  dec: i,
  hex: i.toString(16).toUpperCase(),
  bin: i.toString(2).padStart(4, "0"),
}));

const ASCII_DETAIL: { ch: string; note: string; dec: number }[] = [
  { ch: "NUL", note: "Null (control)", dec: 0 },
  { ch: "HT", note: "Horizontal tab", dec: 9 },
  { ch: "LF", note: "Line feed \\n", dec: 10 },
  { ch: "CR", note: "Carriage return \\r", dec: 13 },
  { ch: "SP", note: "Space", dec: 32 },
  { ch: "!", note: "Exclamation", dec: 33 },
  { ch: '"', note: "Double quote", dec: 34 },
  { ch: "0", note: "Digit zero", dec: 48 },
  { ch: "9", note: "Digit nine", dec: 57 },
  { ch: "A", note: "Uppercase A", dec: 65 },
  { ch: "Z", note: "Uppercase Z", dec: 90 },
  { ch: "a", note: "Lowercase a", dec: 97 },
  { ch: "z", note: "Lowercase z", dec: 122 },
];

const TRUTH_BITS: { a: 0 | 1; b: 0 | 1; and: 0 | 1; or: 0 | 1; xor: 0 | 1 }[] = [
  { a: 0, b: 0, and: 0, or: 0, xor: 0 },
  { a: 0, b: 1, and: 0, or: 1, xor: 1 },
  { a: 1, b: 0, and: 0, or: 1, xor: 1 },
  { a: 1, b: 1, and: 1, or: 1, xor: 0 },
];

function Section({ title, subtitle, children }: { title: string; subtitle?: string; children: ReactNode }) {
  return (
    <section className="border-b border-zinc-200/80 pb-4 last:border-0 last:pb-0">
      <h3 className="text-sm font-bold text-indigo-900">{title}</h3>
      {subtitle && <p className="mt-1 text-xs leading-relaxed text-zinc-600">{subtitle}</p>}
      <div className="mt-2">{children}</div>
    </section>
  );
}

function ReferenceTablesPanel({
  onClose,
  onOpenCalculator,
}: {
  onClose: () => void;
  onOpenCalculator: () => void;
}) {
  return (
    <div className="flex max-h-[min(86vh,720px)] w-[min(100%,520px)] flex-col overflow-hidden rounded-2xl border border-indigo-200/70 bg-white/95 shadow-2xl shadow-indigo-200/40 backdrop-blur-xl sm:w-[520px]">
        <div className="flex shrink-0 items-center justify-between gap-2 border-b border-zinc-200 bg-gradient-to-r from-violet-600 to-indigo-600 px-4 py-3">
        <div>
          <p className="text-sm font-bold text-white">Reference tables</p>
          <p className="text-[11px] text-violet-100">Hex, ASCII, bitwise, SHA-256 formulas & constants</p>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <button
            type="button"
            onClick={onOpenCalculator}
            className="rounded-lg px-2.5 py-1.5 text-[11px] font-semibold text-white/95 transition hover:bg-white/15"
          >
            Calculator
          </button>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-white/85 transition hover:bg-white/15 hover:text-white"
            aria-label="Close tables"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-5 overflow-y-auto overscroll-contain px-4 py-4 text-zinc-800">
        <Section
          title="Hexadecimal digits (nibbles)"
          subtitle="One hexadecimal character is exactly 4 bits. Two hex characters make one byte (8 bits). In SHA-256 dumps, each pair of hex symbols is one byte; a 32-bit word is eight hex characters."
        >
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-wide text-zinc-500">
                  <th className="px-2 py-1.5 font-semibold">Dec</th>
                  <th className="px-2 py-1.5 font-semibold">Hex</th>
                  <th className="px-2 py-1.5 font-semibold">Binary (4 bits)</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {NIBBLE_ROWS.map((row) => (
                  <tr key={row.hex} className="border-b border-zinc-100 last:border-0">
                    <td className="px-2 py-1 text-zinc-600">{row.dec}</td>
                    <td className="px-2 py-1 font-bold text-indigo-700">{row.hex}</td>
                    <td className="px-2 py-1 text-zinc-700">{row.bin}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="Byte → 32-bit word (big-endian)"
          subtitle="SHA-256 parses a 512-bit block as sixteen 32-bit words M[0]…M[15]. Each word is built from four consecutive message bytes: first byte is the most significant 8 bits. Little-endian CPUs still must follow this order on the wire."
        >
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-wide text-zinc-500">
                  <th className="px-2 py-1.5 font-semibold">Example bytes (hex)</th>
                  <th className="px-2 py-1.5 font-semibold">Formula</th>
                  <th className="px-2 py-1.5 font-semibold">Word (hex)</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                <tr className="border-b border-zinc-100">
                  <td className="px-2 py-1.5">61 62 63 64</td>
                  <td className="px-2 py-1.5 text-[11px] text-zinc-600">(61·2^24)+(62·2^16)+(63·2^8)+64</td>
                  <td className="px-2 py-1.5 font-semibold text-indigo-800">0x61626364</td>
                </tr>
                <tr>
                  <td className="px-2 py-1.5">00 00 00 ff</td>
                  <td className="px-2 py-1.5 text-[11px] text-zinc-600">Only last byte set</td>
                  <td className="px-2 py-1.5 font-semibold text-indigo-800">0x000000ff</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="ASCII (single-byte, common points)"
          subtitle="English letters and digits in UTF-8 are the same as ASCII: one byte per character. Extended Unicode (e.g. Cyrillic) uses multiple bytes—then the raw SHA-256 input changes even if the screen looks similar."
        >
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-wide text-zinc-500">
                  <th className="px-2 py-1.5 font-semibold">Char / code</th>
                  <th className="px-2 py-1.5 font-semibold">Description</th>
                  <th className="px-2 py-1.5 font-semibold">Dec</th>
                  <th className="px-2 py-1.5 font-semibold">Hex</th>
                </tr>
              </thead>
              <tbody>
                {ASCII_DETAIL.map((row) => (
                  <tr key={row.dec} className="border-b border-zinc-100 font-mono last:border-0">
                    <td className="px-2 py-1 font-semibold text-zinc-800">{row.ch}</td>
                    <td className="px-2 py-1 text-[11px] text-zinc-600">{row.note}</td>
                    <td className="px-2 py-1 text-zinc-700">{row.dec}</td>
                    <td className="px-2 py-1 text-indigo-800">{row.dec.toString(16).padStart(2, "0")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-500">
            Ranges: digits &apos;0&apos;–&apos;9&apos; are 0x30–0x39; &apos;A&apos;–&apos;Z&apos; are 0x41–0x5A; &apos;a&apos;–&apos;z&apos; are 0x61–0x7A. Printable ASCII is often 0x20 through 0x7E.
          </p>
        </Section>

        <Section
          title="Bitwise operations on 32-bit words"
          subtitle="SHA-256 uses AND, OR, XOR, NOT, plus ROTR (rotate right). All intermediate values are unsigned 32-bit: addition wraps modulo 2³². The calculator applies the same operations to full words; below is the 1-bit logic that is applied bit-by-bit for AND / OR / XOR."
        >
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-wide text-zinc-500">
                  <th className="px-2 py-1.5 font-semibold">a</th>
                  <th className="px-2 py-1.5 font-semibold">b</th>
                  <th className="px-2 py-1.5 font-semibold">a ∧ b (AND)</th>
                  <th className="px-2 py-1.5 font-semibold">a ∨ b (OR)</th>
                  <th className="px-2 py-1.5 font-semibold">a ⊕ b (XOR)</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {TRUTH_BITS.map((row, i) => (
                  <tr key={i} className="border-b border-zinc-100 last:border-0">
                    <td className="px-2 py-1">{row.a}</td>
                    <td className="px-2 py-1">{row.b}</td>
                    <td className="px-2 py-1">{row.and}</td>
                    <td className="px-2 py-1">{row.or}</td>
                    <td className="px-2 py-1">{row.xor}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-[11px] leading-relaxed text-zinc-600">
            NOT (¬): flips every bit of the word. ROTR^n(x): take the 32-bit value x, move bits n positions to the right, and wrap the bits that fall off the right back into the left side. For SHA-256, n is always between 1 and 25.
          </p>
        </Section>

        <Section
          title="SHA-256 padding layout (summary)"
          subtitle="The message is a bit string of length L. Padding produces a multiple of 512 bits so the algorithm can consume fixed-size blocks."
        >
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-wide text-zinc-500">
                  <th className="px-2 py-1.5 font-semibold">Part</th>
                  <th className="px-2 py-1.5 font-semibold">What it is</th>
                </tr>
              </thead>
              <tbody className="text-[11px] leading-snug text-zinc-700">
                <tr className="border-b border-zinc-100">
                  <td className="px-2 py-1.5 font-medium">Original message</td>
                  <td className="px-2 py-1.5">L bits (any L ≥ 0)</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="px-2 py-1.5 font-medium">Bit &quot;1&quot;</td>
                  <td className="px-2 py-1.5">Single 1 bit appended after the last message bit</td>
                </tr>
                <tr className="border-b border-zinc-100">
                  <td className="px-2 py-1.5 font-medium">Zero padding</td>
                  <td className="px-2 py-1.5">Enough 0 bits so total length ≡ 448 (mod 512)</td>
                </tr>
                <tr>
                  <td className="px-2 py-1.5 font-medium">Length field</td>
                  <td className="px-2 py-1.5">64-bit big-endian integer = L (original length in bits)</td>
                </tr>
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="Message schedule W[0]…W[63]"
          subtitle="Sixteen 32-bit words from the block are expanded to sixty-four. Addition is modulo 2³² everywhere."
        >
          <ul className="list-disc space-y-1.5 pl-4 text-[11px] leading-relaxed text-zinc-700">
            <li>
              For <strong>0 ≤ t ≤ 15</strong>: <span className="font-mono">W[t] = M[t]</span> (the parsed block words).
            </li>
            <li>
              For <strong>16 ≤ t ≤ 63</strong>:{" "}
              <span className="font-mono">W[t] = σ₁(W[t−2]) + W[t−7] + σ₀(W[t−15]) + W[t−16]</span>.
            </li>
            <li className="font-mono text-[10px] text-zinc-600">
              σ₀(x) = ROTR^7(x) ⊕ ROTR^18(x) ⊕ SHR^3(x)
            </li>
            <li className="font-mono text-[10px] text-zinc-600">
              σ₁(x) = ROTR^17(x) ⊕ ROTR^19(x) ⊕ SHR^10(x)
            </li>
          </ul>
        </Section>

        <Section
          title="Compression round (64 times per block)"
          subtitle="Working registers a…h are 32-bit. Ch and Maj mix bits; Σ₀ and Σ₁ are rotations and XORs; K[t] is a round constant; W[t] is from the schedule."
        >
          <ul className="list-disc space-y-1.5 pl-4 text-[11px] leading-relaxed text-zinc-700">
            <li className="font-mono text-[10px] sm:text-[11px]">Ch(e,f,g) = (e ∧ f) ⊕ (¬e ∧ g)</li>
            <li className="font-mono text-[10px] sm:text-[11px]">Maj(a,b,c) = (a ∧ b) ⊕ (a ∧ c) ⊕ (b ∧ c)</li>
            <li className="font-mono text-[10px] sm:text-[11px]">Σ₀(a) = ROTR^2(a) ⊕ ROTR^13(a) ⊕ ROTR^22(a)</li>
            <li className="font-mono text-[10px] sm:text-[11px]">Σ₁(e) = ROTR^6(e) ⊕ ROTR^11(e) ⊕ ROTR^25(e)</li>
            <li className="font-mono text-[10px] sm:text-[11px]">T₁ = h + Σ₁(e) + Ch(e,f,g) + K[t] + W[t]</li>
            <li className="font-mono text-[10px] sm:text-[11px]">T₂ = Σ₀(a) + Maj(a,b,c)</li>
            <li>
              Update (all sums mod 2³²): new <span className="font-mono">a = T₁+T₂</span>,{" "}
              <span className="font-mono">b←a</span>, <span className="font-mono">c←b</span>, <span className="font-mono">d←c</span>,{" "}
              <span className="font-mono">e←d+T₁</span>, <span className="font-mono">f←e</span>, <span className="font-mono">g←f</span>,{" "}
              <span className="font-mono">h←g</span> (using old register values on the right-hand side).
            </li>
          </ul>
        </Section>

        <Section
          title="Initial hash values H[0]…H[7]"
          subtitle="Standard IV: first 32 bits of the fractional parts of the square roots of the first eight primes (FIPS 180-4)."
        >
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full border-collapse text-left text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[10px] uppercase tracking-wide text-zinc-500">
                  <th className="px-2 py-1.5 font-semibold">Index</th>
                  <th className="px-2 py-1.5 font-semibold">Value (hex)</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {Array.from({ length: 8 }, (_, i) => (
                  <tr key={i} className="border-b border-zinc-100 last:border-0">
                    <td className="px-2 py-1 text-zinc-600">H[{i}]</td>
                    <td className="px-2 py-1 text-indigo-800">{u32hex(H0[i]!)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>

        <Section
          title="Round constants K[0]…K[63]"
          subtitle="First 32 bits of the fractional parts of the cube roots of the first 64 primes. Each round uses one K[t]."
        >
          <div className="overflow-x-auto rounded-lg border border-zinc-200">
            <table className="w-full border-collapse text-left text-[10px] sm:text-xs">
              <thead>
                <tr className="border-b border-zinc-200 bg-zinc-50 text-[9px] uppercase tracking-wide text-zinc-500 sm:text-[10px]">
                  <th className="px-1.5 py-1 font-semibold">t</th>
                  <th className="px-1.5 py-1 font-semibold">K[t]</th>
                  <th className="px-1.5 py-1 font-semibold">t</th>
                  <th className="px-1.5 py-1 font-semibold">K[t]</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {Array.from({ length: 32 }, (_, row) => (
                  <tr key={row} className="border-b border-zinc-100 last:border-0">
                    <td className="px-1.5 py-0.5 text-zinc-500">{row}</td>
                    <td className="px-1.5 py-0.5 text-indigo-900">{u32hex(K[row]!)}</td>
                    <td className="px-1.5 py-0.5 text-zinc-500">{row + 32}</td>
                    <td className="px-1.5 py-0.5 text-indigo-900">{u32hex(K[row + 32]!)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      </div>
    </div>
  );
}

export function HexCalculator() {
  const [panel, setPanel] = useState<DockPanel>("none");
  const [modeA, setModeA] = useState<Mode>("hex");
  const [modeB, setModeB] = useState<Mode>("dec");
  const [valueA, setValueA] = useState("");
  const [valueB, setValueB] = useState("");
  const [op, setOp] = useState<Op>("xor");
  const [draft, setDraft] = useState("");

  const numA = parseNum(valueA, modeA);
  const numB = parseNum(valueB, modeB);
  const result = compute(numA, numB, op);
  const hasInput = valueA.trim().length > 0;

  const openCalc = () => setPanel("calc");
  const openTables = () => setPanel("tables");
  const closePanel = () => setPanel("none");
  const switchToCalcFromTables = () => setPanel("calc");

  useEffect(() => {
    const saved = window.localStorage.getItem("sha-calc-draft");
    if (saved) setDraft(saved);
  }, []);

  useEffect(() => {
    window.localStorage.setItem("sha-calc-draft", draft);
  }, [draft]);

  const modeBtn = (current: Mode, target: Mode, label: string, set: (m: Mode) => void) => (
    <button
      type="button"
      onClick={() => set(target)}
      className={`rounded-md px-2 py-0.5 text-[11px] font-semibold transition ${
        current === target ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
      }`}
    >
      {label}
    </button>
  );

  if (panel === "none") {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex flex-col items-end gap-2 sm:flex-row sm:items-center">
        <button
          type="button"
          onClick={openTables}
          className="flex items-center gap-2 rounded-2xl border border-violet-200 bg-white px-4 py-2.5 text-sm font-bold text-violet-800 shadow-md shadow-violet-200/50 transition hover:bg-violet-50 hover:shadow-lg"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Tables
        </button>
        <button
          type="button"
          onClick={openCalc}
          className="flex items-center gap-2 rounded-2xl bg-gradient-to-br from-indigo-600 to-cyan-500 px-5 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-300/40 transition-all hover:scale-[1.02] hover:shadow-xl hover:shadow-indigo-300/60"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
          </svg>
          Calculator
        </button>
      </div>
    );
  }

  if (panel === "tables") {
    return (
      <div className="fixed bottom-5 right-5 z-50 flex max-w-[calc(100vw-1.25rem)] justify-end">
        <ReferenceTablesPanel onClose={closePanel} onOpenCalculator={switchToCalcFromTables} />
      </div>
    );
  }

  return (
    <div className="fixed bottom-5 right-5 z-50 w-full max-w-[calc(100vw-1.25rem)] sm:w-[360px]">
      <div className="overflow-hidden rounded-2xl border border-white/40 bg-white/95 shadow-2xl shadow-indigo-200/50 backdrop-blur-xl">
        <div className="flex items-center justify-between bg-gradient-to-r from-indigo-600 to-cyan-500 px-4 py-2.5">
          <span className="text-sm font-bold text-white">Hex/Bin/Dec Calculator</span>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={openTables}
              className="rounded-lg px-2 py-1 text-[11px] font-semibold text-white/90 transition hover:bg-white/20"
            >
              Tables
            </button>
            <button
              type="button"
              onClick={closePanel}
              className="rounded-lg p-1 text-white/80 transition hover:bg-white/20 hover:text-white"
              aria-label="Close calculator"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-3 p-4">
          <div>
            <div className="mb-1 flex items-center gap-1">
              <span className="text-[11px] font-semibold text-zinc-500">A</span>
              {modeBtn(modeA, "hex", "HEX", setModeA)}
              {modeBtn(modeA, "dec", "DEC", setModeA)}
              {modeBtn(modeA, "bin", "BIN", setModeA)}
            </div>
            <input
              value={valueA}
              onChange={(e) => setValueA(e.target.value)}
              placeholder={modeA === "hex" ? "ff00abcd" : modeA === "bin" ? "10110010..." : "42"}
              className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            {hasInput && (
              <div className="mt-1.5 grid grid-cols-3 gap-1 text-[10px]">
                <span className="rounded bg-indigo-50 px-1.5 py-0.5 font-mono text-indigo-700">HEX {fmt(numA, "hex")}</span>
                <span className="rounded bg-emerald-50 px-1.5 py-0.5 font-mono text-emerald-700">DEC {fmt(numA, "dec")}</span>
                <span className="rounded bg-amber-50 px-1.5 py-0.5 font-mono text-amber-700 overflow-hidden text-ellipsis">
                  BIN {fmt(numA, "bin").slice(-16)}…
                </span>
              </div>
            )}
          </div>

          <div>
            <p className="mb-1 text-[11px] font-semibold text-zinc-500">Operation</p>
            <div className="flex flex-wrap gap-1">
              {(Object.keys(OP_LABELS) as Op[]).map((o) => (
                <button
                  key={o}
                  type="button"
                  onClick={() => setOp(o)}
                  className={`rounded-lg border px-2.5 py-1 text-[11px] font-medium transition ${
                    op === o ? "border-indigo-400 bg-indigo-50 text-indigo-800" : "border-zinc-200 bg-white text-zinc-600 hover:border-indigo-300"
                  }`}
                >
                  {OP_LABELS[o]}
                </button>
              ))}
            </div>
          </div>

          {op !== "not" && (
            <div>
              <div className="mb-1 flex items-center gap-1">
                <span className="text-[11px] font-semibold text-zinc-500">B {op === "rotr" || op === "shr" ? "(shift, bits)" : ""}</span>
                {op !== "rotr" && op !== "shr" && modeBtn(modeB, "hex", "HEX", setModeB)}
                {op !== "rotr" && op !== "shr" && modeBtn(modeB, "dec", "DEC", setModeB)}
                {op !== "rotr" && op !== "shr" && modeBtn(modeB, "bin", "BIN", setModeB)}
              </div>
              <input
                value={valueB}
                onChange={(e) => setValueB(e.target.value)}
                placeholder={op === "rotr" || op === "shr" ? "7" : "0"}
                className="w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
              />
            </div>
          )}

          <div>
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[11px] font-semibold text-zinc-500">Draft</p>
              <button
                type="button"
                onClick={() => setDraft("")}
                className="rounded px-1.5 py-0.5 text-[10px] font-medium text-zinc-500 transition hover:bg-zinc-100 hover:text-zinc-800"
              >
                Clear
              </button>
            </div>
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Write intermediate steps here (e.g. W[16] = σ1(W[14]) + W[9] + ...)"
              className="min-h-[82px] w-full resize-y rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 font-mono text-xs text-zinc-900 outline-none focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100"
            />
            <p className="mt-1 text-[10px] text-zinc-500">Saved automatically in your browser.</p>
          </div>

          {hasInput && (
            <div className="rounded-xl border-2 border-indigo-200 bg-gradient-to-br from-indigo-50 to-cyan-50 p-3">
              <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-indigo-600">Result</p>
              <div className="grid gap-1">
                <p className="font-mono text-sm font-bold text-indigo-900">HEX: {fmt(result, "hex")}</p>
                <p className="font-mono text-xs text-zinc-700">DEC: {fmt(result, "dec")}</p>
                <p className="break-all font-mono text-[10px] text-zinc-500">BIN: {fmt(result, "bin")}</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
