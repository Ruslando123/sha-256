"use client";

import { glossaryText } from "@/content/glossary";
import type { ManualChallenge } from "@/lib/sha256/types";
import { Modal } from "@/components/ui/Modal";
import { useState } from "react";

type ManualModeQuizProps = {
  enabled: boolean;
  challenge?: ManualChallenge;
  selectedId: string | null;
  onSelect: (id: string) => void;
};

export function ManualModeQuiz({
  enabled,
  challenge,
  selectedId,
  onSelect,
}: ManualModeQuizProps) {
  const [helpOpen, setHelpOpen] = useState(false);
  const help = challenge ? glossaryText(challenge.promptKey) : undefined;

  if (!enabled) {
    return (
      <section className="rounded-xl border border-dashed border-zinc-200 bg-zinc-50/50 p-4 text-xs text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900/30">
        Ручной режим выключен: шаги проходят без выбора формулы.
      </section>
    );
  }

  if (!challenge) {
    return (
      <section className="rounded-xl border border-zinc-200 bg-zinc-50/50 p-3 text-xs text-zinc-600 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-400">
        На этом шаге нет теста — «Далее» доступна сразу.
      </section>
    );
  }

  const correct = selectedId === challenge.correctId;
  const wrong = selectedId !== null && !correct;

  return (
    <section className="rounded-xl border border-amber-200 bg-amber-50/80 p-4 dark:border-amber-900 dark:bg-amber-950/30">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <h3 className="text-sm font-semibold text-amber-950 dark:text-amber-100">Ручной режим</h3>
        {help && (
          <button
            type="button"
            onClick={() => setHelpOpen(true)}
            className="text-xs font-medium text-amber-800 underline dark:text-amber-300"
          >
            Подсказка
          </button>
        )}
      </div>
      <p className="mb-3 text-xs text-amber-900 dark:text-amber-200">
        Выберите верный вариант для этого подшага. Кнопка «Далее» доступна только при правильном ответе.
      </p>
      <ul className="flex flex-col gap-2">
        {challenge.options.map((opt) => {
          const active = selectedId === opt.id;
          return (
            <li key={opt.id}>
              <button
                type="button"
                onClick={() => onSelect(opt.id)}
                className={`w-full rounded-lg border px-3 py-2 text-left text-xs sm:text-sm ${
                  active
                    ? correct
                      ? "border-green-600 bg-green-100 text-green-950 dark:border-green-500 dark:bg-green-950/50 dark:text-green-50"
                      : "border-red-500 bg-red-50 text-red-950 dark:border-red-500 dark:bg-red-950/40 dark:text-red-50"
                    : "border-zinc-200 bg-white text-zinc-800 hover:border-amber-400 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100"
                }`}
              >
                {opt.label}
              </button>
            </li>
          );
        })}
      </ul>
      {wrong && <p className="mt-2 text-xs font-medium text-red-700 dark:text-red-400">Неверно, попробуйте снова.</p>}
      {correct && <p className="mt-2 text-xs font-medium text-green-700 dark:text-green-400">Верно — можно идти дальше.</p>}
      {help && (
        <Modal open={helpOpen} title={help.title} onClose={() => setHelpOpen(false)}>
          <p>{help.body}</p>
        </Modal>
      )}
    </section>
  );
}
