"use client"

import { useState, useRef, useEffect } from "react"
import {
  ArrowRight,
  Loader2,
  User,
  Copy,
  Check,
  Play,
  Pause,
  Square
} from "lucide-react"
import Image from "next/image"
import ReactMarkdown from "react-markdown"
import CodePreview from "../../CodePreview"
import SearchSources from "../../SearchSources"

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
  type: "text" | "audio" | "image"
  imageUrl?: string
  provider?: string
  model?: string
  sources?: Source[]
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

const modePlaceholders: Record<Mode, string> = {
  chat: "Continue the conversation...",
  image: "Image conversations aren't continued here",
  code: "Describe what code you need...",
  search: "Search the web with AI...",
  audio: "Type text to convert into speech...",
  video: "Coming soon...",
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

export default function ConversationClient({
  conversation,
  initialMessages
}: {
  conversation: any
  initialMessages: any[]
}) {
  const mode: Mode = (conversation.mode as Mode) || "chat"

  const [messages, setMessages] = useState<Message[]>(
    initialMessages.map(m => ({
      role: m.role as "user" | "assistant",
      content: m.content,
      type: mode === "audio" ? "audio" : mode === "image" ? "image" : "text",
      imageUrl: m.metadata?.imageUrl
    }))
  )
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)

  // Web Speech API state — only used when mode === "audio"
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  const [audioVoice, setAudioVoice] = useState<string>("")
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null)
  const [isPaused, setIsPaused] = useState(false)

  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (mode !== "audio") return
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
        window.speechSynthesis.cancel()
      }
    }
  }, [mode])

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

  async function saveFollowUp(userInput: string, assistantContent: string) {
    try {
      await fetch("/api/ai/conversations/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversationId: conversation.id,
          messages: [
            { role: "user", content: userInput },
            { role: "assistant", content: assistantContent }
          ]
        })
      })
    } catch (err) {
      console.error("Failed to save follow-up messages:", err)
    }
  }

  async function sendMessage() {
    if (!input.trim() || loading) return
    if (mode === "video" || mode === "image") return

    const userInput = input.trim()
    setInput("")
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
      if (mode === "search") {
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

        await saveFollowUp(userInput, assistantContent)

      } else if (mode === "audio") {
        setMessages(prev => [...prev, {
          role: "assistant",
          content: userInput,
          type: "audio"
        }])

        await saveFollowUp(userInput, userInput)

      } else {
        // chat or code
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            messages: [
              {
                role: "system",
                content: systemPrompts[mode] ?? systemPrompts.chat
              },
              ...messages.map(m => ({
                role: m.role,
                content: m.content
              })),
              { role: "user", content: userInput }
            ],
            provider: "groq",
            model: "llama-3.3-70b-versatile",
            maxTokens: mode === "code" ? 4096 : 1024
          })
        })

        const data = await response.json()
        const assistantContent = data.content || "Sorry I couldn't respond."

        setMessages(prev => [...prev, {
          role: "assistant",
          content: assistantContent,
          type: "text",
          provider: data.provider,
          model: data.model
        }])

        await saveFollowUp(userInput, assistantContent)
      }
    } catch {
      setMessages(prev => [...prev, {
        role: "assistant",
        content: "Something went wrong. Please try again.",
        type: "text"
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="shrink-0 px-6 py-4 border-b border-white/[0.06]
      flex items-center gap-3">
        <div>
          <h2 className="text-sm font-medium">{conversation.title}</h2>
          <p className="text-xs text-white/25">
            {new Date(conversation.created_at).toLocaleDateString()}
            {" · "}
            <span className="uppercase tracking-wide">{mode}</span>
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-3xl mx-auto px-4 py-8 space-y-6">
          {messages.map((msg, i) => (
            <div key={i} className={`flex gap-3
              ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            >
              {msg.role === "assistant" && (
                <div className="w-7 h-7 rounded-lg bg-white/8
                border border-white/10 flex items-center
                justify-center shrink-0 mt-1">
                  <Image src="/logo1.png" alt="Soma"
                    width={16} height={16}
                    className="object-contain" />
                </div>
              )}

              <div className="max-w-[80%]">
                {msg.type === "image" && msg.imageUrl ? (
                  <div className="relative group">
                    <img
                      src={msg.imageUrl}
                      alt={msg.content}
                      className="rounded-2xl max-w-sm w-full
                      border border-white/10 shadow-xl"
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
                        Save
                      </button>
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
                  <div className={`px-4 py-3 rounded-2xl
                    text-sm leading-relaxed
                    ${msg.role === "user"
                      ? "bg-white text-black rounded-tr-sm font-medium"
                      : "bg-white/[0.05] border border-white/8 text-white rounded-tl-sm"
                    }`}
                  >
                    {msg.role === "assistant" ? (
                      <ReactMarkdown
                        components={{
                          h1: ({ children }) => <h1 className="text-lg font-bold mb-2">{children}</h1>,
                          h2: ({ children }) => <h2 className="text-base font-bold mb-2">{children}</h2>,
                          h3: ({ children }) => <h3 className="text-sm font-semibold mb-1">{children}</h3>,
                          p: ({ children }) => <p className="mb-2 last:mb-0 text-white/85">{children}</p>,
                          strong: ({ children }) => <strong className="font-semibold text-white">{children}</strong>,
                          em: ({ children }) => <em className="italic text-white/75">{children}</em>,
                          code: ({ children, className }) => {
                            const isBlock = className?.includes("language-")
                            const lang = className?.replace("language-", "") ?? ""

                            if (isBlock) {
                              const codeString = String(children).replace(/\n$/, "")
                              return <CodeBlock language={lang} code={codeString} />
                            }

                            return (
                              <code className="bg-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-green-400/90">
                                {children}
                              </code>
                            )
                          },
                          ul: ({ children }) => <ul className="list-disc list-inside mb-2 space-y-1">{children}</ul>,
                          ol: ({ children }) => <ol className="list-decimal list-inside mb-2 space-y-1">{children}</ol>,
                          li: ({ children }) => <li className="text-white/80">{children}</li>,
                        }}
                      >
                        {msg.content}
                      </ReactMarkdown>
                    ) : msg.content}

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

          {loading && (
            <div className="flex gap-3">
              <div className="w-7 h-7 rounded-lg bg-white/8
              border border-white/10 flex items-center justify-center">
                <Image src="/logo1.png" alt="Soma" width={16} height={16}
                  className="object-contain animate-pulse" />
              </div>
              <div className="bg-white/[0.05] border border-white/8
              rounded-2xl px-4 py-3">
                <div className="flex gap-1.5">
                  {[0, 150, 300].map(d => (
                    <div key={d} className="w-1.5 h-1.5 rounded-full
                    bg-white/40 animate-bounce"
                    style={{ animationDelay: `${d}ms` }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Input */}
      <div className="shrink-0 px-4 pb-4 max-w-3xl mx-auto w-full">

        {mode === "audio" && voices.length > 0 && (
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

        <div className="relative bg-white/[0.04] border border-white/10
        rounded-2xl focus-within:border-white/20 transition-all duration-300">
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
                sendMessage()
              }
            }}
            placeholder={modePlaceholders[mode]}
            rows={1}
            disabled={mode === "video" || mode === "image"}
            className="w-full bg-transparent text-white
            placeholder:text-white/20 text-sm resize-none
            focus:outline-none px-4 py-3.5 pr-14
            min-h-[52px] max-h-[120px]
            disabled:cursor-not-allowed disabled:opacity-40"
          />
          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading || mode === "video" || mode === "image"}
            className="absolute right-3 top-3 w-8 h-8
            rounded-lg bg-white text-black flex items-center
            justify-center hover:bg-white/90 transition-all
            disabled:opacity-20 disabled:cursor-not-allowed"
          >
            {loading
              ? <Loader2 size={14} className="animate-spin" />
              : <ArrowRight size={14} />
            }
          </button>
        </div>
        <p className="text-center text-xs text-white/15 mt-2">
          {mode === "search"
            ? "Powered by Groq + Tavily · Live Web Search"
            : mode === "audio"
            ? "Powered by your browser · Free forever"
            : "Powered by Groq · Llama 3.3 70B"
          }
        </p>
      </div>
    </div>
  )
}