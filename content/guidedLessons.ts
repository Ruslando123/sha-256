import type { ShaPhase } from "@/lib/sha256/types";

type GuidedCheckpoint = {
  id: string;
  question: string;
  options: { id: string; label: string }[];
  correctId: string;
};

export type GuidedLesson = {
  scene: string;
  whatNow: string;
  whyItMatters: string;
  remember: string;
  checkpoint?: GuidedCheckpoint;
};

const parseCheckpoint: GuidedCheckpoint = {
  id: "parse-words",
  question: "How many 32-bit words is a single 512-bit block divided into?",
  options: [
    { id: "8", label: "8 words" },
    { id: "16", label: "16 words" },
    { id: "32", label: "32 words" },
  ],
  correctId: "16",
};

const scheduleCheckpoint: GuidedCheckpoint = {
  id: "schedule-growth",
  question: "For t >= 16, the new W[t] is built from:",
  options: [
    { id: "current", label: "Only from W[t]" },
    { id: "mix", label: "W[t-2], W[t-7], W[t-15], W[t-16]" },
    { id: "k", label: "Only from constants K[t]" },
  ],
  correctId: "mix",
};

const compressCheckpoint: GuidedCheckpoint = {
  id: "compress-main",
  question: "Which sums control the register update in a round?",
  options: [
    { id: "t1t2", label: "T1 and T2" },
    { id: "chmaj", label: "Only Ch and Maj" },
    { id: "s01", label: "Only Sigma functions" },
  ],
  correctId: "t1t2",
};

const finalizeCheckpoint: GuidedCheckpoint = {
  id: "finalize-idea",
  question: "What happens after 64 rounds for a block?",
  options: [
    { id: "discard", label: "Working registers are zeroed out" },
    { id: "add", label: "Working registers are added to H[0..7]" },
    { id: "xor", label: "All words are XORed with K[t]" },
  ],
  correctId: "add",
};

export const guidedLessonsByPhase: Record<ShaPhase, GuidedLesson> = {
  padding: {
    scene: "Scene 1: Preparation",
    whatNow: "We append a 1 bit, then zeros and the message length, to produce 512-bit blocks.",
    whyItMatters: "The algorithm strictly operates on blocks of a fixed length.",
    remember: "Padding encodes both the structure and the original data length.",
  },
  parse_block: {
    scene: "Scene 2: Block Parsing",
    whatNow: "We split the block into 16 initial words M0..M15 of 32 bits each (big-endian).",
    whyItMatters: "This is the starting basis for the expanded message schedule.",
    remember: "The byte order within a word matters for the result.",
    checkpoint: parseCheckpoint,
  },
  schedule: {
    scene: "Scene 3: Message Schedule W",
    whatNow: "We expand 16 words into 64 words W[t] using Sigma functions and addition mod 2^32.",
    whyItMatters: "Each round uses a new W[t], which thoroughly mixes the input.",
    remember: "After t=15, previous words start contributing via the formula.",
    checkpoint: scheduleCheckpoint,
  },
  compress_start: {
    scene: "Scene 4: Compression",
    whatNow: "We copy the current H into working registers a..h and prepare for 64 rounds.",
    whyItMatters: "This is the internal state where the main cryptographic work happens.",
    remember: "a..h are constantly updated and depend on all formula components.",
    checkpoint: compressCheckpoint,
  },
  compress_ch_sig1: {
    scene: "Scene 4: Compression",
    whatNow: "We compute Sigma1(e) and Ch(e,f,g): bit selection based on the current e.",
    whyItMatters: "This part creates nonlinearity and strengthens mixing.",
    remember: "Ch selects between f and g using e as a mask.",
  },
  compress_maj_sig0: {
    scene: "Scene 4: Compression",
    whatNow: "We compute Sigma0(a) and Maj(a,b,c): majority of bits from three registers.",
    whyItMatters: "Maj stabilizes and distributes the contribution of the upper state portion.",
    remember: "Maj returns the bit that appears in at least two of the three.",
  },
  compress_t1: {
    scene: "Scene 4: Compression",
    whatNow: "We assemble T1 = h + Sigma1 + Ch + K[t] + W[t] mod 2^32.",
    whyItMatters: "T1 carries the main round contribution to updating e and a.",
    remember: "T1 combines current registers, constants, and the message schedule.",
  },
  compress_t2_update: {
    scene: "Scene 4: Compression",
    whatNow: "We compute T2 = Sigma0 + Maj and update all registers a..h.",
    whyItMatters: "After the update, the state shifts and is ready for the next round.",
    remember: "New a = T1 + T2, new e = d + T1.",
  },
  block_finalize: {
    scene: "Scene 5: Updating H",
    whatNow: "We add the working registers to the accumulated H[0..7].",
    whyItMatters: "This is how the current block's contribution is committed to the final state.",
    remember: "Each block modifies the overall hash state before the next block.",
    checkpoint: finalizeCheckpoint,
  },
  complete: {
    scene: "Scene 6: Final Digest",
    whatNow: "We concatenate H0..H7 into the 256-bit final hash.",
    whyItMatters: "This is the final fingerprint of the message.",
    remember: "Even a tiny change in the input leads to a drastically different digest.",
  },
};
