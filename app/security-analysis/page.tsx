"use client";

import { digestBitOptions, practicalNotes, securityAnalysisCopy } from "@/content/securityAnalysis";
import Link from "next/link";
import { useMemo, useState } from "react";

function collisionProbability(bits: number, messages: number): number {
  const domain = 2 ** bits;
  const lambda = (messages * (messages - 1)) / (2 * domain);
  if (lambda > 50) return 1;
  return 1 - Math.exp(-lambda);
}

function formatProbability(value: number): string {
  if (value <= 0) return "≈ 0%";
  if (value >= 1) return "≈ 100%";
  if (value < 0.000001) return "< 0.0001%";
  return `${(value * 100).toFixed(4)}%`;
}

export default function SecurityAnalysisPage() {
  const [bits, setBits] = useState<number>(256);
  const [logMessages, setLogMessages] = useState(6);

  const messages = useMemo(() => 10 ** logMessages, [logMessages]);
  const probability = useMemo(() => collisionProbability(bits, messages), [bits, messages]);
  const birthdayThreshold = useMemo(() => 2 ** (bits / 2), [bits]);

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <nav className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <h1 className="text-lg font-semibold">{securityAnalysisCopy.title}</h1>
          <Link href="/" className="text-sm font-medium text-cyan-700 hover:underline">
            ← На главную
          </Link>
        </nav>

        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h2 className="text-sm font-semibold text-zinc-900">Collision resistance и Birthday paradox</h2>
          <p className="mt-2 text-sm text-zinc-700">{securityAnalysisCopy.birthdayIntro}</p>
          <details className="mt-3 rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-xs text-zinc-600">
            <summary className="cursor-pointer font-medium text-zinc-800">Показать формулу вероятности</summary>
            <p className="mt-2 font-mono">{securityAnalysisCopy.birthdayFormula}</p>
          </details>
        </section>

        <section className="grid gap-4 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-4 lg:col-span-2">
            <h3 className="text-sm font-semibold text-zinc-900">Интерактивная оценка коллизии</h3>
            <div className="mt-3 grid gap-3 md:grid-cols-2">
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-800">Размер дайджеста (n)</span>
                <select
                  value={bits}
                  onChange={(e) => setBits(Number(e.target.value))}
                  className="rounded-lg border border-zinc-300 px-3 py-2"
                >
                  {digestBitOptions.map((option) => (
                    <option key={option} value={option}>
                      {option} бит
                    </option>
                  ))}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                <span className="font-medium text-zinc-800">Число сообщений k = 10^x</span>
                <input
                  type="range"
                  min={1}
                  max={24}
                  value={logMessages}
                  onChange={(e) => setLogMessages(Number(e.target.value))}
                  className="accent-cyan-600"
                />
                <span className="font-mono text-xs text-zinc-600">x={logMessages}</span>
              </label>
            </div>

            <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-3">
              <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Результат</p>
              <p className="mt-1 text-sm text-zinc-700">
                Для <span className="font-mono">{messages.toExponential(2)}</span> сообщений и n={bits} бит:
              </p>
              <p className="mt-1 text-lg font-semibold text-zinc-900">{formatProbability(probability)}</p>
              <div className="mt-2 h-3 rounded bg-zinc-200">
                <div className="h-3 rounded bg-cyan-500" style={{ width: `${Math.min(100, probability * 100)}%` }} />
              </div>
            </div>
          </div>

          <aside className="rounded-xl border border-zinc-200 bg-white p-4">
            <h3 className="text-sm font-semibold text-zinc-900">Порог birthday bound</h3>
            <p className="mt-2 text-sm text-zinc-700">
              Около <span className="font-mono">2^(n/2)</span> сообщений:
            </p>
            <p className="mt-1 font-mono text-sm text-zinc-900">{birthdayThreshold.toExponential(3)}</p>
            <p className="mt-2 text-xs text-zinc-500">
              Именно поэтому “половина битов” становится практической границей для оценки коллизий.
            </p>
          </aside>
        </section>

        <section className="grid gap-4 lg:grid-cols-2">
          <article className="rounded-xl border border-rose-200 bg-rose-50/60 p-4">
            <h3 className="text-sm font-semibold text-rose-900">Length Extension Attack</h3>
            <p className="mt-2 text-sm text-rose-900">{securityAnalysisCopy.lengthExtensionIntro}</p>
            <pre className="mt-3 overflow-auto rounded-lg border border-rose-200 bg-white p-3 text-xs text-zinc-800">
{`// Уязвимый MAC-подобный подход:
tag = SHA256(secret || message)

// Злоумышленник может построить:
message' = message || gluePadding || extra
tag' = valid_without_secret`}
            </pre>
          </article>

          <article className="rounded-xl border border-emerald-200 bg-emerald-50/60 p-4">
            <h3 className="text-sm font-semibold text-emerald-900">Безопасный подход</h3>
            <p className="mt-2 text-sm text-emerald-900">{securityAnalysisCopy.lengthExtensionFix}</p>
            <pre className="mt-3 overflow-auto rounded-lg border border-emerald-200 bg-white p-3 text-xs text-zinc-800">
{`// Рекомендуется:
tag = HMAC_SHA256(secret, message)

// Альтернатива в новых системах:
tag = KMAC/SHA3-based MAC`}
            </pre>
          </article>
        </section>

        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-900">Практические рекомендации</h3>
          <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-zinc-700">
            {practicalNotes.map((note) => (
              <li key={note}>{note}</li>
            ))}
          </ul>
        </section>
      </div>
    </div>
  );
}
