"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Target, MessageCircle, Repeat, CalendarCheck } from "lucide-react"

import { cn } from "@/lib/utils"

const tabs = [
  { href: "/home", label: "Home", icon: Home },
  { href: "/goals", label: "Goals", icon: Target },
  { href: "/coach", label: "Coach", icon: MessageCircle },
  { href: "/habits", label: "Habits", icon: Repeat },
  { href: "/review", label: "Review", icon: CalendarCheck },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    <nav className="fixed inset-x-0 bottom-0 z-10 border-t border-border bg-surface-card">
      <ul className="mx-auto flex max-w-md items-stretch justify-between">
        {tabs.map(({ href, label, icon: Icon }) => {
          const active = pathname === href
          return (
            <li key={href} className="flex-1">
              <Link
                href={href}
                className={cn(
                  "flex flex-col items-center gap-0.5 py-2.5 text-xs font-medium",
                  active ? "text-mentor-blue" : "text-text-muted"
                )}
                aria-current={active ? "page" : undefined}
              >
                <Icon className="size-5" aria-hidden />
                {label}
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
