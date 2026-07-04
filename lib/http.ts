import { NextResponse } from "next/server"
import type { ZodError, ZodSchema } from "zod"

// Thin, uniform JSON helpers for route handlers so error shapes stay consistent
// and no handler accidentally leaks a stack trace to the client
// ([09](PRDs/09-data-privacy-ai-safety-prd.md) §7).

export function ok<T extends object>(data: T = {} as T, init?: ResponseInit) {
  return NextResponse.json({ ok: true, ...data }, init)
}

export function fail(message: string, status = 400, extra?: Record<string, unknown>) {
  return NextResponse.json({ ok: false, error: message, ...extra }, { status })
}

function firstZodMessage(error: ZodError): string {
  return error.issues[0]?.message ?? "Please check your input"
}

// Parses + validates a JSON body against a Zod schema. On failure returns a
// ready-to-send 400 so callers can `if (!parsed.ok) return parsed.response`.
export async function parseBody<T>(
  req: Request,
  schema: ZodSchema<T>
): Promise<{ ok: true; data: T } | { ok: false; response: NextResponse }> {
  let raw: unknown
  try {
    raw = await req.json()
  } catch {
    return { ok: false, response: fail("Invalid request", 400) }
  }

  const result = schema.safeParse(raw)
  if (!result.success) {
    return { ok: false, response: fail(firstZodMessage(result.error), 400) }
  }
  return { ok: true, data: result.data }
}
