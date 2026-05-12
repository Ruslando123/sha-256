export const miningDemoCopy = {
  title: "SHA-256 in Blockchain: Mining Demo",
  intro:
    "Try to find a nonce such that the block hash starts with a given number of zeros. This is the basic idea behind Proof of Work.",
  disclaimer:
    "This is an educational model. Real mining takes into account the block header, target, and network difficulty.",
};

export const difficultyLevels = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] as const;

export function expectedTries(difficulty: number): number {
  return 16 ** difficulty;
}

export function expectedSeconds(difficulty: number, hashRate: number): number {
  if (!Number.isFinite(hashRate) || hashRate <= 0) return Number.POSITIVE_INFINITY;
  return expectedTries(difficulty) / hashRate;
}
