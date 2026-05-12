export const securityAnalysisCopy = {
  title: "Attacks and Limitations of SHA-256",
  birthdayIntro:
    "Even if a hash has 2^n possible values, collisions start becoming likely much earlier: around 2^(n/2) messages.",
  birthdayFormula:
    "p ≈ 1 - exp(-k(k-1) / (2 * 2^n)), where n is the digest size in bits, k is the number of random messages.",
  lengthExtensionIntro:
    "The construction SHA256(secret || message) is vulnerable to length extension: an attacker can append to the message and produce a valid hash without knowing the secret.",
  lengthExtensionFix:
    "For MAC, use HMAC-SHA256 (or a modern KMAC/SHA-3 based MAC), not a simple secret prefix.",
};

export const digestBitOptions = [32, 64, 128, 160, 256] as const;

export const practicalNotes = [
  "SHA-256 is secure as a general-purpose hash function when used correctly.",
  "For integrity signatures with a secret, use HMAC-SHA256.",
  "SHA-3 has a different internal construction (sponge) and is not susceptible to length extension in the same way.",
];
