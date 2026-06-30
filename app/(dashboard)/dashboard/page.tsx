"use client"

import { useState, useRef, useEffect } from "react"
import {
  Search,
  ImageIcon as ImageLucide,
  Code,
  Music,
  Video,
  ArrowRight,
  Loader2,
  User,
  Download,
  RefreshCw,
  Copy,
  Check,
  Play,
  Pause,
  Square
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

const modes: {
  label: string
  icon: any
  value: Mode
  placeholder: string
}[] = [
  { label: "Chat", icon: Search, value: "chat", placeholder: "Ask anything..." },
  { label: "Image", icon: ImageLucide, value: "image", placeholder: "Describe an image to generate..." },
  { label: "Code", icon: Code, value: "code", placeholder: "Describe what code you need..." },
  { label: "Search", icon: Search, value: "search", placeholder: "Search the web with AI..." },
  { label: "Audio", icon: Music, value: "audio", placeholder: "Type text to convert into speech..." },
  { label: "Video", icon: Video, value: "video", placeholder: "Describe a short video to generate..." },
]

const suggestions: Record<Mode, { icon: string; text: string }[]> = {
  chat: [
    { icon: "⚡", text: "Write me a Python script" },
    { icon: "🧠", text: "Explain quantum computing" },
    { icon: "📝", text: "Help me write an email" },
    { icon: "🌐", text: "Create a landing page" },
    { icon: "🐛", text: "Help me debug my code" },
    { icon: "💡", text: "Give me startup ideas" },
  ],
  image: [
    { icon: "🌆", text: "Futuristic city at night with neon lights" },
    { icon: "🐺", text: "Wolf howling at the moon in a forest" },
    { icon: "🚀", text: "Astronaut floating in a colorful nebula" },
    { icon: "🐉", text: "Dragon flying over mountains at sunset" },
    { icon: "☕", text: "Cozy coffee shop on a rainy day" },
    { icon: "🤖", text: "Robot painting in an art studio" },
  ],
  code: [
    { icon: "⚛️", text: "Build a beautiful counter app in React" },
    { icon: "🎨", text: "Create an animated landing page in HTML" },
    { icon: "✅", text: "Build a polished todo list app in React" },
    { icon: "📊", text: "Create a pricing cards component in React" },
    { icon: "🎮", text: "Build a tic-tac-toe game in React" },
    { icon: "🗄️", text: "Database schema for an e-commerce app" },
  ],
  search: [
    { icon: "🔍", text: "Latest AI news today" },
    { icon: "📈", text: "Best programming languages 2025" },
    { icon: "🌍", text: "Climate change solutions" },
    { icon: "💻", text: "Next.js vs Remix comparison" },
    { icon: "🏥", text: "Benefits of meditation" },
    { icon: "🚀", text: "SpaceX latest missions" },
  ],
  audio: [
    { icon: "🎙️", text: "Welcome to SomaLabs, the unified AI studio." },
    { icon: "📖", text: "Once upon a time, in a city powered by AI..." },
    { icon: "💬", text: "Thank you for using our app. Your feedback matters." },
    { icon: "📰", text: "Breaking news: AI just changed everything." },
    { icon: "🧘", text: "Take a deep breath. You are capable of amazing things." },
    { icon: "🎬", text: "In a world where machines learned to speak..." },
  ],
  video: [
    { icon: "🌊", text: "Waves crashing on a tropical beach at sunset" },
    { icon: "🚗", text: "A sports car driving through a neon-lit city street" },
    { icon: "🔥", text: "A campfire crackling under a starry night sky" },
    { icon: "🐦", text: "A hummingbird flying around colorful flowers" },
    { icon: "☁️", text: "Clouds drifting over snow-capped mountains" },
    { icon: "🌧️", text: "Rain falling on a window with city lights blurred behind" },
  ],
}

const systemPrompts: Record<string, string> = {
  chat: "You are a helpful AI assistant. Format your responses using markdown — use **bold** for emphasis, `code` for inline code, code blocks for longer code, and bullet points for lists.",
  code: `You are an elite frontend engineer who builds beautiful, production-grade UI components, similar to what top design agencies ship.

CRITICAL RULES FOR REACT/JSX CODE:
- Always start with: import { useState } from "react"  (NOT React.useState)
- Use modern hooks syntax: const [x, setX] = useState(initial)
- Always end with: export default function App() { ... }
- Use Tailwind CSS classes for ALL styling — make it look premium and polished, not bare-bones
- Add hover states, transitions, shadows, rounded corners, proper spacing, and a cohesive color palette
- Include icons where relevant using simple SVGs or emoji if no icon library is available
- Make layouts responsive and visually balanced — never just plain unstyled divs
- Think like a senior designer: use whitespace, hierarchy, and polish
- For lists/cards, add subtle borders, backgrounds, and spacing between items
- Always include realistic placeholder content, not just "Item 1, Item 2"

CRITICAL RULES FOR HTML CODE:
- Write complete \`\`\`html with inline <style> using modern CSS (flexbox/grid, gradients, shadows, transitions)
- Make it look like a real polished webpage, not a bare template

GENERAL RULES:
- Always use markdown code blocks with correct language identifier (\`\`\`jsx, \`\`\`html, \`\`\`python, etc.)
- Write COMPLETE, working code — never truncate or use "// rest of code here"
- Include proper error handling, edge cases, and clean logic
- Add comments only for genuinely complex logic, not obvious lines
- After the code, briefly explain key features and how to use it
- Follow modern best practices for the requested language/framework`,
  search: "You are a knowledgeable AI assistant. Answer questions accurately using markdown formatting. Use **bold** for key terms and bullet points for multiple items."
}

function CodeBlock({ language, code }: { language: string; code: string }) {
  const [copied, setCopied] = useState(false)
  const [showPreview, setShowPreview] = useState(false)

  function handleCopy() {
    navigator.clipboard.writeText(code)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const previewableLanguages = ["jsx", "js", "javascript", "html", "react", "tsx", "typescript"]
  const canPreview = previewableLanguages.includes(language.toLowerCase())

  return (
    <>
      <div className="my-3 rounded-xl overflow-hidden border border-white/10">
        <div className="flex items-center justify-between px-4 py-1.5
        bg-white/5 border-b border-white/10">
          <span className="text-xs text-white/40 font-mono">
            {language || "code"}
          </span>
          <div className="flex items-center gap-3">
            {canPreview && (
              <button
                onClick={() => setShowPreview(true)}
                className="flex items-center gap-1.5 text-xs
                text-purple-400/70 hover:text-purple-400 transition-colors"
              >
                <Play size={11} />
                Preview
              </button>
            )}
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 text-xs
              text-white/40 hover:text-white transition-colors"
            >
              {copied ? (
                <>
                  <Check size={11} />
                  Copied
                </>
              ) : (
                <>
                  <Copy size={11} />
                  Copy
                </>
              )}
            </button>
          </div>
        </div>
        <pre className="bg-black/50 p-4 overflow-auto
        text-xs text-green-400/90 font-mono leading-relaxed">
          <code>{code}</code>
        </pre>
      </div>

      {showPreview && (
        <CodePreview
          code={code}
          language={language}
          onClose={() => setShowPreview(false)}
        />
      )}
    </>
  )
}

export default function DashboardPage() {
  const [activeMode, setActiveMode] = useState<Mode>("chat")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [hasStarted, setHasStarted] = useState(false)
  const [conversationId, setConversationId] = useState<string | null>(null)
  const [imageLoading, setImageLoading] = useState(false)
  const [videoLoading, setVideoLoading] = useState(false)
  const [videoAspect, setVideoAspect] = useState<"16:9" | "9:16">("16:9")

  // Web Speech API state — entirely client-side, no backend involved
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [audioVoice, setAudioVoice] = useState<string>("")
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // Load available system voices. Most browsers populate this list
  // asynchronously, so we listen for the voiceschanged event too.
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
      if (window.speechSynthesis) {
        window.speechSynthesis.onvoiceschanged = null
      }
    }
  }, [])

  const currentMode = modes.find(m => m.value === activeMode)!

  function speakMessage(index: number, text: string) {
    if (typeof window === "undefined" || !window.speechSynthesis) return

    // Clicking the currently-speaking message toggles pause/resume
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

    // Switching to a different message — stop whatever's playing and start fresh
    window.speechSynthesis.cancel()

    const utterance = new SpeechSynthesisUtterance(text)
    const selectedVoice = voices.find((v) => v.voiceURI === audioVoice)
    if (selectedVoice) utterance.voice = selectedVoice

    utterance.onend = () => setSpeakingIndex(null)
    utterance.onerror = () => setSpeakingIndex(null)

    setSpeakingIndex(index)
    setIsPaused(false)
    window.speechSynthesis.speak(utterance)
  }

  function stopSpeaking() {
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setSpeakingIndex(null)
    setIsPaused(false)
  }

  async function saveConversation(
    userInput: string,
    assistantContent: string,
    assistantMetadata?: Record<string, any>
  ) {
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
            { role: "assistant", content: assistantContent, metadata: assistantMetadata ?? null }
          ]
        })
      })
      const data = await res.json()
      if (data.id) {
        setConversationId(data.id)
      }
    } catch (err) {
      console.error("Failed to save conversation:", err)
    }
  }

  async function saveFollowUpMessages(
    userInput: string,
    assistantContent: string,
    assistantMetadata?: Record<string, any>
  ) {
    if (!conversationId) return
    try {
      await fetch("/api/ai/conversations/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId,
          messages: [
            { role: "user", content: userInput },
            { role: "assistant", content: assistantContent, metadata: assistantMetadata ?? null }
          ]
        })
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

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    setMessages(prev => [...prev, {
      role: "user",
      content: userInput,
      type: "text"
    }])

    try {
      if (activeMode === "image") {
        setImageLoading(true)

        const response = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `${userInput}, highly detailed, 4k quality`,
            width: "1024",
            height: "1024"
          })
        })

        const data = await response.json()
        setImageLoading(false)

        if (data.success && data.imageUrl) {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: userInput,
            type: "image",
            imageUrl: data.imageUrl
          }])

          if (isFirstMessage) {
            await saveConversation(userInput, userInput, { imageUrl: data.imageUrl })
          } else {
            await saveFollowUpMessages(userInput, userInput, { imageUrl: data.imageUrl })
          }
        } else {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "Failed to generate image. Please try again.",
            type: "text"
          }])
        }

      } else if (activeMode === "search") {
        const response = await fetch("/api/ai/search", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ query: userInput })
        })

        const data = await response.json()
        const assistantContent = data.answer || "Sorry, I couldn't find an answer for that."

        setMessages(prev => [...prev, {
          role: "assistant",
          content: assistantContent,
          type: "text",
          sources: data.sources
        }])

        if (isFirstMessage) {
          await saveConversation(userInput, assistantContent)
        } else {
          await saveFollowUpMessages(userInput, assistantContent)
        }

      } else if (activeMode === "audio") {
        // No network call — the text itself is the "result". Speaking
        // happens on demand when the user presses Play on the bubble.
        setMessages(prev => [...prev, {
          role: "assistant",
          content: userInput,
          type: "audio"
        }])

        if (isFirstMessage) {
          await saveConversation(userInput, userInput)
        } else {
          await saveFollowUpMessages(userInput, userInput)
        }

      } else if (activeMode === "video") {
        // No paid video API. Generate a free Pollinations image, then
        // animate it client-side (pan/zoom) — zero cost, zero risk,
        // nothing that depends on a third party's paid video tier.
        setVideoLoading(true)

        const response = await fetch("/api/ai/image", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            prompt: `${userInput}, highly detailed, cinematic, 4k quality`,
            width: videoAspect === "9:16" ? "768" : "1280",
            height: videoAspect === "9:16" ? "1280" : "768"
          })
        })

        const data = await response.json()
        setVideoLoading(false)

        if (data.success && data.imageUrl) {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: userInput,
            type: "video",
            imageUrl: data.imageUrl
          }])
        } else {
          setMessages(prev => [...prev, {
            role: "assistant",
            content: "Failed to generate video. Please try again.",
            type: "text"
          }])
        }

      } else {
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: systemPrompts[activeMode] ?? systemPrompts.chat
              },
              ...messages.map(m => ({
                role: m.role,
                content: m.content
              })),
              { role: "user", content: userInput }
            ],
            provider: "groq",
            model: "llama-3.3-70b-versatile",
            maxTokens: activeMode === "code" ? 4096 : 1024
          })
        })

        const data = await response.json()
        const assistantContent = data.content || "Sorry I couldn't get a response."

        setMessages(prev => [...prev, {
          role: "assistant",
          content: assistantContent,
          type: "text",
          provider: data.provider,
          model: data.model
        }])

        if (isFirstMessage) {
          await saveConversation(userInput, assistantContent)
        } else {
          await saveFollowUpMessages(userInput, assistantContent)
        }
      }
    } catch (err) {
      console.error("Error in handleSubmit:", err)
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Something went wrong. Please try again.",
        type: "text"
      }])
    } finally {
      setLoading(false)
      setImageLoading(false)
      setVideoLoading(false)
    }
  }

  function handleModeSwitch(mode: Mode) {
    stopSpeaking()
    setActiveMode(mode)
    setMessages([])
    setHasStarted(false)
    setInput("")
    setConversationId(null)
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  function startNew() {
    stopSpeaking()
    setMessages([])
    setHasStarted(false)
    setInput("")
    setConversationId(null)
    setActiveMode("chat")
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }
  }

  return (
    <div className="flex flex-col h-full relative">
      <style>{`
        @keyframes kenburns {
          0% { transform: scale(1) translate(0, 0); }
          100% { transform: scale(1.15) translate(-2%, -2%); }
        }
        .animate-kenburns {
          animation: kenburns 8s ease-in-out infinite alternate;
        }
      `}</style>

      {/* Messages area */}
      <div className="flex-1 overflow-auto">
        {!hasStarted ? (

          /* Landing */
          <div className="flex flex-col items-center justify-center
          min-h-full px-4 relative">

            <div className="absolute top-1/3 left-1/2 -translate-x-1/2
            -translate-y-1/2 w-96 h-96 rounded-full
            bg-white/[0.02] blur-3xl pointer-events-none" />

            {/* Brand */}
            <div className="flex flex-col items-center mb-10 relative">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden
              mb-5 shadow-2xl shadow-white/5 border border-white/10">
                <Image
                  src="/logo1.png"
                  alt="SomaLabs"
                  fill
                  className="object-cover"
                />
            </div>
              <h1 className="text-5xl font-light tracking-[0.2em]
              uppercase text-white">
                SOMA
              </h1>
              <p className="text-xs text-white/25 mt-2
              tracking-[0.4em] uppercase">
                Unified AI Studio
              </p>
            </div>

            {/* Suggestions */}
            {suggestions[activeMode].length > 0 && (
              <div className="w-full max-w-2xl grid grid-cols-3 gap-2 mb-4">
                {suggestions[activeMode].map((s) => (
                  <button
                    key={s.text}
                    onClick={() => setInput(s.text)}
                    className="text-left px-4 py-3 rounded-xl
                    bg-white/[0.03] border border-white/[0.07]
                    hover:bg-white/[0.06] hover:border-white/15
                    transition-all duration-200 group"
                  >
                    <span className="text-base mb-1.5 block">{s.icon}</span>
                    <span className="text-xs text-white/35
                    group-hover:text-white/65 transition-colors
                    line-clamp-2 leading-relaxed">
                      {s.text}
                    </span>
                  </button>
                ))}
              </div>
            )}

            {activeMode === "code" && (
              <p className="text-xs text-white/15 mb-4">
                💡 Tip: Ask for React or HTML code to see a live preview
              </p>
            )}

            {activeMode === "audio" && (
              <p className="text-xs text-white/15 mb-4">
                🎙️ Free text-to-speech using your browser's built-in voices — no server, no cost
              </p>
            )}

            {activeMode === "video" && (
              <p className="text-xs text-white/15 mb-4">
                🎬 Pan &amp; zoom preview clips, 100% free · Full AI-generated video coming soon
              </p>
            )}
          </div>

        ) : (

          /* Messages */
          <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
            {messages.map((msg, i) => (
              <div
                key={i}
                className={`flex gap-3
                  ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.role === "assistant" && (
                  <div className="w-7 h-7 rounded-lg bg-white/8
                  border border-white/10 flex items-center
                  justify-center shrink-0 mt-1 overflow-hidden">
                    <Image
                      src="/logo1.png"
                      alt="Soma"
                      width={16}
                      height={16}
                      className="object-cover w-full h-full"
                    />
                  </div>
                )}

                <div className="max-w-[85%]">
                  {msg.type === "image" && msg.imageUrl ? (
                    <div className="relative group">
                      <img
                        src={msg.imageUrl}
                        alt={msg.content}
                        className="rounded-2xl max-w-sm w-full
                        border border-white/10 shadow-xl"
                        onError={(e) => {
                          setTimeout(() => {
                            (e.target as HTMLImageElement).src =
                              msg.imageUrl! + "&retry=" + Date.now()
                          }, 2000)
                        }}
                      />
                      <div className="absolute bottom-3 left-3 right-3
                      flex items-center justify-between
                      opacity-0 group-hover:opacity-100
                      transition-opacity duration-200">
                        <span className="text-xs text-white/50 bg-black/50
                        backdrop-blur-sm px-2 py-1 rounded-lg
                        truncate max-w-[60%]">
                          {msg.content}
                        </span>
                        <button
                          onClick={() => window.open(msg.imageUrl, "_blank")}
                          className="flex items-center gap-1.5 px-3 py-1.5
                          bg-white text-black rounded-lg
                          text-xs font-medium hover:bg-white/90
                          transition-colors"
                        >
                          <Download size={11} />
                          Save
                        </button>
                      </div>
                    </div>
                  ) : msg.type === "video" && msg.imageUrl ? (
                    <div className="rounded-2xl border border-white/10
                    bg-white/[0.05] p-3 overflow-hidden">
                      <div className="rounded-xl overflow-hidden max-w-sm
                      aspect-video">
                        <img
                          src={msg.imageUrl}
                          alt={msg.content}
                          className="w-full h-full object-cover animate-kenburns"
                        />
                      </div>
                      <div className="flex items-center justify-between mt-2">
                        <span className="text-xs text-white/30 truncate max-w-[65%]">
                          {msg.content}
                        </span>
                        <a
                          href={msg.imageUrl}
                          download="soma-frame.jpg"
                          className="flex items-center gap-1.5 px-2.5 py-1
                          bg-white text-black rounded-lg
                          text-xs font-medium hover:bg-white/90
                          transition-colors"
                        >
                          <Download size={11} />
                          Save frame
                        </a>
                      </div>
                    </div>
                  ) : msg.type === "audio" ? (
                    <div className="rounded-2xl border border-white/10
                    bg-white/[0.05] p-4">
                      <div className="flex items-center gap-3">
                        <button
                          onClick={() => speakMessage(i, msg.content)}
                          className="w-9 h-9 rounded-full bg-white text-black
                          flex items-center justify-center shrink-0
                          hover:bg-white/90 active:scale-95
                          transition-all duration-150"
                        >
                          {speakingIndex === i && !isPaused
                            ? <Pause size={14} />
                            : <Play size={14} />
                          }
                        </button>
                        <p className="text-sm text-white/80 leading-relaxed flex-1">
                          {msg.content}
                        </p>
                        {speakingIndex === i && (
                          <button
                            onClick={stopSpeaking}
                            className="w-7 h-7 rounded-full bg-white/10
                            hover:bg-white/15 flex items-center justify-center
                            shrink-0 transition-colors"
                          >
                            <Square size={10} className="text-white/60" />
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className={`px-4 py-3 rounded-2xl text-sm
                      leading-relaxed
                      ${msg.role === "user"
                        ? "bg-white text-black rounded-tr-sm font-medium"
                        : "bg-white/[0.05] border border-white/8 text-white rounded-tl-sm"
                      }`}
                    >
                      {msg.role === "assistant" ? (
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => (
                              <h1 className="text-lg font-bold mb-3 text-white">
                                {children}
                              </h1>
                            ),
                            h2: ({ children }) => (
                              <h2 className="text-base font-bold mb-2 text-white">
                                {children}
                              </h2>
                            ),
                            h3: ({ children }) => (
                              <h3 className="text-sm font-semibold mb-2 text-white/90
                              mt-3">
                                {children}
                              </h3>
                            ),
                            p: ({ children }) => (
                              <p className="mb-3 last:mb-0 text-white/85 leading-relaxed">
                                {children}
                              </p>
                            ),
                            strong: ({ children }) => (
                              <strong className="font-semibold text-white">
                                {children}
                              </strong>
                            ),
                            em: ({ children }) => (
                              <em className="italic text-white/75">
                                {children}
                              </em>
                            ),
                            code: ({ children, className }) => {
                              const isBlock = className?.includes("language-")
                              const lang = className?.replace("language-", "") ?? ""

                              if (isBlock) {
                                const codeString = String(children).replace(/\n$/, "")
                                return <CodeBlock language={lang} code={codeString} />
                              }

                              return (
                                <code className="bg-white/10 px-1.5 py-0.5
                                rounded text-xs font-mono text-green-400/90">
                                  {children}
                                </code>
                              )
                            },
                            ul: ({ children }) => (
                              <ul className="list-disc list-inside mb-3
                              space-y-1.5 text-white/80">
                                {children}
                              </ul>
                            ),
                            ol: ({ children }) => (
                              <ol className="list-decimal list-inside mb-3
                              space-y-1.5 text-white/80">
                                {children}
                              </ol>
                            ),
                            li: ({ children }) => (
                              <li className="text-white/80 leading-relaxed">
                                {children}
                              </li>
                            ),
                            hr: () => (
                              <hr className="border-white/10 my-4" />
                            ),
                            blockquote: ({ children }) => (
                              <blockquote className="border-l-2 border-white/20
                              pl-4 my-3 text-white/55 italic">
                                {children}
                              </blockquote>
                            ),
                          }}
                        >
                          {msg.content}
                        </ReactMarkdown>
                      ) : (
                        msg.content
                      )}

                      {msg.provider && (
                        <div className="text-xs mt-2 pt-2
                        border-t border-white/5 text-white/20">
                          {msg.provider} · {msg.model}
                        </div>
                      )}

                      {msg.sources && msg.sources.length > 0 && (
                        <SearchSources sources={msg.sources} />
                      )}
                    </div>
                  )}
                </div>

                {msg.role === "user" && (
                  <div className="w-7 h-7 rounded-lg bg-white/10
                  flex items-center justify-center shrink-0 mt-1">
                    <User size={13} className="text-white/70" />
                  </div>
                )}
              </div>
            ))}

            {(loading || imageLoading || videoLoading) && (
              <div className="flex gap-3 justify-start">
                <div className="w-7 h-7 rounded-lg bg-white/8
                border border-white/10 flex items-center
                justify-center shrink-0 overflow-hidden">
                  <Image
                    src="/logo1.png"
                    alt="Soma"
                    width={16}
                    height={16}
                    className="object-cover w-full h-full animate-pulse"
                  />
                </div>
                <div className="bg-white/[0.05] border border-white/8
                rounded-2xl rounded-tl-sm px-4 py-3">
                  {imageLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin
                      text-purple-400" />
                      <span className="text-xs text-white/40">
                        Generating image...
                      </span>
                    </div>
                  ) : videoLoading ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin
                      text-orange-400" />
                      <span className="text-xs text-white/40">
                        Generating video frame...
                      </span>
                    </div>
                  ) : activeMode === "code" ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin
                      text-green-400" />
                      <span className="text-xs text-white/40">
                        Writing code...
                      </span>
                    </div>
                  ) : activeMode === "search" ? (
                    <div className="flex items-center gap-2">
                      <Loader2 size={14} className="animate-spin
                      text-blue-400" />
                      <span className="text-xs text-white/40">
                        Searching the web...
                      </span>
                    </div>
                  ) : (
                    <div className="flex gap-1.5 items-center">
                      {[0, 150, 300].map((d) => (
                        <div
                          key={d}
                          className="w-1.5 h-1.5 rounded-full
                          bg-white/40 animate-bounce"
                          style={{ animationDelay: `${d}ms` }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 pb-4 max-w-3xl mx-auto w-full">

        {activeMode === "audio" && voices.length > 0 && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <span className="text-xs text-white/25">Voice</span>
            <select
              value={audioVoice}
              onChange={(e) => setAudioVoice(e.target.value)}
              className="bg-white/[0.03] border border-white/[0.07] rounded-lg
              px-2 py-1.5 text-xs text-white/60 focus:outline-none
              focus:border-white/20 max-w-[220px]"
            >
              {voices.map((v) => (
                <option key={v.voiceURI} value={v.voiceURI} className="bg-[#0c0c0c]">
                  {v.name} ({v.lang})
                </option>
              ))}
            </select>
          </div>
        )}

        {activeMode === "video" && (
          <div className="flex items-center gap-3 mb-2 px-1">
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-white/25">Aspect</span>
              <select
                value={videoAspect}
                onChange={(e) => setVideoAspect(e.target.value as "16:9" | "9:16")}
                className="bg-white/[0.03] border border-white/[0.07] rounded-lg
                px-2 py-1.5 text-xs text-white/60 focus:outline-none
                focus:border-white/20"
              >
                <option value="16:9" className="bg-[#0c0c0c]">16:9 Landscape</option>
                <option value="9:16" className="bg-[#0c0c0c]">9:16 Portrait</option>
              </select>
            </div>
          </div>
        )}

        <div className="relative bg-white/[0.04] border border-white/10
        rounded-2xl hover:border-white/15 focus-within:border-white/20
        transition-all duration-300 shadow-xl shadow-black/20">

          <textarea
            ref={textareaRef}
            value={input}
            onChange={(e) => {
              setInput(e.target.value)
              e.target.style.height = "auto"
              e.target.style.height =
                `${Math.min(e.target.scrollHeight, 120)}px`
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault()
                handleSubmit()
              }
            }}
            placeholder={currentMode.placeholder}
            rows={1}
            className="w-full bg-transparent text-white
            placeholder:text-white/20 text-sm resize-none
            focus:outline-none leading-relaxed
            px-4 pt-4 pb-2 pr-14
            min-h-[52px] max-h-[120px]"
          />

          <div className="flex items-center gap-0.5 px-3 pb-3 pt-1">
            {modes.map((mode) => (
              <button
                key={mode.value}
                onClick={() => handleModeSwitch(mode.value)}
                className={`flex items-center gap-1.5 px-2.5 py-1.5
                rounded-lg text-xs font-medium transition-all duration-200
                ${activeMode === mode.value
                  ? "bg-white/12 text-white"
                  : "text-white/25 hover:text-white/50 hover:bg-white/5"
                }`}
              >
                <mode.icon size={11} />
                {mode.label}
              </button>
            ))}
          </div>

          <button
            onClick={handleSubmit}
            disabled={!input.trim() || loading}
            className="absolute right-3 top-3
            w-8 h-8 rounded-lg bg-white text-black
            flex items-center justify-center
            hover:bg-white/90 active:scale-95
            transition-all duration-200
            disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {loading
              ? <Loader2 size={14} className="animate-spin" />
              : <ArrowRight size={14} />
            }
          </button>
        </div>

        <div className="flex items-center justify-center mt-2 gap-3">
          {hasStarted && (
            <>
              <button
                onClick={startNew}
                className="text-xs text-white/20 hover:text-white/45
                transition-colors flex items-center gap-1"
              >
                <RefreshCw size={10} />
                New conversation
              </button>
              <span className="text-white/10 text-xs">·</span>
            </>
          )}
          <p className="text-xs text-white/15">
            {activeMode === "image"
              ? "Powered by Pollinations AI · Free"
              : activeMode === "search"
              ? "Powered by Groq + Tavily · Live Web Search"
              : activeMode === "audio"
              ? "Powered by your browser · Free forever"
              : activeMode === "video"
              ? "Powered by Pollinations AI · Preview mode · Free"
              : "Powered by Groq · Llama 3.3 70B"
            }
          </p>
        </div>
      </div>
    </div>
  )
}