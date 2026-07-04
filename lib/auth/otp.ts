import { createHash, randomInt, timingSafeEqual } from "crypto"

import { OTP_LENGTH } from "./config"

// One-time codes are short and low-entropy, so we don't need bcrypt here — a
// plain SHA-256 of the code is enough to keep the plaintext out of the DB
// (TECH_STACK.md §4.2). Brute force is bounded by the attempt limit + expiry,
// not by hash cost.

// Cryptographically-random 6-digit code, e.g. "042317". randomInt avoids modulo
// bias that Math.random / % 1_000_000 would introduce.
export function generateOtp(): string {
  const max = 10 ** OTP_LENGTH
  return randomInt(0, max).toString().padStart(OTP_LENGTH, "0")
}

export function hashOtp(code: string): string {
  return createHash("sha256").update(code).digest("hex")
}

// Constant-time compare so a timing side-channel can't reveal how many leading
// digits matched.
export function verifyOtp(code: string, storedHash: string): boolean {
  const candidate = Buffer.from(hashOtp(code), "hex")
  const expected = Buffer.from(storedHash, "hex")
  if (candidate.length !== expected.length) return false
  return timingSafeEqual(candidate, expected)
}
