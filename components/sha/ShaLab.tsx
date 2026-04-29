"use client";

import { glossaryText } from "@/content/glossary";
import { useSha256Steps } from "@/hooks/useSha256Steps";
import { useCallback, useEffect, useMemo, useState } from "react";
import { MessageSchedulePanel } from "./MessageSchedulePanel";
import { RegistersPanel } from "./RegistersPanel";
import { RoundDetailPanel } from "./RoundDetailPanel";
import { StepNavigator } from "./StepNavigator";

function bytesPreviewHex(bytes: Uint8Array, max = 96): string {
  let s = "";
  const n = Math.min(bytes.length, max);
  for (let i = 0; i < n; i++) {
    s += bytes[i]!.toString(16).padStart(2, "0");
  }
  if (bytes.length > max) s += "…";
  return s;
}

export function ShaLab() {
  const [inputText, setInputText] = useState("abc");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [binaryMode, setBinaryMode] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const message = useMemo(() => new TextEncoder().encode(inputText), [inputText]);
  const { step, index, count, goNext, goBack, setIndex, getStep, digestHex } = useSha256Steps(message);

  const handleNext = useCallback(() => {
    goNext();
  }, [goNext]);

  const handleBack = useCallback(() => {
    goBack();
  }, [goBack]);

  const prev = index > 0 ? getStep(index - 1) : undefined;
  const prevRegs =
    prev && prev.phase !== "padding"
      ? {
          a: prev.a,
          b: prev.b,
          c: prev.c,
          d: prev.d,
          e: prev.e,
          f: prev.f,
          g: prev.g,
          h: prev.h,
        }
      : undefined;

  const desc = step?.descriptionKey ? glossaryText(step.descriptionKey) : null;
  const nextDisabled = false;

  const highlightW =
    step?.phase === "schedule"
      ? step.scheduleIndex
      : step?.phase === "compress_ch_sig1" ||
          step?.phase === "compress_maj_sig0" ||
          step?.phase === "compress_t1" ||
          step?.phase === "compress_t2_update"
        ? step.scheduleIndex
        : undefined;

  const registerFocus = step?.phase.startsWith("compress") ?? false;
  const scheduleFocus = step?.phase === "schedule" || step?.phase === "parse_block";
  const detailsFocus = step?.phase.startsWith("compress") || step?.phase === "block_finalize";

  useEffect(() => {
    if (!isPlaying || index >= count - 1) return;
    const ms = Math.max(180, Math.floor(900 / playbackSpeed));
    const timer = window.setTimeout(() => {
      handleNext();
    }, ms);
    return () => window.clearTimeout(timer);
  }, [count, handleNext, index, isPlaying, playbackSpeed]);

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 bg-white px-4 py-10 text-zinc-900">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">SHA-256 Visualizer</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-zinc-600">
          Чистая визуализация этапов: Padding, Parse, W[t], Compress, Finalize и итоговый Digest.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-zinc-800">Сообщение (текст → UTF-8)</span>
          <textarea
            value={inputText}
            onChange={(e) => {
              setIsPlaying(false);
              setInputText(e.target.value);
            }}
            className="min-h-[100px] rounded-lg border border-zinc-300 bg-white p-3 font-mono text-sm text-zinc-900"
          />
        </label>
        <div className="flex flex-wrap items-center gap-4 text-xs text-zinc-700">
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={binaryMode} onChange={(e) => setBinaryMode(e.target.checked)} />
            <span>Показывать регистры в бинарном виде</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input type="checkbox" checked={showDetails} onChange={(e) => setShowDetails(e.target.checked)} />
            <span>Показывать детали формул</span>
          </label>
          <span className="text-zinc-500">
            Всего шагов для текущего ввода: <span className="font-mono font-medium">{count}</span>
          </span>
        </div>
      </div>

      {step && (
        <>
          <StepNavigator
            index={index}
            count={count}
            phase={step.phase}
            title={step.title}
            isPlaying={isPlaying}
            speed={playbackSpeed}
            onNext={handleNext}
            onBack={handleBack}
            onSeek={(nextIndex) => {
              setIsPlaying(false);
              setIndex(nextIndex);
            }}
            onTogglePlay={() => setIsPlaying((v) => !v)}
            onSpeedChange={setPlaybackSpeed}
            nextDisabled={nextDisabled}
          />

          <div key={index} className="edu-step-surface flex flex-col gap-6">
            <section className="rounded-xl border border-cyan-200 bg-cyan-50/60 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">Что происходит сейчас</p>
              <p className="mt-2 text-sm text-cyan-950">{step.title}</p>
              {desc ? <p className="mt-1 text-sm text-cyan-900">{desc.body}</p> : null}
            </section>

            {step.phase === "padding" && step.paddedPreview && (
              <div className="rounded-xl border border-zinc-200 bg-white p-4 text-xs">
                <p className="mb-2 font-medium text-zinc-800">Превью дополненного сообщения (hex)</p>
                <code className="break-all font-mono text-zinc-700">{bytesPreviewHex(step.paddedPreview)}</code>
                {step.paddedLengthBytes !== undefined && (
                  <p className="mt-2 text-zinc-500">
                    Длина после padding: {step.paddedLengthBytes} байт ({step.paddedLengthBytes / 64} блок(ов) по 64
                    байта)
                  </p>
                )}
              </div>
            )}

            <div className="grid gap-4 lg:grid-cols-3">
              <div className="lg:col-span-2">
                {step.phase === "schedule" || step.phase === "parse_block" ? (
                  <MessageSchedulePanel W={step.W} highlightIndex={highlightW} guidedFocus={scheduleFocus} />
                ) : step.phase.startsWith("compress") || step.phase === "block_finalize" ? (
                  <RegistersPanel
                    stepIndex={index}
                    a={step.a}
                    b={step.b}
                    c={step.c}
                    d={step.d}
                    e={step.e}
                    f={step.f}
                    g={step.g}
                    h={step.h}
                    prev={prevRegs}
                    binaryMode={binaryMode}
                    guidedFocus={registerFocus}
                  />
                ) : (
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-600">
                    Для этой фазы основная визуализация появится на следующих шагах.
                  </div>
                )}
              </div>

              <div className="flex flex-col gap-4">
                {showDetails && (
                  <RoundDetailPanel
                    round={step.round}
                    K_t={step.K_t}
                    s0={step.s0}
                    s1={step.s1}
                    Ch={step.Ch}
                    Maj={step.Maj}
                    T1={step.T1}
                    T2={step.T2}
                    guidedFocus={detailsFocus}
                    phase={step.phase}
                  />
                )}

                <div className="rounded-xl border border-zinc-200 bg-white p-4">
                  <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Этапы</p>
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    {[
                      ["padding", "Padding"],
                      ["parse_block", "Parse"],
                      ["schedule", "W[t]"],
                      ["compress_start", "Compress"],
                      ["block_finalize", "H += state"],
                      ["complete", "Digest"],
                    ].map(([phaseName, label]) => {
                      const active = phaseName === "compress_start" ? step.phase.startsWith("compress") : step.phase === phaseName;
                      return (
                        <span
                          key={phaseName}
                          className={`rounded-full px-3 py-1 ${active ? "bg-cyan-600 text-white" : "bg-zinc-100 text-zinc-600"}`}
                        >
                          {label}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>

            {step.phase === "complete" && step.digestHex && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50/80 p-4">
                <p className="text-sm font-medium text-emerald-900">Итоговый SHA-256</p>
                <p className="mt-2 break-all font-mono text-sm text-emerald-950">{step.digestHex}</p>
                <p className="mt-1 text-xs text-emerald-800">
                  Совпадает с быстрым путём hashFull: {digestHex === step.digestHex ? "да" : "нет"}
                </p>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
