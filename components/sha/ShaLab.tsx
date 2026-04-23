"use client";

import { glossaryText } from "@/content/glossary";
import { hintAfterLeavingStep } from "@/content/stepHints";
import { useSha256Steps } from "@/hooks/useSha256Steps";
import { useCallback, useMemo, useState } from "react";
import { AvalancheCompare } from "./AvalancheCompare";
import { EduTooltip } from "./EduTooltip";
import { ManualModeQuiz } from "./ManualModeQuiz";
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
  const [binaryMode, setBinaryMode] = useState(false);
  const [manualMode, setManualMode] = useState(false);
  const [manualPick, setManualPick] = useState<string | null>(null);
  const [transitionHint, setTransitionHint] = useState<string | null>(null);

  const message = useMemo(() => new TextEncoder().encode(inputText), [inputText]);
  const { step, index, count, goNext, goBack, getStep, digestHex } = useSha256Steps(message);

  const handleNext = useCallback(() => {
    if (step) {
      setTransitionHint(hintAfterLeavingStep(step));
    }
    setManualPick(null);
    goNext();
  }, [goNext, step]);

  const handleBack = useCallback(() => {
    setManualPick(null);
    setTransitionHint(null);
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

  const desc = step?.descriptionKey ? glossaryText(step.descriptionKey) : undefined;
  const challenge = step?.manualChallenge;
  const manualOk =
    !manualMode || !challenge || manualPick === challenge.correctId;
  const nextDisabled = !manualOk;

  const highlightW =
    step?.phase === "schedule"
      ? step.scheduleIndex
      : step?.phase === "compress_ch_sig1" ||
          step?.phase === "compress_maj_sig0" ||
          step?.phase === "compress_t1" ||
          step?.phase === "compress_t2_update"
        ? step.scheduleIndex
        : undefined;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-8 bg-white px-4 py-10 text-zinc-900">
      <header className="flex flex-col gap-2">
        <p className="text-xs font-medium uppercase tracking-wider text-cyan-700">SDU University · лаборатория</p>
        <h1 className="text-2xl font-bold tracking-tight text-zinc-900">Интерактивное обучение SHA-256</h1>
        <p className="max-w-3xl text-sm leading-relaxed text-zinc-600">
          Пошаговая демонстрация: padding, разбор блока, расписание W<sub>t</sub>, 64 раунда сжатия с подшагами.
          Ввод кодируется в{" "}
          <span className="font-medium text-zinc-800">UTF-8</span> (как в типичных приложениях). Константы{" "}
          <EduTooltip glossaryKey="constants_kt" label="Kₜ" /> и сдвиги{" "}
          <EduTooltip glossaryKey="rotr" label="ROTR" /> /{" "}
          <EduTooltip glossaryKey="shr" label="SHR" /> можно открыть по клику.
        </p>
      </header>

      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-zinc-50/80 p-4">
        <label className="flex flex-col gap-2 text-sm">
          <span className="font-medium text-zinc-800">Сообщение (текст → UTF-8)</span>
          <textarea
            value={inputText}
            onChange={(e) => {
              setInputText(e.target.value);
              setTransitionHint(null);
            }}
            className="min-h-[100px] rounded-lg border border-zinc-300 bg-white p-3 font-mono text-sm text-zinc-900"
          />
        </label>
        <div className="flex flex-wrap items-center gap-4 text-xs">
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={binaryMode}
              onChange={(e) => setBinaryMode(e.target.checked)}
            />
            <span>Регистры в двоичном виде</span>
          </label>
          <label className="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              checked={manualMode}
              onChange={(e) => setManualMode(e.target.checked)}
            />
            <span>Ручной режим (тест на формулы)</span>
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
            onNext={handleNext}
            onBack={handleBack}
            nextDisabled={nextDisabled}
          />

          {transitionHint && (
            <div
              className="rounded-xl border-2 border-cyan-200 bg-white p-4 shadow-sm"
              role="status"
            >
              <p className="text-xs font-semibold uppercase tracking-wide text-cyan-800">После шага</p>
              <p className="mt-2 text-sm leading-relaxed text-zinc-800">{transitionHint}</p>
            </div>
          )}

          {desc && (
            <article className="rounded-xl border border-cyan-100 bg-cyan-50/60 p-4 text-sm leading-relaxed text-cyan-950">
              <h2 className="mb-1 font-semibold">{desc.title}</h2>
              <p>{desc.body}</p>
            </article>
          )}

          {step.phase === "padding" && step.paddedPreview && (
            <div className="rounded-xl border border-zinc-200 bg-white p-4 text-xs">
              <p className="mb-2 font-medium text-zinc-800">Превью дополненного сообщения (hex)</p>
              <code className="break-all font-mono text-zinc-700">
                {bytesPreviewHex(step.paddedPreview)}
              </code>
              {step.paddedLengthBytes !== undefined && (
                <p className="mt-2 text-zinc-500">
                  Длина после padding: {step.paddedLengthBytes} байт ({step.paddedLengthBytes / 64} блок(ов) по 64
                  байта)
                </p>
              )}
            </div>
          )}

          <div className="grid gap-4 lg:grid-cols-2">
            <RegistersPanel
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
            />
            <MessageSchedulePanel W={step.W} highlightIndex={highlightW} />
          </div>

          <RoundDetailPanel
            round={step.round}
            K_t={step.K_t}
            s0={step.s0}
            s1={step.s1}
            Ch={step.Ch}
            Maj={step.Maj}
            T1={step.T1}
            T2={step.T2}
          />

          <ManualModeQuiz
            enabled={manualMode}
            challenge={challenge}
            selectedId={manualPick}
            onSelect={setManualPick}
          />

          {step.phase === "complete" && step.digestHex && (
            <div className="rounded-xl border border-green-200 bg-green-50/80 p-4">
              <p className="text-sm font-medium text-green-900">Итоговый SHA-256</p>
              <p className="mt-2 break-all font-mono text-sm text-green-950">{step.digestHex}</p>
              <p className="mt-1 text-xs text-green-800">
                Совпадает с быстрым путём hashFull: {digestHex === step.digestHex ? "да" : "нет"}
              </p>
            </div>
          )}
        </>
      )}

      <AvalancheCompare />
    </div>
  );
}
