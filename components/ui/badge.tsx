import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
  {
    variants: {
      variant: {
        neutral: "bg-muted text-text-muted",
        green: "bg-zone-green-bg text-zone-green",
        yellow: "bg-zone-yellow-bg text-zone-yellow",
        red: "bg-zone-red-bg text-zone-red",
        locked: "bg-zone-locked-bg text-zone-locked",
        blue: "bg-mentor-blue-bg text-mentor-blue",
      },
    },
    defaultVariants: {
      variant: "neutral",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <span className={cn(badgeVariants({ variant }), className)} {...props} />
}

export { Badge, badgeVariants }
