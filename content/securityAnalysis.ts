export const securityAnalysisCopy = {
  title: "Атаки и границы применимости SHA-256",
  birthdayIntro:
    "Даже если у хеша 2^n вариантов, коллизии начинают быть вероятными намного раньше: около 2^(n/2) сообщений.",
  birthdayFormula:
    "p ≈ 1 - exp(-k(k-1) / (2 * 2^n)), где n — размер дайджеста в битах, k — число случайных сообщений.",
  lengthExtensionIntro:
    "Конструкция SHA256(secret || message) уязвима к length extension: злоумышленник может продолжить сообщение и получить валидный хеш без знания secret.",
  lengthExtensionFix:
    "Для MAC используйте HMAC-SHA256 (или современный KMAC/SHA-3 based MAC), а не простой префиксный секрет.",
};

export const digestBitOptions = [32, 64, 128, 160, 256] as const;

export const practicalNotes = [
  "SHA-256 безопасен как хеш-функция общего назначения при корректном применении.",
  "Для подписи целостности с секретом используйте HMAC-SHA256.",
  "SHA-3 имеет другую внутреннюю конструкцию (sponge) и не подвержен length extension в том же виде.",
];
