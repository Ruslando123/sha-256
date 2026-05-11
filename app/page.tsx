import { AiTutorWidget } from "@/components/AiTutorWidget";
import Link from "next/link";

export default function Home() {
  return (
    <div className="relative min-h-screen bg-zinc-50 px-6 py-16">
      <AiTutorWidget />
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <header className="text-center">
          <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan-700">SDU University</p>
          <h1 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900">Интерактивное обучение SHA-256</h1>
          <p className="mx-auto max-w-3xl text-sm leading-relaxed text-zinc-600">
            Учебный набор страниц: чистая визуализация SHA-256, демонстрация Proof of Work, анализ уязвимостей и
            сравнение эволюции алгоритмов хеширования.
          </p>
        </header>

        <section className="grid gap-4 md:grid-cols-2">
          <Link
            href="/learn"
            className="rounded-xl border-2 border-cyan-300 bg-cyan-50 p-5 transition hover:border-cyan-500"
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-cyan-700">Старт для новичка</p>
            <p className="mt-1 text-sm font-semibold text-zinc-900">SHA-256: интерактивный учебник</p>
            <p className="mt-1 text-sm text-zinc-700">
              8 коротких уроков. Студент сам вводит данные, кликает операции и собирает формулы.
            </p>
          </Link>

          <Link href="/sha-lab" className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-cyan-300">
            <p className="text-sm font-semibold text-zinc-900">SHA Visualizer</p>
            <p className="mt-1 text-sm text-zinc-600">Пошаговый разбор padding, W[t], compress и итогового digest.</p>
          </Link>

          <Link
            href="/blockchain-mining"
            className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-cyan-300"
          >
            <p className="text-sm font-semibold text-zinc-900">SHA-256 в блокчейне</p>
            <p className="mt-1 text-sm text-zinc-600">Подбор nonce, сложность и визуализация принципа Proof of Work.</p>
          </Link>

          <Link
            href="/security-analysis"
            className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-cyan-300"
          >
            <p className="text-sm font-semibold text-zinc-900">Атаки и уязвимости</p>
            <p className="mt-1 text-sm text-zinc-600">Birthday paradox, collision intuition и length extension attack.</p>
          </Link>

          <Link
            href="/algorithm-evolution"
            className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-cyan-300"
          >
            <p className="text-sm font-semibold text-zinc-900">Сравнение алгоритмов</p>
            <p className="mt-1 text-sm text-zinc-600">MD5, SHA-1, SHA-256, SHA-3: скорость, размер и безопасность.</p>
          </Link>
        </section>
      </div>
    </div>
  );
}
