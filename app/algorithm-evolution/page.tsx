"use client";

import Link from "next/link";
import { useState, useEffect, useCallback } from "react";

// ── Data ─────────────────────────────────────────────────────────────────────

type SecurityStatus = "Broken" | "Weak" | "Recommended" | "Best";

interface Algorithm {
  id: string;
  name: string;
  year: number;
  author: string;
  quote: string;
  digestBits: number;
  blockBits: number;
  rounds: number;
  speedMBps: number;
  security: SecurityStatus;
  collisionScore: number;
  preimageScore: number;
  lengthExtension: boolean;
  usages: string[];
  warning?: string;
  nsaNote?: boolean;
  color: string;
  radarScores: [number, number, number, number, number, number];
  webCryptoName?: "SHA-1" | "SHA-256";
}

const algorithms: Algorithm[] = [
  {
    id: "md5",
    name: "MD5",
    year: 1991,
    author: "Ron Rivest",
    quote: '"Like a lock with no key — looks solid, but anyone can open it."',
    digestBits: 128,
    blockBits: 512,
    rounds: 64,
    speedMBps: 850,
    security: "Broken",
    collisionScore: 5,
    preimageScore: 40,
    lengthExtension: true,
    usages: ["File checksums (legacy)", "Password storage — NEVER use"],
    warning: "Collisions found in seconds on a regular PC. Using MD5 for security is a critical mistake.",
    color: "#ef4444",
    radarScores: [5, 85, 60, 5, 40, 70],
  },
  {
    id: "sha1",
    name: "SHA-1",
    year: 1995,
    author: "NSA / NIST",
    quote: '"Like an old door lock — used to be fine, now easily picked."',
    digestBits: 160,
    blockBits: 512,
    rounds: 80,
    speedMBps: 700,
    security: "Weak",
    collisionScore: 30,
    preimageScore: 60,
    lengthExtension: true,
    usages: ["Git (migrating to SHA-256)", "TLS (deprecated)", "Digital signatures (deprecated)"],
    warning: "SHAttered (2017): Google found a practical collision. Chrome and Firefox dropped support.",
    nsaNote: true,
    color: "#f59e0b",
    radarScores: [30, 70, 75, 30, 60, 60],
    webCryptoName: "SHA-1",
  },
  {
    id: "sha256",
    name: "SHA-256",
    year: 2001,
    author: "NSA / NIST",
    quote: '"The gold standard. Like a bank vault — trusted everywhere."',
    digestBits: 256,
    blockBits: 512,
    rounds: 64,
    speedMBps: 520,
    security: "Recommended",
    collisionScore: 95,
    preimageScore: 95,
    lengthExtension: true,
    usages: ["Bitcoin (PoW)", "TLS/HTTPS certificates", "Document signatures", "Password storage (with salt)"],
    nsaNote: true,
    color: "#10b981",
    radarScores: [95, 52, 95, 95, 95, 99],
    webCryptoName: "SHA-256",
  },
  {
    id: "sha3-256",
    name: "SHA3-256",
    year: 2015,
    author: "Guido Bertoni et al.",
    quote: '"Next generation. Different \u201csponge\u201d architecture, unrelated to SHA-2."',
    digestBits: 256,
    blockBits: 1088,
    rounds: 24,
    speedMBps: 300,
    security: "Best",
    collisionScore: 99,
    preimageScore: 99,
    lengthExtension: false,
    usages: ["Cryptocurrencies (Ethereum etc.)", "Post-quantum cryptography", "Next-gen signatures"],
    color: "#6366f1",
    radarScores: [99, 30, 40, 99, 99, 80],
  },
];

// ── Radar Chart ───────────────────────────────────────────────────────────────

const RADAR_AXES = ["Security", "Speed", "Popularity", "Collision Res.", "Preimage", "Compatibility"];

function polarToXY(cx: number, cy: number, r: number, i: number, total: number) {
  const angle = (Math.PI * 2 * i) / total - Math.PI / 2;
  return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
}

function RadarChart({ hoveredId }: { hoveredId: string | null }) {
  const cx = 200, cy = 200, maxR = 140;
  const n = RADAR_AXES.length;

  const polyPoints = (scores: number[]) =>
    scores.map((s, i) => {
      const { x, y } = polarToXY(cx, cy, (s / 100) * maxR, i, n);
      return `${x},${y}`;
    }).join(" ");

  return (
    <svg viewBox="0 0 400 400" className="w-full max-w-[380px]">
      {[20, 40, 60, 80, 100].map((r) => (
        <polygon
          key={r}
          points={Array.from({ length: n }, (_, i) => {
            const p = polarToXY(cx, cy, (r / 100) * maxR, i, n);
            return `${p.x},${p.y}`;
          }).join(" ")}
          fill="none"
          stroke="rgba(15,23,42,0.14)"
          strokeWidth="1"
        />
      ))}
      {RADAR_AXES.map((_, i) => {
        const p = polarToXY(cx, cy, maxR, i, n);
        return <line key={i} x1={cx} y1={cy} x2={p.x} y2={p.y} stroke="rgba(15,23,42,0.16)" strokeWidth="1" />;
      })}
      {RADAR_AXES.map((label, i) => {
        const p = polarToXY(cx, cy, maxR + 24, i, n);
        return (
          <text key={i} x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fill="rgba(39,39,42,0.75)" fontSize="11">
            {label}
          </text>
        );
      })}
      {algorithms.map((alg) => (
        <polygon
          key={alg.id}
          points={polyPoints(alg.radarScores)}
          fill={alg.color + "2a"}
          stroke={alg.color}
          strokeWidth={hoveredId === alg.id ? 2.5 : 1.5}
          opacity={hoveredId && hoveredId !== alg.id ? 0.25 : 1}
          style={{ transition: "opacity 0.2s" }}
        />
      ))}
    </svg>
  );
}

// ── Security badge ────────────────────────────────────────────────────────────

function SecurityBadge({ status }: { status: SecurityStatus }) {
  const cfg: Record<SecurityStatus, { label: string; cls: string }> = {
    Broken:      { label: "⚠ Broken",       cls: "bg-red-950 text-red-400 border border-red-800" },
    Weak:        { label: "~ Weak",          cls: "bg-amber-950 text-amber-400 border border-amber-800" },
    Recommended: { label: "✓ Recommended",   cls: "bg-emerald-950 text-emerald-400 border border-emerald-800" },
    Best:        { label: "★ Best",          cls: "bg-indigo-950 text-indigo-400 border border-indigo-800" },
  };
  const { label, cls } = cfg[status];
  return <span className={`rounded-md px-2 py-1 text-xs font-semibold ${cls}`}>{label}</span>;
}

// ── Algorithm Card ────────────────────────────────────────────────────────────

function AlgorithmCard({ alg, onHover }: { alg: Algorithm; onHover: (id: string | null) => void }) {
  return (
    <div
      className="rounded-xl p-5 flex flex-col gap-3 cursor-default transition-all duration-200"
      style={{
        background: "linear-gradient(135deg,#ffffff 0%,#f8fafc 100%)",
        border: `1px solid ${alg.color}55`,
        boxShadow: `0 8px 24px ${alg.color}14`,
      }}
      onMouseEnter={() => onHover(alg.id)}
      onMouseLeave={() => onHover(null)}
    >
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-2xl font-black" style={{ color: alg.color }}>{alg.name}</h3>
          <p className="text-xs text-zinc-500 mt-0.5">{alg.year} · {alg.author}</p>
        </div>
        <SecurityBadge status={alg.security} />
      </div>

      <p className="rounded-lg p-3 text-sm italic leading-relaxed text-zinc-600" style={{ background: `${alg.color}14` }}>
        {alg.quote}
      </p>

      <div className="grid grid-cols-2 gap-2">
        {[
          { label: "Hash Size", value: `${alg.digestBits} bits` },
          { label: "Block",     value: `${alg.blockBits} bits` },
          { label: "Rounds",    value: String(alg.rounds) },
          { label: "Speed",     value: `~${alg.speedMBps} MB/s` },
        ].map(({ label, value }) => (
          <div key={label} className="rounded-lg border border-zinc-200 bg-white p-3">
            <p className="text-xs text-zinc-500">{label}</p>
            <p className="font-bold text-sm mt-1" style={{ color: alg.color }}>{value}</p>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2">
        {[
          { label: "Collision Resistance", score: alg.collisionScore },
          { label: "Preimage Resistance",  score: alg.preimageScore },
        ].map(({ label, score }) => (
          <div key={label}>
            <div className="flex justify-between text-xs text-zinc-500 mb-1">
              <span>{label}</span>
              <span className="font-mono">{score}/100</span>
            </div>
            <div className="h-1.5 rounded-full bg-zinc-200">
              <div className="h-1.5 rounded-full" style={{ width: `${score}%`, background: alg.color }} />
            </div>
          </div>
        ))}
      </div>

      <div className="flex justify-between items-center text-sm">
        <span className="text-zinc-500 text-xs">Length extension vulnerable</span>
        <span className={`text-xs font-medium ${alg.lengthExtension ? "text-amber-400" : "text-emerald-400"}`}>
          {alg.lengthExtension ? "Yes ⚠" : "No ✓"}
        </span>
      </div>

      <div>
        <p className="text-xs uppercase tracking-wider text-zinc-600 mb-1.5">Used in</p>
        <div className="flex flex-wrap gap-1">
          {alg.usages.map((u) => (
            <span key={u} className="rounded-full border border-zinc-200 bg-zinc-100 px-2 py-0.5 text-xs text-zinc-700">{u}</span>
          ))}
        </div>
      </div>

      {alg.warning && (
        <div className="rounded-lg p-3 text-xs leading-relaxed" style={{ background: `${alg.color}18`, color: alg.color }}>
          ⚠ {alg.warning}
        </div>
      )}
    </div>
  );
}

// ── Table View ────────────────────────────────────────────────────────────────

function TableView() {
  return (
    <div className="overflow-x-auto rounded-xl border border-zinc-200 bg-white">
      <table className="min-w-full text-sm text-left">
        <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600">
          <tr>
            {["Algorithm", "Digest", "Security", "Speed", "Collision", "Preimage", "Length Ext."].map((h) => (
              <th key={h} className="px-4 py-3">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {algorithms.map((alg) => (
            <tr key={alg.id} className="border-b border-zinc-100 bg-white transition hover:bg-zinc-50">
              <td className="px-4 py-3 font-black" style={{ color: alg.color }}>{alg.name}</td>
              <td className="px-4 py-3 font-mono text-zinc-700">{alg.digestBits} bit</td>
              <td className="px-4 py-3"><SecurityBadge status={alg.security} /></td>
              <td className="px-4 py-3 text-zinc-700">~{alg.speedMBps} MB/s</td>
              {[alg.collisionScore, alg.preimageScore].map((score, idx) => (
                <td key={idx} className="px-4 py-3">
                  <div className="flex items-center gap-2">
                    <div className="h-1.5 w-20 rounded-full bg-zinc-200">
                      <div className="h-1.5 rounded-full" style={{ width: `${score}%`, background: alg.color }} />
                    </div>
                    <span className="text-xs text-zinc-500">{score}</span>
                  </div>
                </td>
              ))}
              <td className="px-4 py-3">
                <span className={`text-xs font-medium ${alg.lengthExtension ? "text-amber-400" : "text-emerald-400"}`}>
                  {alg.lengthExtension ? "Yes ⚠" : "No ✓"}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── History Tab ───────────────────────────────────────────────────────────────

const timelineEvents = [
  { year: 1991, label: "MD5",        color: "#ef4444", note: "Created to replace MD4" },
  { year: 1993, label: "SHA-0",      color: "#9ca3af", note: "First SHA, quickly withdrawn" },
  { year: 1995, label: "SHA-1",      color: "#f59e0b", note: "NSA fixed SHA-0" },
  { year: 2001, label: "SHA-256",    color: "#10b981", note: "Part of the SHA-2 family" },
  { year: 2004, label: "MD5 broken", color: "#ef4444", note: "Xiaoyun Wang found collisions" },
  { year: 2015, label: "SHA3-256",   color: "#6366f1", note: "New \u201csponge\u201d architecture" },
  { year: 2017, label: "SHA-1 broken", color: "#f59e0b", note: "SHAttered by Google" },
];

function HistoryTab() {
  const minYear = 1990, maxYear = 2019;
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-1 text-xl font-bold text-zinc-900">History of Hash Algorithms</h2>
        <p className="mb-8 text-sm text-zinc-600">
          Cryptography constantly evolves. Algorithms once considered secure get broken over time — that&apos;s normal.
          What matters is knowing which ones are still relevant today.
        </p>

        {/* Timeline */}
        <div className="relative mb-16">
          <div className="absolute left-0 right-0 h-px bg-zinc-200" style={{ top: "28px" }} />
          <div className="relative" style={{ height: "90px" }}>
            {timelineEvents.map((ev) => {
              const pct = ((ev.year - minYear) / (maxYear - minYear)) * 100;
              return (
                <div
                  key={ev.year + ev.label}
                  className="absolute flex flex-col items-center"
                  style={{ left: `${pct}%`, transform: "translateX(-50%)" }}
                >
                  <p className="text-xs text-zinc-500 mb-1">{ev.year}</p>
                  <div className="w-3 h-3 rounded-full" style={{ background: ev.color, boxShadow: `0 0 8px ${ev.color}` }} />
                  <p className="text-xs font-bold mt-1 whitespace-nowrap" style={{ color: ev.color }}>{ev.label}</p>
                  <p className="text-xs text-zinc-500 text-center" style={{ maxWidth: "80px", fontSize: "10px" }}>{ev.note}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* History cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {algorithms.map((alg) => (
            <div key={alg.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4" style={{ borderLeftColor: alg.color, borderLeftWidth: "3px" }}>
              <div className="flex justify-between items-start mb-1">
                <h3 className="font-black" style={{ color: alg.color }}>{alg.name}</h3>
                <span className="text-xs text-zinc-500">{alg.year}</span>
              </div>
              <p className="text-xs text-zinc-600">{alg.author}</p>
              <p className="text-xs italic text-zinc-500 mt-2 leading-relaxed">{alg.quote}</p>
              {alg.nsaNote && (
                <p className="text-xs mt-2 font-medium" style={{ color: alg.color }}>⚠ Developed with NSA involvement</p>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Try It Tab ────────────────────────────────────────────────────────────────

async function computeHash(text: string, alg: "SHA-1" | "SHA-256"): Promise<string> {
  const buf = await crypto.subtle.digest(alg, new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function TryItTab() {
  const [input, setInput] = useState("Hello, world!");
  const [hashes, setHashes] = useState<Record<string, string>>({});

  const compute = useCallback(async (text: string) => {
    const [h1, h256] = await Promise.all([computeHash(text, "SHA-1"), computeHash(text, "SHA-256")]);
    setHashes({ sha1: h1, sha256: h256 });
  }, []);

  useEffect(() => { compute(input); }, [input, compute]);

  const keyProps = [
    { icon: "🔄", title: "Deterministic",       desc: "Same input → always the same hash." },
    { icon: "🌊", title: "Avalanche Effect",     desc: "Changing one bit flips ~50% of the output bits." },
    { icon: "🚫", title: "One-way",              desc: "You cannot recover the original data from a hash." },
    { icon: "❄️", title: "Collision Resistant",  desc: "Practically impossible to find two inputs with the same hash." },
    { icon: "⚡", title: "Fast Computation",     desc: "Hash is computed instantly, regardless of file size." },
  ];

  return (
    <div className="grid md:grid-cols-2 gap-6">
      <div className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5">
        <div>
          <h2 className="text-lg font-bold text-zinc-900">✏️ Live Hasher</h2>
          <p className="mt-1 text-sm text-zinc-600">Enter any text and see what its hash looks like. Even one letter changes everything!</p>
        </div>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 outline-none transition focus:border-cyan-500"
        />
        <div className="flex flex-col gap-2">
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-semibold mb-1" style={{ color: "#ef4444" }}>MD5</p>
            <p className="text-xs text-zinc-500">(unavailable in browser)</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-semibold mb-1" style={{ color: "#f59e0b" }}>SHA-1</p>
            <p className="break-all font-mono text-xs text-zinc-700">{hashes.sha1 ?? "..."}</p>
          </div>
          <div className="rounded-lg border border-zinc-200 bg-zinc-50 p-3">
            <p className="text-xs font-semibold mb-1" style={{ color: "#10b981" }}>SHA-256</p>
            <p className="break-all font-mono text-xs text-zinc-700">{hashes.sha256 ?? "..."}</p>
          </div>
        </div>
        <p className="text-xs text-zinc-500">
          💡 Try changing one letter — the hash changes completely (this is called the &quot;avalanche effect&quot;)
        </p>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h2 className="mb-4 text-lg font-bold text-zinc-900">📚 Key Properties</h2>
        <div className="flex flex-col gap-5">
          {keyProps.map(({ icon, title, desc }) => (
            <div key={title} className="flex gap-3 items-start">
              <span className="text-xl leading-none">{icon}</span>
              <div>
                <p className="text-sm font-semibold text-zinc-900">{title}</p>
                <p className="mt-0.5 text-xs text-zinc-600">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ── When to Use Tab ───────────────────────────────────────────────────────────

const useCases = [
  { icon: "🔑", title: "Password Storage",       desc: 'Never use a raw hash for passwords! Add a "salt" and a slow algorithm.',     good: "SHA-256 + bcrypt/Argon2",            bad: "MD5, SHA-1" },
  { icon: "📁", title: "File Integrity",          desc: "Need to verify a file hasn't changed? SHA-256 is your go-to.",               good: "SHA-256 or SHA3-256",                bad: "MD5 (still used, but avoid)" },
  { icon: "₿",  title: "Cryptocurrencies",        desc: "Bitcoin uses SHA-256 for Proof of Work. Ethereum moved to SHA3.",            good: "SHA-256 (Bitcoin), SHA3 (Ethereum)", bad: "MD5, SHA-1" },
  { icon: "🌐", title: "TLS / HTTPS Certificates",desc: "All modern SSL certificates use SHA-256.",                                   good: "SHA-256",                            bad: "SHA-1 (deprecated since 2016)" },
  { icon: "✍️", title: "Digital Signatures",      desc: "Signing documents, code, or data — SHA-256 and newer only.",                good: "SHA-256 or SHA3-256",                bad: "MD5, SHA-1" },
  { icon: "🧬", title: "Post-Quantum Future",     desc: "Quantum computers may weaken SHA-256. SHA-3 is more resistant.",            good: "SHA3-256",                           bad: "SHA-2 (potential risks)" },
];

function WhenToUseTab() {
  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-1 text-xl font-bold text-zinc-900">🗂️ When to Use What</h2>
        <p className="mb-6 text-sm text-zinc-600">Algorithm choice depends on your use case. Here&apos;s a practical guide for developers and beginners.</p>
        <div className="grid md:grid-cols-3 gap-4">
          {useCases.map(({ icon, title, desc, good, bad }) => (
            <div key={title} className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
              <p className="text-2xl mb-2">{icon}</p>
              <h3 className="mb-1 text-sm font-bold text-zinc-900">{title}</h3>
              <p className="mb-3 text-xs leading-relaxed text-zinc-600">{desc}</p>
              <p className="text-xs text-emerald-400">✓ {good}</p>
              <p className="text-xs text-red-400 mt-1">✗ {bad}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="mb-4 text-xl font-bold text-zinc-900">⚡ Quick Rule</h2>
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-xl p-5 text-center" style={{ background: "rgba(239,68,68,0.12)", border: "1px solid rgba(239,68,68,0.25)" }}>
            <p className="text-3xl mb-2">🚫</p>
            <p className="font-bold text-red-400 text-lg">Never</p>
            <p className="text-red-400 text-sm mt-1">MD5 · SHA-1</p>
            <p className="text-zinc-500 text-xs mt-1">for security</p>
          </div>
          <div className="rounded-xl p-5 text-center" style={{ background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.25)" }}>
            <p className="text-3xl mb-2">✅</p>
            <p className="font-bold text-emerald-400 text-lg">Standard</p>
            <p className="text-emerald-400 text-sm mt-1">SHA-256</p>
            <p className="text-zinc-500 text-xs mt-1">most tasks</p>
          </div>
          <div className="rounded-xl p-5 text-center" style={{ background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.25)" }}>
            <p className="text-3xl mb-2">🚀</p>
            <p className="font-bold text-indigo-400 text-lg">The Future</p>
            <p className="text-indigo-400 text-sm mt-1">SHA3-256</p>
            <p className="text-zinc-500 text-xs mt-1">new projects</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

type Tab = "compare" | "history" | "tryit" | "whenuse";

export default function AlgorithmEvolutionPage() {
  const [tab, setTab] = useState<Tab>("compare");
  const [viewMode, setViewMode] = useState<"cards" | "table">("cards");
  const [hoveredAlg, setHoveredAlg] = useState<string | null>(null);

  const tabs: { id: Tab; label: string }[] = [
    { id: "compare", label: "Compare" },
    { id: "history", label: "History" },
    { id: "tryit",   label: "Try It" },
    { id: "whenuse", label: "When to Use" },
  ];

  return (
    <div className="min-h-screen bg-white px-4 py-8 text-zinc-900">
      <div className="mx-auto w-full max-w-6xl flex flex-col gap-6">

        {/* Header */}
        <header>
          <div className="flex items-center gap-2 mb-3">
            <div className="w-8 h-8 rounded-lg bg-cyan-700 flex items-center justify-center text-sm">🔒</div>
            <p className="text-xs font-semibold uppercase tracking-widest text-zinc-500">Cryptography Learning Course</p>
          </div>
          <h1 className="text-4xl font-black mb-2">
            Hash{" "}
            <span style={{ background: "linear-gradient(90deg,#22d3ee,#6366f1)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
              Algorithms
            </span>
          </h1>
          <p className="max-w-lg text-sm leading-relaxed text-zinc-600">
            A hash function turns any data into a fixed-length string. Think of it as a fingerprint for a file — unique and irreversible.
          </p>
        </header>

        {/* Tabs */}
        <div className="flex gap-1 rounded-xl border border-zinc-200 bg-white p-1">
          {tabs.map(({ id, label }) => (
            <button
              key={id}
              onClick={() => setTab(id)}
              className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                tab === id ? "border border-zinc-300 bg-zinc-100 text-zinc-900" : "text-zinc-500 hover:text-zinc-700"
              }`}
              style={tab === id ? {} : {}}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Compare */}
        {tab === "compare" && (
          <div className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">{algorithms.length} algorithms · {viewMode}</p>
              <div className="flex overflow-hidden rounded-lg border border-zinc-200">
                {(["cards", "table"] as const).map((m) => (
                  <button
                    key={m}
                    onClick={() => setViewMode(m)}
                    className="px-4 py-1.5 text-sm capitalize transition"
                    style={{
                      background: viewMode === m ? "#e4e4e7" : "#ffffff",
                      color: viewMode === m ? "#111827" : "#52525b",
                    }}
                  >
                    {m.charAt(0).toUpperCase() + m.slice(1)}
                  </button>
                ))}
              </div>
            </div>

            {viewMode === "cards" ? (
              <div className="grid md:grid-cols-2 gap-4">
                {algorithms.map((alg) => (
                  <AlgorithmCard key={alg.id} alg={alg} onHover={setHoveredAlg} />
                ))}
              </div>
            ) : (
              <TableView />
            )}

            {/* Radar */}
            <div className="rounded-xl border border-zinc-200 bg-white p-6">
              <div className="flex flex-col md:flex-row gap-6 items-center">
                <div className="flex-1">
                  <h2 className="mb-2 text-xl font-bold text-zinc-900">Comparison Radar</h2>
                  <p className="mb-4 text-sm text-zinc-600">
                    Hover over an algorithm card above to highlight it on the radar.
                    6 axes: security, speed, popularity, collision resistance, preimage resistance, and compatibility.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    {algorithms.map((alg) => (
                      <div key={alg.id} className="flex items-center gap-1.5">
                        <div className="w-3 h-3 rounded-sm" style={{ background: alg.color }} />
                        <span className="text-xs text-zinc-600">{alg.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="w-full md:w-[380px]">
                  <RadarChart hoveredId={hoveredAlg} />
                </div>
              </div>
            </div>
          </div>
        )}

        {tab === "history" && <HistoryTab />}
        {tab === "tryit"   && <TryItTab />}
        {tab === "whenuse" && <WhenToUseTab />}

        <Link href="/" className="text-sm text-cyan-600 hover:underline self-start">← Back to Home</Link>
      </div>
    </div>
  );
}
