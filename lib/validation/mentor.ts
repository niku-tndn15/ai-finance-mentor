import { z } from "zod"

// Milestone 7 — validation for the conversational mentor endpoint (PRD 07).
// Shared client+server; no @prisma/client import so client forms can use it.

export const mentorAskSchema = z.object({
  question: z.string().trim().min(3, "Type a question first").max(500, "That's a bit long — try a shorter question"),
})

export type MentorAskInput = z.infer<typeof mentorAskSchema>
