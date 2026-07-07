"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import {
  ArrowUp,
  ChevronDown,
  Sparkles,
  ImageIcon,
  Code,
  Search,
  Music,
  Video,
  Copy,
  Check,
  Play,
  Download,
  Loader2,
  RefreshCw,
  Pause,
  Square,
  Paperclip,
  FileText,
  X,
  Pencil,
  ThumbsUp,
  ThumbsDown,
} from "lucide-react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import remarkGfm from "remark-gfm"
import CodePreview from "./CodePreview"
import SearchSources from "./SearchSources"

// ─── Types ────────────────────────────────────────────────────────────────────

type Capability = "general" | "image" | "code" | "search" | "audio" | "video"

interface Source {
  index: number
  title: string
  url: string
  snippet: string
}

interface Attachment {
  id: string
  name: string
  type: "image" | "document"
  mimeType: string
  url: string
  extractedText?: string
  size: number
}

interface UploadingFile {
  name: string
  type: "image" | "document"
  localPreview?: string
}

interface Message {
  role: "user" | "assistant"
  content: string
  type: "text" | "image" | "audio" | "video"
  imageUrl?: string
  capability?: Capability
  provider?: string
  model?: string
  sources?: Source[]
  attachments?: Attachment[]
  timestamp?: number
}

// ─── Capability chips config ───────────────────────────────────────────────────

const capabilities: {
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

// ─── Intent detection ──────────────────────────────────────────────────────────

function detectIntent(prompt: string): Exclude<Capability, "general"> {
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

// ─── System prompts ────────────────────────────────────────────────────────────

const systemPrompts: Record<string, string> = {
  chat: `You are Soma, an intelligent AI assistant. Format your responses with markdown.
Use **bold** for emphasis, \`code\` for inline code, code blocks for longer code, and bullet points for lists.
Never use raw HTML tags like <br> — use a blank line for paragraph breaks, and use actual markdown table syntax (| col | col |) for tables, not HTML.
Be concise but thorough. Match the user's tone.`,

  code: `You are Soma's code engine — an elite engineer who writes beautiful, production-grade code.

REACT/JSX RULES:
- Always start with: import { useState } from "react"
- Always end with: export default function App() { ... }
- Use Tailwind CSS classes for ALL styling — make it look polished and premium
- Write COMPLETE, working code — never truncate or use placeholder comments

HTML RULES:
- Write complete HTML with inline <style> using modern CSS

GENERAL:
- Use markdown code blocks with correct language identifier (\`\`\`jsx, \`\`\`html, \`\`\`python, etc.)
- Write COMPLETE code. Never truncate.
- Never use raw HTML tags like <br> outside of actual HTML code blocks — use a blank line for paragraph breaks in your explanations.
- Briefly explain key features after the code.`,

  search: `You are Soma's search engine. Answer using ONLY the sources provided.
Cite inline using [1], [2], etc. Never use raw HTML tags like <br> — use blank lines for paragraph breaks.
Be concise and direct.`,
}

// ─── Capability chip component ─────────────────────────────────────────────────

function CapabilityChip({
  cap,
  active,
  onClick,
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
        display: "inline-flex",
        alignItems: "center",
        gap: "6px",
        padding: "6px 14px",
        borderRadius: "999px",
        fontSize: "13px",
        fontWeight: active ? 600 : 400,
        border: active ? "1px solid rgba(255,255,255,0.2)" : "1px solid #1A1A1A",
        background: active ? "#ffffff" : "#0D0D0D",
        color: active ? "#000000" : "#6B6B6B",
        cursor: "pointer",
        transition: "all 0.18s ease",
        boxShadow: active ? "0 0 16px rgba(255,255,255,0.12)" : "none",
        transform: "translateY(0)",
        whiteSpace: "nowrap",
        userSelect: "none" as const,
        WebkitUserSelect: "none" as const,
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

// ─── Attachment menu (the "+" popup) — inlined, no external file needed ───────

function AttachmentMenu({ onFilesSelected }: { onFilesSelected: (files: File[]) => void }) {
  const [open, setOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const imageInputRef = useRef<HTMLInputElement>(null)
  const docInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? [])
    if (files.length) onFilesSelected(files)
    e.target.value = ""
    setOpen(false)
  }

  return (
    <div className="relative" ref={menuRef}>
      <input
        ref={imageInputRef}
        type="file"
        accept="image/png,image/jpeg,image/webp,image/gif"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />
      <input
        ref={docInputRef}
        type="file"
        accept=".pdf,.txt,.docx,application/pdf,text/plain,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
        multiple
        className="hidden"
        onChange={handleFileChange}
      />

      <button
        type="button"
        onClick={() => setOpen((p) => !p)}
        title="Attach files"
        className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-colors duration-150"
        style={{ background: "#1A1A1A", color: "#A3A3A3" }}
      >
        <Paperclip size={14} />
      </button>

      {open && (
        <div
          className="absolute bottom-full left-0 mb-2 w-56 rounded-xl overflow-hidden shadow-2xl z-50"
          style={{ background: "#121212", border: "1px solid #2A2A2A" }}
        >
          <button
            type="button"
            onClick={() => imageInputRef.current?.click()}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left transition-colors duration-150"
            style={{ color: "#E5E5E5" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1A1A1A")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <ImageIcon size={15} style={{ color: "#A3A3A3" }} />
            Add photos
          </button>
          <button
            type="button"
            onClick={() => docInputRef.current?.click()}
            className="flex items-center gap-3 w-full px-4 py-3 text-sm text-left transition-colors duration-150"
            style={{ color: "#E5E5E5" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#1A1A1A")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <FileText size={15} style={{ color: "#A3A3A3" }} />
            Add documents
          </button>
        </div>
      )}
    </div>
  )
}

// ─── Attachment chip preview — inlined, no external file needed ──────────────

function AttachmentChip({
  attachment,
  uploading,
  onRemove,
}: {
  attachment: Attachment | UploadingFile
  uploading?: boolean
  onRemove: () => void
}) {
  const isImage = attachment.type === "image"
  const preview = "url" in attachment ? attachment.url : attachment.localPreview

  return (
    <div
      className="relative flex items-center gap-2 pl-2 pr-1 py-1.5 rounded-xl shrink-0"
      style={{ background: "#0D0D0D", border: "1px solid #1A1A1A" }}
    >
      {isImage && preview ? (
        <img src={preview} alt={attachment.name} className="w-8 h-8 rounded-lg object-cover" />
      ) : (
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: "#1A1A1A" }}
        >
          <FileText size={14} style={{ color: "#A3A3A3" }} />
        </div>
      )}
      <span className="text-xs max-w-[110px] truncate" style={{ color: "#D4D4D4" }}>
        {attachment.name}
      </span>
      {uploading ? (
        <Loader2 size={12} className="animate-spin mx-1.5" style={{ color: "#6B6B6B" }} />
      ) : (
        <button
          type="button"
          onClick={onRemove}
          className="w-5 h-5 rounded-full flex items-center justify-center shrink-0"
          style={{ background: "#1A1A1A", color: "#6B6B6B" }}
        >
          <X size={11} />
        </button>
      )}
    </div>
  )
}

// ─── Message action bar ─────────────────────────────────────────────────────────

function ActionIconButton({
  onClick,
  title,
  active,
  activeColor,
  children,
}: {
  onClick: () => void
  title: string
  active?: boolean
  activeColor?: string
  children: React.ReactNode
}) {
  return (
    <button
      onClick={onClick}
      title={title}
      className="w-6 h-6 rounded-lg flex items-center justify-center transition-colors duration-150"
      style={{ color: active ? activeColor ?? "#ffffff" : "#6B6B6B", background: "transparent" }}
      onMouseEnter={(e) => {
        e.currentTarget.style.background = "#1A1A1A"
        if (!active) e.currentTarget.style.color = "#A3A3A3"
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent"
        if (!active) e.currentTarget.style.color = "#6B6B6B"
      }}
    >
      {children}
    </button>
  )
}

function MessageActions({
  role,
  timestamp,
  onCopy,
  onRegenerate,
  onEdit,
  onFeedback,
  feedback,
}: {
  role: "user" | "assistant"
  timestamp?: number
  onCopy: () => void
  onRegenerate?: () => void
  onEdit?: () => void
  onFeedback?: (type: "up" | "down") => void
  feedback?: "up" | "down" | null
}) {
  const [copied, setCopied] = useState(false)

  function handleCopyClick() {
    onCopy()
    setCopied(true)
    setTimeout(() => setCopied(false), 1500)
  }

  const timeLabel = timestamp
    ? new Date(timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
    : null

  return (
    <div className={`flex items-center gap-0.5 mt-1.5 ${role === "user" ? "justify-end" : ""}`}>
      {role === "user" && timeLabel && (
        <span className="text-[10px] mr-1 select-none" style={{ color: "#4B4B4B" }}>
          {timeLabel}
        </span>
      )}

      {onRegenerate && (
        <ActionIconButton onClick={onRegenerate} title="Regenerate">
          <RefreshCw size={12} />
        </ActionIconButton>
      )}

      {onEdit && (
        <ActionIconButton onClick={onEdit} title="Edit">
          <Pencil size={12} />
        </ActionIconButton>
      )}

      <ActionIconButton onClick={handleCopyClick} title="Copy">
        {copied ? <Check size={12} /> : <Copy size={12} />}
      </ActionIconButton>

      {onFeedback && (
        <>
          <ActionIconButton
            onClick={() => onFeedback("up")}
            title="Good response"
            active={feedback === "up"}
            activeColor="#4ADE80"
          >
            <ThumbsUp size={12} />
          </ActionIconButton>
          <ActionIconButton
            onClick={() => onFeedback("down")}
            title="Bad response"
            active={feedback === "down"}
            activeColor="#FF6B6B"
          >
            <ThumbsDown size={12} />
          </ActionIconButton>
        </>
      )}

      {role === "assistant" && timeLabel && (
        <span className="text-[10px] ml-1 select-none" style={{ color: "#4B4B4B" }}>
          {timeLabel}
        </span>
      )}
    </div>
  )
}

// ─── CodeBlock ────────────────────────────────────────────────────────────────

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const previewable = ["jsx", "js", "javascript", "html", "react", "tsx", "typescript"]
  const canPreview = previewable.includes(language.toLowerCase())

  return (
    <>
      <div className="my-3 rounded-xl overflow-hidden" style={{ border: "1px solid #1A1A1A" }}>
        <div className="flex items-center justify-between px-4 py-1.5" style={{ background: "#0D0D0D", borderBottom: "1px solid #1A1A1A" }}>
          <span className="text-xs font-mono" style={{ color: "#6B6B6B" }}>{language || "code"}</span>
          <div className="flex items-center gap-3">
            {canPreview && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: "#6B6B6B" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#A3A3A3")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6B6B6B")}
              >
                <Play size={10} />
                Preview
              </button>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs transition-colors"
              style={{ color: "#6B6B6B" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#A3A3A3")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B6B6B")}
            >
              {copied ? <><Check size={10} />Copied</> : <><Copy size={10} />Copy</>}
            </button>
          </div>
        </div>
        <pre className="p-4 overflow-auto text-xs font-mono leading-relaxed" style={{ background: "#000000", color: "#4ADE80" }}>
          <code>{code}</code>
        </pre>
      </div>
      {showPreview && (
        <CodePreview code={code} language={language} onClose={() => setShowPreview(false)} />
      )}
    </>
  )
}

// ─── Markdown renderer ────────────────────────────────────────────────────────

function SomaMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm" style={{ color: "#D4D4D4", lineHeight: "1.8" }}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => <h1 className="text-lg sm:text-xl font-semibold mb-4 mt-2" style={{ color: "#ffffff" }}>{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mb-3 mt-5" style={{ color: "#ffffff" }}>{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-4" style={{ color: "#E5E5E5" }}>{children}</h3>,
          p: ({ children }) => <p className="mb-3 last:mb-0" style={{ lineHeight: "1.8" }}>{children}</p>,
          strong: ({ children }) => <strong className="font-semibold" style={{ color: "#ffffff" }}>{children}</strong>,
          em: ({ children }) => <em className="italic" style={{ color: "#A3A3A3" }}>{children}</em>,
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-")
            const lang = className?.replace("language-", "") ?? ""
            if (isBlock) {
              return <CodeBlock language={lang} code={String(children).replace(/\n$/, "")} />
            }
            return (
              <code className="px-1.5 py-0.5 rounded text-xs font-mono" style={{ background: "#0D0D0D", color: "#4ADE80", border: "1px solid #1A1A1A" }}>
                {children}
              </code>
            )
          },
          ul: ({ children }) => <ul className="mb-3 space-y-1.5 pl-4" style={{ listStyleType: "disc" }}>{children}</ul>,
          ol: ({ children }) => <ol className="mb-3 space-y-1.5 pl-4" style={{ listStyleType: "decimal" }}>{children}</ol>,
          li: ({ children }) => <li style={{ color: "#D4D4D4", lineHeight: "1.8" }}>{children}</li>,
          hr: () => <hr className="my-6" style={{ borderColor: "#1A1A1A" }} />,
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 pl-4 my-4 italic" style={{ borderColor: "#2A2A2A", color: "#6B6B6B" }}>
              {children}
            </blockquote>
          ),
          table: ({ children }) => (
            <div className="my-4 overflow-x-auto rounded-lg" style={{ border: "1px solid #1A1A1A" }}>
              <table className="w-full text-sm border-collapse">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead style={{ background: "#0D0D0D" }}>{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr style={{ borderBottom: "1px solid #1A1A1A" }}>{children}</tr>
          ),
          th: ({ children }) => (
            <th className="text-left px-3 py-2 font-semibold" style={{ color: "#ffffff" }}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className="px-3 py-2 align-top" style={{ color: "#D4D4D4" }}>
              {children}
            </td>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}

// ─── Main component ────────────────────────────────────────────────────────────

export default function DashboardPage() {
  const [activeCapability, setActiveCapability] = useState<Capability>("general")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [currentlyGenerating, setCurrentlyGenerating] = useState<string>("")
  const [feedbackMap, setFeedbackMap] = useState<Record<number, "up" | "down">>({})

  // Attachments
  const [pendingAttachments, setPendingAttachments] = useState<Attachment[]>([])
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([])

  // Web Speech API
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [audioVoice, setAudioVoice] = useState<string>("")
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, loading])

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    function loadVoices() {
      const v = window.speechSynthesis.getVoices()
      if (v.length > 0) {
        setVoices(v)
        setAudioVoice((prev) => prev || v[0].voiceURI)
      }
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  function speakMessage(index: number, text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    if (speakingIndex === index) {
      if (isPaused) {
        window.speechSynthesis.resume()
        setIsPaused(false)
      } else {
        window.speechSynthesis.pause()
        setIsPaused(true)
      }
      return
    }
    window.speechSynthesis.cancel()
    const utterance = new SpeechSynthesisUtterance(text)
    const v = voices.find((v) => v.voiceURI === audioVoice)
    if (v) utterance.voice = v
    utterance.onend = () => setSpeakingIndex(null)
    utterance.onerror = () => setSpeakingIndex(null)
    setSpeakingIndex(index)
    setIsPaused(false)
    window.speechSynthesis.speak(utterance)
  }

  function stopSpeaking() {
    if (typeof window !== "undefined" && window.speechSynthesis) window.speechSynthesis.cancel()
    setSpeakingIndex(null)
    setIsPaused(false)
  }

  async function persist(userInput: string, assistantContent: string, meta?: Record<string, any>) {
    if (!conversationId) {
      try {
        const res = await fetch("/api/ai/conversations", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            title: userInput.slice(0, 60),
            model: activeCapability === "general" ? "auto" : activeCapability,
            mode: activeCapability === "general" ? "chat" : activeCapability,
            messages: [
              { role: "user", content: userInput },
              { role: "assistant", content: assistantContent, metadata: meta ?? null },
            ],
          }),
        })
        const data = await res.json()
        if (data.id) setConversationId(data.id)
      } catch (e) {
        console.error(e)
      }
    } else {
      try {
        await fetch("/api/ai/conversations/messages", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            conversationId,
            messages: [
              { role: "user", content: userInput },
              { role: "assistant", content: assistantContent, metadata: meta ?? null },
            ],
          }),
        })
      } catch (e) {
        console.error(e)
      }
    }
  }

  // ── Attachments ──────────────────────────────────────────────────────────

  async function handleFilesSelected(files: File[]) {
    for (const file of files) {
      const isImage = file.type.startsWith("image/")
      const localPreview = isImage ? URL.createObjectURL(file) : undefined

      setUploadingFiles((prev) => [
        ...prev,
        { name: file.name, type: isImage ? "image" : "document", localPreview },
      ])

      try {
        const formData = new FormData()
        formData.append("file", file)
        const res = await fetch("/api/ai/upload", { method: "POST", body: formData })
        const data = await res.json()

        if (data.success) {
          setPendingAttachments((prev) => [
            ...prev,
            {
              id: data.id,
              name: data.name,
              type: data.type,
              mimeType: data.mimeType,
              url: data.url,
              extractedText: data.extractedText,
              size: data.size,
            },
          ])
        } else {
          console.error("Upload failed:", data.error)
        }
      } catch (e) {
        console.error("Upload error:", e)
      } finally {
        setUploadingFiles((prev) => prev.filter((f) => f.name !== file.name))
      }
    }
  }

  function removePendingAttachment(id: string) {
    setPendingAttachments((prev) => prev.filter((a) => a.id !== id))
  }

  // ── Core generation logic — shared by first send AND regenerate ──────────
  const runTurn = useCallback(
    async (
      userInput: string,
      attachmentsForThisMessage: Attachment[],
      historyForModel: Message[],
      forcedCapability?: Capability
    ) => {
      let resolvedTool: Exclude<Capability, "general"> =
        forcedCapability && forcedCapability !== "general"
          ? (forcedCapability as Exclude<Capability, "general">)
          : activeCapability === "general"
          ? detectIntent(userInput)
          : (activeCapability as Exclude<Capability, "general">)

      if (!forcedCapability && activeCapability !== "general") {
        resolvedTool = activeCapability as Exclude<Capability, "general">
      }

      try {
        if (resolvedTool === "image") {
          setCurrentlyGenerating("Generating image...")
          const res = await fetch("/api/ai/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: `${userInput}, highly detailed, 4k quality`, width: "1024", height: "1024" }),
          })
          const data = await res.json()
          if (data.success && data.imageUrl) {
            setMessages((prev) => [...prev, { role: "assistant", content: userInput, type: "image", imageUrl: data.imageUrl, capability: "image", timestamp: Date.now() }])
            await persist(userInput, userInput, { imageUrl: data.imageUrl })
          } else {
            setMessages((prev) => [...prev, { role: "assistant", content: "Failed to generate the image. Please try again.", type: "text", capability: "image", timestamp: Date.now() }])
          }
        } else if (resolvedTool === "search") {
          setCurrentlyGenerating("Searching the web...")
          const res = await fetch("/api/ai/search", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ query: userInput }),
          })
          const data = await res.json()
          const content = data.answer || "No results found."
          setMessages((prev) => [...prev, { role: "assistant", content, type: "text", sources: data.sources, capability: "search", timestamp: Date.now() }])
          await persist(userInput, content)
        } else if (resolvedTool === "audio") {
          setCurrentlyGenerating("Preparing speech...")
          setMessages((prev) => [...prev, { role: "assistant", content: userInput, type: "audio", capability: "audio", timestamp: Date.now() }])
          await persist(userInput, userInput)
        } else if (resolvedTool === "video") {
          setCurrentlyGenerating("Generating video frame...")
          const res = await fetch("/api/ai/image", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ prompt: `${userInput}, highly detailed, cinematic, 4k quality`, width: "1280", height: "768" }),
          })
          const data = await res.json()
          if (data.success && data.imageUrl) {
            setMessages((prev) => [...prev, { role: "assistant", content: userInput, type: "video", imageUrl: data.imageUrl, capability: "video", timestamp: Date.now() }])
          } else {
            setMessages((prev) => [...prev, { role: "assistant", content: "Failed to generate the video frame. Please try again.", type: "text", capability: "video", timestamp: Date.now() }])
          }
        } else {
          const isCode = resolvedTool === "code"
          const hasImage = attachmentsForThisMessage.some((a) => a.type === "image")
          const docContext = attachmentsForThisMessage
            .filter((a) => a.type === "document" && a.extractedText)
            .map((a) => `--- Content of ${a.name} ---\n${a.extractedText}`)
            .join("\n\n")

          setCurrentlyGenerating(hasImage ? "Looking at your image..." : isCode ? "Writing code..." : "Thinking...")

          const systemPrompt = isCode ? systemPrompts.code : systemPrompts.chat

          const userContent = docContext
            ? `${userInput}\n\nAttached document context:\n${docContext}`
            : userInput

          const res = await fetch("/api/ai/chat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              messages: [
                { role: "system", content: systemPrompt },
                ...historyForModel.map((m) => ({ role: m.role, content: m.content })),
                { role: "user", content: userContent },
              ],
              provider: "groq",
              imageUrl: hasImage ? attachmentsForThisMessage.find((a) => a.type === "image")?.url : undefined,
              maxTokens: isCode ? 8192 : 1024,
            }),
          })
          const data = await res.json()
          const content = data.content || "Sorry, I couldn't respond."
          setMessages((prev) => [
            ...prev,
            { role: "assistant", content, type: "text", capability: isCode ? "code" : "general", provider: data.provider, model: data.model, timestamp: Date.now() },
          ])
          await persist(userInput, content)
        }
      } catch (err) {
        console.error(err)
        setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again.", type: "text", timestamp: Date.now() }])
      }
    },
    [activeCapability, conversationId]
  )

  const handleSubmit = useCallback(async () => {
    if ((!input.trim() && pendingAttachments.length === 0) || loading) return

    const userInput = input.trim()
    const attachmentsForThisMessage = pendingAttachments
    const historyForModel = messages

    setInput("")
    setPendingAttachments([])
    setHasStarted(true)
    setLoading(true)
    if (textareaRef.current) textareaRef.current.style.height = "auto"

    setMessages((prev) => [
      ...prev,
      { role: "user", content: userInput, type: "text", attachments: attachmentsForThisMessage, timestamp: Date.now() },
    ])

    await runTurn(userInput, attachmentsForThisMessage, historyForModel)
    setLoading(false)
    setCurrentlyGenerating("")
  }, [input, loading, messages, pendingAttachments, runTurn])

  // ── Message actions: copy / regenerate / edit / feedback ─────────────────

  function handleCopyMessage(content: string) {
    navigator.clipboard.writeText(content)
  }

  async function handleRegenerate(index: number) {
    if (loading) return
    let userIdx = index - 1
    while (userIdx >= 0 && messages[userIdx].role !== "user") userIdx--
    if (userIdx < 0) return

    const userMsg = messages[userIdx]
    const historyForModel = messages.slice(0, userIdx)
    const capabilityUsed = messages[index]?.capability

    setLoading(true)
    setMessages((prev) => prev.slice(0, index))
    await runTurn(userMsg.content, userMsg.attachments ?? [], historyForModel, capabilityUsed)
    setLoading(false)
    setCurrentlyGenerating("")
  }

  function handleEditUser(index: number) {
    const msg = messages[index]
    if (msg.role !== "user" || loading) return
    setInput(msg.content)
    setMessages((prev) => prev.slice(0, index))
    setTimeout(() => textareaRef.current?.focus(), 0)
  }

  function handleFeedback(index: number, type: "up" | "down") {
    setFeedbackMap((prev) => ({ ...prev, [index]: prev[index] === type ? undefined : type } as Record<number, "up" | "down">))
  }

  function startNew() {
    stopSpeaking()
    setMessages([])
    setHasStarted(false)
    setInput("")
    setConversationId(null)
    setActiveCapability("general")
    setPendingAttachments([])
    setUploadingFiles([])
    setFeedbackMap({})
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }

  function CapabilityBadge({ cap }: { cap?: Capability }) {
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

  function AttachmentPreviewRow() {
    if (pendingAttachments.length === 0 && uploadingFiles.length === 0) return null
    return (
      <div className="flex items-center gap-2 mb-2 overflow-x-auto soma-chip-scroll">
        {pendingAttachments.map((a) => (
          <AttachmentChip key={a.id} attachment={a} onRemove={() => removePendingAttachment(a.id)} />
        ))}
        {uploadingFiles.map((f) => (
          <AttachmentChip key={f.name} attachment={f} uploading onRemove={() => {}} />
        ))}
      </div>
    )
  }

  // ─────────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full" style={{ background: "#000000" }}>
      <style>{`
        textarea::placeholder { color: #6B6B6B; }
        @keyframes kenburns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.15) translate(-2%, -2%); }
        }
        .soma-chat-scroll::-webkit-scrollbar { width: 3px; }
        .soma-chat-scroll::-webkit-scrollbar-track { background: transparent; }
        .soma-chat-scroll::-webkit-scrollbar-thumb { background: #1A1A1A; border-radius: 99px; }
        .soma-chat-scroll::-webkit-scrollbar-thumb:hover { background: #2A2A2A; }
        .soma-chat-scroll { scrollbar-width: thin; scrollbar-color: #1A1A1A transparent; }
        .soma-chip-scroll::-webkit-scrollbar { display: none; }
        .soma-chip-scroll { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>

      {/* ── Message area ─────────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-auto soma-chat-scroll">
        {!hasStarted ? (

          /* ── Hero landing ──────────────────────────────────────────────────── */
          <div className="flex flex-col items-center justify-center min-h-full px-4 sm:px-6 py-8 sm:py-12">
            <div className="w-full max-w-2xl">

              {/* Hero image */}
              <div className="relative mb-2">
                <div
                  className="absolute inset-0 pointer-events-none"
                  style={{
                    background:
                      "radial-gradient(ellipse 70% 50% at 50% 50%, rgba(168,197,255,0.06), transparent 70%)",
                    filter: "blur(24px)",
                  }}
                />
                <Image
                  src="/soma-hero-bg.png"
                  alt="SOMA — AI that evolves with you."
                  width={800}
                  height={420}
                  className="w-full object-contain relative z-10 max-h-[200px] sm:max-h-none"
                  priority
                />
              </div>

              {/* Divider */}
              <div className="mb-5 sm:mb-6" style={{ height: "1px", background: "rgba(255,255,255,0.05)" }} />

              {/* Capability chips */}
              <div className="mb-4 -mx-4 px-4 sm:mx-0 sm:px-0">
                <div className="flex items-center gap-2 overflow-x-auto soma-chip-scroll sm:flex-wrap sm:justify-center sm:overflow-visible">
                  {capabilities.map((cap) => (
                    <CapabilityChip
                      key={cap.value}
                      cap={cap}
                      active={activeCapability === cap.value}
                      onClick={() => setActiveCapability(cap.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Attachment previews */}
              <AttachmentPreviewRow />

              {/* Input */}
              <div
                className="flex items-end gap-3 px-4 py-3 sm:py-3.5 rounded-2xl"
                style={{
                  background: "#0D0D0D",
                  border: "1px solid rgba(255,255,255,0.07)",
                }}
              >
                <AttachmentMenu onFilesSelected={handleFilesSelected} />
                <textarea
                  ref={textareaRef}
                  value={input}
                  onChange={(e) => {
                    setInput(e.target.value)
                    e.target.style.height = "auto"
                    e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      handleSubmit()
                    }
                  }}
                  placeholder="What do you want to know?"
                  rows={1}
                  className="flex-1 bg-transparent text-sm resize-none focus:outline-none"
                  style={{
                    color: "#ffffff",
                    caretColor: "#ffffff",
                    minHeight: "24px",
                    maxHeight: "120px",
                    lineHeight: "1.6",
                    paddingTop: "2px",
                  }}
                />
                <button
                  onClick={handleSubmit}
                  disabled={(!input.trim() && pendingAttachments.length === 0) || loading}
                  className="w-8 h-8 rounded-full flex items-center justify-center
                  shrink-0 transition-all duration-150 active:scale-95"
                  style={{
                    background: (input.trim() || pendingAttachments.length > 0) && !loading ? "#ffffff" : "#1A1A1A",
                    marginBottom: "1px",
                  }}
                >
                  {loading
                    ? <Loader2 size={13} className="animate-spin" style={{ color: "#6B6B6B" }} />
                    : <ArrowUp size={13} style={{ color: (input.trim() || pendingAttachments.length > 0) ? "#000000" : "#6B6B6B" }} />
                  }
                </button>
              </div>

              {/* Footer */}
              <p className="text-center text-xs mt-4 px-2" style={{ color: "#4B4B4B" }}>
                By messaging Soma, you agree to our{" "}
                <a href="#" className="underline" style={{ color: "#6B6B6B" }}>Terms</a>
                {" "}and{" "}
                <a href="#" className="underline" style={{ color: "#6B6B6B" }}>Privacy Policy</a>.
              </p>
            </div>
          </div>

        ) : (

          /* ── Active conversation ─────────────────────────────────────────────── */
          <div className="min-h-full" style={{ background: "#000000" }}>
            <div className="max-w-2xl mx-auto px-4 sm:px-6 py-8 sm:py-12 space-y-6 sm:space-y-8">
              {messages.map((msg, i) => (
                <div key={i}>
                  {msg.role === "user" ? (
                    <div className="flex flex-col items-end gap-2">
                      <div className="flex justify-end w-full">
                        <div
                          className="max-w-[85%] sm:max-w-[70%] px-4 py-3 rounded-2xl rounded-br-md text-sm"
                          style={{
                            background: "#111111",
                            color: "#ffffff",
                            border: "1px solid #1E1E1E",
                            lineHeight: "1.7",
                          }}
                        >
                          {msg.attachments && msg.attachments.length > 0 && (
                            <div className="flex flex-wrap gap-1.5 mb-2">
                              {msg.attachments.map((a) => {
                                if (a.type === "image") {
                                  return (
                                    <img
                                      key={a.id}
                                      src={a.url}
                                      alt={a.name}
                                      className="w-16 h-16 rounded-lg object-cover"
                                      style={{ border: "1px solid #2A2A2A" }}
                                    />
                                  )
                                }
                                return (
                                  <a
                                    key={a.id}
                                    href={a.url}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-xs"
                                    style={{ background: "#1A1A1A", color: "#A3A3A3" }}
                                  >
                                    <FileText size={11} />
                                    {a.name}
                                  </a>
                                )
                              })}
                            </div>
                          )}
                          {msg.content}
                        </div>
                      </div>
                      <MessageActions
                        role="user"
                        timestamp={msg.timestamp}
                        onCopy={() => handleCopyMessage(msg.content)}
                        onRegenerate={() => handleRegenerate(i + 1 < messages.length ? i + 1 : i)}
                        onEdit={() => handleEditUser(i)}
                      />
                    </div>
                  ) : (
                    <div className="flex flex-col gap-2.5">
                      {/* Soma label + capability badge */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full overflow-hidden shrink-0"
                          style={{ border: "1px solid #1A1A1A" }}
                        >
                          <Image src="/logo1.png" alt="Soma" width={20} height={20} className="object-cover w-full h-full" />
                        </div>
                        <span className="text-xs font-medium" style={{ color: "#6B6B6B" }}>Soma</span>
                        <CapabilityBadge cap={msg.capability} />
                      </div>

                      {/* Content */}
                      <div className="pl-7">
                        {msg.type === "image" && msg.imageUrl ? (
                          <div className="relative group inline-block max-w-full">
                            <img
                              src={msg.imageUrl}
                              alt={msg.content}
                              className="rounded-2xl max-w-full sm:max-w-sm w-full"
                              style={{ border: "1px solid #1A1A1A" }}
                              onError={(e) => {
                                setTimeout(() => {
                                  (e.target as HTMLImageElement).src = msg.imageUrl! + "&retry=" + Date.now()
                                }, 2000)
                              }}
                            />
                            <div
                              className="absolute bottom-3 left-3 right-3 flex items-center
                              justify-between opacity-100 sm:opacity-0 sm:group-hover:opacity-100
                              transition-opacity duration-200"
                            >
                              <span
                                className="text-xs px-2 py-1 rounded-lg truncate max-w-[60%]"
                                style={{ color: "rgba(255,255,255,0.6)", background: "rgba(0,0,0,0.7)", backdropFilter: "blur(8px)" }}
                              >
                                {msg.content}
                              </span>
                              <button
                                onClick={() => window.open(msg.imageUrl, "_blank")}
                                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium"
                                style={{ background: "#ffffff", color: "#000000" }}
                              >
                                <Download size={10} />
                                Save
                              </button>
                            </div>
                          </div>
                        ) : msg.type === "video" && msg.imageUrl ? (
                          <div className="rounded-2xl overflow-hidden max-w-full sm:max-w-sm" style={{ border: "1px solid #1A1A1A" }}>
                            <div className="aspect-video overflow-hidden">
                              <img
                                src={msg.imageUrl}
                                alt={msg.content}
                                className="w-full h-full object-cover"
                                style={{ animation: "kenburns 8s ease-in-out infinite alternate" }}
                              />
                            </div>
                            <div
                              className="flex items-center justify-between px-3 py-2.5"
                              style={{ background: "#0A0A0A", borderTop: "1px solid #1A1A1A" }}
                            >
                              <span className="text-xs truncate max-w-[60%]" style={{ color: "#6B6B6B" }}>{msg.content}</span>
                              <a
                                href={msg.imageUrl}
                                download="soma-frame.jpg"
                                className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-medium"
                                style={{ background: "#1A1A1A", color: "#A3A3A3", border: "1px solid #2A2A2A" }}
                              >
                                <Download size={10} />
                                Save frame
                              </a>
                            </div>
                          </div>
                        ) : msg.type === "audio" ? (
                          <div
                            className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl max-w-full sm:max-w-sm"
                            style={{ background: "#0A0A0A", border: "1px solid #1A1A1A" }}
                          >
                            <button
                              onClick={() => speakMessage(i, msg.content)}
                              className="w-8 h-8 rounded-full flex items-center
                              justify-center shrink-0 active:scale-95 transition-all"
                              style={{ background: "#ffffff" }}
                            >
                              {speakingIndex === i && !isPaused
                                ? <Pause size={12} style={{ color: "#000000" }} />
                                : <Play size={12} style={{ color: "#000000" }} />
                              }
                            </button>
                            <p className="text-sm leading-relaxed flex-1" style={{ color: "#A3A3A3" }}>{msg.content}</p>
                            {speakingIndex === i && (
                              <button
                                onClick={stopSpeaking}
                                className="w-6 h-6 rounded-full flex items-center justify-center shrink-0"
                                style={{ background: "#1A1A1A" }}
                              >
                                <Square size={9} style={{ color: "#6B6B6B" }} />
                              </button>
                            )}
                          </div>
                        ) : (
                          <div>
                            <SomaMarkdown content={msg.content} />
                            {msg.sources && msg.sources.length > 0 && <SearchSources sources={msg.sources} />}
                          </div>
                        )}

                        <MessageActions
                          role="assistant"
                          timestamp={msg.timestamp}
                          onCopy={() => handleCopyMessage(msg.content)}
                          onRegenerate={() => handleRegenerate(i)}
                          onFeedback={(type) => handleFeedback(i, type)}
                          feedback={feedbackMap[i]}
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading */}
              {loading && (
                <div className="flex flex-col gap-2.5">
                  <div className="flex items-center gap-2">
                    <div className="w-5 h-5 rounded-full overflow-hidden shrink-0" style={{ border: "1px solid #1A1A1A" }}>
                      <Image src="/logo1.png" alt="Soma" width={20} height={20} className="object-cover w-full h-full animate-pulse" />
                    </div>
                    <span className="text-xs font-medium" style={{ color: "#6B6B6B" }}>Soma</span>
                  </div>
                  <div className="pl-7 flex items-center gap-2.5">
                    <Loader2 size={12} className="animate-spin" style={{ color: "#4B4B4B" }} />
                    <span className="text-sm" style={{ color: "#4B4B4B" }}>{currentlyGenerating || "Thinking..."}</span>
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        )}
      </div>

      {/* ── Persistent input (after first message) ───────────────────────────── */}
      {hasStarted && (
        <div className="shrink-0 px-4 sm:px-6 pb-4 sm:pb-5 pt-3" style={{ background: "#000000" }}>
          <div className="max-w-2xl mx-auto">
            {/* Capability chips */}
            <div className="mb-3 -mx-4 px-4 sm:mx-0 sm:px-0">
              <div className="flex items-center gap-2 overflow-x-auto soma-chip-scroll sm:flex-wrap sm:overflow-visible">
                {capabilities.map((cap) => (
                  <CapabilityChip
                    key={cap.value}
                    cap={cap}
                    active={activeCapability === cap.value}
                    onClick={() => setActiveCapability(cap.value)}
                  />
                ))}
              </div>
            </div>

            {/* Attachment previews */}
            <AttachmentPreviewRow />

            {/* Input */}
            <div
              className="flex items-end gap-3 px-4 py-3 sm:py-3.5 rounded-2xl"
              style={{
                background: "#0D0D0D",
                border: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <AttachmentMenu onFilesSelected={handleFilesSelected} />
              <textarea
                ref={textareaRef}
                value={input}
                onChange={(e) => {
                  setInput(e.target.value)
                  e.target.style.height = "auto"
                  e.target.style.height = `${Math.min(e.target.scrollHeight, 120)}px`
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault()
                    handleSubmit()
                  }
                }}
                placeholder="What do you want to know?"
                rows={1}
                className="flex-1 bg-transparent text-sm resize-none focus:outline-none"
                style={{
                  color: "#ffffff",
                  caretColor: "#ffffff",
                  minHeight: "24px",
                  maxHeight: "120px",
                  lineHeight: "1.6",
                  paddingTop: "2px",
                }}
              />
              <button
                onClick={handleSubmit}
                disabled={(!input.trim() && pendingAttachments.length === 0) || loading}
                className="w-8 h-8 rounded-full flex items-center justify-center
                shrink-0 transition-all duration-150 active:scale-95"
                style={{
                  background: (input.trim() || pendingAttachments.length > 0) && !loading ? "#ffffff" : "#1A1A1A",
                  marginBottom: "1px",
                }}
              >
                {loading
                  ? <Loader2 size={13} className="animate-spin" style={{ color: "#6B6B6B" }} />
                  : <ArrowUp size={13} style={{ color: (input.trim() || pendingAttachments.length > 0) ? "#000000" : "#6B6B6B" }} />
                }
              </button>
            </div>

            {/* New conversation */}
            <div className="flex justify-center mt-3">
              <button
                onClick={startNew}
                className="flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: "#4B4B4B" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#6B6B6B")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#4B4B4B")}
              >
                <RefreshCw size={10} />
                New conversation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}