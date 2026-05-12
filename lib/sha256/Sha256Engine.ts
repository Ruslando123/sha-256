import { H0, K } from "./constants";
import { bytesToHex, hashFull } from "./hashFull";
import { blockCount, padMessage, parseBlock } from "./preprocess";
import {
  Ch,
  Maj,
  Sigma0,
  Sigma1,
  add32,
  gamma0,
  gamma1,
} from "./primitives";
import type { ManualChallenge, ShaStepSnapshot } from "./types";

function copyU32(a: Uint32Array): Uint32Array {
  return new Uint32Array(a);
}

function chChallenge(): ManualChallenge {
  return {
    type: "pick_formula",
    promptKey: "manual.ch",
    options: [
      { id: "ch_std", label: "(e ∧ f) ⊕ (¬e ∧ g)  — choice Ch(e,f,g)" },
      { id: "wrong1", label: "(e ⊕ f) ∧ g" },
      { id: "wrong2", label: "e ⊕ f ⊕ g" },
      { id: "wrong3", label: "(e ∨ f) ⊕ (e ∨ g)" },
    ],
    correctId: "ch_std",
  };
}

function majChallenge(): ManualChallenge {
  return {
    type: "pick_formula",
    promptKey: "manual.maj",
    options: [
      { id: "maj_std", label: "(a ∧ b) ⊕ (a ∧ c) ⊕ (b ∧ c)  — majority Maj(a,b,c)" },
      { id: "wrong1", label: "(a ⊕ b) ⊕ c" },
      { id: "wrong2", label: "(a ∧ b) ∨ (a ∧ c)" },
      { id: "wrong3", label: "a ⊕ b ⊕ c" },
    ],
    correctId: "maj_std",
  };
}

function t1Challenge(): ManualChallenge {
  return {
    type: "pick_formula",
    promptKey: "manual.t1",
    options: [
      { id: "t1_std", label: "T₁ = h + Σ₁(e) + Ch(e,f,g) + Kₜ + Wₜ  (mod 2³²)" },
      { id: "wrong1", label: "T₁ = h + Σ₀(a) + Maj + Kₜ + Wₜ" },
      { id: "wrong2", label: "T₁ = e + Ch + Kₜ + Wₜ" },
      { id: "wrong3", label: "T₁ = a + b + T₂" },
    ],
    correctId: "t1_std",
  };
}

function t2UpdateChallenge(): ManualChallenge {
  return {
    type: "pick_formula",
    promptKey: "manual.t2_update",
    options: [
      { id: "ok", label: "T₂ = Σ₀(a) + Maj(a,b,c); then register shift and a ← T₁ + T₂" },
      { id: "wrong1", label: "T₂ = Σ₁(e) + Ch; a ← T₁ only" },
      { id: "wrong2", label: "Registers do not shift until end of block" },
      { id: "wrong3", label: "a ← Maj, e ← T₁" },
    ],
    correctId: "ok",
  };
}

export function buildSha256Steps(message: Uint8Array): ShaStepSnapshot[] {
  const steps: ShaStepSnapshot[] = [];
  let index = 0;
  const padded = padMessage(message);
  const totalBlocks = blockCount(padded);
  const inputLengthBytes = message.length;

  const padPreviewLen = Math.min(padded.length, 128);
  const paddedPreview = padded.slice(0, padPreviewLen);

  steps.push({
    index: index++,
    phase: "padding",
    title: "Preprocessing: padding",
    descriptionKey: "padding",
    blockIndex: 0,
    totalBlocks,
    inputLengthBytes,
    paddedLengthBytes: padded.length,
    paddedPreview,
    a: H0[0]!,
    b: H0[1]!,
    c: H0[2]!,
    d: H0[3]!,
    e: H0[4]!,
    f: H0[5]!,
    g: H0[6]!,
    h: H0[7]!,
  });

  const H = copyU32(H0);

  for (let bi = 0; bi < totalBlocks; bi++) {
    const M = parseBlock(padded, bi * 64);

    steps.push({
      index: index++,
      phase: "parse_block",
      title: `Block ${bi + 1}/${totalBlocks}: split into 16 words M₀…M₁₅`,
      descriptionKey: "parse_block",
      blockIndex: bi,
      totalBlocks,
      inputLengthBytes,
      M: copyU32(M),
      a: H[0]!,
      b: H[1]!,
      c: H[2]!,
      d: H[3]!,
      e: H[4]!,
      f: H[5]!,
      g: H[6]!,
      h: H[7]!,
      H: copyU32(H),
    });

    const W = new Uint32Array(64);
    for (let t = 0; t < 64; t++) {
      if (t < 16) {
        W[t] = M[t]!;
      } else {
        W[t] = add32(gamma1(W[t - 2]!), W[t - 7]!, gamma0(W[t - 15]!), W[t - 16]!);
      }
      const Wcopy = copyU32(W);
      steps.push({
        index: index++,
        phase: "schedule",
        title: `Message schedule: W[${t}]`,
        descriptionKey: t < 16 ? "schedule_w_low" : "schedule_w_high",
        blockIndex: bi,
        totalBlocks,
        inputLengthBytes,
        scheduleIndex: t,
        W: Wcopy,
        M: copyU32(M),
        a: H[0]!,
        b: H[1]!,
        c: H[2]!,
        d: H[3]!,
        e: H[4]!,
        f: H[5]!,
        g: H[6]!,
        h: H[7]!,
        H: copyU32(H),
      });
    }

    let a = H[0]!,
      b = H[1]!,
      c = H[2]!,
      d = H[3]!,
      e = H[4]!,
      f = H[5]!,
      g = H[6]!,
      h = H[7]!;

    steps.push({
      index: index++,
      phase: "compress_start",
      title: `Block ${bi + 1}: compression start (registers = current H)`,
      descriptionKey: "compress_start",
      blockIndex: bi,
      totalBlocks,
      inputLengthBytes,
      W: copyU32(W),
      a,
      b,
      c,
      d,
      e,
      f,
      g,
      h,
      H: copyU32(H),
    });

    for (let t = 0; t < 64; t++) {
      const aPrev = a,
        bPrev = b,
        cPrev = c,
        dPrev = d,
        ePrev = e,
        fPrev = f,
        gPrev = g,
        hPrev = h;

      const s1 = Sigma1(e);
      const ch = Ch(e, f, g);

      steps.push({
        index: index++,
        phase: "compress_ch_sig1",
        title: `Round ${t + 1}/64: Σ₁(e) and Ch(e,f,g)`,
        descriptionKey: "compress_ch_sig1",
        blockIndex: bi,
        totalBlocks,
        inputLengthBytes,
        round: t,
        compressSubLabel: "Σ₁ + Ch",
        K_t: K[t],
        W: copyU32(W),
        scheduleIndex: t,
        s1,
        Ch: ch,
        a,
        b,
        c,
        d,
        e,
        f,
        g,
        h,
        aPrev,
        bPrev,
        cPrev,
        dPrev,
        ePrev,
        fPrev,
        gPrev,
        hPrev,
        H: copyU32(H),
        manualChallenge: chChallenge(),
      });

      const s0 = Sigma0(a);
      const maj = Maj(a, b, c);

      steps.push({
        index: index++,
        phase: "compress_maj_sig0",
        title: `Round ${t + 1}/64: Σ₀(a) and Maj(a,b,c)`,
        descriptionKey: "compress_maj_sig0",
        blockIndex: bi,
        totalBlocks,
        inputLengthBytes,
        round: t,
        compressSubLabel: "Σ₀ + Maj",
        K_t: K[t],
        W: copyU32(W),
        scheduleIndex: t,
        s1,
        Ch: ch,
        s0,
        Maj: maj,
        a,
        b,
        c,
        d,
        e,
        f,
        g,
        h,
        aPrev,
        bPrev,
        cPrev,
        dPrev,
        ePrev,
        fPrev,
        gPrev,
        hPrev,
        H: copyU32(H),
        manualChallenge: majChallenge(),
      });

      const t1 = add32(h, s1, ch, K[t]!, W[t]!);

      steps.push({
        index: index++,
        phase: "compress_t1",
        title: `Round ${t + 1}/64: T₁ = h + Σ₁ + Ch + Kₜ + Wₜ`,
        descriptionKey: "compress_t1",
        blockIndex: bi,
        totalBlocks,
        inputLengthBytes,
        round: t,
        compressSubLabel: "T₁",
        K_t: K[t],
        W: copyU32(W),
        scheduleIndex: t,
        s1,
        Ch: ch,
        s0,
        Maj: maj,
        T1: t1,
        a,
        b,
        c,
        d,
        e,
        f,
        g,
        h,
        aPrev,
        bPrev,
        cPrev,
        dPrev,
        ePrev,
        fPrev,
        gPrev,
        hPrev,
        H: copyU32(H),
        manualChallenge: t1Challenge(),
      });

      const t2 = add32(s0, maj);
      const newA = add32(t1, t2);
      const newE = add32(d, t1);

      steps.push({
        index: index++,
        phase: "compress_t2_update",
        title: `Round ${t + 1}/64: T₂ and register update`,
        descriptionKey: "compress_t2_update",
        blockIndex: bi,
        totalBlocks,
        inputLengthBytes,
        round: t,
        compressSubLabel: "T₂ + update",
        K_t: K[t],
        W: copyU32(W),
        scheduleIndex: t,
        s1,
        Ch: ch,
        s0,
        Maj: maj,
        T1: t1,
        T2: t2,
        a: newA,
        b: aPrev,
        c: bPrev,
        d: cPrev,
        e: newE,
        f: ePrev,
        g: fPrev,
        h: gPrev,
        aPrev,
        bPrev,
        cPrev,
        dPrev,
        ePrev,
        fPrev,
        gPrev,
        hPrev,
        H: copyU32(H),
        manualChallenge: t2UpdateChallenge(),
      });

      h = gPrev;
      g = fPrev;
      f = ePrev;
      e = newE;
      d = cPrev;
      c = bPrev;
      b = aPrev;
      a = newA;
    }

    H[0] = add32(H[0]!, a);
    H[1] = add32(H[1]!, b);
    H[2] = add32(H[2]!, c);
    H[3] = add32(H[3]!, d);
    H[4] = add32(H[4]!, e);
    H[5] = add32(H[5]!, f);
    H[6] = add32(H[6]!, g);
    H[7] = add32(H[7]!, h);

    steps.push({
      index: index++,
      phase: "block_finalize",
      title: `Block ${bi + 1}: add to H (intermediate digest)`,
      descriptionKey: "block_finalize",
      blockIndex: bi,
      totalBlocks,
      inputLengthBytes,
      a,
      b,
      c,
      d,
      e,
      f,
      g,
      h,
      H: copyU32(H),
    });
  }

  const digest = hashFull(message);
  steps.push({
    index: index++,
    phase: "complete",
    title: "Done: SHA-256 digest",
    descriptionKey: "complete",
    blockIndex: totalBlocks - 1,
    totalBlocks,
    inputLengthBytes,
    a: H[0]!,
    b: H[1]!,
    c: H[2]!,
    d: H[3]!,
    e: H[4]!,
    f: H[5]!,
    g: H[6]!,
    h: H[7]!,
    H: copyU32(H),
    digestHex: bytesToHex(digest),
  });

  return steps;
}

export interface Sha256Stepper {
  getStepCount(): number;
  getStep(i: number): ShaStepSnapshot | undefined;
  getDigestHex(): string;
}

export function createSha256Stepper(message: Uint8Array): Sha256Stepper {
  const steps = buildSha256Steps(message);
  const digestHex = steps[steps.length - 1]?.digestHex ?? "";
  return {
    getStepCount: () => steps.length,
    getStep: (i: number) => steps[i],
    getDigestHex: () => digestHex,
  };
}
