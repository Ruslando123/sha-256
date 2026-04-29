import { bytesToHex, hashFull } from "./hashFull";

function utf8(input: string): Uint8Array {
  return new TextEncoder().encode(input);
}

export function hashWithNonce(data: string, nonce: number): string {
  const payload = `${data}${nonce}`;
  return bytesToHex(hashFull(utf8(payload)));
}

export function meetsDifficulty(hashHex: string, difficulty: number): boolean {
  return hashHex.startsWith("0".repeat(Math.max(0, difficulty)));
}

export function estimateHashRate(attempts: number, elapsedMs: number): number {
  if (elapsedMs <= 0) return 0;
  return (attempts / elapsedMs) * 1000;
}
