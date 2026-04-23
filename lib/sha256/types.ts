export type ShaPhase =
  | "padding"
  | "parse_block"
  | "schedule"
  | "compress_start"
  | "compress_ch_sig1"
  | "compress_maj_sig0"
  | "compress_t1"
  | "compress_t2_update"
  | "block_finalize"
  | "complete";

export type ManualChallengeType = "pick_formula";

export interface ManualChallenge {
  type: ManualChallengeType;
  promptKey: string;
  options: { id: string; label: string }[];
  correctId: string;
}

export interface ShaStepSnapshot {
  index: number;
  phase: ShaPhase;
  title: string;
  descriptionKey?: string;
  blockIndex: number;
  totalBlocks: number;
  /** UTF-8 note: input is raw bytes; UI may show TextEncoder output */
  inputLengthBytes: number;
  /** After padding step */
  paddedLengthBytes?: number;
  paddedPreview?: Uint8Array;
  /** Parsed 16 words for current block */
  M?: Uint32Array;
  /** Message schedule after current schedule step (length 64 when in schedule/compress) */
  W?: Uint32Array;
  scheduleIndex?: number;
  round?: number;
  /** Compression sub-step label for UI */
  compressSubLabel?: string;
  K_t?: number;
  a: number;
  b: number;
  c: number;
  d: number;
  e: number;
  f: number;
  g: number;
  h: number;
  /** Registers before this sub-step (for diff highlight) */
  aPrev?: number;
  bPrev?: number;
  cPrev?: number;
  dPrev?: number;
  ePrev?: number;
  fPrev?: number;
  gPrev?: number;
  hPrev?: number;
  Ch?: number;
  Maj?: number;
  s0?: number;
  s1?: number;
  T1?: number;
  T2?: number;
  /** Running hash H[0..7] after block finalize */
  H?: Uint32Array;
  digestHex?: string;
  manualChallenge?: ManualChallenge;
}
