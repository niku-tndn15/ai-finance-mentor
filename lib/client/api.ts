// Tiny client-side helper for calling the auth JSON endpoints. Keeps every form
// from re-implementing fetch + error-shape handling. The server always replies
// with `{ ok, error?, ... }` (see lib/http.ts).

export interface ApiResult<T = Record<string, unknown>> {
  ok: boolean
  error?: string
  data: T
}

export async function sendJson<T = Record<string, unknown>>(
  method: "POST" | "PATCH" | "PUT" | "DELETE",
  url: string,
  body?: unknown
): Promise<ApiResult<T>> {
  try {
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    const json = (await res.json().catch(() => ({}))) as Record<string, unknown>
    return {
      ok: res.ok && json.ok !== false,
      error: typeof json.error === "string" ? json.error : undefined,
      data: json as T,
    }
  } catch {
    // Network-level failure — never surface a raw error (PRD 09 §7).
    return { ok: false, error: "Something went wrong. Please try again.", data: {} as T }
  }
}

export function postJson<T = Record<string, unknown>>(
  url: string,
  body: unknown
): Promise<ApiResult<T>> {
  return sendJson<T>("POST", url, body)
}
