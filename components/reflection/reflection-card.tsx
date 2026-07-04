import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { cn } from "@/lib/utils"

export function ReflectionCard({
  title,
  items,
  tone = "neutral",
}: {
  title: string
  items: string[]
  tone?: "positive" | "neutral"
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="flex flex-col gap-1.5">
          {items.map((item) => (
            <li
              key={item}
              className={cn(
                "text-sm",
                tone === "positive" ? "text-zone-green" : "text-text-primary"
              )}
            >
              {item}
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  )
}
