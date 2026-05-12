import type { ShaStepSnapshot } from "@/lib/sha256/types";

/**
 * Message shown right after pressing "Next" — briefly describes what was done
 * on the step the user just left.
 */
export function hintAfterLeavingStep(completed: ShaStepSnapshot): string {
  const bi = completed.blockIndex + 1;
  const tb = completed.totalBlocks;

  switch (completed.phase) {
    case "padding":
      return "We just appended a 1-bit and zeros so the message reaches the required length: after the 0x80 byte, zero bits are added until the length is ≡ 448 (mod 512) in bits, followed by a 64-bit original message length. This prepares the data for splitting into 512-bit blocks.";

    case "parse_block":
      return `Block ${bi}/${tb}: 64 bytes (512 bits) split into 16 words M₀…M₁₅ of 32 bits each (big-endian byte order).`;

    case "schedule": {
      const t = completed.scheduleIndex ?? 0;
      if (t < 16) {
        return `For t = ${t}: W[${t}] = M[${t}] — the first 16 schedule words match the block data.`;
      }
      return `For t = ${t}: W[${t}] was computed using the small σ formula — expanding the schedule "tail".`;
    }

    case "compress_start":
      return "Registers a…h copy the current intermediate hash H before the 64 compression rounds.";

    case "compress_ch_sig1": {
      const r = (completed.round ?? 0) + 1;
      return `Round ${r}/64: computed Σ₁(e) and the choice function Ch(e, f, g) — input for T₁.`;
    }

    case "compress_maj_sig0": {
      const r = (completed.round ?? 0) + 1;
      return `Round ${r}/64: computed Σ₀(a) and the majority function Maj(a, b, c) — input for T₂.`;
    }

    case "compress_t1": {
      const r = (completed.round ?? 0) + 1;
      return `Round ${r}/64: assembled T₁ = h + Σ₁ + Ch + Kₜ + Wₜ (all mod 2³²).`;
    }

    case "compress_t2_update": {
      const r = (completed.round ?? 0) + 1;
      return `Round ${r}/64: computed T₂, updated and shifted registers; new a = T₁ + T₂, new e = d + T₁.`;
    }

    case "block_finalize":
      if (tb > 1 && bi < tb) {
        return `After block ${bi}, H has been updated; next — processing the following 512 bits.`;
      }
      return "Each word of H has been incremented by the corresponding working register a…h; one block (or the last one) has been processed.";

    case "complete":
      return "The 256-bit digest has been formed: eight words of H as 32 bytes (big-endian).";

    default:
      return "Step complete — use \"Back\" / \"Next\" to walk through the algorithm linearly.";
  }
}
