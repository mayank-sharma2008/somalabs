import { auth } from "@clerk/nextjs/server"
import { routeChat } from "@/lib/gateway/router"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()

    if (!userId) {
      return NextResponse.json(
        { success: false, error: "Unauthorized" },
        { status: 401 }
      )
    }

    const { messages, provider, model, maxTokens } = await req.json()

    if (!messages || messages.length === 0) {
      return NextResponse.json(
        { success: false, error: "No messages provided" },
        { status: 400 }
      )
    }

    const response = await routeChat(
      messages,
      {
        model,
        maxTokens: maxTokens ?? 1024
      },
      provider
    )

    return NextResponse.json(response)

  } catch (error) {
    console.error("Chat API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}