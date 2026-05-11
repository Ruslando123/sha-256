import { ShaLab } from "@/components/sha/ShaLab";
import Link from "next/link";

export const metadata = {
  title: "SHA-256 Visualizer | SDU",
  description: "Пошаговая визуализация SHA-256",
};

export default function ShaLabPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50 text-zinc-900">
      <nav className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/70 px-4 py-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          <Link href="/" className="text-sm font-medium text-cyan-700 transition-colors hover:text-cyan-900 hover:underline">
            ← На главную
          </Link>
          <Link href="/learn" className="text-sm font-medium text-cyan-700 transition-colors hover:text-cyan-900 hover:underline">
            Интерактивный учебник →
          </Link>
        </div>
      </nav>
      <ShaLab />
    </div>
  );
}
