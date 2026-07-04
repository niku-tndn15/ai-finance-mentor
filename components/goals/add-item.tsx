"use client"

import { useState } from "react"
import { Plus } from "lucide-react"

import { Button } from "@/components/ui/button"
import { GoalForm } from "./goal-form"
import { DebtForm } from "./debt-form"

// Milestone 4 — "Add a goal / debt" trigger that reveals the create form in
// place. Two thin wrappers over the shared toggle so the page can drop either in.

export function AddGoal() {
  const [open, setOpen] = useState(false)
  if (open) return <GoalForm onDone={() => setOpen(false)} />
  return (
    <Button variant="outline" size="sm" className="self-start" onClick={() => setOpen(true)}>
      <Plus /> Add a goal
    </Button>
  )
}

export function AddDebt() {
  const [open, setOpen] = useState(false)
  if (open) return <DebtForm onDone={() => setOpen(false)} />
  return (
    <Button variant="outline" size="sm" className="self-start" onClick={() => setOpen(true)}>
      <Plus /> Add a debt
    </Button>
  )
}
