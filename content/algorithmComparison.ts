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
    note: "Коллизии строятся практически; для безопасности не использовать.",
  },
  {
    id: "sha1",
    name: "SHA-1",
    digestBits: 160,
    referenceMBps: 700,
    security: "Weak",
    note: "Есть практические collision-атаки; для новых систем не рекомендуется.",
    webCryptoName: "SHA-1",
  },
  {
    id: "sha256",
    name: "SHA-256",
    digestBits: 256,
    referenceMBps: 520,
    security: "Recommended",
    note: "Стандартный выбор для большинства задач целостности и PoW-демо.",
    webCryptoName: "SHA-256",
  },
  {
    id: "sha3-256",
    name: "SHA3-256",
    digestBits: 256,
    referenceMBps: 300,
    security: "Recommended",
    note: "Современная альтернатива на sponge-конструкции.",
  },
];
