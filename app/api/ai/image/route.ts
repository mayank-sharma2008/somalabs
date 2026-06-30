import { auth } from "@clerk/nextjs/server"
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

    const { prompt, width = "1024", height = "1024" } = await req.json()

    if (!prompt) {
      return NextResponse.json(
        { success: false, error: "No prompt provided" },
        { status: 400 }
      )
    }

    const encodedPrompt = encodeURIComponent(prompt)
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true&enhance=true`

    // Pre-fetch the image to make sure it's generated
    const imageResponse = await fetch(imageUrl)
    
    if (!imageResponse.ok) {
      return NextResponse.json(
        { success: false, error: "Failed to generate image" },
        { status: 500 }
      )
    }

    return NextResponse.json({ 
      success: true, 
      imageUrl,
      prompt 
    })

  } catch (error) {
    console.error("Image API error:", error)
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    )
  }
}