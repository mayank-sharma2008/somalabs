"use client"

import { useState, useRef, useEffect } from "react"
import {
  ArrowUp,
  ChevronDown,
  MessageSquare,
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
} from "lucide-react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import CodePreview from "./CodePreview"
import SearchSources from "./SearchSources"

type Mode = "chat" | "image" | "code" | "search" | "audio" | "video"

interface Source {
  index: number
  title: string
  url: string
  snippet: string
}

interface Message {
  role: "user" | "assistant"
  content: string
  type: "text" | "image" | "audio" | "video"
  imageUrl?: string
  provider?: string
  model?: string
  sources?: Source[]
}

const modeOptions: { label: string; icon: any; value: Mode }[] = [
  { label: "Chat", icon: MessageSquare, value: "chat" },
  { label: "Image", icon: ImageIcon, value: "image" },
  { label: "Code", icon: Code, value: "code" },
  { label: "Search", icon: Search, value: "search" },
  { label: "Audio", icon: Music, value: "audio" },
  { label: "Video", icon: Video, value: "video" },
]

const modePlaceholders: Record<Mode, string> = {
  chat: "What do you want to know?",
  image: "Describe an image to generate...",
  code: "Describe what code you need...",
  search: "Search the web with AI...",
  audio: "Type text to convert into speech...",
  video: "Describe a short video to generate...",
}

const systemPrompts: Record<string, string> = {
  chat: "You are a helpful AI assistant. Format your responses using markdown — use **bold** for emphasis, `code` for inline code, code blocks for longer code, and bullet points for lists.",
  code: `You are an elite frontend engineer who builds beautiful, production-grade UI components.
CRITICAL RULES FOR REACT/JSX CODE:
- Always start with: import { useState } from "react"
- Always end with: export default function App() { ... }
- Use Tailwind CSS classes for ALL styling
- Write COMPLETE, working code — never truncate
CRITICAL RULES FOR HTML CODE:
- Write complete html with inline <style>
GENERAL RULES:
- Always use markdown code blocks with correct language identifier
- After the code, briefly explain key features`,
  search: "You are a knowledgeable AI assistant. Answer questions accurately using markdown formatting.",
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const previewableLangs = ["jsx", "js", "javascript", "html", "react", "tsx", "typescript"]
  const canPreview = previewableLangs.includes(language.toLowerCase())

  return (
    <>
      <div className="my-3 rounded-xl overflow-hidden" style={{ border: "1px solid #000000" }}>
        <div
          className="flex items-center justify-between px-4 py-1.5"
          style={{ background: "#000000", borderBottom: "1px solid #2A2A2A" }}
        >
          <span className="text-xs font-mono" style={{ color: "#6B6B6B" }}>
            {language || "code"}
          </span>
          <div className="flex items-center gap-3">
            {canPreview && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 text-xs transition-colors"
                style={{ color: "#6B6B6B" }}
                onMouseEnter={(e) => (e.currentTarget.style.color = "#A3A3A3")}
                onMouseLeave={(e) => (e.currentTarget.style.color = "#6B6B6B")}
              >
                <Play size={11} />
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
              {copied ? <><Check size={11} />Copied</> : <><Copy size={11} />Copy</>}
            </button>
          </div>
        </div>
        <pre
          className="p-4 overflow-auto text-xs font-mono leading-relaxed"
          style={{ background: "#000000", color: "#4ADE80" }}
        >
          <code>{code}</code>
        </pre>
      </div>
      {showPreview && (
        <CodePreview code={code} language={language} onClose={() => setShowPreview(false)} />
      )}
    </>
  )
}

export default function DashboardPage() {
  const [activeMode, setActiveMode] = useState<Mode>("chat")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [imageLoading, setImageLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [showModeDropdown, setShowModeDropdown] = useState(false)
  const [videoAspect] = useState<"16:9" | "9:16">("16:9")

  // Web Speech API for audio
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [audioVoice, setAudioVoice] = useState<string>("")
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    function loadVoices() {
      const available = window.speechSynthesis.getVoices()
      if (available.length > 0) {
        setVoices(available)
        setAudioVoice((prev) => prev || available[0].voiceURI)
      }
    }
    loadVoices()
    window.speechSynthesis.onvoiceschanged = loadVoices
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null
    }
  }, [])

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowModeDropdown(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  const currentMode = modeOptions.find((m) => m.value === activeMode)!

  function speakMessage(index: number, text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return
    if (speakingIndex === index) {
      if (isPaused) { window.speechSynthesis.resume(); setIsPaused(false) }
      else { window.speechSynthesis.pause(); setIsPaused(true) }
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
    if (typeof window !== "undefined" && window.speechSynthesis)
      window.speechSynthesis.cancel()
    setSpeakingIndex(null)
    setIsPaused(false)
  }

  async function saveConversation(userInput: string, assistantContent: string, assistantMetadata?: Record<string, any>) {
    try {
      const res = await fetch("/api/ai/conversations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: userInput.slice(0, 60),
          model: "llama-3.3-70b-versatile",
          mode: activeMode,
          messages: [
            { role: "user", content: userInput },
            { role: "assistant", content: assistantContent, metadata: assistantMetadata ?? null },
          ],
        }),
      })
      const data = await res.json()
      if (data.id) setConversationId(data.id)
    } catch (err) {
      console.error("Failed to save conversation:", err)
    }
  }

  async function saveFollowUpMessages(userInput: string, assistantContent: string, assistantMetadata?: Record<string, any>) {
    if (!conversationId) return
    try {
      await fetch("/api/ai/conversations/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: [
            { role: "user", content: userInput },
            { role: "assistant", content: assistantContent, metadata: assistantMetadata ?? null },
          ],
        }),
      })
    } catch (err) {
      console.error("Failed to save follow-up messages:", err)
    }
  }

  async function handleSubmit() {
    if (!input.trim() || loading) return

    const userInput = input.trim()
    const isFirstMessage = messages.length === 0
    setInput("")
    setHasStarted(true)
    setLoading(true)

    if (textareaRef.current) textareaRef.current.style.height = "auto"

    setMessages((prev) => [...prev, { role: "user", content: userInput, type: "text" }])

    try {
      if (activeMode === "image") {
        setImageLoading(true)
        const res = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `${userInput}, highly detailed, 4k quality`,
            width: "1024",
            height: "1024",
          }),
        })
        const data = await res.json()
        setImageLoading(false)
        if (data.success && data.imageUrl) {
          setMessages((prev) => [...prev, { role: "assistant", content: userInput, type: "image", imageUrl: data.imageUrl }])
          if (isFirstMessage) await saveConversation(userInput, userInput, { imageUrl: data.imageUrl })
          else await saveFollowUpMessages(userInput, userInput, { imageUrl: data.imageUrl })
        } else {
          setMessages((prev) => [...prev, { role: "assistant", content: "Failed to generate image. Please try again.", type: "text" }])
        }
      } else if (activeMode === "search") {
        const res = await fetch("/api/ai/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: userInput }),
        })
        const data = await res.json()
        const content = data.answer || "Sorry, I couldn't find an answer."
        setMessages((prev) => [...prev, { role: "assistant", content, type: "text", sources: data.sources }])
        if (isFirstMessage) await saveConversation(userInput, content)
        else await saveFollowUpMessages(userInput, content)
      } else if (activeMode === "audio") {
        setMessages((prev) => [...prev, { role: "assistant", content: userInput, type: "audio" }])
        if (isFirstMessage) await saveConversation(userInput, userInput)
        else await saveFollowUpMessages(userInput, userInput)
      } else if (activeMode === "video") {
        setImageLoading(true)
        const res = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `${userInput}, highly detailed, cinematic, 4k quality`,
            width: videoAspect === "9:16" ? "768" : "1280",
            height: videoAspect === "9:16" ? "1280" : "768",
          }),
        })
        const data = await res.json()
        setImageLoading(false)
        if (data.success && data.imageUrl) {
          setMessages((prev) => [...prev, { role: "assistant", content: userInput, type: "video", imageUrl: data.imageUrl }])
        } else {
          setMessages((prev) => [...prev, { role: "assistant", content: "Failed to generate video frame. Please try again.", type: "text" }])
        }
      } else {
        const res = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              { role: "system", content: systemPrompts[activeMode] ?? systemPrompts.chat },
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: "user", content: userInput },
            ],
            provider: "groq",
            model: "llama-3.3-70b-versatile",
            maxTokens: activeMode === "code" ? 4096 : 1024,
          }),
        })
        const data = await res.json()
        const content = data.content || "Sorry, I couldn't get a response."
        setMessages((prev) => [...prev, { role: "assistant", content, type: "text", provider: data.provider, model: data.model }])
        if (isFirstMessage) await saveConversation(userInput, content)
        else await saveFollowUpMessages(userInput, content)
      }
    } catch (err) {
      console.error("Error:", err)
      setMessages((prev) => [...prev, { role: "assistant", content: "Something went wrong. Please try again.", type: "text" }])
    } finally {
      setLoading(false)
      setImageLoading(false)
    }
  }

  function handleModeSelect(mode: Mode) {
    stopSpeaking()
    setActiveMode(mode)
    setMessages([])
    setHasStarted(false)
    setInput("")
    setConversationId(null)
    setShowModeDropdown(false)
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }

  function startNew() {
    stopSpeaking()
    setMessages([])
    setHasStarted(false)
    setInput("")
    setConversationId(null)
    setActiveMode("chat")
    if (textareaRef.current) textareaRef.current.style.height = "auto"
  }

  return (
    <div className="flex flex-col h-full relative" style={{ background: "#000000" }}>


      {/* Messages area */}
      <div className="flex-1 overflow-auto">
        {!hasStarted ? (

          /* Hero landing */
          <div className="flex flex-col items-center justify-center min-h-full px-6">

            {/* Hero image — soma-hero-bg has SOMA wordmark + tagline baked in */}
            <div className="relative w-full max-w-2xl mb-2">
              {/* Soft radial glow behind the image */}
              <div
                className="absolute inset-0 rounded-3xl pointer-events-none"
                style={{
                  background: "radial-gradient(ellipse 80% 60% at 50% 50%, rgba(168,197,255,0.07), transparent 70%)",
                  filter: "blur(20px)",
                }}
              />
              <Image
                src="/soma-hero-bg.png"
                alt="SOMA — AI that evolves with you."
                width={800}
                height={420}
                className="w-full object-contain relative z-10"
                priority
              />
            </div>

            {/* Divider */}
            <div
              className="w-full max-w-2xl mb-6"
              style={{ height: "1px", background: "rgba(255,255,255,0.06)" }}
            />

            {/* Prompt input */}
            <div className="w-full max-w-2xl">
              <div
                className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
                style={{
                  background: "#0A0A0A",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
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
                  placeholder={modePlaceholders[activeMode]}
                  rows={1}
                  className="flex-1 bg-transparent text-sm resize-none focus:outline-none leading-relaxed"
                  style={{
                    color: "#ffffff",
                    caretColor: "#ffffff",
                    minHeight: "24px",
                    maxHeight: "120px",
                  }}
                />
                <style>{`
                  textarea::placeholder { color: #A3A3A3; }
                `}</style>

                {/* Mode selector dropdown */}
                <div className="relative shrink-0" ref={dropdownRef}>
                  <button
                    onClick={() => setShowModeDropdown(!showModeDropdown)}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                    text-sm transition-colors duration-150"
                    style={{
                      background: "#000000",
                      color: "#A3A3A3",
                      border: "1px solid #2A2A2A",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                    onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A3A3")}
                  >
                    <currentMode.icon size={13} />
                    <span>{currentMode.label}</span>
                    <ChevronDown size={12} />
                  </button>

                  {showModeDropdown && (
                    <div
                      className="absolute bottom-full right-0 mb-2 w-40 rounded-xl
                      overflow-hidden shadow-2xl z-50"
                      style={{
                        background: "#000000",
                        border: "1px solid #2A2A2A",
                      }}
                    >
                      {modeOptions.map((m) => (
                        <button
                          key={m.value}
                          onClick={() => handleModeSelect(m.value)}
                          className="flex items-center gap-2.5 w-full px-3.5 py-2.5
                          text-sm transition-colors duration-100"
                          style={{
                            color: activeMode === m.value ? "#ffffff" : "#A3A3A3",
                            background: activeMode === m.value ? "#0A0A0A" : "transparent",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.background = "#0A0A0A")}
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.background =
                              activeMode === m.value ? "#0A0A0A" : "transparent")
                          }
                        >
                          <m.icon size={13} />
                          {m.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Send button */}
                <button
                  onClick={handleSubmit}
                  disabled={!input.trim() || loading}
                  className="w-8 h-8 rounded-full flex items-center justify-center
                  shrink-0 transition-all duration-150"
                  style={{
                    background: input.trim() && !loading ? "#ffffff" : "#2A2A2A",
                  }}
                >
                  {loading
                    ? <Loader2 size={14} className="animate-spin" style={{ color: "#6B6B6B" }} />
                    : <ArrowUp size={14} style={{ color: input.trim() ? "#000000" : "#6B6B6B" }} />
                  }
                </button>
              </div>

              {/* Footer */}
              <p
                className="text-center text-xs mt-4"
                style={{ color: "#6B6B6B" }}
              >
                By messaging Soma, you agree to our{" "}
                <a
                  href="#"
                  className="underline transition-colors"
                  style={{ color: "#A3A3A3" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A3A3")}
                >
                  Terms
                </a>{" "}
                and{" "}
                <a
                  href="#"
                  className="underline transition-colors"
                  style={{ color: "#A3A3A3" }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = "#ffffff")}
                  onMouseLeave={(e) => (e.currentTarget.style.color = "#A3A3A3")}
                >
                  Privacy Policy
                </a>
                .
              </p>
            </div>
          </div>

        ) : (

          /* Messages — pure black, full-width reading layout */
          <div
            className="min-h-full"
            style={{ background: "#000000" }}
          >
            <div className="max-w-2xl mx-auto px-6 py-12 space-y-8 soma-chat-scroll">
              {messages.map((msg, i) => (
                <div key={i} className="flex flex-col gap-1">
                  {msg.role === "user" ? (
                    /* User message — right-aligned pill */
                    <div className="flex justify-end">
                      <div
                        className="max-w-[72%] px-4 py-3 rounded-2xl rounded-br-md text-sm leading-relaxed"
                        style={{
                          background: "#141414",
                          color: "#ffffff",
                          border: "1px solid #242424",
                        }}
                      >
                        {msg.content}
                      </div>
                    </div>
                  ) : (
                    /* Assistant message — left-aligned, label above */
                    <div className="flex flex-col gap-2">
                      {/* SOMA label */}
                      <div className="flex items-center gap-2">
                        <div
                          className="w-5 h-5 rounded-full overflow-hidden shrink-0"
                          style={{ border: "1px solid #000000" }}
                        >
                          <Image
                            src="/logo1.png"
                            alt="Soma"
                            width={20}
                            height={20}
                            className="object-cover w-full h-full"
                          />
                        </div>
                        <span
                          className="text-xs font-medium"
                          style={{ color: "#6B6B6B" }}
                        >
                          Soma
                        </span>
                      </div>

                      {/* Content */}
                      <div className="pl-7">
                        {msg.type === "image" && msg.imageUrl ? (
                          <div className="relative group inline-block">
                            <img
                              src={msg.imageUrl}
                              alt={msg.content}
                              className="rounded-2xl max-w-sm w-full"
                              style={{ border: "1px solid #000000" }}
                              onError={(e) => {
                                setTimeout(() => {
                                  (e.target as HTMLImageElement).src =
                                    msg.imageUrl! + "&retry=" + Date.now()
                                }, 2000)
                              }}
                            />
                            <div
                              className="absolute bottom-3 left-3 right-3 flex items-center
                              justify-between opacity-0 group-hover:opacity-100
                              transition-opacity duration-200"
                            >
                              <span
                                className="text-xs px-2 py-1 rounded-lg truncate max-w-[60%]"
                                style={{
                                  color: "rgba(255,255,255,0.6)",
                                  background: "rgba(0,0,0,0.65)",
                                  backdropFilter: "blur(8px)",
                                }}
                              >
                                {msg.content}
                              </span>
                              <button
                                onClick={() => window.open(msg.imageUrl, "_blank")}
                                className="flex items-center gap-1.5 px-3 py-1.5
                                rounded-xl text-xs font-medium transition-all"
                                style={{
                                  background: "rgba(255,255,255,0.95)",
                                  color: "#000000",
                                }}
                              >
                                <Download size={11} />
                                Save
                              </button>
                            </div>
                          </div>
                        ) : msg.type === "video" && msg.imageUrl ? (
                          <div
                            className="rounded-2xl overflow-hidden max-w-sm"
                            style={{ border: "1px solid #000000" }}
                          >
                            <div className="aspect-video overflow-hidden">
                              <img
                                src={msg.imageUrl}
                                alt={msg.content}
                                className="w-full h-full object-cover"
                                style={{
                                  animation: "kenburns 8s ease-in-out infinite alternate",
                                }}
                              />
                            </div>
                            <div
                              className="flex items-center justify-between px-3 py-2.5"
                              style={{ background: "#0D0D0D", borderTop: "1px solid #000000" }}
                            >
                              <span className="text-xs truncate max-w-[65%]" style={{ color: "#6B6B6B" }}>
                                {msg.content}
                              </span>
                              <a
                                href={msg.imageUrl}
                                download="soma-frame.jpg"
                                className="flex items-center gap-1.5 px-2.5 py-1.5
                                rounded-xl text-xs font-medium transition-colors"
                                style={{ background: "#000000", color: "#A3A3A3", border: "1px solid #2A2A2A" }}
                              >
                                <Download size={11} />
                                Save frame
                              </a>
                            </div>
                          </div>
                        ) : msg.type === "audio" ? (
                          <div
                            className="inline-flex items-center gap-3 px-4 py-3 rounded-2xl max-w-sm"
                            style={{ background: "#0D0D0D", border: "1px solid #000000" }}
                          >
                            <button
                              onClick={() => speakMessage(i, msg.content)}
                              className="w-8 h-8 rounded-full flex items-center justify-center
                              shrink-0 transition-all duration-150 active:scale-95"
                              style={{ background: "#ffffff" }}
                            >
                              {speakingIndex === i && !isPaused
                                ? <Pause size={12} style={{ color: "#000000" }} />
                                : <Play size={12} style={{ color: "#000000" }} />
                              }
                            </button>
                            <p
                              className="text-sm leading-relaxed flex-1"
                              style={{ color: "#A3A3A3" }}
                            >
                              {msg.content}
                            </p>
                            {speakingIndex === i && (
                              <button
                                onClick={stopSpeaking}
                                className="w-6 h-6 rounded-full flex items-center
                                justify-center shrink-0"
                                style={{ background: "#000000" }}
                              >
                                <Square size={9} style={{ color: "#6B6B6B" }} />
                              </button>
                            )}
                          </div>
                        ) : (
                          /* Text response */
                          <div className="text-sm leading-[1.8]" style={{ color: "#D4D4D4" }}>
                            <ReactMarkdown
                              components={{
                                h1: ({ children }) => (
                                  <h1
                                    className="text-xl font-semibold mb-4 mt-2"
                                    style={{ color: "#ffffff" }}
                                  >
                                    {children}
                                  </h1>
                                ),
                                h2: ({ children }) => (
                                  <h2
                                    className="text-base font-semibold mb-3 mt-4"
                                    style={{ color: "#ffffff" }}
                                  >
                                    {children}
                                  </h2>
                                ),
                                h3: ({ children }) => (
                                  <h3
                                    className="text-sm font-semibold mb-2 mt-3"
                                    style={{ color: "#E5E5E5" }}
                                  >
                                    {children}
                                  </h3>
                                ),
                                p: ({ children }) => (
                                  <p className="mb-3 last:mb-0 leading-[1.8]">
                                    {children}
                                  </p>
                                ),
                                strong: ({ children }) => (
                                  <strong className="font-semibold" style={{ color: "#ffffff" }}>
                                    {children}
                                  </strong>
                                ),
                                em: ({ children }) => (
                                  <em className="italic" style={{ color: "#A3A3A3" }}>
                                    {children}
                                  </em>
                                ),
                                code: ({ children, className }) => {
                                  const isBlock = className?.includes("language-")
                                  const lang = className?.replace("language-", "") ?? ""
                                  if (isBlock) {
                                    return (
                                      <CodeBlock
                                        language={lang}
                                        code={String(children).replace(/\n$/, "")}
                                      />
                                    )
                                  }
                                  return (
                                    <code
                                      className="px-1.5 py-0.5 rounded text-xs font-mono"
                                      style={{ background: "#141414", color: "#4ADE80", border: "1px solid #1A1A1A" }}
                                    >
                                      {children}
                                    </code>
                                  )
                                },
                                ul: ({ children }) => (
                                  <ul className="mb-3 space-y-1.5 pl-4 list-disc marker:text-[#6B6B6B]">
                                    {children}
                                  </ul>
                                ),
                                ol: ({ children }) => (
                                  <ol className="mb-3 space-y-1.5 pl-4 list-decimal marker:text-[#6B6B6B]">
                                    {children}
                                  </ol>
                                ),
                                li: ({ children }) => (
                                  <li className="leading-[1.8]">{children}</li>
                                ),
                                hr: () => (
                                  <hr className="my-6" style={{ borderColor: "#000000" }} />
                                ),
                                blockquote: ({ children }) => (
                                  <blockquote
                                    className="border-l-2 pl-4 my-4 italic"
                                    style={{ borderColor: "#2A2A2A", color: "#6B6B6B" }}
                                  >
                                    {children}
                                  </blockquote>
                                ),
                              }}
                            >
                              {msg.content}
                            </ReactMarkdown>

                            {msg.sources && msg.sources.length > 0 && (
                              <SearchSources sources={msg.sources} />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Loading state */}
              {(loading || imageLoading) && (
                <div className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <div
                      className="w-5 h-5 rounded-full overflow-hidden shrink-0"
                      style={{ border: "1px solid #000000" }}
                    >
                      <Image
                        src="/logo1.png"
                        alt="Soma"
                        width={20}
                        height={20}
                        className="object-cover w-full h-full animate-pulse"
                      />
                    </div>
                    <span className="text-xs font-medium" style={{ color: "#6B6B6B" }}>Soma</span>
                  </div>
                  <div className="pl-7">
                    {imageLoading ? (
                      <div className="flex items-center gap-2.5">
                        <Loader2 size={13} className="animate-spin" style={{ color: "#6B6B6B" }} />
                        <span className="text-sm" style={{ color: "#6B6B6B" }}>
                          {activeMode === "video" ? "Generating video frame..." : "Generating image..."}
                        </span>
                      </div>
                    ) : activeMode === "code" ? (
                      <div className="flex items-center gap-2.5">
                        <Loader2 size={13} className="animate-spin" style={{ color: "#4ADE80" }} />
                        <span className="text-sm" style={{ color: "#6B6B6B" }}>Writing code...</span>
                      </div>
                    ) : activeMode === "search" ? (
                      <div className="flex items-center gap-2.5">
                        <Loader2 size={13} className="animate-spin" style={{ color: "#60A5FA" }} />
                        <span className="text-sm" style={{ color: "#6B6B6B" }}>Searching the web...</span>
                      </div>
                    ) : (
                      <div className="flex gap-1 items-center">
                        {[0, 200, 400].map((d) => (
                          <div
                            key={d}
                            className="w-1 h-1 rounded-full animate-pulse"
                            style={{
                              background: "#6B6B6B",
                              animationDelay: `${d}ms`,
                              animationDuration: "1.2s",
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div ref={bottomRef} />
            </div>
          </div>
        )}
      </div>

      {/* Persistent input bar (shown when chat has started) */}
      {hasStarted && (
        <div className="shrink-0 px-6 pb-4 max-w-3xl mx-auto w-full">
          <div
            className="flex items-center gap-3 px-4 py-3.5 rounded-2xl"
            style={{
              background: "#000000",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
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
              placeholder={modePlaceholders[activeMode]}
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none focus:outline-none leading-relaxed"
              style={{ color: "#ffffff", caretColor: "#ffffff", minHeight: "24px", maxHeight: "120px" }}
            />

            <div className="relative shrink-0" ref={dropdownRef}>
              <button
                onClick={() => setShowModeDropdown(!showModeDropdown)}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm
                transition-colors duration-150"
                style={{ background: "#000000", color: "#A3A3A3", border: "1px solid #2A2A2A" }}
              >
                <currentMode.icon size={13} />
                <span>{currentMode.label}</span>
                <ChevronDown size={12} />
              </button>

              {showModeDropdown && (
                <div
                  className="absolute bottom-full right-0 mb-2 w-40 rounded-xl overflow-hidden shadow-2xl z-50"
                  style={{ background: "#000000", border: "1px solid #2A2A2A" }}
                >
                  {modeOptions.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => handleModeSelect(m.value)}
                      className="flex items-center gap-2.5 w-full px-3.5 py-2.5 text-sm transition-colors duration-100"
                      style={{
                        color: activeMode === m.value ? "#ffffff" : "#A3A3A3",
                        background: activeMode === m.value ? "#000000" : "transparent",
                      }}
                      onMouseEnter={(e) => (e.currentTarget.style.background = "#1A1A1A")}
                      onMouseLeave={(e) =>
                        (e.currentTarget.style.background = activeMode === m.value ? "#1A1A1A" : "transparent")
                      }
                    >
                      <m.icon size={13} />
                      {m.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleSubmit}
              disabled={!input.trim() || loading}
              className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all duration-150"
              style={{ background: input.trim() && !loading ? "#ffffff" : "#2A2A2A" }}
            >
              {loading
                ? <Loader2 size={14} className="animate-spin" style={{ color: "#6B6B6B" }} />
                : <ArrowUp size={14} style={{ color: input.trim() ? "#000000" : "#6B6B6B" }} />
              }
            </button>
          </div>

          <div className="flex items-center justify-center mt-2 gap-3">
            <button
              onClick={startNew}
              className="text-xs flex items-center gap-1 transition-colors"
              style={{ color: "#6B6B6B" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#A3A3A3")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B6B6B")}
            >
              <RefreshCw size={10} />
              New conversation
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.15) translate(-2%, -2%); }
        }
      `}</style>
    </div>
  )
}