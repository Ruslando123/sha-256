"use client";

import { AiTutorWidget } from "@/components/AiTutorWidget";
import { motion, useMotionValue, useTransform } from "framer-motion";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const SHA_HASH = "b94d27b9934d3e08a52e52d7da7dabfac484efe37a5380ee9088f7ace2efcde9";

function useTypedHash() {
  const [displayed, setDisplayed] = useState("");
  const [done, setDone] = useState(false);
  useEffect(() => {
    let i = 0;
    const id = setInterval(() => {
      i++;
      setDisplayed(SHA_HASH.slice(0, i));
      if (i >= SHA_HASH.length) {
        clearInterval(id);
        setDone(true);
      }
    }, 65);
    return () => clearInterval(id);
  }, []);
  return { displayed, done };
}

function FloatingHexGrid() {
  const ref = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = ref.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    const chars = "0123456789abcdef";
    const cols = 28;
    const rows = 16;
    const cells: { char: string; alpha: number; target: number; speed: number }[] = [];
    for (let i = 0; i < cols * rows; i++) {
      cells.push({
        char: chars[Math.floor(Math.random() * 16)]!,
        alpha: Math.random() * 0.12,
        target: Math.random() * 0.15,
        speed: 0.002 + Math.random() * 0.004,
      });
    }

    const resize = () => {
      canvas.width = canvas.offsetWidth * 2;
      canvas.height = canvas.offsetHeight * 2;
      ctx.scale(2, 2);
    };
    resize();

    const draw = () => {
      const w = canvas.offsetWidth;
      const h = canvas.offsetHeight;
      ctx.clearRect(0, 0, w, h);
      const cw = w / cols;
      const ch = h / rows;
      ctx.font = `${Math.max(10, cw * 0.45)}px monospace`;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const cell = cells[r * cols + c]!;
          cell.alpha += (cell.target - cell.alpha) * cell.speed * 8;
          if (Math.abs(cell.alpha - cell.target) < 0.005) {
            cell.target = Math.random() * 0.18;
            if (Math.random() < 0.02) {
              cell.char = chars[Math.floor(Math.random() * 16)]!;
            }
          }
          ctx.fillStyle = `rgba(8, 145, 178, ${cell.alpha})`;
          ctx.fillText(cell.char, c * cw + cw / 2, r * ch + ch / 2);
        }
      }
      animId = requestAnimationFrame(draw);
    };
    draw();
    window.addEventListener("resize", resize);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      className="pointer-events-none absolute inset-0 h-full w-full opacity-60"
    />
  );
}

const CARDS = [
  {
    href: "/learn",
    badge: "Start",
    badgeColor: "bg-cyan-500",
    title: "Interactive Course",
    desc: "8 lessons: from ASCII to the final digest. Enter data, click through operations, and build formulas hands-on.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M4.26 10.147a60.438 60.438 0 0 0-.491 6.347A48.62 48.62 0 0 1 12 20.904a48.62 48.62 0 0 1 8.232-4.41 60.46 60.46 0 0 0-.491-6.347m-15.482 0a50.636 50.636 0 0 0-2.658-.813A59.906 59.906 0 0 1 12 3.493a59.903 59.903 0 0 1 10.399 5.84c-.896.248-1.783.52-2.658.814m-15.482 0A50.717 50.717 0 0 1 12 13.489a50.702 50.702 0 0 1 7.74-3.342M6.75 15a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm0 0v-3.675A55.378 55.378 0 0 1 12 8.443m-7.007 11.55A5.981 5.981 0 0 0 6.75 15.75v-1.5" />
      </svg>
    ),
    gradient: "from-cyan-500/10 to-cyan-500/5",
    ring: "ring-cyan-200 hover:ring-cyan-400",
    featured: true,
  },
  {
    href: "/sha-lab",
    badge: "Lab",
    badgeColor: "bg-indigo-500",
    title: "SHA Visualizer",
    desc: "Step-by-step breakdown: padding → parse → W[t] → compress → digest. With an animated round diagram.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.75 3.104v5.714a2.25 2.25 0 0 1-.659 1.591L5 14.5M9.75 3.104c-.251.023-.501.05-.75.082m.75-.082a24.301 24.301 0 0 1 4.5 0m0 0v5.714c0 .597.237 1.17.659 1.591L19.8 15.3M14.25 3.104c.251.023.501.05.75.082M19.8 15.3l-1.57.393A9.065 9.065 0 0 1 12 15a9.065 9.065 0 0 0-6.23.693L5 14.5m14.8.8 1.402 1.402c1.232 1.232.65 3.318-1.067 3.611A48.309 48.309 0 0 1 12 21c-2.773 0-5.491-.235-8.135-.687-1.718-.293-2.3-2.379-1.067-3.61L5 14.5" />
      </svg>
    ),
    gradient: "from-indigo-500/10 to-indigo-500/5",
    ring: "ring-indigo-200 hover:ring-indigo-400",
  },
  {
    href: "/blockchain-mining",
    badge: "PoW",
    badgeColor: "bg-amber-500",
    title: "SHA-256 in Blockchain",
    desc: "Real-time nonce mining, difficulty adjustment, and Proof of Work visualization.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="m21 7.5-2.25-1.313M21 7.5v2.25m0-2.25-2.25 1.313M3 7.5l2.25-1.313M3 7.5l2.25 1.313M3 7.5v2.25m9 3 2.25-1.313M12 12.75l-2.25-1.313M12 12.75V15m0 6.75 2.25-1.313M12 21.75V19.5m0 2.25-2.25-1.313m0-16.875L12 2.25l2.25 1.313M21 14.25v2.25l-2.25 1.313m-13.5 0L3 16.5v-2.25" />
      </svg>
    ),
    gradient: "from-amber-500/10 to-amber-500/5",
    ring: "ring-amber-200 hover:ring-amber-400",
  },
  {
    href: "/security-analysis",
    badge: "Sec",
    badgeColor: "bg-rose-500",
    title: "Attacks & Vulnerabilities",
    desc: "Birthday paradox, collision intuition, and length extension attack.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m0-10.036A11.959 11.959 0 0 1 3.598 6 11.99 11.99 0 0 0 3 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285Z" />
      </svg>
    ),
    gradient: "from-rose-500/10 to-rose-500/5",
    ring: "ring-rose-200 hover:ring-rose-400",
  },
  {
    href: "/algorithm-evolution",
    badge: "Algo",
    badgeColor: "bg-emerald-500",
    title: "Algorithm Comparison",
    desc: "MD5 → SHA-1 → SHA-256 → SHA-3: speed, size, and security.",
    icon: (
      <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 0 1 3 19.875v-6.75ZM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V8.625ZM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 0 1-1.125-1.125V4.125Z" />
      </svg>
    ),
    gradient: "from-emerald-500/10 to-emerald-500/5",
    ring: "ring-emerald-200 hover:ring-emerald-400",
  },
];

const STATS = [
  { value: "256", label: "bits in hash" },
  { value: "64", label: "compression rounds" },
  { value: "8", label: "interactive lessons" },
  { value: "5", label: "tools" },
];

const containerVariants = {
  hidden: {},
  visible: {
    transition: { staggerChildren: 0.1 },
  },
};

const cardVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { type: "spring" as const, stiffness: 200, damping: 24 },
  },
};

export default function Home() {
  const { displayed, done } = useTypedHash();
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const spotlightX = useTransform(mouseX, (v) => `${v}px`);
  const spotlightY = useTransform(mouseY, (v) => `${v}px`);

  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (!heroRef.current) return;
      const rect = heroRef.current.getBoundingClientRect();
      mouseX.set(e.clientX - rect.left);
      mouseY.set(e.clientY - rect.top);
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, [mouseX, mouseY]);

  return (
    <div className="relative min-h-screen bg-white">
      <AiTutorWidget />

      {/* ---- HERO ---- */}
      <section
        ref={heroRef}
        className="relative overflow-hidden bg-gradient-to-b from-zinc-950 via-zinc-900 to-zinc-950"
      >
        <FloatingHexGrid />

        {/* Mouse spotlight */}
        <motion.div
          className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 rounded-full"
          style={{
            left: spotlightX,
            top: spotlightY,
            width: 500,
            height: 500,
            background: "radial-gradient(circle, rgba(8,145,178,0.08) 0%, transparent 70%)",
          }}
        />

        <div className="relative z-10 mx-auto flex max-w-5xl flex-col items-center px-6 pb-20 pt-24 text-center">
          {/* University badge */}
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-800/40 bg-cyan-950/50 px-4 py-1.5 text-xs font-medium text-cyan-300 backdrop-blur-sm"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
            SDU University — Cryptography
          </motion.div>

          {/* Title */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, type: "spring", stiffness: 120, damping: 20 }}
            className="mb-4 text-4xl font-bold tracking-tight text-white sm:text-5xl lg:text-6xl"
          >
            Interactive Learning{" "}
            <span className="bg-gradient-to-r from-cyan-400 to-cyan-200 bg-clip-text text-transparent">
              SHA-256
            </span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
            className="mx-auto mb-10 max-w-2xl text-sm leading-relaxed text-zinc-400 sm:text-base"
          >
            Visualize every step of the algorithm — padding, message expansion, 64 compression rounds, and finalization.
            Learn by doing, not by reading.
          </motion.p>

          {/* Animated hash */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.5, duration: 0.5 }}
            className="relative mb-10 w-full max-w-2xl overflow-hidden rounded-2xl border border-zinc-700/60 bg-zinc-900/80 p-5 backdrop-blur-sm"
          >
            <div className="mb-2 flex items-center gap-1 font-mono text-xs text-zinc-500">
              <span>SHA-256</span>
              <span className="text-zinc-700">(</span>
              <span className="text-cyan-500">&quot;hello world&quot;</span>
              <span className="text-zinc-700">)</span>
              <span className="text-zinc-700">&nbsp;=</span>
            </div>
            <div className="relative font-mono text-sm leading-relaxed tracking-wide sm:text-base">
              {displayed.split("").map((ch, i) => (
                <motion.span
                  key={i}
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15 }}
                  className={
                    i < 8
                      ? "text-cyan-400"
                      : i < 16
                        ? "text-cyan-300"
                        : i < 32
                          ? "text-zinc-300"
                          : "text-zinc-400"
                  }
                >
                  {ch}
                </motion.span>
              ))}
              {!done && (
                <motion.span
                  animate={{ opacity: [1, 0] }}
                  transition={{ duration: 0.5, repeat: Infinity }}
                  className="inline-block h-[1.1em] w-[2px] translate-y-[2px] bg-cyan-400"
                />
              )}
            </div>
            {done && (
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: "100%" }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="absolute bottom-0 left-0 h-[2px] bg-gradient-to-r from-cyan-500 via-cyan-300 to-transparent"
              />
            )}
          </motion.div>

          {/* CTA buttons */}
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex flex-wrap items-center justify-center gap-3"
          >
            <Link
              href="/learn"
              className="group relative inline-flex items-center gap-2 overflow-hidden rounded-xl bg-cyan-600 px-6 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/25 transition-all hover:bg-cyan-500 hover:shadow-cyan-500/30"
            >
              <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/10 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
              Start Learning
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5 21 12m0 0-7.5 7.5M21 12H3" />
              </svg>
            </Link>
            <Link
              href="/sha-lab"
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-600 bg-zinc-800/50 px-6 py-3 text-sm font-medium text-zinc-300 backdrop-blur-sm transition hover:border-zinc-500 hover:text-white"
            >
              Open Visualizer
            </Link>
          </motion.div>
        </div>

        {/* Gradient fade to white */}
        <div className="absolute bottom-0 left-0 right-0 h-24 bg-gradient-to-b from-transparent to-white" />
      </section>

      {/* ---- STATS ---- */}
      <section className="relative z-10 -mt-10 px-6">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-50px" }}
          variants={containerVariants}
          className="mx-auto grid max-w-3xl grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {STATS.map((s) => (
            <motion.div
              key={s.label}
              variants={cardVariants}
              className="flex flex-col items-center rounded-2xl border border-zinc-200 bg-white px-4 py-5 shadow-sm"
            >
              <span className="text-2xl font-bold text-zinc-900">{s.value}</span>
              <span className="mt-1 text-xs text-zinc-500">{s.label}</span>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ---- CARDS ---- */}
      <section className="mx-auto max-w-5xl px-6 pb-20 pt-16">
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mb-8 text-center"
        >
          <h2 className="text-2xl font-bold tracking-tight text-zinc-900 sm:text-3xl">Tools</h2>
          <p className="mt-2 text-sm text-zinc-500">Each page is a standalone interactive experience</p>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-80px" }}
          variants={containerVariants}
          className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {CARDS.map((card) => (
            <motion.div
              key={card.href}
              variants={cardVariants}
              className={card.featured ? "sm:col-span-2 lg:col-span-2" : ""}
            >
              <Link
                href={card.href}
                className={`group relative flex h-full flex-col overflow-hidden rounded-2xl border bg-gradient-to-br ${card.gradient} p-6 ring-1 ${card.ring} transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg`}
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.badgeColor} text-white shadow-sm`}>
                    {card.icon}
                  </div>
                  <span className={`rounded-full ${card.badgeColor} px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-white`}>
                    {card.badge}
                  </span>
                </div>
                <h3 className="mb-1.5 text-lg font-semibold text-zinc-900">{card.title}</h3>
                <p className="text-sm leading-relaxed text-zinc-600">{card.desc}</p>
                <div className="mt-auto flex items-center gap-1 pt-4 text-xs font-medium text-zinc-400 transition group-hover:text-zinc-700">
                  Open
                  <svg className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="m8.25 4.5 7.5 7.5-7.5 7.5" />
                  </svg>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* ---- FOOTER ---- */}
      <footer className="border-t border-zinc-200 bg-white px-6 py-8">
        <div className="mx-auto flex max-w-5xl flex-col items-center gap-4 text-center sm:flex-row sm:justify-between sm:text-left">
          <div>
            <p className="text-sm font-semibold text-zinc-900">SHA-256 Edu</p>
            <p className="text-xs text-zinc-500">SDU University — Cryptography &amp; Information Security</p>
          </div>
          <div className="flex gap-4 text-xs text-zinc-400">
            <Link href="/learn" className="transition hover:text-cyan-600">Course</Link>
            <Link href="/sha-lab" className="transition hover:text-cyan-600">Visualizer</Link>
            <Link href="/blockchain-mining" className="transition hover:text-cyan-600">Blockchain</Link>
            <Link href="/security-analysis" className="transition hover:text-cyan-600">Security</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
