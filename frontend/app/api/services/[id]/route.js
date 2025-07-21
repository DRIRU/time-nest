import { NextResponse } from "next/server"
import { getServiceById } from "@/lib/database-services" // This import is already correct

export async function GET(request, { params }) {
  try {
    const { id } = await params
    const service = await getServiceById(id)

    if (!service) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 })
    }

    return NextResponse.json({ service })
  } catch (error) {
    console.error("Error fetching service:", error)
    return NextResponse.json({ error: "Failed to fetch service" }, { status: 500 })
  }
}
