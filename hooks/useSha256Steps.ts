"use client";

import { createSha256Stepper } from "@/lib/sha256/Sha256Engine";
import type { ShaStepSnapshot } from "@/lib/sha256/types";
import { useCallback, useEffect, useMemo, useState } from "react";

export function useSha256Steps(message: Uint8Array) {
  const stepper = useMemo(() => createSha256Stepper(message), [message]);
  const count = stepper.getStepCount();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- reset step when message changes
    setIndex(0);
  }, [message]);

  const step: ShaStepSnapshot | undefined = stepper.getStep(index);

  const goNext = useCallback(() => {
    setIndex((i) => Math.min(count - 1, i + 1));
  }, [count]);

  const goBack = useCallback(() => {
    setIndex((i) => Math.max(0, i - 1));
  }, []);

  const reset = useCallback(() => {
    setIndex(0);
  }, []);

  return {
    step,
    index,
    count,
    goNext,
    goBack,
    reset,
    setIndex,
    getStep: (i: number) => stepper.getStep(i),
    digestHex: stepper.getDigestHex(),
  };
}
