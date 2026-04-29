type ChatMessage = {
  role: "user" | "bot";
  text: string;
};

type TutorRequest = {
  question?: string;
  messages?: ChatMessage[];
};

function extractAnswerText(data: unknown): string | null {
  if (!data || typeof data !== "object") return null;
  const root = data as Record<string, unknown>;

  if (typeof root.output_text === "string" && root.output_text.trim()) {
    return root.output_text.trim();
  }

  const output = root.output;
  if (!Array.isArray(output)) return null;

  const parts: string[] = [];
  for (const item of output) {
    if (!item || typeof item !== "object") continue;
    const content = (item as Record<string, unknown>).content;
    if (!Array.isArray(content)) continue;

    for (const chunk of content) {
      if (!chunk || typeof chunk !== "object") continue;
      const c = chunk as Record<string, unknown>;
      if (typeof c.text === "string" && c.text.trim()) {
        parts.push(c.text.trim());
      }
    }
  }

  const combined = parts.join("\n").trim();
  return combined || null;
}

export async function POST(req: Request) {
  const apiKey = process.env.OPENAI_API_KEY;
  const model = process.env.OPENAI_MODEL ?? "gpt-4.1-mini";

  if (!apiKey) {
    return Response.json({ error: "OPENAI_API_KEY is not configured" }, { status: 500 });
  }

  const body = (await req.json()) as TutorRequest;
  const question = body.question?.trim();

  if (!question) {
    return Response.json({ error: "Question is required" }, { status: 400 });
  }

  const safeMessages = (body.messages ?? []).slice(-8);
  const historyText = safeMessages
    .map((m) => `${m.role === "user" ? "User" : "Assistant"}: ${m.text}`)
    .join("\n");

  const prompt = [
    "You are an AI tutor for SHA-256 education website.",
    "Explain clearly in Russian, concise and beginner-friendly.",
    "Focus on SHA-256 internals, Proof of Work, collisions, padding, and practical security advice.",
    "If user is off-topic, gently redirect to cryptography learning.",
    historyText ? `Conversation history:\n${historyText}` : "",
    `User question: ${question}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const upstream = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model,
      input: prompt,
      temperature: 0.4,
    }),
  });

  if (!upstream.ok) {
    const errText = await upstream.text();
    let userMessage = "OpenAI API вернул ошибку. Проверь OPENAI_API_KEY и OPENAI_MODEL";
    try {
      const j = JSON.parse(errText) as { error?: { message?: string; code?: string } };
      const msg = j.error?.message ?? "";
      if (upstream.status === 401 || /invalid.*api|incorrect.*key/i.test(msg)) {
        userMessage =
          "Ключ API отклонён: проверь, что в Vercel (Production) задана переменная OPENAI_API_KEY и сделан Redeploy.";
      } else if (upstream.status === 404 || /model/i.test(msg)) {
        userMessage = `Проверь OPENAI_MODEL (сейчас: ${model}) — у аккаунта OpenAI должен быть доступ к этой модели.`;
      } else if (msg) {
        userMessage = `OpenAI: ${msg}`;
      }
    } catch {
      if (errText && errText.length < 400) userMessage = errText;
    }
    console.error("[ai-tutor] OpenAI error", upstream.status, errText.slice(0, 2000));
    return Response.json({ error: userMessage, details: errText }, { status: 502 });
  }

  const data = (await upstream.json()) as unknown;
  const answer = extractAnswerText(data);

  return Response.json({
    answer: answer ?? "Не удалось получить ответ от модели.",
  });
}
