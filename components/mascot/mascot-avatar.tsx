import Image from "next/image"

import mascotImg from "@/images/finance-me.png"
import { cn } from "@/lib/utils"

const sizeMap = {
  md: 96,
  lg: 220,
} as const

// The source photo is a full-body figurine on a busy outdoor background.
// We render it at ZOOM× its container size and top-align it inside a
// clipped circle so only the head-and-shoulders region shows, cropping
// out both the background and the lower body/base.
const ZOOM = 1.75
const IMAGE_ASPECT = 1447 / 1130 // source height / width

export function MascotAvatar({
  size = "md",
  className,
}: {
  size?: keyof typeof sizeMap
  className?: string
}) {
  const px = sizeMap[size]
  const renderedWidth = Math.round(px * ZOOM)
  const renderedHeight = Math.round(renderedWidth * IMAGE_ASPECT)

  return (
    <div
      className={cn(
        "relative shrink-0 overflow-hidden rounded-full bg-mentor-blue-bg ring-2 ring-white",
        className
      )}
      style={{ width: px, height: px }}
    >
      <Image
        src={mascotImg}
        alt="UrPaisa mascot"
        width={renderedWidth}
        height={renderedHeight}
        className="absolute left-1/2 top-0 max-w-none -translate-x-1/2"
        priority
      />
    </div>
  )
}
