"use client"

import { useState } from "react"
import { Check, Eye, EyeOff } from "lucide-react"

import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { passwordRules } from "@/lib/validation/auth"

interface PasswordFieldProps {
  id: string
  label: string
  value: string
  onChange: (value: string) => void
  autoComplete?: string
  // Show the live strength checklist (only useful when choosing a new password).
  showChecklist?: boolean
}

// Password input with a show/hide toggle and, optionally, the live strength
// checklist driven by the same rules the server enforces (lib/validation/auth).
export function PasswordField({
  id,
  label,
  value,
  onChange,
  autoComplete = "new-password",
  showChecklist = false,
}: PasswordFieldProps) {
  const [visible, setVisible] = useState(false)

  return (
    <div className="flex flex-col gap-1.5">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={visible ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          autoComplete={autoComplete}
          className="pr-10"
        />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? "Hide password" : "Show password"}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-text-muted"
        >
          {visible ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
        </button>
      </div>

      {showChecklist && (
        <ul className="mt-1 flex flex-col gap-1">
          {passwordRules.map((rule) => {
            const met = rule.test(value)
            return (
              <li
                key={rule.label}
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  met ? "text-zone-green" : "text-text-muted"
                )}
              >
                <Check className={cn("size-3.5", met ? "opacity-100" : "opacity-30")} />
                {rule.label}
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
