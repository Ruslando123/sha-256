export const miningDemoCopy = {
  title: "SHA-256 в блокчейне: Mining Demo",
  intro:
    "Попробуйте подобрать nonce так, чтобы хеш блока начинался с заданного количества нулей. Так работает базовая идея Proof of Work.",
  disclaimer:
    "Это учебная модель. Реальный майнинг учитывает заголовок блока, target и сетевую сложность.",
};

export const difficultyLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function expectedTries(difficulty: number): number {
  return 16 ** difficulty;
}

export function expectedSeconds(difficulty: number, hashRate: number): number {
  if (!Number.isFinite(hashRate) || hashRate <= 0) return Number.POSITIVE_INFINITY;
  return expectedTries(difficulty) / hashRate;
}
