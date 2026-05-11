import { LearnExperience } from "@/components/learn/LearnExperience";
import Link from "next/link";

export const metadata = {
  title: "SHA-256 Учебник | SDU",
  description: "Пошаговый интерактивный курс по SHA-256 для новичков",
};

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50 text-zinc-900">
      <nav className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/70 px-4 py-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-sm font-medium text-cyan-700 transition-colors hover:text-cyan-900 hover:underline">
            ← На главную
          </Link>
          <Link href="/sha-lab" className="text-sm font-medium text-cyan-700 transition-colors hover:text-cyan-900 hover:underline">
            Открыть SHA Visualizer →
          </Link>
        </div>
      </nav>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">
            SHA-256 для новичка
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Интерактивный учебник: 8 шагов от текста до digest
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-600">
            Не нужно знаний криптографии. Каждый урок просит тебя <strong>вычислить</strong> и <strong>написать ответ</strong>: перевести числа
            в hex, посчитать длину padding, собрать формулу. Калькулятор hex/bin/dec всегда под рукой (кнопка справа внизу). Прогресс сохраняется автоматически.
          </p>
        </header>
        <LearnExperience />
      </div>
    </div>
  );
}
