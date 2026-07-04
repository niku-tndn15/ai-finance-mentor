import { MascotAvatar } from "@/components/mascot/mascot-avatar"
import { cn } from "@/lib/utils"

export function MascotBubble({
  children,
  size = "md",
  className,
}: {
  children: React.ReactNode
  size?: "md" | "lg"
  className?: string
}) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <MascotAvatar size={size} />
      <div className="relative flex-1 rounded-2xl rounded-tl-sm bg-mentor-blue-bg px-4 py-3">
        <p className="text-sm font-medium leading-snug text-text-primary">{children}</p>
      </div>
    </div>
  )
}
