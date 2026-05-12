"use client";

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
  onResetCourse: () => void;
};

type ChoiceQ = {
  id: string;
  kind: "choice";
  prompt: string;
  options: { id: string; label: string }[];
  correctId: string;
  explain: string;
};

type FillQ = {
  id: string;
  kind: "fill";
  prompt: string;
  placeholder?: string;
  expected: string[];
  explain: string;
};

type Question = ChoiceQ | FillQ;

const QUESTIONS: Question[] = [
  {
    id: "q1",
    kind: "fill",
    prompt: "What is the ASCII code (decimal) of the letter 'b'?",
    placeholder: "number",
    expected: ["98"],
    explain: "In ASCII: a=97, b=98, c=99. Lowercase Latin letters start at 97.",
  },
  {
    id: "q2",
    kind: "fill",
    prompt: "Convert the number 255 to hexadecimal (hex).",
    placeholder: "hex without 0x",
    expected: ["ff"],
    explain: "255 = 15×16 + 15 = FF₁₆. 15 in hex = F.",
  },
  {
    id: "q3",
    kind: "choice",
    prompt: "How many bits are in one SHA-256 block?",
    options: [
      { id: "a", label: "128" },
      { id: "b", label: "256" },
      { id: "c", label: "512" },
      { id: "d", label: "1024" },
    ],
    correctId: "c",
    explain: "A block is always 512 bits = 64 bytes.",
  },
  {
    id: "q4",
    kind: "fill",
    prompt: "What byte (hex) is used as the separator in padding?",
    placeholder: "hex without 0x",
    expected: ["80"],
    explain: "Separator = 0x80 (binary: 10000000).",
  },
  {
    id: "q5",
    kind: "choice",
    prompt: "What does the Ch(e, f, g) operation do?",
    options: [
      { id: "a", label: "Adds e + f + g" },
      { id: "b", label: "If bit e=1, takes bit f; if e=0, takes bit g" },
      { id: "c", label: "Majority vote: 2 out of 3 bits" },
      { id: "d", label: "Circular shift of e by f positions" },
    ],
    correctId: "b",
    explain: "Ch = Choice: bit e selects where to take the bit from — f or g.",
  },
  {
    id: "q6",
    kind: "fill",
    prompt: "How many words (W[t]) are in the full message schedule?",
    placeholder: "number",
    expected: ["64"],
    explain: "16 original + 48 expanded = 64.",
  },
  {
    id: "q7",
    kind: "fill",
    prompt: "Compute: 0x0A XOR 0x0F = ? (answer in hex)",
    placeholder: "hex without 0x",
    expected: ["05", "5"],
    explain: "0A = 00001010, 0F = 00001111. XOR → 00000101 = 05.",
  },
  {
    id: "q8",
    kind: "choice",
    prompt: "How many compression rounds are in SHA-256?",
    options: [
      { id: "a", label: "32" },
      { id: "b", label: "48" },
      { id: "c", label: "64" },
      { id: "d", label: "80" },
    ],
    correctId: "c",
    explain: "Exactly 64 rounds per block.",
  },
  {
    id: "q9",
    kind: "fill",
    prompt: "If you change one letter in the message, approximately how many bits out of 256 will change in the hash?",
    placeholder: "number",
    expected: ["128", "~128", "about 128"],
    explain: "On average, half (about 128 out of 256) — this is the avalanche effect.",
  },
  {
    id: "q10",
    kind: "fill",
    prompt: "Compute: 0xFF + 0x01 mod 2³² = ? (answer in hex)",
    placeholder: "hex without 0x",
    expected: ["100"],
    explain: "0xFF + 0x01 = 0x100. That is less than 2³², so the result is 0x100.",
  },
];

function badge(score: number, total: number): string {
  const pct = score / total;
  if (pct >= 0.9) return "SHA-256 Master";
  if (pct >= 0.7) return "Expert";
  if (pct >= 0.5) return "Apprentice";
  return "Beginner";
}

function isFillCorrect(value: string, expected: string[]): boolean {
  const clean = value.trim().toLowerCase();
  return expected.some((e) => clean === e.toLowerCase() || clean.includes(e.toLowerCase()));
}

export function QuizLesson(props: Props) {
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [showResults, setShowResults] = useState<Record<string, boolean>>({});

  const { score, results } = useMemo(() => {
    if (!submitted) return { score: 0, results: {} as Record<string, boolean> };
    let s = 0;
    const r: Record<string, boolean> = {};
    for (const q of QUESTIONS) {
      const v = answers[q.id];
      if (!v) { r[q.id] = false; continue; }
      const correct = q.kind === "choice" ? v === q.correctId : isFillCorrect(v, q.expected);
      r[q.id] = correct;
      if (correct) s += 1;
    }
    return { score: s, results: r };
  }, [answers, submitted]);

  useEffect(() => {
    if (submitted && score >= Math.ceil(QUESTIONS.length * 0.6)) props.onComplete();
  }, [submitted, score, props]);

  const allAnswered = QUESTIONS.every((q) => (answers[q.id] ?? "").trim().length > 0);

  const setAnswer = (id: string, value: string) => {
    setAnswers((prev) => ({ ...prev, [id]: value }));
    setSubmitted(false);
  };

  const handleSubmit = () => {
    setSubmitted(true);
    const r: Record<string, boolean> = {};
    QUESTIONS.forEach((q) => { r[q.id] = true; });
    setShowResults(r);
  };

  const passingScore = Math.ceil(QUESTIONS.length * 0.6);

  return (
    <LessonShell
      index={props.index}
      total={props.total}
      title="Final quiz"
      simpleWords={`${QUESTIONS.length} questions: both multiple choice and calculations. Test that you truly understand SHA-256.`}
      whyMatters={`If you score ${passingScore}+ out of ${QUESTIONS.length} — you can head to the SHA Visualizer and work with real data.`}
      taskTitle={`Answer ${QUESTIONS.length} questions (${passingScore}+ to pass)`}
      status={submitted ? (score >= passingScore ? "ok" : "fail") : "idle"}
      successText={`Badge: ${badge(score, QUESTIONS.length)}. Score: ${score} out of ${QUESTIONS.length}.`}
      hintText={submitted && score < passingScore ? `Score: ${score} out of ${QUESTIONS.length}. You need at least ${passingScore}. Review your answers — hints are now visible.` : ""}
      completed={props.completed}
      canGoNext={props.completed}
      hasNext={props.hasNext}
      hasPrev={props.hasPrev}
      onNext={props.onNext}
      onPrev={props.onPrev}
      onReset={() => {
        setAnswers({});
        setSubmitted(false);
        setShowResults({});
        props.onResetCourse();
      }}
    >
      <ol className="flex flex-col gap-4">
        {QUESTIONS.map((q, idx) => {
          const isCorrect = submitted && showResults[q.id] && results[q.id];
          const isWrong = submitted && showResults[q.id] && !results[q.id];
          return (
            <li
              key={q.id}
              className={`rounded-xl border p-4 transition ${
                isCorrect
                  ? "border-emerald-300 bg-emerald-50"
                  : isWrong
                    ? "border-rose-300 bg-rose-50"
                    : "border-zinc-200 bg-white"
              }`}
            >
              <div className="flex items-start gap-2">
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${
                    isCorrect ? "bg-emerald-500" : isWrong ? "bg-rose-500" : "bg-zinc-400"
                  }`}
                >
                  {isCorrect ? "✓" : isWrong ? "✗" : idx + 1}
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-zinc-900">{q.prompt}</p>
                  {q.kind === "choice" ? (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {q.options.map((opt) => {
                        const isPicked = answers[q.id] === opt.id;
                        const isRight = submitted && opt.id === q.correctId;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setAnswer(q.id, opt.id)}
                            className={`rounded-lg border px-3 py-2 text-left text-sm transition ${
                              isRight && submitted
                                ? "border-emerald-500 bg-emerald-100 text-emerald-900"
                                : isPicked && isWrong
                                  ? "border-rose-400 bg-rose-100 text-rose-900"
                                  : isPicked
                                    ? "border-cyan-500 bg-cyan-50 text-cyan-900"
                                    : "border-zinc-300 bg-white text-zinc-700 hover:border-cyan-300"
                            }`}
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <input
                      value={answers[q.id] ?? ""}
                      onChange={(e) => setAnswer(q.id, e.target.value)}
                      placeholder={q.placeholder ?? "Your answer"}
                      className={`mt-2 w-full rounded-lg border px-3 py-2 font-mono text-sm outline-none ${
                        isCorrect
                          ? "border-emerald-400 bg-emerald-50 text-emerald-900"
                          : isWrong
                            ? "border-rose-400 bg-rose-50 text-rose-900"
                            : "border-zinc-300 bg-white text-zinc-900 focus:border-cyan-400"
                      }`}
                    />
                  )}
                  {submitted && showResults[q.id] && (
                    <p className={`mt-2 rounded-lg px-3 py-2 text-xs ${isCorrect ? "bg-emerald-100 text-emerald-800" : "bg-rose-100 text-rose-800"}`}>
                      {q.explain}
                    </p>
                  )}
                </div>
              </div>
            </li>
          );
        })}
      </ol>
      <div className="mt-4 flex items-center gap-3">
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!allAnswered}
          className="rounded-lg bg-cyan-600 px-5 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-700 disabled:cursor-not-allowed disabled:bg-zinc-300"
        >
          Submit quiz
        </button>
        {submitted && (
          <p className={`text-sm font-medium ${score >= passingScore ? "text-emerald-700" : "text-rose-700"}`}>
            Result: {score} / {QUESTIONS.length} — {badge(score, QUESTIONS.length)}
          </p>
        )}
      </div>
    </LessonShell>
  );
}
