interface ImageResult {
  success: boolean
  imageUrl?: string
  provider?: string
  error?: string
}

export async function generateImageWithFallback(
  prompt: string,
  width: string,
  height: string
): Promise<ImageResult> {
  // ── Try Pollinations first (your existing, currently-working provider) ──
  try {
    const encodedPrompt = encodeURIComponent(prompt)
    const pollinationsUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=${width}&height=${height}&nologo=true`

    const res = await fetch(pollinationsUrl)
    if (res.ok) {
      const buffer = await res.arrayBuffer()
      const base64 = Buffer.from(buffer).toString("base64")
      const contentType = res.headers.get("content-type") || "image/jpeg"
      return {
        success: true,
        imageUrl: `data:${contentType};base64,${base64}`,
        provider: "pollinations",
      }
    }
    console.warn(`[fallback] Pollinations failed (${res.status}), trying Hugging Face...`)
  } catch (err) {
    console.error("[fallback] Pollinations threw an error:", err)
  }

  // ── Fallback: Hugging Face Inference API (Stable Diffusion) ──
  if (process.env.HUGGINGFACE_API_KEY) {
    try {
      const res = await fetch(
        "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion-xl-base-1.0",
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ inputs: prompt }),
        }
      )

      if (res.ok) {
        const buffer = await res.arrayBuffer()
        const base64 = Buffer.from(buffer).toString("base64")
        return {
          success: true,
          imageUrl: `data:image/jpeg;base64,${base64}`,
          provider: "huggingface",
        }
      }
      console.error(`[fallback] Hugging Face also failed (${res.status})`)
    } catch (err) {
      console.error("[fallback] Hugging Face threw an error:", err)
    }
  }

  return { success: false, error: "All image providers are currently unavailable. Please try again shortly." }
}