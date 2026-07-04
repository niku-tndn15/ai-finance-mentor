// Small helpers for reading client metadata off an incoming Request, used to
// stamp Session rows (for the user's future "active sessions" view — §4.1) and
// as a rate-limit signal.

export function getClientIp(req: Request): string | null {
  const forwarded = req.headers.get("x-forwarded-for")
  if (forwarded) return forwarded.split(",")[0].trim()
  return req.headers.get("x-real-ip")
}

export function getUserAgent(req: Request): string | null {
  return req.headers.get("user-agent")
}
