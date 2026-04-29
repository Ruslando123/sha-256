"use client";

import Image from "next/image";
import { FormEvent, useMemo, useState } from "react";

type Message = {
  role: "bot" | "user";
  text: string;
};

const quickPrompts = [
  "Что такое SHA-256 простыми словами?",
];

export function AiTutorWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Привет! Я ИИ-помощник по SHA-256. Задай вопрос по теме, и я объясню простыми словами.",
    },
  ]);

  const canSend = useMemo(() => input.trim().length > 0, [input]);

  const send = async (question: string) => {
    const trimmed = question.trim();
    if (!trimmed) return;
    if (showQuickPrompts) {
      setShowQuickPrompts(false);
    }
    setMessages((prev) => [...prev, { role: "user", text: trimmed }]);
    setInput("");
    setOpen(true);
    setIsLoading(true);

    try {
      const res = await fetch("/api/ai-tutor", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: trimmed,
          messages,
        }),
      });

      if (!res.ok) {
        throw new Error("request_failed");
      }

      const data = (await res.json()) as { answer?: string };
      const answer =
        data.answer?.trim() ||
        "Я не получил ответ от модели. Попробуй переформулировать вопрос или повтори позже.";
      setMessages((prev) => [...prev, { role: "bot", text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Сейчас не удалось обратиться к AI API. Проверь ключ OPENAI_API_KEY и попробуй снова.",
        },
      ]);
    } finally {
      setIsLoading(false);
    }
  };

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    void send(input);
  };

  return (
    <div className="absolute right-3 top-160 z-20">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="block transition hover:scale-[1.02]"
        aria-label="Открыть ИИ помощника"
        title="ИИ помощник"
      >
        <Image
          src="/ai-assistant-v2.png"
          alt="ИИ помощник"
          width={90}
          height={150}
          className="h-[150px] w-[90px] object-contain"
          priority
        />
      </button>

      {open ? (
        <div className="absolute bottom-full right-0 mb-2 w-[420px] rounded-2xl border border-zinc-200 bg-white p-3 shadow-xl">
          <p className="text-sm font-semibold text-zinc-900">ИИ помощник по SHA-256</p>
          <div className="mt-2 max-h-64 space-y-2 overflow-y-auto rounded-lg bg-zinc-50 p-2 text-sm">
            {messages.map((m, idx) => (
              <div
                key={`${m.role}-${idx}`}
                className={`rounded-lg px-3 py-2 leading-relaxed ${
                  m.role === "user" ? "ml-8 bg-cyan-600 text-white" : "mr-8 bg-white text-zinc-700"
                }`}
              >
                {m.text}
              </div>
            ))}
          </div>

          {showQuickPrompts ? (
            <div className="mt-2 flex flex-wrap gap-1">
              {quickPrompts.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => void send(p)}
                  disabled={isLoading}
                  className="rounded-full border border-zinc-300 px-2 py-1 text-xs text-zinc-700 hover:border-cyan-300 hover:text-cyan-700"
                >
                  {p}
                </button>
              ))}
            </div>
          ) : null}

          <form onSubmit={onSubmit} className="mt-2 flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Напиши вопрос по теме..."
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!canSend || isLoading}
              className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {isLoading ? "..." : "Отправить"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
