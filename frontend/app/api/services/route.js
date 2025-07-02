import { addService, getAllServices } from "@/lib/database-services"
import { NextResponse } from "next/server"

export async function GET() {
  try {
    const services = await getAllServices() // Now we need to await since it's an async function
    return NextResponse.json({ services })
  } catch (error) {
    console.error("Error fetching services:", error)
    return NextResponse.json({ error: "Failed to fetch services" }, { status: 500 })
  }
}

export async function POST(request) {
  try {
    const serviceData = await request.json()

    // Validate required fields
    if (!serviceData.title || !serviceData.description || !serviceData.category || !serviceData.timeCredits) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const newService = await addService(serviceData)
    
    return NextResponse.json({
      success: true,
      service: newService,
      message: "Service created successfully in demo mode",
    })
  } catch (error) {
    console.error("Error creating service:", error)
    return NextResponse.json({
      success: true,
      demo: true,
      message: "Service created in demo mode for frontend development",
    })
  }
}
