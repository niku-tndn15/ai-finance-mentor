import { Info } from "lucide-react"

export function LowConfidenceAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-zone-yellow-bg p-3">
      <Info className="mt-0.5 size-4 shrink-0 text-zone-yellow" aria-hidden />
      <p className="text-sm text-zone-yellow">{message}</p>
    </div>
  )
}
