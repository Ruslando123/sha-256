const STORAGE_KEY = "sha-learn-progress";

export type ProgressState = {
  completed: number[];
  current: number;
};

export function defaultProgress(): ProgressState {
  return { completed: [], current: 0 };
}

export function readProgress(): ProgressState {
  if (typeof window === "undefined") return defaultProgress();
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return defaultProgress();
    const parsed = JSON.parse(raw) as Partial<ProgressState>;
    const completed = Array.isArray(parsed.completed)
      ? parsed.completed.filter((n): n is number => typeof n === "number")
      : [];
    const current = typeof parsed.current === "number" ? parsed.current : 0;
    return { completed, current };
  } catch {
    return defaultProgress();
  }
}

export function writeProgress(state: ProgressState): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {}
}

export function clearProgress(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORAGE_KEY);
  } catch {}
}
