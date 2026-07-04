import bcrypt from "bcryptjs"

import { BCRYPT_ROUNDS } from "./config"

// bcryptjs (pure-JS) is used deliberately so there's no native binary to bundle
// into Netlify Functions — TECH_STACK.md §4.2.

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, BCRYPT_ROUNDS)
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash)
}
