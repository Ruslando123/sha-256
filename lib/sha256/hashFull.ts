import { H0, K } from "./constants";
import {
  Ch,
  Maj,
  Sigma0,
  Sigma1,
  add32,
  gamma0,
  gamma1,
  readU32BE,
  u32ToBytesBE,
} from "./primitives";
import { padMessage } from "./preprocess";

/** Full SHA-256 hash (32 bytes). Pure TypeScript, no Web Crypto. */
export function hashFull(message: Uint8Array): Uint8Array {
  const padded = padMessage(message);
  const H = new Uint32Array(H0);
  const W = new Uint32Array(64);

  for (let bi = 0; bi < padded.length / 64; bi++) {
    const off = bi * 64;
    for (let i = 0; i < 16; i++) {
      W[i] = readU32BE(padded, off + i * 4);
    }
    for (let t = 16; t < 64; t++) {
      W[t] = add32(gamma1(W[t - 2]!), W[t - 7]!, gamma0(W[t - 15]!), W[t - 16]!);
    }

    let a = H[0]!,
      b = H[1]!,
      c = H[2]!,
      d = H[3]!,
      e = H[4]!,
      f = H[5]!,
      g = H[6]!,
      h = H[7]!;

    for (let t = 0; t < 64; t++) {
      const s1 = Sigma1(e);
      const ch = Ch(e, f, g);
      const t1 = add32(h, s1, ch, K[t]!, W[t]!);
      const s0 = Sigma0(a);
      const maj = Maj(a, b, c);
      const t2 = add32(s0, maj);
      h = g;
      g = f;
      f = e;
      e = add32(d, t1);
      d = c;
      c = b;
      b = a;
      a = add32(t1, t2);
    }

    H[0] = add32(H[0]!, a);
    H[1] = add32(H[1]!, b);
    H[2] = add32(H[2]!, c);
    H[3] = add32(H[3]!, d);
    H[4] = add32(H[4]!, e);
    H[5] = add32(H[5]!, f);
    H[6] = add32(H[6]!, g);
    H[7] = add32(H[7]!, h);
  }

  const out = new Uint8Array(32);
  for (let i = 0; i < 8; i++) {
    u32ToBytesBE(H[i]!, out, i * 4);
  }
  return out;
}

export function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i]!.toString(16).padStart(2, "0");
  }
  return s;
}

const EMPTY_SHA256 =
  "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";

/** Throws if built-in vector fails (empty string). */
export function assertSha256SelfTest(): void {
  const got = bytesToHex(hashFull(new TextEncoder().encode("")));
  if (got !== EMPTY_SHA256) {
    throw new Error(`SHA-256 self-test failed: expected ${EMPTY_SHA256}, got ${got}`);
  }
}

assertSha256SelfTest();
