/** 32-bit rotate right */
export function rotr(n: number, x: number): number {
  return ((x >>> n) | (x << (32 - n))) >>> 0;
}

/** 32-bit logical shift right */
export function shr(n: number, x: number): number {
  return x >>> n;
}

/** Choice: (e ∧ f) ⊕ (¬e ∧ g) */
export function Ch(e: number, f: number, g: number): number {
  return ((e & f) ^ (~e & g)) >>> 0;
}

/** Majority: (a ∧ b) ⊕ (a ∧ c) ⊕ (b ∧ c) */
export function Maj(a: number, b: number, c: number): number {
  return ((a & b) ^ (a & c) ^ (b & c)) >>> 0;
}

/** Σ₀ — used on a in compression */
export function Sigma0(a: number): number {
  return (rotr(2, a) ^ rotr(13, a) ^ rotr(22, a)) >>> 0;
}

/** Σ₁ — used on e in compression */
export function Sigma1(e: number): number {
  return (rotr(6, e) ^ rotr(11, e) ^ rotr(25, e)) >>> 0;
}

/** σ₀ — message schedule on W[t-15] */
export function gamma0(x: number): number {
  return (rotr(7, x) ^ rotr(18, x) ^ shr(3, x)) >>> 0;
}

/** σ₁ — message schedule on W[t-2] */
export function gamma1(x: number): number {
  return (rotr(17, x) ^ rotr(19, x) ^ shr(10, x)) >>> 0;
}

/** Addition mod 2³² (any number of terms). */
export function add32(...terms: number[]): number {
  let sum = 0;
  for (const t of terms) {
    sum = (sum + (t >>> 0)) >>> 0;
  }
  return sum >>> 0;
}

export function readU32BE(bytes: Uint8Array, offset: number): number {
  return (
    ((bytes[offset]! << 24) |
      (bytes[offset + 1]! << 16) |
      (bytes[offset + 2]! << 8) |
      bytes[offset + 3]!) >>>
    0
  );
}

export function u32ToBytesBE(w: number, out: Uint8Array, offset: number): void {
  out[offset] = (w >>> 24) & 0xff;
  out[offset + 1] = (w >>> 16) & 0xff;
  out[offset + 2] = (w >>> 8) & 0xff;
  out[offset + 3] = w & 0xff;
}
