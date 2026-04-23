import { ShaLab } from "@/components/sha/ShaLab";
import Link from "next/link";

export const metadata = {
  title: "SHA-256 Lab | SDU",
  description: "Пошаговая визуализация SHA-256",
};

export default function ShaLabPage() {
  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <nav className="border-b border-zinc-200 bg-white px-4 py-3">
        <Link href="/" className="text-sm font-medium text-cyan-700 hover:underline">
          ← На главную
        </Link>
      </nav>
      <ShaLab />
    </div>
  );
}
