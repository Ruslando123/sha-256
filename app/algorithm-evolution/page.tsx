"use client";

import { algorithmRows, type AlgorithmRow } from "@/content/algorithmComparison";
import { benchmarkDigest, type BenchmarkResult } from "@/lib/crypto/benchmark";
import Link from "next/link";
import { useMemo, useState } from "react";

type LiveMap = Partial<Record<AlgorithmRow["id"], BenchmarkResult>>;

function statusClasses(status: AlgorithmRow["security"]): string {
  if (status === "Recommended") return "bg-emerald-100 text-emerald-800";
  if (status === "Weak") return "bg-amber-100 text-amber-800";
  return "bg-rose-100 text-rose-800";
}

export default function AlgorithmEvolutionPage() {
  const [liveResults, setLiveResults] = useState<LiveMap>({});
  const [isRunning, setIsRunning] = useState(false);
  const [activeAlgorithm, setActiveAlgorithm] = useState<AlgorithmRow["id"] | null>(null);
  const [benchmarkNote, setBenchmarkNote] = useState<string | null>(null);

  const maxRefSpeed = useMemo(() => Math.max(...algorithmRows.map((row) => row.referenceMBps)), []);

  const runLiveBenchmark = async () => {
    setIsRunning(true);
    setActiveAlgorithm(null);
    setBenchmarkNote(null);
    const nextMap: LiveMap = {};

    try {
      for (const row of algorithmRows) {
        if (!row.webCryptoName) continue;
        setActiveAlgorithm(row.id);
        const result = await benchmarkDigest(row.webCryptoName);
        nextMap[row.id] = result;
        setLiveResults((prev) => ({ ...prev, [row.id]: result }));
      }
      setLiveResults(nextMap);
      setBenchmarkNote(
        "Live benchmark измеряет скорость на текущем устройстве и зависит от браузера, CPU и режима энергосбережения.",
      );
    } catch (error) {
      setBenchmarkNote(error instanceof Error ? error.message : "Не удалось запустить benchmark.");
    } finally {
      setActiveAlgorithm(null);
      setIsRunning(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-8 text-zinc-900">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
        <nav className="flex items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-3">
          <h1 className="text-lg font-semibold">Сравнение алгоритмов: эволюция</h1>
          <Link href="/" className="text-sm font-medium text-cyan-700 hover:underline">
            ← На главную
          </Link>
        </nav>

        <section className="rounded-xl border border-zinc-200 bg-white p-4">
          <p className="text-sm text-zinc-700">
            Сравнение MD5, SHA-1, SHA-256 и SHA-3 по размеру дайджеста, ориентировочной производительности и статусу
            безопасности.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={runLiveBenchmark}
              disabled={isRunning}
              className={`benchmark-run-btn relative overflow-hidden rounded-lg bg-cyan-600 px-4 py-2 text-sm font-medium text-white transition-all duration-300 hover:bg-cyan-500 disabled:cursor-not-allowed disabled:opacity-70 ${isRunning ? "benchmark-run-btn-active" : ""}`}
            >
              {isRunning ? <span aria-hidden className="benchmark-run-wave" /> : null}
              {isRunning ? <span aria-hidden className="benchmark-run-wave benchmark-run-wave-2" /> : null}
              {isRunning ? "Running..." : "Run live benchmark"}
            </button>
            <span className="text-xs text-zinc-500">
              Live test доступен только для алгоритмов, которые поддерживает Web Crypto API.
            </span>
            {isRunning && activeAlgorithm ? (
              <span className="benchmark-active-chip rounded-full border border-cyan-200 bg-cyan-50 px-3 py-1 text-xs font-medium text-cyan-800">
                Testing {algorithmRows.find((row) => row.id === activeAlgorithm)?.name}
              </span>
            ) : null}
          </div>
          {benchmarkNote ? <p className="mt-2 text-xs text-zinc-600">{benchmarkNote}</p> : null}
        </section>

        <section className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600">
              <tr>
                <th className="px-4 py-3">Algorithm</th>
                <th className="px-4 py-3">Digest</th>
                <th className="px-4 py-3">Security</th>
                <th className="px-4 py-3">Reference speed</th>
                <th className="px-4 py-3">Live speed</th>
                <th className="px-4 py-3">Notes</th>
              </tr>
            </thead>
            <tbody>
              {algorithmRows.map((row) => {
                const live = liveResults[row.id];
                const refWidth = Math.max(8, (row.referenceMBps / maxRefSpeed) * 100);
                const isActiveRow = isRunning && activeAlgorithm === row.id;
                return (
                  <tr
                    key={row.id}
                    className={`border-b border-zinc-100 align-top transition ${isActiveRow ? "active-row-glow" : ""}`}
                  >
                    <td className="px-4 py-3 font-semibold text-zinc-900">{row.name}</td>
                    <td className="px-4 py-3 font-mono text-zinc-700">{row.digestBits} bit</td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2 py-1 text-xs font-medium ${statusClasses(row.security)}`}>
                        {row.security}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="w-[180px]">
                        <div className="h-2 rounded bg-zinc-100">
                          <div className="h-2 rounded bg-cyan-500" style={{ width: `${refWidth}%` }} />
                        </div>
                        <p className="mt-1 font-mono text-xs text-zinc-600">{row.referenceMBps} MB/s (reference)</p>
                      </div>
                    </td>
                    <td className="px-4 py-3 font-mono text-xs text-zinc-700">
                      {live ? (
                        `${live.mbps.toFixed(1)} MB/s`
                      ) : row.webCryptoName ? (
                        isActiveRow ? (
                          <span className="measuring-text">
                            <span aria-hidden className="pulse-circle" />
                            <span className="benchmark-dots">Measuring</span>
                          </span>
                        ) : (
                          "Not run yet"
                        )
                      ) : (
                        "N/A"
                      )}
                    </td>
                    <td className="px-4 py-3 text-xs text-zinc-600">{row.note}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </section>
      </div>
    </div>
  );
}
