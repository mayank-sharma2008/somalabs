"use client"

import { useState } from "react"
import { Sparkles, Download, Image as ImageIcon, Loader2 } from "lucide-react"

const styles = [
  { label: "Realistic", value: "realistic" },
  { label: "Anime", value: "anime" },
  { label: "Digital Art", value: "digital art" },
  { label: "Oil Painting", value: "oil painting" },
  { label: "Sketch", value: "sketch" },
  { label: "Cinematic", value: "cinematic" },
]

const suggestions = [
  "A futuristic city at night with neon lights",
  "A wolf howling at the moon in a forest",
  "An astronaut floating in colorful nebula",
  "A cozy coffee shop on a rainy day",
  "A dragon flying over mountains at sunset",
  "A robot painting in an art studio",
]

export default function ImagePage() {
  const [prompt, setPrompt] = useState("")
  const [style, setStyle] = useState("realistic")
  const [loading, setLoading] = useState(false)
  const [imageUrl, setImageUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  async function generateImage() {
    if (!prompt.trim() || loading) return
    setLoading(true)
    setError(null)
    setImageUrl(null)

    try {
      const response = await fetch("/api/ai/image", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: `${prompt}, ${style} style` })
      })

      const data = await response.json()

      if (data.success && data.imageUrl) {
        setImageUrl(data.imageUrl)
      } else {
        setError(data.error ?? "Failed to generate image")
      }
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full max-w-5xl mx-auto">

      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-7 h-7 rounded-lg bg-purple-500/20 
        border border-purple-500/30 flex items-center justify-center">
          <ImageIcon size={14} className="text-purple-400" />
        </div>
        <div>
          <h2 className="text-sm font-medium">Image Generation</h2>
          <p className="text-xs text-white/30">
            Powered by Pollinations AI
          </p>
        </div>
      </div>

      <div className="flex gap-6 flex-1 min-h-0">

        {/* Left — controls */}
        <div className="w-80 shrink-0 flex flex-col gap-4">

          {/* Prompt */}
          <div>
            <label className="text-xs text-white/40 mb-2 block">
              Describe your image
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault()
                  generateImage()
                }
              }}
              placeholder="A beautiful sunset over mountains..."
              rows={4}
              className="w-full bg-white/[0.04] border border-white/10
              rounded-xl px-4 py-3 text-sm text-white
              placeholder:text-white/20 resize-none
              focus:outline-none focus:border-white/25
              transition-all duration-200"
            />
          </div>

          {/* Style selector */}
          <div>
            <label className="text-xs text-white/40 mb-2 block">
              Style
            </label>
            <div className="grid grid-cols-3 gap-2">
              {styles.map((s) => (
                <button
                  key={s.value}
                  onClick={() => setStyle(s.value)}
                  className={`px-2 py-1.5 rounded-lg text-xs
                  transition-all duration-200 border
                  ${style === s.value
                    ? "bg-white/15 border-white/30 text-white"
                    : "bg-white/[0.03] border-white/8 text-white/40 hover:text-white/70"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          {/* Generate button */}
          <button
            onClick={generateImage}
            disabled={!prompt.trim() || loading}
            className="w-full py-3 rounded-xl bg-white text-black
            text-sm font-medium flex items-center justify-center gap-2
            hover:bg-white/90 transition-all duration-200
            disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {loading ? (
              <>
                <Loader2 size={16} className="animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles size={16} />
                Generate Image
              </>
            )}
          </button>

          {/* Suggestions */}
          <div>
            <label className="text-xs text-white/40 mb-2 block">
              Try these prompts
            </label>
            <div className="flex flex-col gap-1.5">
              {suggestions.map((s) => (
                <button
                  key={s}
                  onClick={() => setPrompt(s)}
                  className="text-left px-3 py-2 rounded-lg text-xs
                  text-white/40 hover:text-white/70
                  bg-white/[0.02] hover:bg-white/[0.05]
                  border border-white/[0.05] hover:border-white/15
                  transition-all duration-200"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Right — image display */}
        <div className="flex-1 flex flex-col">
          <div className="flex-1 rounded-2xl border border-white/10
          bg-white/[0.02] flex items-center justify-center
          overflow-hidden relative">

            {/* Empty state */}
            {!imageUrl && !loading && !error && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-white/[0.03]
                border border-white/8 flex items-center justify-center
                mx-auto mb-4">
                  <ImageIcon size={28} className="text-white/20" />
                </div>
                <p className="text-sm text-white/30">
                  Your image will appear here
                </p>
                <p className="text-xs text-white/15 mt-1">
                  Enter a prompt and click generate
                </p>
              </div>
            )}

            {/* Loading state */}
            {loading && (
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-purple-500/10
                border border-purple-500/20 flex items-center
                justify-center mx-auto mb-4">
                  <Loader2 size={28} className="text-purple-400 animate-spin" />
                </div>
                <p className="text-sm text-white/50">
                  Generating your image...
                </p>
                <p className="text-xs text-white/20 mt-1">
                  This may take a few seconds
                </p>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="text-center">
                <p className="text-sm text-red-400">{error}</p>
                <button
                  onClick={generateImage}
                  className="mt-3 text-xs text-white/40 
                  hover:text-white/70 underline"
                >
                  Try again
                </button>
              </div>
            )}

            {/* Generated image */}
            {imageUrl && (
              <>
                <img
                  src={imageUrl}
                  alt={prompt}
                  className="w-full h-full object-contain"
                />
                <button
                  onClick={() => window.open(imageUrl, "_blank")}
                  className="absolute bottom-4 right-4
                  flex items-center gap-2 px-3 py-2
                  bg-black/60 backdrop-blur-sm
                  border border-white/20 rounded-lg
                  text-xs text-white/70 hover:text-white
                  transition-all duration-200"
                >
                  <Download size={13} />
                  Download
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}