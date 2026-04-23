import { readU32BE } from "./primitives";

/**
 * SHA-256 padding: append 0x80, zeros until length ≡ 448 (mod 512) in bits,
 * then append 64-bit big-endian bit length of the original message.
 */
export function padMessage(message: Uint8Array): Uint8Array {
  const ml = message.length;
  const bitLen = BigInt(ml) * BigInt(8);
  const bitsAfterOneByte = BigInt(ml) * BigInt(8) + BigInt(8);
  const k =
    ((BigInt(448) - bitsAfterOneByte) % BigInt(512) + BigInt(512)) % BigInt(512);
  const padZeroBytes = Number(k / BigInt(8));
  const outLen = ml + 1 + padZeroBytes + 8;
  const out = new Uint8Array(outLen);
  out.set(message);
  out[ml] = 0x80;
  for (let i = 0; i < 8; i++) {
    const shift = BigInt(56 - i * 8);
    out[outLen - 8 + i] = Number((bitLen >> shift) & BigInt(255));
  }
  return out;
}

/** Number of 512-bit (64-byte) blocks after padding. */
export function blockCount(padded: Uint8Array): number {
  return padded.length / 64;
}

/** Parse one 64-byte block into 16 big-endian 32-bit words M[0..15]. */
export function parseBlock(block: Uint8Array, offset: number): Uint32Array {
  const M = new Uint32Array(16);
  for (let i = 0; i < 16; i++) {
    M[i] = readU32BE(block, offset + i * 4);
  }
  return M;
}
