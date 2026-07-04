import { auth } from "@clerk/nextjs/server"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) {
      return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
    }

    const { prompt, width = "1024", height = "1024" } = await req.json()

    if (!prompt) {
      return NextResponse.json({ success: false, error: "No prompt provided" }, { status: 400 })
    }

    const apiKey = process.env.POLLINATIONS_API_KEY
    if (!apiKey) {
      console.error("POLLINATIONS_API_KEY is not set")
      return NextResponse.json({ success: false, error: "Image generation is not configured" }, { status: 500 })
    }

    const encodedPrompt = encodeURIComponent(prompt)
    const sourceUrl = `https://gen.pollinations.ai/image/${encodedPrompt}?width=${width}&height=${height}&nologo=true&enhance=true`

    const imageResponse = await fetch(sourceUrl, {
      headers: { Authorization: `Bearer ${apiKey}` },
    })

    if (!imageResponse.ok) {
      const errText = await imageResponse.text().catch(() => "")
      console.error("Pollinations error:", imageResponse.status, errText)
      return NextResponse.json({ success: false, error: "Failed to generate image" }, { status: 500 })
    }

    // Proxy the bytes ourselves so the API key never reaches the browser
    const contentType = imageResponse.headers.get("content-type") || "image/jpeg"
    const buffer = Buffer.from(await imageResponse.arrayBuffer())
    const dataUrl = `data:${contentType};base64,${buffer.toString("base64")}`

    return NextResponse.json({ success: true, imageUrl: dataUrl, prompt })
  } catch (error) {
    console.error("Image API error:", error)
    return NextResponse.json({ success: false, error: "Internal server error" }, { status: 500 })
  }
}