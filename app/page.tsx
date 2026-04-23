import Link from "next/link";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-8 bg-zinc-50 px-6 py-16">
      <div className="max-w-lg text-center">
        <p className="mb-2 text-xs font-semibold uppercase tracking-widest text-cyan-700">SDU University</p>
        <h1 className="mb-4 text-3xl font-bold tracking-tight text-zinc-900">Интерактивное обучение SHA-256</h1>
        <p className="mb-8 text-sm leading-relaxed text-zinc-600">
          Пошаговый разбор padding, расписания W<sub>t</sub> и 64 раундов сжатия на чистом TypeScript без
          криптобиблиотек. Ручной режим, визуализация регистров и демонстрация эффекта лавины.
        </p>
        <Link
          href="/sha-lab"
          className="inline-flex rounded-full bg-cyan-600 px-8 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-cyan-500"
        >
          Открыть лабораторию
        </Link>
      </div>
    </div>
  );
}
