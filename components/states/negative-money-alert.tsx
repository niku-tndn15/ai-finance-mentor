import { OctagonAlert } from "lucide-react"

export function NegativeMoneyAlert({ message }: { message: string }) {
  return (
    <div className="flex items-start gap-2 rounded-lg bg-zone-red-bg p-3">
      <OctagonAlert className="mt-0.5 size-4 shrink-0 text-zone-red" aria-hidden />
      <p className="text-sm text-zone-red">{message}</p>
    </div>
  )
}
