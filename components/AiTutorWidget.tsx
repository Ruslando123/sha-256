"use client";

import Image from "next/image";
import { FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";

type Message = {
  role: "bot" | "user";
  text: string;
};

const quickPrompts = [
  "What is SHA-256 in simple terms?",
];

const TOOLTIP_MESSAGES = [
  "Hi! I'm your AI assistant 👋 Got questions?",
  "Confused about something? Ask me!",
  "I can explain any SHA-256 step 💡",
  "Click me to ask a question!",
  "Stuck? I'll help you figure it out 🔍",
];

function useTypedTooltip(messages: string[], intervalMs: number, enabled: boolean) {
  const [visible, setVisible] = useState(false);
  const [text, setText] = useState("");
  const [typed, setTyped] = useState("");
  const indexRef = useRef(0);

  const show = useCallback(() => {
    const msg = messages[indexRef.current % messages.length]!;
    indexRef.current++;
    setText(msg);
    setTyped("");
    setVisible(true);
  }, [messages]);

  useEffect(() => {
    if (!enabled) return;
    const t = setTimeout(show, 3000);
    return () => clearTimeout(t);
  }, [enabled, show]);

  useEffect(() => {
    if (!enabled) return;
    const id = setInterval(show, intervalMs);
    return () => clearInterval(id);
  }, [enabled, intervalMs, show]);

  useEffect(() => {
    if (!visible || !text) return;
    if (typed.length >= text.length) {
      const hideTimer = setTimeout(() => setVisible(false), 4000);
      return () => clearTimeout(hideTimer);
    }
    const id = setTimeout(() => {
      setTyped(text.slice(0, typed.length + 1));
    }, 35);
    return () => clearTimeout(id);
  }, [visible, text, typed]);

  return { visible, typed, dismiss: () => setVisible(false) };
}

export function AiTutorWidget() {
  const [open, setOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showQuickPrompts, setShowQuickPrompts] = useState(true);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "bot",
      text: "Hi! I'm an AI assistant for SHA-256. Ask any question and I'll explain it simply.",
    },
  ]);

  const tooltip = useTypedTooltip(TOOLTIP_MESSAGES, 120_000, !open);

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

      const payload = (await res.json()) as {
        answer?: string;
        error?: string;
        details?: string;
      };

      if (!res.ok) {
        const hint =
          payload.error ||
          (res.status === 500
            ? "Server not configured: in Vercel → Settings → Environment Variables, add the OPENAI_API_KEY variable for Production, then Redeploy."
            : "Could not reach the AI API right now. Please try again shortly.");
        setMessages((prev) => [
          ...prev,
          { role: "bot", text: hint },
        ]);
        return;
      }

      const answer =
        payload.answer?.trim() ||
        "No response from the model. Try rephrasing your question or try again later.";
      setMessages((prev) => [...prev, { role: "bot", text: answer }]);
    } catch {
      setMessages((prev) => [
        ...prev,
        {
          role: "bot",
          text: "Network or browser interrupted the request. Check your connection and try again. If deployed — add OPENAI_API_KEY in Vercel and Redeploy.",
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
    <div className="fixed bottom-4 right-4 z-50">
      {/* Typing tooltip bubble */}
      {tooltip.visible && !open && (
        <div
          className="absolute bottom-full right-0 mb-3 animate-[fadeInUp_0.3s_ease-out] cursor-pointer"
          onClick={() => {
            tooltip.dismiss();
            setOpen(true);
          }}
        >
          <div className="relative rounded-2xl border border-cyan-200 bg-white px-4 py-2.5 shadow-lg shadow-cyan-100/50">
            <p className="whitespace-nowrap text-sm text-zinc-700">
              {tooltip.typed}
              <span className="inline-block h-[1em] w-[2px] translate-y-[2px] animate-pulse bg-cyan-500" />
            </p>
            {/* Arrow pointing down-right */}
            <div className="absolute -bottom-[6px] right-6 h-3 w-3 rotate-45 border-b border-r border-cyan-200 bg-white" />
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => {
          tooltip.dismiss();
          setOpen((v) => !v);
        }}
        className="group relative block transition hover:scale-[1.02]"
        aria-label="Open AI assistant"
        title="AI assistant"
      >
        <Image
          src="/ai-assistant-v2.png"
          alt="AI assistant"
          width={90}
          height={150}
          className="h-[150px] w-[90px] object-contain drop-shadow-lg"
          priority
        />
      </button>

      {open ? (
        <div className="absolute bottom-full right-0 mb-2 w-[360px] animate-[fadeInUp_0.25s_ease-out] rounded-2xl border border-zinc-200 bg-white p-3 shadow-2xl sm:w-[420px]">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-zinc-900">AI Assistant — SHA-256</p>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1 text-zinc-400 transition hover:bg-zinc-100 hover:text-zinc-600"
              aria-label="Close"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
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
              placeholder="Ask a question..."
              className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm outline-none focus:border-cyan-400"
            />
            <button
              type="submit"
              disabled={!canSend || isLoading}
              className="rounded-lg bg-cyan-600 px-3 py-2 text-sm font-medium text-white disabled:cursor-not-allowed disabled:bg-zinc-300"
            >
              {isLoading ? "..." : "Send"}
            </button>
          </form>
        </div>
      ) : null}
    </div>
  );
}
