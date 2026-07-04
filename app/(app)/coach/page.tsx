import { CoachChat } from "@/components/coach/coach-chat"

// Ask UrPaisa screen (PRD 07). Server wrapper reads an optional ?q= (passed from
// the home "Ask UrPaisa" box) and hands it to the client chat, which posts to
// /api/mentor/ask. Auth is enforced by the (app) layout.
export default function CoachPage({ searchParams }: { searchParams: { q?: string } }) {
  return <CoachChat initialQuestion={searchParams.q} />
}
