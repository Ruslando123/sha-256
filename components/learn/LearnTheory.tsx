"use client";

import { LEARN_THEORY_SECTIONS } from "@/content/learnTheory";
import { AnimatePresence, motion } from "framer-motion";
import { useCallback, useEffect, useId, useLayoutEffect, useState } from "react";
import { createPortal } from "react-dom";

type Viewport = "wide" | "narrow";

export function LearnTheoryLauncher() {
  const [open, setOpen] = useState(false);
  const [viewport, setViewport] = useState<Viewport>("wide");
  const [portalReady, setPortalReady] = useState(false);
  const titleId = useId();

  const close = useCallback(() => setOpen(false), []);

  useLayoutEffect(() => {
    setPortalReady(true);
    const mq = window.matchMedia("(min-width: 768px)");
    const sync = () => setViewport(mq.matches ? "wide" : "narrow");
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, close]);

  const scrollToSection = (id: string) => {
    document.getElementById(`theory-${id}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-pressed={open}
        className={`group relative inline-flex items-center gap-2 overflow-hidden rounded-full border px-4 py-2 text-sm font-semibold shadow-sm transition-transform duration-150 will-change-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-500 focus-visible:ring-offset-2 active:scale-[0.96] ${
          open
            ? "border-cyan-500 bg-cyan-600 text-white shadow-cyan-500/25"
            : "border-cyan-200 bg-gradient-to-r from-cyan-50 to-white text-cyan-900 hover:border-cyan-400 hover:shadow-md hover:shadow-cyan-200/50"
        }`}
      >
        {!open && (
          <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/60 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        )}
        <svg className="relative h-4 w-4" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" aria-hidden>
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 0 0 6 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 0 1 6 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 0 1 6-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0 0 18 18a8.967 8.967 0 0 0-6 2.292m0-14.25v14.25" />
        </svg>
        <span className="relative">{open ? "Close theory" : "Theory"}</span>
      </button>

      {/* Portal: fixed+z-index inside sticky nav with backdrop-blur can paint under the lesson; body escapes that stacking context. */}
      {portalReady &&
        createPortal(
          <AnimatePresence>
            {open && (
              <motion.div
                className="pointer-events-none fixed inset-0 z-[100]"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.12 }}
              >
                <motion.aside
                  role="dialog"
                  aria-modal={false}
                  aria-labelledby={titleId}
                  key={viewport}
                  initial={viewport === "wide" ? { x: "100%", y: 0 } : { y: "100%", x: 0 }}
                  animate={{ x: 0, y: 0 }}
                  exit={viewport === "wide" ? { x: "100%", y: 0 } : { y: "100%", x: 0 }}
                  transition={{ type: "spring" as const, stiffness: 380, damping: 34 }}
                  className={
                    viewport === "wide"
                      ? "pointer-events-auto absolute bottom-0 right-0 top-14 flex w-full max-w-md flex-col overflow-hidden rounded-tl-2xl border-l border-zinc-200/90 bg-white shadow-[-16px_0_48px_rgba(0,0,0,0.1)]"
                      : "pointer-events-auto absolute bottom-0 left-0 right-0 top-auto flex max-h-[min(82vh,32rem)] w-full flex-col overflow-hidden rounded-t-2xl border border-b-0 border-zinc-200/90 border-t-zinc-200/90 bg-white shadow-[0_-16px_48px_rgba(0,0,0,0.12)]"
                  }
                >
              <div className="pointer-events-none absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-cyan-400 via-sky-400 to-emerald-400" />

              <div className="flex shrink-0 items-start justify-between gap-3 border-b border-zinc-100 bg-gradient-to-b from-zinc-50/95 to-white px-4 pb-3 pt-4 sm:px-5">
                <div className="min-w-0">
                  <p className="text-[10px] font-semibold uppercase tracking-widest text-cyan-700">Reference</p>
                  <h2 id={titleId} className="mt-0.5 text-lg font-bold tracking-tight text-zinc-900 sm:text-xl">
                    SHA-256 theory
                  </h2>
                  <p className="mt-1 text-xs text-zinc-600 sm:text-sm">
                    Read beside your lesson—the page stays usable. Press Esc or the button to hide.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={close}
                  className="shrink-0 rounded-xl border border-zinc-200 bg-white p-2 text-zinc-500 transition hover:border-zinc-300 hover:bg-zinc-50 hover:text-zinc-800"
                  aria-label="Close theory panel"
                >
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="shrink-0 border-b border-zinc-100 bg-white px-4 py-2.5 sm:px-5">
                <p className="mb-1.5 text-[10px] font-semibold uppercase tracking-wide text-zinc-400">Jump to</p>
                <div className="flex max-h-[4.5rem] flex-wrap gap-1.5 overflow-y-auto sm:max-h-none">
                  {LEARN_THEORY_SECTIONS.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => scrollToSection(s.id)}
                      className="rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-0.5 text-left text-[11px] font-medium text-zinc-700 transition hover:border-cyan-300 hover:bg-cyan-50 hover:text-cyan-900 sm:text-xs"
                    >
                      {s.title}
                    </button>
                  ))}
                </div>
              </div>

              <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4 sm:px-5 sm:py-5">
                <div className="flex flex-col gap-8">
                  {LEARN_THEORY_SECTIONS.map((section, i) => (
                    <motion.article
                      key={section.id}
                      id={`theory-${section.id}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.25, delay: Math.min(i * 0.04, 0.2) }}
                      className="scroll-mt-3 rounded-xl border border-zinc-100 bg-zinc-50/60 p-3.5 sm:p-4"
                    >
                      <h3 className="text-sm font-semibold text-zinc-900 sm:text-base">{section.title}</h3>
                      <p className="mt-1.5 text-xs font-medium leading-relaxed text-cyan-900/90 sm:text-sm">{section.lead}</p>
                      <div className="mt-2 space-y-2 text-xs leading-relaxed text-zinc-700 sm:text-sm">
                        {section.paragraphs.map((p, j) => (
                          <p key={j}>{p}</p>
                        ))}
                      </div>
                    </motion.article>
                  ))}
                </div>
              </div>
            </motion.aside>
          </motion.div>
            )}
          </AnimatePresence>,
          document.body,
        )}
    </>
  );
}
