"use client";

import { bytesToHex, hashFull } from "@/lib/sha256/hashFull";
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

function hashString(value: string): string {
  if (!value) return "";
  return bytesToHex(hashFull(new TextEncoder().encode(value)));
}

type Phase = "ascii" | "hex" | "compare";

export function IntroLesson(props: Props) {
  const [phase, setPhase] = useState<Phase>("ascii");
  const [asciiAnswer, setAsciiAnswer] = useState("");
  const [hexAnswer, setHexAnswer] = useState("");
  const [name, setName] = useState("");
  const [tweak, setTweak] = useState("");
  const [observed, setObserved] = useState(false);
  const [hint, setHint] = useState("");

  const letter = "a";
  const correctAscii = 97;
  const correctHex = "61";

  const original = useMemo(() => hashString(name), [name]);
  const altered = useMemo(() => hashString(tweak), [tweak]);

  const meaningfullyDifferent = name.length > 0 && tweak.length > 0 && name !== tweak;

  useEffect(() => {
    if (meaningfullyDifferent && original && altered && original !== altered) {
      setObserved(true);
    }
  }, [altered, meaningfullyDifferent, original]);

  const isComplete = phase === "compare" && observed;

  useEffect(() => {
    if (isComplete) props.onComplete();
  }, [isComplete, props]);

  const checkAscii = () => {
    const guess = parseInt(asciiAnswer.trim(), 10);
    if (guess === correctAscii) {
      setPhase("hex");
      setHint("");
    } else {
      setHint(
        "Не совсем. Посмотри на справочную таблицу: маленькие латинские буквы (a-z) начинаются с определённого числа. 'A' = 65, тогда 'a' = ?",
      );
    }
  };

  const checkHex = () => {
    const guess = hexAnswer.trim().toLowerCase();
    if (guess === correctHex) {
      setPhase("compare");
      setHint("");
    } else {
      setHint(
        "Подсказка: раздели число на 16. Частное — первая hex-цифра, остаток — вторая.",
      );
    }
  };

  const status = isComplete ? "ok" : hint ? "fail" : "idle";

  return (
    <LessonShell
      index={props.index}
      total={props.total}
      title="Что такое хеш"
      simpleWords="Хеш — короткий цифровой отпечаток текста. Компьютер сначала превращает буквы в числа (ASCII → hex), а потом перемешивает их в «отпечаток». Если поменять хоть одну букву, отпечаток поменяется полностью."
      whyMatters="Хеши помогают проверять целостность файлов, подписывать документы и хранить пароли. SHA-256 — один из самых популярных алгоритмов. Понимание кодировок — первый шаг."
      taskTitle={
        phase === "ascii"
          ? `Шаг 1: Узнай ASCII-код буквы "${letter}"`
          : phase === "hex"
            ? "Шаг 2: Переведи ASCII-код в шестнадцатеричную систему"
            : "Шаг 3: Сравни два хеша — измени одну букву"
      }
      status={status}
      successText="Отлично! Ты узнал, как буква становится числом, а число — частью хеша. Поменял одну букву — и отпечаток стал совсем другим."
      hintText={hint}
      completed={props.completed}
      canGoNext={props.completed}
      hasNext={props.hasNext}
      hasPrev={props.hasPrev}
      onNext={props.onNext}
      onPrev={props.onPrev}
    >
      <div className="flex flex-col gap-5">
        {/* Phase 1: ASCII */}
        <div
          className={`rounded-xl border-2 p-4 transition-all ${
            phase === "ascii"
              ? "border-dashed border-cyan-300 bg-cyan-50/50"
              : "border-emerald-200 bg-emerald-50/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                phase === "ascii" ? "bg-cyan-600" : "bg-emerald-500"
              }`}
            >
              {phase === "ascii" ? "1" : "✓"}
            </span>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-zinc-900">
                Какой <strong>десятичный</strong> код у буквы <code className="rounded bg-zinc-100 px-1.5 py-0.5 font-mono text-cyan-800">"{letter}"</code> в таблице ASCII?
              </p>
              <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
                <p className="text-xs text-zinc-500">Подсказка: маленькие латинские буквы в ASCII начинаются не с нуля. Попробуй вспомнить или найти код.</p>
                <div className="mt-2 overflow-x-auto">
                  <table className="text-[11px]">
                    <thead>
                      <tr className="text-zinc-500">
                        <th className="pr-3 text-left font-medium">Символ</th>
                        <th className="pr-3 text-left font-medium">ASCII</th>
                        <th className="text-left font-medium">Hex</th>
                      </tr>
                    </thead>
                    <tbody className="font-mono text-zinc-700">
                      <tr><td className="pr-3">'0'</td><td className="pr-3">48</td><td>30</td></tr>
                      <tr><td className="pr-3">'A'</td><td className="pr-3">65</td><td>41</td></tr>
                      <tr className="text-cyan-800 font-semibold"><td className="pr-3">'a'</td><td className="pr-3">?</td><td>?</td></tr>
                      <tr><td className="pr-3">'b'</td><td className="pr-3">?</td><td>?</td></tr>
                    </tbody>
                  </table>
                </div>
              </div>
              {phase === "ascii" ? (
                <div className="flex items-center gap-2">
                  <input
                    value={asciiAnswer}
                    onChange={(e) => setAsciiAnswer(e.target.value)}
                    inputMode="numeric"
                    placeholder="?"
                    className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
                  />
                  <button
                    type="button"
                    onClick={checkAscii}
                    disabled={!asciiAnswer.trim()}
                    className="rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-cyan-700 disabled:bg-zinc-300"
                  >
                    Проверить
                  </button>
                </div>
              ) : (
                <p className="font-mono text-sm text-emerald-700">'{letter}' = {correctAscii} (десятичный)</p>
              )}
            </div>
          </div>
        </div>

        {/* Phase 2: Hex */}
        <div
          className={`rounded-xl border-2 p-4 transition-all ${
            phase === "hex"
              ? "border-dashed border-indigo-300 bg-indigo-50/50"
              : phase === "compare"
                ? "border-emerald-200 bg-emerald-50/30"
                : "border-zinc-200 bg-zinc-50/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                phase === "hex"
                  ? "bg-indigo-600"
                  : phase === "compare"
                    ? "bg-emerald-500"
                    : "bg-zinc-300"
              }`}
            >
              {phase === "compare" ? "✓" : "2"}
            </span>
            <div className="flex flex-col gap-2">
              <p className="text-sm font-medium text-zinc-900">
                Переведи <strong>{correctAscii}</strong> в <strong>шестнадцатеричную</strong> систему (hex)
              </p>
              {phase !== "ascii" && (
                <div className="rounded-lg bg-white p-3 ring-1 ring-zinc-200">
                  <p className="text-xs text-zinc-500">
                    Формула: число ÷ 16 = частное (первая цифра hex) и остаток (вторая цифра hex).
                  </p>
                  <p className="mt-1 font-mono text-xs text-zinc-600">
                    {correctAscii} ÷ 16 = ? (остаток ?)
                  </p>
                </div>
              )}
              {phase === "hex" ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-zinc-500">0x</span>
                  <input
                    value={hexAnswer}
                    onChange={(e) => setHexAnswer(e.target.value)}
                    placeholder="??"
                    maxLength={4}
                    className="w-24 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-center font-mono text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
                  />
                  <button
                    type="button"
                    onClick={checkHex}
                    disabled={!hexAnswer.trim()}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-indigo-700 disabled:bg-zinc-300"
                  >
                    Проверить
                  </button>
                </div>
              ) : phase === "compare" ? (
                <p className="font-mono text-sm text-emerald-700">{correctAscii} = 0x{correctHex}</p>
              ) : (
                <p className="text-xs text-zinc-400">Сначала реши шаг 1</p>
              )}
            </div>
          </div>
        </div>

        {/* Phase 3: Hash comparison */}
        <div
          className={`rounded-xl border-2 p-4 transition-all ${
            phase === "compare"
              ? "border-dashed border-amber-300 bg-amber-50/50"
              : "border-zinc-200 bg-zinc-50/30"
          }`}
        >
          <div className="flex items-start gap-3">
            <span
              className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white ${
                phase === "compare"
                  ? observed
                    ? "bg-emerald-500"
                    : "bg-amber-600"
                  : "bg-zinc-300"
              }`}
            >
              {observed ? "✓" : "3"}
            </span>
            <div className="flex w-full flex-col gap-2">
              <p className="text-sm font-medium text-zinc-900">
                Теперь посмотри, что делает SHA-256 с текстом. Введи два похожих слова и сравни их хеши.
              </p>
              {phase === "compare" ? (
                <div className="grid gap-3 md:grid-cols-2">
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-zinc-800">Первое слово</span>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="например: hello"
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                    <div className="rounded-lg bg-zinc-900 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">SHA-256</p>
                      <code className="break-all font-mono text-[11px] text-emerald-300">
                        {original || "(введи слово)"}
                      </code>
                    </div>
                  </label>
                  <label className="flex flex-col gap-2 text-sm">
                    <span className="font-medium text-zinc-800">Измени одну букву</span>
                    <input
                      value={tweak}
                      onChange={(e) => setTweak(e.target.value)}
                      placeholder="например: Hello"
                      className="rounded-lg border border-zinc-300 bg-white px-3 py-2 font-mono text-sm text-zinc-900 outline-none focus:border-amber-400 focus:ring-2 focus:ring-amber-100"
                    />
                    <div className="rounded-lg bg-zinc-900 p-3">
                      <p className="text-[10px] font-semibold uppercase tracking-wide text-zinc-500">SHA-256</p>
                      <code className="break-all font-mono text-[11px] text-amber-300">
                        {altered || "(введи изменённое слово)"}
                      </code>
                    </div>
                  </label>
                </div>
              ) : (
                <p className="text-xs text-zinc-400">Сначала реши шаги 1 и 2</p>
              )}
            </div>
          </div>
        </div>

        {/* Encoding reference */}
        <details className="rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-700">
          <summary className="cursor-pointer font-medium text-zinc-800">Справка: таблица ASCII (основные символы)</summary>
          <div className="mt-2 grid grid-cols-4 gap-1 font-mono text-[11px]">
            {[
              ["0-9", "48-57", "30-39"],
              ["A-Z", "65-90", "41-5a"],
              ["a-z", "97-122", "61-7a"],
              ["пробел", "32", "20"],
            ].map(([sym, dec, hex]) => (
              <div key={sym} className="rounded bg-white p-1.5 text-center ring-1 ring-zinc-100">
                <span className="block text-zinc-500">{sym}</span>
                <span className="block text-zinc-800">{dec}</span>
                <span className="block text-indigo-600">0x{hex}</span>
              </div>
            ))}
          </div>
        </details>
      </div>
    </LessonShell>
  );
}
