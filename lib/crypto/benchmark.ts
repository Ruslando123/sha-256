export type BenchmarkResult = {
  algorithm: string;
  mbps: number;
  elapsedMs: number;
};

export async function benchmarkDigest(
  algorithm: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512",
  totalBytes = 8 * 1024 * 1024,
  chunkSize = 1024 * 1024,
): Promise<BenchmarkResult> {
  if (!globalThis.crypto?.subtle) {
    throw new Error("Web Crypto API is not available in this environment.");
  }

  const chunk = new Uint8Array(chunkSize);
  const chunks = Math.max(1, Math.floor(totalBytes / chunkSize));
  const start = performance.now();
  for (let i = 0; i < chunks; i++) {
    await globalThis.crypto.subtle.digest(algorithm, chunk);
  }
  const elapsedMs = performance.now() - start;
  const processedBytes = chunks * chunkSize;
  const mbps = processedBytes / 1024 / 1024 / (elapsedMs / 1000);
  return { algorithm, mbps, elapsedMs };
}
