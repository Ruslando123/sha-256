"use client";

import { bytesToHex, hashFull } from "@/lib/sha256/hashFull";
import { useMemo, useState } from "react";

function hammingDigest(a: Uint8Array, b: Uint8Array): number {
  let bits = 0;
  for (let i = 0; i < 32; i++) {
    let x = a[i]! ^ b[i]!;
    for (let k = 0; k < 8; k++) {
      bits += x & 1;
      x >>= 1;
    }
  }
  return bits;
}

function utf8Bytes(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

export function AvalancheCompare() {
  const [left, setLeft] = useState("hello");
  const [right, setRight] = useState("hallo");

  const { hexL, hexR, hamming, pct, lenL, lenR } = useMemo(() => {
    const bL = utf8Bytes(left);
    const bR = utf8Bytes(right);
    const hL = hashFull(bL);
    const hR = hashFull(bR);
    const h = hammingDigest(hL, hR);
    return {
      hexL: bytesToHex(hL),
      hexR: bytesToHex(hR),
      hamming: h,
      pct: ((h / 256) * 100).toFixed(1),
      lenL: bL.length,
      lenR: bR.length,
    };
  }, [left, right]);

  const maxLen = Math.max(left.length, right.length);
  const diffChars: boolean[] = [];
  for (let i = 0; i < maxLen; i++) {
    diffChars.push((left[i] ?? "") !== (right[i] ?? ""));
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-4 dark:border-zinc-700 dark:bg-zinc-950">
      <h3 className="mb-2 text-sm font-semibold text-zinc-800 dark:text-zinc-100">Эффект лавины</h3>
      <p className="mb-4 text-xs text-zinc-600 dark:text-zinc-400">
        Сравните два ввода в UTF-8. Даже одна буква меняет весь 256-битный хеш; ниже — расстояние Хэмминга между
        дайджестами и подсветка отличающихся символов строки.
      </p>
      <div className="grid gap-4 md:grid-cols-2">
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Ввод A ({lenL} байт UTF-8)</span>
          <textarea
            value={left}
            onChange={(e) => setLeft(e.target.value)}
            className="min-h-[88px] rounded-lg border border-zinc-300 bg-zinc-50 p-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
        </label>
        <label className="flex flex-col gap-1 text-xs">
          <span className="font-medium text-zinc-700 dark:text-zinc-300">Ввод B ({lenR} байт UTF-8)</span>
          <textarea
            value={right}
            onChange={(e) => setRight(e.target.value)}
            className="min-h-[88px] rounded-lg border border-zinc-300 bg-zinc-50 p-2 font-mono text-sm dark:border-zinc-600 dark:bg-zinc-900"
          />
        </label>
      </div>
      <div className="mt-3 flex flex-col gap-3 text-xs">
        <div key={`ha-${hexL}`} className="edu-avalanche-hash rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900/80">
          <p className="mb-1 font-sans font-medium text-zinc-600 dark:text-zinc-400">H(A)</p>
          <p className="break-all font-mono text-zinc-900 dark:text-zinc-100">{hexL}</p>
        </div>
        <div key={`hb-${hexR}`} className="edu-avalanche-hash rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 dark:border-zinc-600 dark:bg-zinc-900/80">
          <p className="mb-1 font-sans font-medium text-zinc-600 dark:text-zinc-400">H(B)</p>
          <p className="break-all font-mono text-zinc-900 dark:text-zinc-100">{hexR}</p>
        </div>
        <span className="inline-flex w-fit rounded-full bg-cyan-100 px-3 py-1 font-medium text-cyan-950 dark:bg-cyan-900 dark:text-cyan-50">
          XOR битов дайджеста: {hamming} / 256 ({pct}%)
        </span>
      </div>
      <div className="mt-4">
        <p className="mb-1 text-xs font-medium text-zinc-600 dark:text-zinc-400">Символы ввода (позиция отличается)</p>
        <div className="flex flex-wrap gap-0.5 font-mono text-xs">
          {Array.from({ length: maxLen }, (_, i) => (
            <span
              key={`${i}-${left[i] ?? "∅"}-${right[i] ?? "∅"}`}
              className={
                diffChars[i]
                  ? "edu-avalanche-diff rounded bg-rose-200 px-0.5 text-rose-950 dark:bg-rose-900 dark:text-rose-50"
                  : "text-zinc-400"
              }
            >
              {left[i] ?? "∅"}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
