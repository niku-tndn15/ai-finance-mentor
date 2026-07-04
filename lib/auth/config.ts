// Central knobs for the auth system so the security rules live in one place
// rather than being sprinkled as magic numbers across route handlers.
// Rules trace to TECH_STACK.md §4.5.

export const SESSION_COOKIE = "urpaisa_session"
// Short-lived signed cookie proving "this browser just passed OTP", required by
// the set-password / reset-password steps (see lib/auth/tokens.ts).
export const PENDING_COOKIE = "urpaisa_pending"

// Durations (milliseconds).
export const SESSION_TTL_MS = 30 * 24 * 60 * 60 * 1000 // 30 days
export const OTP_TTL_MS = 10 * 60 * 1000 // 10-minute code expiry (§4.2)
export const PENDING_TTL_MS = 15 * 60 * 1000 // window to finish setting a password

// OTP rules (§4.2 / §4.5).
export const OTP_MAX_ATTEMPTS = 5 // wrong tries before a code is invalidated
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000 // 60s between sends
export const OTP_MAX_SENDS_PER_HOUR = 5

// Login lockout (§4.5).
export const LOGIN_MAX_FAILURES = 5
export const LOGIN_LOCKOUT_MS = 15 * 60 * 1000 // lock window

// bcrypt work factor. 10 is a sane default for serverless cold-start latency.
export const BCRYPT_ROUNDS = 10

export const OTP_LENGTH = 6
