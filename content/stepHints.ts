import type { ShaStepSnapshot } from "@/lib/sha256/types";

/**
 * Сообщение сразу после нажатия «Далее» — кратко описывает, что было сделано
 * на шаге, с которого пользователь ушёл.
 */
export function hintAfterLeavingStep(completed: ShaStepSnapshot): string {
  const bi = completed.blockIndex + 1;
  const tb = completed.totalBlocks;

  switch (completed.phase) {
    case "padding":
      return "Сейчас мы добавили единицу и нули, чтобы сообщение стало нужной длины: после байта 0x80 идут нулевые биты до длины ≡ 448 (mod 512) в битах, в конце — 64 бита длины исходного текста. Так данные готовятся к разбиению на блоки по 512 бит.";

    case "parse_block":
      return `Блок ${bi}/${tb}: 64 байта (512 бит) разбиты на 16 слов M₀…M₁₅ по 32 бита (порядок байт — big-endian).`;

    case "schedule": {
      const t = completed.scheduleIndex ?? 0;
      if (t < 16) {
        return `Для t = ${t}: W[${t}] = M[${t}] — первые 16 слов расписания совпадают с данными блока.`;
      }
      return `Для t = ${t}: W[${t}] вычислено по формуле с малыми σ — разворачиваем «хвост» расписания.`;
    }

    case "compress_start":
      return "Регистры a…h копируют текущий промежуточный хеш H перед 64 раундами сжатия.";

    case "compress_ch_sig1": {
      const r = (completed.round ?? 0) + 1;
      return `Раунд ${r}/64: вычислены Σ₁(e) и функция выбора Ch(e, f, g) — ввод для T₁.`;
    }

    case "compress_maj_sig0": {
      const r = (completed.round ?? 0) + 1;
      return `Раунд ${r}/64: вычислены Σ₀(a) и большинство Maj(a, b, c) — ввод для T₂.`;
    }

    case "compress_t1": {
      const r = (completed.round ?? 0) + 1;
      return `Раунд ${r}/64: собрали T₁ = h + Σ₁ + Ch + Kₜ + Wₜ (всё по mod 2³²).`;
    }

    case "compress_t2_update": {
      const r = (completed.round ?? 0) + 1;
      return `Раунд ${r}/64: посчитали T₂, обновили и сдвинули регистры; новый a = T₁ + T₂, новый e = d + T₁.`;
    }

    case "block_finalize":
      if (tb > 1 && bi < tb) {
        return `После блока ${bi} значение H обновлено; далее — обработка следующих 512 бит.`;
      }
      return "К каждому слову H прибавлено соответствующее рабочее слово a…h; один блок (или последний) обработан.";

    case "complete":
      return "Сформирован 256‑битный дайджест: восемь слов H в виде 32 байт (big-endian).";

    default:
      return "Шаг выполнен — используйте «Назад» / «Далее», чтобы пройти алгоритм линейно.";
  }
}
