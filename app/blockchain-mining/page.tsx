import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "SHA-256 in Blockchain · Proof of Work | SHA-256 Edu",
  description:
    "Hands-on Proof of Work: nonces, leading zeros, difficulty scaling, and browser mining — step by step.",
};

export default function BlockchainMiningPage() {
  return (
    <div className="flex h-[100dvh] flex-col bg-zinc-100">
      <header className="flex shrink-0 items-center justify-between gap-3 border-b border-zinc-200 bg-white/90 px-4 py-2.5 backdrop-blur-sm">
        <Link href="/" className="text-sm font-medium text-cyan-700 transition hover:text-cyan-900 hover:underline">
          ← Home
        </Link>
        <span className="hidden text-xs text-zinc-500 sm:inline">Module loads below (interactive)</span>
        <Link href="/sha-lab" className="text-sm font-medium text-cyan-700 transition hover:text-cyan-900 hover:underline">
          SHA Visualizer →
        </Link>
      </header>
      <iframe
        title="SHA-256 in Blockchain — Proof of Work"
        src="/sha256-blockchain.html"
        className="min-h-0 w-full flex-1 border-0 bg-[#f4f8ff]"
      />
    </div>
  );
}
