/**
 * Read-only theory for the /learn page. Mirrors the lesson order but is prose only.
 * Written to align with FIPS PUB 180-4 (SHA-256) terminology.
 */
export type LearnTheorySection = {
  id: string;
  title: string;
  lead: string;
  paragraphs: string[];
};

export const LEARN_THEORY_SECTIONS: LearnTheorySection[] = [
  {
    id: "theory-hash",
    title: "What is a cryptographic hash?",
    lead:
      "SHA-256 is a deterministic function: any message (as a sequence of bits) is mapped to exactly one 256-bit digest, no matter how long the message is.",
    paragraphs: [
      "Informally, a hash “fingerprints” data. The output is always 32 bytes (256 bits), usually shown as 64 hexadecimal characters. Two different files can produce the same digest only if the hash is broken; for SHA-256, no practical method is known to find such collisions for arbitrary messages.",
      "Determinism: identical input bytes always yield the same digest. That lets you store a small digest instead of the whole file and later re-hash the file to verify it was not altered.",
      "One-way intuition: from the digest alone you should not be able to recover the message. Formally, “preimage resistance” means that given a target digest H, finding any message M with SHA-256(M) = H should require about 2^256 work in the ideal case (SHA-256 is 256-bit output, so generic preimage search is often discussed in terms of 2^256 trials for a random hash—practical attacks are structured differently, but the design goal is hardness).",
      "Second-preimage resistance: given a message M1, finding another M2 ≠ M1 with the same hash should be infeasible. Collision resistance: finding any pair M1 ≠ M2 with the same hash should be infeasible. Collisions are easier than preimage attacks in the generic birthday bound (~2^128 for 256-bit hashes in an ideal model), which is why output length matters.",
      "The avalanche property: changing a single bit of the input should, after many rounds of mixing, change roughly half of the output bits on average. That is not a formal definition but explains why similar messages have completely unrelated digests.",
      "SHA-256 is part of the SHA-2 family (like SHA-224, SHA-384, SHA-512). It uses a Merkle–Damgård style block processing: the message is split into fixed-size blocks; each block updates an internal chaining value; the last value is formatted as the digest.",
      "In this tutorial, “message” almost always means the exact byte sequence you type or paste. Encoding matters: the same text in UTF-8 vs UTF-16 is a different byte sequence and therefore a different hash.",
    ],
  },
  {
    id: "theory-padding",
    title: "Padding: bit length, 1 bit, zeros, and the length field",
    lead:
      "SHA-256 never sees your raw string “as text”—only as bits. Padding forces the total length to be a multiple of 512 bits while uniquely encoding where the real message ends.",
    paragraphs: [
      "Step 1 — bits: The input is a sequence of bits. In software we almost always work in bytes; one byte is 8 bits. If the message length in bits is L, we think of the message as occupying the first L bits of a longer padded string.",
      "Step 2 — append a single 1: After the last real message bit, append one bit with value 1. In byte terms: if the message already ends on a byte boundary, append the byte 0x80 (binary 10000000). If the message length is not a multiple of 8 bits (rare in byte-oriented APIs), the 1 is inserted at the correct bit position; most tutorials assume whole-byte messages.",
      "Step 3 — append zeros: Append 0 bits until the total length of (original message || 1 || zeros) is congruent to 448 modulo 512. Equivalently, the padded length is 64 bits less than the next multiple of 512. That leaves exactly 64 bits at the end for the length field.",
      "Why 448 mod 512? A 512-bit block is divided into sixteen 32-bit words (16 × 32 = 512). The last two words of the padded block are reserved for the 64-bit length; the design fixes the “payload” area of the last block to 448 bits so the length always fits.",
      "Step 4 — append L as 64 bits: Write L, the original message length in bits, as a big-endian 64-bit integer (most significant byte first). If L is larger than 2^64 − 1, the standard says the message is too long for SHA-256; in practice normal files never hit this.",
      "Empty message: L = 0. You still append 1, then enough zeros to reach 448 mod 512, then 64 bits of zeros for the length. So the empty string still produces one full padded “block” of processing.",
      "Worked example (conceptual): message \"abc\" is 3 bytes = 24 bits. Append 1 → need padding zeros so total before length is 448 bits. 448 − 25 = 423 zero bits (including the single 1 in the right position within bytes). Then append 64-bit L = 24. The tutorial’s interactive padding step walks through the byte-level layout you need to type.",
      "Uniqueness: No two distinct messages produce the same padded bit string: the combination of the 1 bit, the padding zeros, and the explicit length L encodes exactly where the original message stopped. Different lengths or different content lead to different padded data and thus different hashes.",
      "Multiple blocks: If the message is long, after padding you get N blocks of 512 bits each. SHA-256 compresses them one after another, updating the same eight-word chaining variable each time.",
    ],
  },
  {
    id: "theory-parse",
    title: "Parsing a 512-bit block into sixteen 32-bit words",
    lead:
      "Each 512-bit block is cut into M[0]…M[15]. Byte order inside each word is big-endian: the first byte of the word is the high byte.",
    paragraphs: [
      "Layout: 512 bits = 64 bytes. Number the bytes b0, b1, …, b63 in order as they appear in the padded message stream.",
      "Word M[0] uses bytes b0–b3: value = b0·2^24 + b1·2^16 + b2·2^8 + b3. Word M[1] uses b4–b7, and so on through M[15] using b60–b63.",
      "Big-endian means “most significant byte first.” If you accidentally interpret a word as little-endian, every word value changes and the entire hash is wrong. The standard is strict about this.",
      "Why sixteen words? The compression function is defined to run 64 rounds, each consuming one schedule word W[t]. The first sixteen W[t] are exactly these M[t]. The remaining forty-eight W[t] are derived by recurrence from these sixteen—so the block parsing step is the only place the raw message bytes enter the round loop directly.",
      "Hex view: In the lab, you often see each byte as two hex digits. Four hex pairs in order form one 32-bit word; mentally group them to match M[0], M[1], …",
      "Partial blocks: After padding, every block is full 512 bits. There are no “short” blocks in the compression input; padding guarantees completeness.",
    ],
  },
  {
    id: "theory-schedule",
    title: "Message schedule W[0]…W[63]",
    lead:
      "Sixteen block words are expanded into sixty-four words. Each W[t] for t ≥ 16 is a fixed mix of four earlier words, using rotations, shifts, and addition modulo 2^32.",
    paragraphs: [
      "For t = 0…15: W[t] = M[t]. The schedule starts as a direct copy of the parsed block.",
      "For t = 16…63, the FIPS 180-4 recurrence is: W[t] = σ₁(W[t−2]) + W[t−7] + σ₀(W[t−15]) + W[t−16] (mod 2^32). All additions are modulo 2^32; overflow wraps like a 32-bit CPU.",
      "Small sigma σ₀ (used in the schedule, not the same as the big Σ in compression): σ₀(x) = ROTR^7(x) ⊕ ROTR^18(x) ⊕ SHR^3(x). ROTR^n rotates bits right within the 32-bit word; SHR^n shifts right, filling with zeros on the left.",
      "Small sigma σ₁: σ₁(x) = ROTR^17(x) ⊕ ROTR^19(x) ⊕ SHR^10(x). These mixes are linear except for the implicit 32-bit wrap in addition when words are combined in the recurrence.",
      "Why expand? If each round only used the sixteen original words in a simple cycle, local patterns in the message could persist. The recurrence smears each input bit across many W[t], so round 40’s W[40] indirectly depends on bytes from all over the block.",
      "Dependency chain: W[16] depends on W[14], W[9], W[1], W[0]. Each step pulls in older words; by t = 63, the algebraic dependency on the original M[0]…M[15] is deep and entangled.",
      "Implementation note: You can compute W[t] on the fly round by round to save memory, or precompute all 64 before compression—both are equivalent.",
      "Contrast with SHA-512: the same idea applies but word size is 64 bits and rotation/shift constants differ; SHA-256’s numbers are tuned for 32-bit arithmetic.",
    ],
  },
  {
    id: "theory-compress",
    title: "Compression: sixty-four rounds, eight registers",
    lead:
      "For each block, eight working variables a…h absorb the block through 64 identical-in-shape rounds. Each round injects a constant K[t] and a schedule word W[t].",
    paragraphs: [
      "Chaining input: Before round 0 of a block, (a,b,c,d,e,f,g,h) is initialized from the current hash state H[0]…H[7] (for the very first block, H is the standard SHA-256 initial value IV).",
      "Boolean functions (32-bit words, bit-wise): Ch(e,f,g) = (e ∧ f) ⊕ (¬e ∧ g). Think of e as choosing between f and g per bit. Maj(a,b,c) = (a ∧ b) ⊕ (a ∧ c) ⊕ (b ∧ c)—the majority vote per bit.",
      "Large sigmas (round mixing): Σ₀(a) = ROTR^2(a) ⊕ ROTR^13(a) ⊕ ROTR^22(a). Σ₁(e) = ROTR^6(e) ⊕ ROTR^11(e) ⊕ ROTR^25(e). These are different from the small σ₀, σ₁ in the message schedule.",
      "Per-round intermediates: T₁ = h + Σ₁(e) + Ch(e,f,g) + K[t] + W[t] (mod 2^32). T₂ = Σ₀(a) + Maj(a,b,c) (mod 2^32). K[t] is the t-th SHA-256 round constant (first 32 bits of fractional part of the cube root of the t-th prime, per the standard).",
      "Register update (one round): new_a = T₁ + T₂; new_b = a; new_c = b; new_d = c; new_e = d + T₁; new_f = e; new_g = f; new_h = g. All additions mod 2^32. After this, rename (a,…,h) to the new values and increment t.",
      "Role of T₁: It feeds both the top word (through T₁+T₂) and the middle of the chain (e gets d+T₁). That ties the “lower” half of the state to the message and constants every round.",
      "Role of T₂: It uses the top three registers’ majority and Σ₀(a), so the high part of the state contributes nonlinear mixing independent of the Ch path.",
      "Sixty-four rounds: t runs 0 to 63. Each round uses a different K[t] and W[t], so the same algebraic shape never repeats with the same parameters.",
      "Why this structure: The combination of additions (carry propagation), XOR, and bitwise choices creates strong diffusion and confusion—classic block-cipher–like goals, applied in a hash compression function.",
    ],
  },
  {
    id: "theory-finalize",
    title: "Finalization: adding the block result to H",
    lead:
      "After 64 rounds, the working registers are folded back into the chaining variables by word-wise addition modulo 2^32.",
    paragraphs: [
      "Update rule: For each i = 0…7, H[i] ← H[i] + register_i (mod 2^32), where register order matches (a,b,c,d,e,f,g,h) → (H[0],…,H[7]). This uses the H that was the input to this block’s compression, not the initial IV alone.",
      "First block: H starts as the fixed IV—the first eight 32-bit words derived from the square roots of the first eight primes (fractional parts). That standard IV is the same for every SHA-256 computation in the world.",
      "Next blocks: The H produced after block 1 becomes the input chaining value for block 2, and so on. Only the last block’s padding guarantees the message ends correctly; all blocks run the same parse → schedule → compress → add-to-H pipeline.",
      "Digest output: After the final block, concatenate H[0]‖H[1]‖…‖H[7] as eight big-endian 32-bit words. That is 256 bits = 64 hex characters. There is no extra padding on the output—what you see in hex is the raw digest.",
      "Total work: For a message that spans N blocks, you run N full compressions. Longer files mean linearly more blocks, hence linearly more rounds (64 per block).",
      "Invariant: At every step, all internal words are explicitly 32-bit values. Implementations use uint32 arithmetic with wraparound; languages without unsigned types must mask to 32 bits after each addition.",
    ],
  },
  {
    id: "theory-avalanche",
    title: "Avalanche effect and what you should notice",
    lead:
      "A single-bit input change propagates through padding, schedule, and 64 rounds so that the output bits look uncorrelated with the original digest.",
    paragraphs: [
      "Empirical rule of thumb: For a good hash, flipping one input bit changes about half of the output bits on average (Hamming distance ~128 of 256). SHA-256 is designed so that after many mixing layers, bit correlations die out.",
      "Why it matters for integrity: An attacker cannot make a small, plausible edit to a document and keep the same hash. Any change forces a new digest; comparing digests is a standard integrity check.",
      "Hex display: One hex character is 4 bits. A “small” change in the hex string often corresponds to many flipped bits inside; do not judge similarity of files by how many hex digits match visually.",
      "Connection to rounds: Early in processing, a local change affects nearby W[t] first; by later rounds, Σ and Ch/Maj have spread influence across all registers. The tutorial’s avalanche view makes that spreading visible.",
      "Not randomness: The digest is fully deterministic. “Looks random” means unstructured with respect to small input changes, not that the output is a random variable.",
      "Cryptographic note: Avalanche is necessary but not sufficient for security; the full SHA-256 security story relies on the public analysis of the whole construction. For learning, avalanche explains why hashes behave “brittle” and unpredictable under tiny edits.",
    ],
  },
];
