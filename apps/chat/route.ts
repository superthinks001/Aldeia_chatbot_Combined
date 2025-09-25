import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL
    if (!backendUrl) {
      return NextResponse.json(
        {
          error: "Chat service is not configured. Set BACKEND_URL to your FastAPI chat endpoint.",
        },
        { status: 503 }
      )
    }

    const body = await req.json()
    const { message, conversationId, context, pageUrl, isFirstMessage } = body

    const response = await fetch(`${backendUrl.replace(/\/$/, "")}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.API_KEY && { Authorization: `Bearer ${process.env.API_KEY}` }),
      },
      body: JSON.stringify({
        message,
        conversationId,
        context,
        pageUrl,
        isFirstMessage,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      return NextResponse.json(
        {
          error: "Chat backend responded with an error",
          details: errorText,
        },
        { status: response.status }
      )
    }

    const data = await response.json()
    return NextResponse.json(data)
  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      {
        error: "Chat service is temporarily unavailable.",
      },
      { status: 502 }
    )
  }
}
