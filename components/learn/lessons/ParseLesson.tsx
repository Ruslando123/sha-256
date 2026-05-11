"use client";

import { padMessage, parseBlock } from "@/lib/sha256/preprocess";
import { useEffect, useMemo, useState } from "react";
import { LessonShell } from "../LessonShell";

type Props = {
  index: number;
  total: number;
  completed: boolean;
  hasNext: boolean;
  hasPrev: boolean;
  onComplete: () => void;
  onNext: () => void;
  onPrev: () => void;
};

const SAMPLE = "abc";

function toHex(byte: number): string {
  return byte.toString(16).padStart(2, "0");
}

function toHex32(n: number): string {
  return n.toString(16).padStart(8, "0");
}

const COMPUTE_INDICES = [0, 1, 15];

export function ParseLesson(props: Props) {
  const { padded, words } = useMemo(() => {
    const p = padMessage(new TextEncoder().encode(SAMPLE));
    const M = parseBlock(p, 0);
    return { padded: p, words: Array.from(M) };
  }, []);

  const [currentIdx, setCurrentIdx] = useState(0);
  const [answer, setAnswer] = useState("");
  const [solved, setSolved] = useState<Set<number>>(new Set());
  const [status, setStatus] = useState<"idle" | "ok" | "fail">("idle");
  const [hint, setHint] = useState("");

  const targetWordIdx = COMPUTE_INDICES[currentIdx];
  const allDone = currentIdx >= COMPUTE_INDICES.length;

  useEffect(() => {
    if (allDone) props.onComplete();
  }, [allDone, props]);

  const checkAnswer = () => {
    if (targetWordIdx === undefined) return;
    const expected = toHex32(words[targetWordIdx]!);
    const guess = answer.trim().toLowerCase().replace(/^0x/, "");
    if (guess === expected) {
      setSolved((prev) => new Set(prev).add(targetWordIdx));
      setCurrentIdx((c) => c + 1);
      setAnswer("");
      setStatus("ok");
      setHint("");
    } else {
      setStatus("fail");
      setHint(
        `Подсказка: возьми байты с ${targetWordIdx * 4} по ${targetWordIdx * 4 + 3} из дополненного блока и соедини их слева направо.`,
      );
    }
  };

  const reset = () => {
    setCurrentIdx(0);
    setAnswer("");
    setSolved(new Set());
    setStatus("idle");
    setHint("");
  };

  return (
    <LessonShell
      index={props.index}
      total={props.total}
      title="Разбор блока на 16 слов"
      simpleWords="Один блок (64 байта) разбивается на 16 кусочков по 4 байта. Каждый кусочек называется словом — W[0], W[1], ..., W[15]. Ты склеиваешь 4 байта в одно 32-битное число."
      whyMatters="С 32-битными словами удобно работать процессору. Из 16 слов потом получится 64 — расширенный список для перемешивания."
      taskTitle={allDone ? "Все слова вычислены!" : `Вычисли W[${targetWordIdx}] из 4-х байтов`}
      status={allDone ? "ok" : status === "fail" ? "fail" : status === "ok" ? "ok" : "idle"}
      successText="Идеально! Ты разобрался, как 64 байта превращаются в 16 слов. Эти слова отправляются в расписание сообщения."
      hintText={hint}
      completed={props.completed}
      canGoNext={props.completed}
      hasNext={props.hasNext}
      hasPrev={props.hasPrev}
      onNext={props.onNext}
      onPrev={props.onPrev}
      onReset={reset}
    >
      <div className="flex flex-col gap-5">
        {/* Raw bytes visualization */}
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Блок (64 байта) — разбит на группы по 4</p>
          <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white p-3">
            <div className="grid grid-cols-4 gap-y-1 gap-x-3 font-mono text-[11px]">
              {Array.from({ length: 16 }).map((_, wi) => {
                const offset = wi * 4;
                const bytes = [padded[offset]!, padded[offset + 1]!, padded[offset + 2]!, padded[offset + 3]!];
                const isSolved = solved.has(wi);
                const isCurrent = !allDone && wi === targetWordIdx;
                return (
                  <div
                    key={wi}
                    className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 transition-all ${
                      isCurrent
                        ? "bg-cyan-50 ring-2 ring-cyan-400"
                        : isSolved
                          ? "bg-emerald-50"
                          : "bg-zinc-50"
                    }`}
                  >
                    <span className={`w-8 text-[10px] font-semibold ${isCurrent ? "text-cyan-700" : isSolved ? "text-emerald-600" : "text-zinc-400"}`}>
                      W[{wi}]
                    </span>
                    <span className="flex gap-0.5">
                      {bytes.map((b, bi) => {
                        const shouldHide = isCurrent || (COMPUTE_INDICES.includes(wi) && !isSolved);
                        return (
                          <span
                            key={bi}
                            className={`rounded px-1 py-0.5 ${
                              isCurrent
                                ? "bg-cyan-100 text-cyan-900 font-semibold"
                                : isSolved
                                  ? "bg-emerald-100 text-emerald-800"
                                  : "bg-zinc-100 text-zinc-500"
                            }`}
                          >
                            {shouldHide ? "??" : toHex(b)}
                          </span>
                        );
                      })}
                    </span>
                    {isSolved && (
                      <span className="text-[10px] text-emerald-600">= {toHex32(words[wi]!)}</span>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Current task */}
        {!allDone && targetWordIdx !== undefined && (
          <div className="rounded-xl border-2 border-dashed border-cyan-300 bg-cyan-50/50 p-4">
            <div className="flex items-start gap-3">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-cyan-600 text-sm font-bold text-white">
                {currentIdx + 1}
              </span>
              <div className="flex flex-col gap-3">
                <p className="text-sm font-medium text-zinc-900">
                  Склей 4 байта в одно 32-битное слово <strong>W[{targetWordIdx}]</strong>
                </p>
                <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
                  <p className="text-xs text-zinc-600">Найди 4 байта в таблице выше и склей в одно число (big-endian):</p>
                  <div className="mt-2 flex items-center gap-2">
                    {Array.from({ length: 4 }).map((_, bi) => (
                      <div key={bi} className="flex flex-col items-center gap-1">
                        <span className="text-[10px] text-zinc-400">байт {targetWordIdx * 4 + bi}</span>
                        <span className="rounded-lg bg-zinc-100 px-3 py-2 font-mono text-sm font-bold text-zinc-400">
                          ??
                        </span>
                      </div>
                    ))}
                    <span className="text-lg text-zinc-400">=</span>
                    <div className="flex flex-col items-center gap-1">
                      <span className="text-[10px] text-zinc-400">W[{targetWordIdx}]</span>
                      <span className="rounded-lg border-2 border-dashed border-cyan-300 bg-white px-3 py-2 font-mono text-sm text-zinc-400">
                        ????????
                      </span>
                    </div>
                  </div>
                  <p className="mt-2 text-[11px] text-zinc-500">
                    Формула: W[i] = байт[i×4] || байт[i×4+1] || байт[i×4+2] || байт[i×4+3]
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">0x</span>
                  <input
                    value={answer}
                    onChange={(e) => setAnswer(e.target.value)}
                    placeholder="????????"
                    maxLength={10}
                    className="w-36 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                  <button
                    type="button"
                    onClick={checkAnswer}
                    disabled={!answer.trim()}
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:bg-zinc-300"
                  >
                    Проверить
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="flex items-center gap-3">
          <div className="flex gap-1">
            {COMPUTE_INDICES.map((wi, i) => (
              <span
                key={wi}
                className={`rounded-full px-2 py-0.5 text-[11px] font-medium ${
                  solved.has(wi)
                    ? "bg-emerald-100 text-emerald-700"
                    : i === currentIdx
                      ? "bg-cyan-100 text-cyan-700"
                      : "bg-zinc-100 text-zinc-400"
                }`}
              >
                W[{wi}] {solved.has(wi) ? "✓" : ""}
              </span>
            ))}
          </div>
          <span className="text-xs text-zinc-500">
            {solved.size} из {COMPUTE_INDICES.length} вычислено
          </span>
        </div>

        {/* Solved words table */}
        {allDone && (
          <div className="rounded-xl border-2 border-emerald-300 bg-emerald-50 p-4">
            <p className="mb-2 text-sm font-semibold text-emerald-800">Все 16 слов блока:</p>
            <div className="grid grid-cols-2 gap-1 font-mono text-[11px] sm:grid-cols-4">
              {words.map((w, i) => (
                <div key={i} className="rounded bg-white px-2 py-1 ring-1 ring-emerald-200">
                  <span className="text-emerald-600">W[{i}]</span>{" "}
                  <span className="text-zinc-800">{toHex32(w)}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Reference */}
        <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
          <summary className="cursor-pointer font-medium text-zinc-800">Как работает big-endian</summary>
          <div className="mt-2 space-y-1 text-[11px]">
            <p>Big-endian = старший байт первый.</p>
            <p className="font-mono">Пример: байты AA BB CC DD → слово 0xAABBCCDD</p>
            <p>Каждый байт занимает 8 бит (2 hex-цифры), а слово — 32 бита (8 hex-цифр).</p>
            <p>Формула: W[i] = byte[i×4] &lt;&lt; 24 | byte[i×4+1] &lt;&lt; 16 | byte[i×4+2] &lt;&lt; 8 | byte[i×4+3]</p>
          </div>
        </details>
      </div>
    </LessonShell>
  );
}
