import Link from "next/link"

// Calm, single-column mobile shell for every auth screen. Deliberately minimal:
// auth is "the door into the product, not the product" (IMPLEMENTATION_PLAN.md
// M1), so there's no nav, no dashboard chrome — just the brand and one task.
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-md flex-1 flex-col px-4 py-8">
      <Link href="/" className="mb-8 text-xl font-bold tracking-tight text-mentor-blue">
        UrPaisa
      </Link>
      <div className="flex flex-1 flex-col">{children}</div>
    </main>
  )
}
