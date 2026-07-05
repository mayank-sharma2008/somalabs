"use client"

import { Sparkles, ImageIcon, Code, Search, Music, Video } from "lucide-react"
import type { Capability } from "./types"

export const capabilities: {
  label: string
  value: Capability
  icon: any
  description: string
}[] = [
  { label: "General", value: "general", icon: Sparkles, description: "Auto-select the right tool" },
  { label: "Image", value: "image", icon: ImageIcon, description: "Prioritize image generation" },
  { label: "Code", value: "code", icon: Code, description: "Prioritize code generation" },
  { label: "Search", value: "search", icon: Search, description: "Prioritize web search" },
  { label: "Audio", value: "audio", icon: Music, description: "Prioritize text-to-speech" },
  { label: "Video", value: "video", icon: Video, description: "Prioritize animated clips" },
]

export function detectIntent(prompt: string): Exclude<Capability, "general"> {
  const p = prompt.toLowerCase()

  if (
    /\b(generate|create|draw|design|paint|make|show me|produce).{0,30}(image|photo|picture|logo|icon|illustration|artwork|banner|poster|portrait|thumbnail|visual|render|sketch)\b/.test(p) ||
    /\b(image|photo|picture|logo|illustration|artwork) of\b/.test(p) ||
    /\b(futuristic|cinematic|realistic|artistic|anime|pixel art)\b.{0,20}(image|photo|picture|logo|style)\b/.test(p)
  ) return "image"

  if (
    /\b(video|film|animation|reel|clip|footage|cinematic|motion|animated)\b/.test(p) &&
    /\b(create|make|generate|produce|build)\b/.test(p)
  ) return "video"

  if (
    /\b(speak|say aloud|read out|narrate|voice|tts|text.to.speech|audio of|speech)\b/.test(p) ||
    /\b(convert|turn).{0,20}(text|this).{0,20}(speech|audio|voice)\b/.test(p)
  ) return "audio"

  if (
    /\b(latest|breaking|today|current|recent|news|trending|what happened|stock price|weather|live|2024|2025|2026)\b/.test(p) ||
    /\b(search|look up|find|google|what is the)\b.{0,20}\b(latest|current|today|now|recent)\b/.test(p)
  ) return "search"

  if (
    /\b(write|build|create|implement|generate|code|script|function|class|component|api|endpoint|website|app|page|program|algorithm|debug|fix|refactor)\b.{0,30}\b(in|using|with|for)?\b.{0,15}\b(javascript|typescript|python|react|next\.?js|html|css|node|sql|rust|go|java|swift|kotlin|php)\b/.test(p) ||
    /\b(write me|build me|create me|code)\b.{0,20}\b(a|an|the)\b.{0,20}\b(function|component|class|script|page|app|website|api|backend|frontend|hook|util|helper)\b/.test(p) ||
    /\b(how do i|how to|show me how).{0,30}(code|implement|build|create|program|develop)\b/.test(p)
  ) return "code"

  return "chat" as any
}

export const systemPrompts: Record<string, string> = {
  chat: `You are Soma, the AI assistant built by SomaLabs. Format your responses with markdown.
Use **bold** for emphasis, \`code\` for inline code, code blocks for longer code, and bullet points for lists.
Be concise but thorough. Match the user's tone.

If asked who you are or what you can do, answer as Soma — do not claim to be built by OpenAI, Google, or any other company, and do not state a specific knowledge cutoff date, since your underlying models change over time.

Soma has several modes the user can switch between using the capability chips above the input box:
- General — everyday conversation and Q&A (this mode)
- Image — generates images from text prompts
- Code — writes and explains code
- Search — answers using live web search results with citations
- Audio — generates spoken-style text and reads it aloud via text-to-speech
- Video — generates short animated video frames from a prompt

Soma can also read attached files — images, PDFs, Word documents, text files, and CSVs — when the user uploads them via the attachment (paperclip) button.`,

  code: `You are Soma's code engine — an elite full-stack engineer who builds real, runnable projects, not toy snippets. Think Claude Code, Replit, or Lovable.

OUTPUT FORMAT — always structure your response exactly like this:
1. One or two sentences describing what you built or changed.
2. Then, one block per file using this exact marker format (no markdown code fences around them):

===FILE: /App.js===
<complete file content>
===FILE: /components/Header.js===
<complete file content>

RULES:
- Always output the COMPLETE current content of every relevant file — never partial diffs, never "// ... rest unchanged" placeholders.
- Default stack: React (function components, hooks). Tailwind CSS is already available — don't import it, just use the classes.
- The main component file must be /App.js with "export default function App()".
- Split larger UIs into multiple files under /components/ rather than one giant file.
- If the user's message includes "Current project files", they're asking you to MODIFY an existing project — output the full updated set of files reflecting the change, including any files that didn't change.
- Never use \`\`\` code fences around the ===FILE=== blocks — the raw marker format is required for parsing.`,

  search: `You are Soma's search engine. Answer using ONLY the sources provided.
Cite inline using [1], [2], etc. Be concise and direct.`,

  audio: `You are Soma's speech writer. The user wants something read aloud, so write natural, flowing spoken-style text for their request.
Do not use markdown, headers, bullet points, asterisks, or code formatting — none of that survives being spoken aloud.
Write in complete, natural sentences the way a person would actually speak them. Keep it well-paced and not overly long unless the user asks for something lengthy.`,
}

export function CapabilityChip({
  cap, active, onClick,
}: {
  cap: (typeof capabilities)[0]
  active: boolean
  onClick: () => void
}) {
  return (
    <button
      onClick={onClick}
      title={cap.description}
      style={{
        display: "inline-flex", alignItems: "center", gap: "6px",
        padding: "6px 14px", borderRadius: "999px", fontSize: "13px",
        fontWeight: active ? 600 : 400,
        border: active ? "1px solid rgba(255,255,255,0.2)" : "1px solid #1A1A1A",
        background: active ? "#ffffff" : "#0D0D0D",
        color: active ? "#000000" : "#6B6B6B",
        cursor: "pointer", transition: "all 0.18s ease",
        boxShadow: active ? "0 0 16px rgba(255,255,255,0.12)" : "none",
        userSelect: "none" as const, WebkitUserSelect: "none" as const,
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = "#D4D4D4"
          e.currentTarget.style.borderColor = "#2A2A2A"
          e.currentTarget.style.transform = "translateY(-1px)"
          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0,0,0,0.4)"
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = "#6B6B6B"
          e.currentTarget.style.borderColor = "#1A1A1A"
          e.currentTarget.style.transform = "translateY(0)"
          e.currentTarget.style.boxShadow = "none"
        }
      }}
    >
      <cap.icon size={12} />
      {cap.label}
    </button>
  )
}

export function CapabilityBadge({ cap }: { cap?: Capability }) {
  if (!cap || cap === "general") return null
  const found = capabilities.find((c) => c.value === cap)
  if (!found) return null
  return (
    <span
      className="inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
      style={{ background: "#0D0D0D", color: "#6B6B6B", border: "1px solid #1A1A1A" }}
    >
      <found.icon size={9} />
      {found.label}
    </span>
  )
}