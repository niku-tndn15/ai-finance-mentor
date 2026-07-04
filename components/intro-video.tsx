"use client"

import { useRef, useState } from "react"
import Link from "next/link"
import { Volume2, VolumeX } from "lucide-react"

import { Button } from "@/components/ui/button"

// Full-screen intro: the AI mentor video fills the screen, with only the
// brand, tagline, and CTA overlaid. Autoplay must be muted (browsers block
// autoplay-with-sound), so a tap on the speaker turns the voice on and
// restarts from the top.
export function IntroVideo() {
  const videoRef = useRef<HTMLVideoElement>(null)
  const [muted, setMuted] = useState(true)

  function toggleSound() {
    const video = videoRef.current
    if (!video) return
    const next = !muted
    video.muted = next
    if (!next) video.currentTime = 0
    void video.play().catch(() => {})
    setMuted(next)
  }

  return (
    <div className="fixed inset-0 z-50 bg-black">
      <div className="relative mx-auto h-full max-w-md overflow-hidden">
        <video
          ref={videoRef}
          src="/videos/intro-video.mp4"
          autoPlay
          muted
          loop
          playsInline
          className="absolute inset-0 h-full w-full object-cover"
        />

        <button
          type="button"
          onClick={toggleSound}
          aria-label={muted ? "Turn on sound" : "Mute"}
          className="absolute right-4 top-4 z-10 flex size-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur transition-colors hover:bg-black/60"
        >
          {muted ? <VolumeX className="size-5" /> : <Volume2 className="size-5" />}
        </button>

        <div className="pointer-events-none absolute inset-x-0 bottom-0 flex flex-col items-center gap-1.5 bg-gradient-to-t from-black/85 via-black/45 to-transparent px-6 pb-10 pt-28 text-center">
          <span className="text-4xl font-bold tracking-tight text-white">UrPaisa</span>
          {/* PRD 01 §6 Welcome Screen — promise copy, verbatim. */}
          <p className="max-w-xs text-base font-medium text-white/90">
            Know what is safe to spend and what money move to make next.
          </p>
          <Button asChild size="lg" className="pointer-events-auto mt-4 w-full max-w-xs">
            <Link href="/login">Get started</Link>
          </Button>
          <span className="mt-1 text-xs text-white/70">No bank linking required for the first version.</span>
        </div>
      </div>
    </div>
  )
}
