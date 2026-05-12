"use client";

import { glossaryText } from "@/content/glossary";
import { useState } from "react";
import { Modal } from "@/components/ui/Modal";

type EduTooltipProps = {
  glossaryKey: string;
  label: React.ReactNode;
  className?: string;
};

/** Clickable label: opens a modal with the glossary explanation. */
export function EduTooltip({ glossaryKey, label, className = "" }: EduTooltipProps) {
  const [open, setOpen] = useState(false);
  const entry = glossaryText(glossaryKey);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={`inline cursor-help border-b border-dotted border-cyan-600 text-cyan-700 hover:text-cyan-900 dark:border-cyan-400 dark:text-cyan-300 dark:hover:text-cyan-100 ${className}`}
        title="Learn more"
      >
        {label}
      </button>
      {entry && (
        <Modal open={open} title={entry.title} onClose={() => setOpen(false)}>
          <p>{entry.body}</p>
        </Modal>
      )}
    </>
  );
}
