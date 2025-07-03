import { NextResponse } from "next/server"

// This file is now deprecated as we're using the FastAPI backend directly
// Keeping it for backward compatibility but all functionality should be moved to the backend

export async function POST(request) {
  try {
    // Forward the request to the backend
    const requestData = await request.json()
    
    // Try to forward to backend
    try {
      const backendResponse = await fetch("http://localhost:8000/api/v1/requests", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": request.headers.get("Authorization") || ""
        },
        body: JSON.stringify(requestData)
      });
      
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json({
          success: true,
          request: data,
          message: "Service request created successfully"
        });
      }
    } catch (backendError) {
      console.error("Error forwarding to backend:", backendError);
      // Fall back to demo mode
    }
    
    // Demo mode fallback
    console.log("Service request created in demo mode:", requestData)

    return NextResponse.json({
      success: true,
      demo: true,
      message: "Service request created in demo mode for frontend development",
    })
  } catch (error) {
    console.error("Error creating service request:", error)
    return NextResponse.json({
      success: false,
      error: error.message || "An error occurred while creating the service request",
    }, { status: 500 })
  }
}

export async function GET() {
  try {
    // Try to fetch from backend
    try {
      const backendResponse = await fetch("http://localhost:8000/api/v1/requests");
      
      if (backendResponse.ok) {
        const data = await backendResponse.json();
        return NextResponse.json({ requests: data });
      }
    } catch (backendError) {
      console.error("Error fetching from backend:", backendError);
      // Fall back to demo mode
    }
    
    // Demo mode fallback - return mock service requests
    return NextResponse.json({ 
      requests: [],
      demo: true,
      message: "Using demo data as backend connection failed"
    })
  } catch (error) {
    console.error("Error fetching service requests:", error)
    return NextResponse.json({ 
      error: "Failed to fetch service requests",
      message: error.message 
    }, { status: 500 })
  }
}