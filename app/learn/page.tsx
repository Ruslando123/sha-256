import { LearnExperience } from "@/components/learn/LearnExperience";
import { LearnTheoryLauncher } from "@/components/learn/LearnTheory";
import Link from "next/link";

export const metadata = {
  title: "SHA-256 Tutorial | SDU",
  description: "Step-by-step interactive SHA-256 course for beginners",
};

export default function LearnPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-zinc-50 via-white to-zinc-50 text-zinc-900">
      <nav className="sticky top-0 z-30 border-b border-zinc-200/60 bg-white/70 px-4 py-2.5 backdrop-blur-xl">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
          <Link href="/" className="text-sm font-medium text-cyan-700 transition-colors hover:text-cyan-900 hover:underline">
            ← Home
          </Link>
          <div className="flex items-center gap-2 sm:gap-3">
            <LearnTheoryLauncher />
            <Link href="/sha-lab" className="text-sm font-medium text-cyan-700 transition-colors hover:text-cyan-900 hover:underline">
              Open SHA Visualizer →
            </Link>
          </div>
        </div>
      </nav>
      <div className="mx-auto flex max-w-6xl flex-col gap-6 px-4 py-8">
        <header className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-widest text-cyan-700">
            SHA-256 for Beginners
          </p>
          <h1 className="text-3xl font-bold tracking-tight text-zinc-900">
            Interactive Tutorial: 8 Steps from Text to Digest
          </h1>
          <p className="max-w-3xl text-sm leading-relaxed text-zinc-600">
            Open <strong>Theory</strong> in the bar above for a plain-language overview. The lessons below ask you to calculate and type answers—padding, words W[t], a full round, and more. The hex/bin/dec calculator stays in the bottom right. Progress saves automatically.
          </p>
        </header>
        <LearnExperience />
      </div>
    </div>
  );
}
