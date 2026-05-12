/** Short explanations for tooltips and modals. */
export const glossary: Record<string, { title: string; body: string }> = {
  mod32: {
    title: "Modular Arithmetic mod 2³²",
    body: "All additions in SHA-256 are integer additions modulo 2³²: the result is always 32 bits, as if the higher bits are discarded. In code, this is the '+' operation on uint32.",
  },
  rotr: {
    title: "Circular Right Shift (ROTR)",
    body: "ROTRⁿ(x) shifts a 32-bit word x by n positions to the right, with bits from the right edge wrapping around to the left. Unlike the logical shift >>>, it does not introduce zeros on the left.",
  },
  shr: {
    title: "Logical Right Shift (SHR)",
    body: "SHRⁿ(x) shifts right and fills with zeros on the left (like >>> in JavaScript for uint32). Used in the small σ functions for the message schedule.",
  },
  constants_kt: {
    title: "Constants Kₜ",
    body: "64 constants — the first 32 bits of the fractional parts of cube roots of the first 64 prime numbers. They 'mix' the bits in each round together with Wₜ.",
  },
  padding: {
    title: "Message Padding",
    body: "A 0x80 byte (a '1' bit followed by zeros to the byte boundary) is appended to the message, then zeros are added until the bit length is ≡ 448 (mod 512), and finally a 64-bit big-endian original message length in bits is appended.",
  },
  parse_block: {
    title: "Block Parsing",
    body: "The 512 bits (64 bytes) of a block are split into 16 words of 32 bits each, where each word is big-endian from 4 bytes: M₀…M₁₅.",
  },
  schedule_w_low: {
    title: "Schedule: W[t] for t < 16",
    body: "The first 16 schedule words match the message block: Wₜ = Mₜ.",
  },
  schedule_w_high: {
    title: "Schedule: W[t] for t ≥ 16",
    body: "Wₜ = σ₁(Wₜ₋₂) + Wₜ₋₇ + σ₀(Wₜ₋₁₅) + Wₜ₋₁₆ (all additions mod 2³²). The small σ functions use ROTR and SHR.",
  },
  compress_start: {
    title: "Round Initialization",
    body: "Registers a…h copy the current intermediate hash value H (before processing this block). Then 64 rounds follow using the same message schedule W.",
  },
  compress_ch_sig1: {
    title: "Σ₁(e) and the Choice Function Ch",
    body: "Σ₁(e) = ROTR⁶(e) ⊕ ROTR¹¹(e) ⊕ ROTR²⁵(e). Ch(e,f,g) = (e∧f)⊕(¬e∧g) — if e=1 then f is selected, otherwise g.",
  },
  compress_maj_sig0: {
    title: "Σ₀(a) and the Majority Function Maj",
    body: "Σ₀(a) = ROTR²(a) ⊕ ROTR¹³(a) ⊕ ROTR²²(a). Maj(a,b,c) = (a∧b)⊕(a∧c)⊕(b∧c) — the bit at each position equals the majority among the three bits.",
  },
  compress_t1: {
    title: "Temporary Value T₁",
    body: "T₁ = h + Σ₁(e) + Ch(e,f,g) + Kₜ + Wₜ (mod 2³²). Collects the contribution of the 'right' part of the state and the message.",
  },
  compress_t2_update: {
    title: "T₂ and Register Update",
    body: "T₂ = Σ₀(a) + Maj(a,b,c). New a = T₁+T₂, new e = d+T₁, the remaining registers shift: b←a, c←b, …, h←g.",
  },
  block_finalize: {
    title: "Block Finalization",
    body: "After 64 rounds, the corresponding register value is added (mod 2³²) to each word Hᵢ. If there is a next block, the process repeats for it.",
  },
  complete: {
    title: "Final Digest",
    body: "H₀…H₇ are written as 32 bytes in big-endian — this is the 256-bit SHA-256 hash.",
  },
  "manual.ch": {
    title: "Exercise: Ch Formula",
    body: "Select the correct definition of Ch(e,f,g) for the current step.",
  },
  "manual.maj": {
    title: "Exercise: Maj Formula",
    body: "Select the correct definition of Maj(a,b,c).",
  },
  "manual.t1": {
    title: "Exercise: T₁",
    body: "Which values are summed in T₁ in SHA-256?",
  },
  "manual.t2_update": {
    title: "Exercise: T₂ and Update",
    body: "Confirm the rule for T₂ and the register shift.",
  },
};

export function glossaryText(key: string): { title: string; body: string } | undefined {
  return glossary[key];
}
