import { NextResponse } from "next/server"

import { prisma } from "@/lib/db"

// Temporary production diagnostic (safe to delete once auth is confirmed working
// on Netlify). Surfaces the REAL error that the auth routes hide behind a generic
// 503, plus a sanitized view of the DB connection and which env vars are present.
// It never returns secrets — only booleans, the DB host, and non-secret query
// params like `pgbouncer`.
export const dynamic = "force-dynamic"

function sanitizeDbUrl(raw: string | undefined) {
  if (!raw) return null
  try {
    const u = new URL(raw)
    return {
      protocol: u.protocol.replace(":", ""),
      host: u.hostname,
      port: u.port,
      // Param KEYS/values only — no credentials live here.
      params: Object.fromEntries(u.searchParams.entries()),
    }
  } catch {
    return { unparseable: true }
  }
}

export async function GET() {
  const env = {
    DATABASE_URL: Boolean(process.env.DATABASE_URL),
    DIRECT_URL: Boolean(process.env.DIRECT_URL),
    SESSION_SECRET: Boolean(process.env.SESSION_SECRET),
    RESEND_API_KEY: Boolean(process.env.RESEND_API_KEY),
    CRON_SECRET: Boolean(process.env.CRON_SECRET),
    NODE_ENV: process.env.NODE_ENV,
  }
  const db = sanitizeDbUrl(process.env.DATABASE_URL)

  try {
    const userCount = await prisma.user.count()
    return NextResponse.json({ ok: true, env, db, userCount })
  } catch (error) {
    const e = error as { name?: string; code?: string; message?: string }
    return NextResponse.json(
      {
        ok: false,
        env,
        db,
        error: {
          name: e?.name ?? "Error",
          code: e?.code ?? null,
          message: String(e?.message ?? "").slice(0, 800),
        },
      },
      { status: 500 }
    )
  }
}
