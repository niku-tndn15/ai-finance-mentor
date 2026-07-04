import { Sparkles } from "lucide-react"

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center gap-2 rounded-lg border border-dashed border-border p-6 text-center">
      <Sparkles className="size-5 text-text-muted" aria-hidden />
      <p className="text-sm text-text-muted">{message}</p>
    </div>
  )
}
