import Link from "next/link"
import { Badge } from "@/components/ui/badge"

export default function ServiceRequestListItem({ request }) {
  return (
    <div className="bg-card p-4 rounded-lg border hover:shadow-md transition-shadow">
      <Link href={`/requests/${request.id}`}>
        <h3 className="font-semibold text-foreground">{request.title}</h3>
        <p className="text-sm text-muted-foreground">{request.description.substring(0, 100)}...</p>
        <div className="flex gap-2 mt-2">
          <Badge variant="outline">{request.category}</Badge>
          <Badge>{request.budget} credits</Badge>
        </div>
      </Link>
    </div>
  )
}
