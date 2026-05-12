export type SecurityStatus = "Broken" | "Weak" | "Recommended";

export type AlgorithmRow = {
  id: "md5" | "sha1" | "sha256" | "sha3-256";
  name: string;
  digestBits: number;
  referenceMBps: number;
  security: SecurityStatus;
  note: string;
  webCryptoName?: "SHA-1" | "SHA-256" | "SHA-384" | "SHA-512";
};

export const algorithmRows: AlgorithmRow[] = [
  {
    id: "md5",
    name: "MD5",
    digestBits: 128,
    referenceMBps: 850,
    security: "Broken",
    note: "Collisions can be constructed practically; do not use for security.",
  },
  {
    id: "sha1",
    name: "SHA-1",
    digestBits: 160,
    referenceMBps: 700,
    security: "Weak",
    note: "Practical collision attacks exist; not recommended for new systems.",
    webCryptoName: "SHA-1",
  },
  {
    id: "sha256",
    name: "SHA-256",
    digestBits: 256,
    referenceMBps: 520,
    security: "Recommended",
    note: "The standard choice for most integrity and PoW demo tasks.",
    webCryptoName: "SHA-256",
  },
  {
    id: "sha3-256",
    name: "SHA3-256",
    digestBits: 256,
    referenceMBps: 300,
    security: "Recommended",
    note: "A modern alternative based on the sponge construction.",
  },
];
