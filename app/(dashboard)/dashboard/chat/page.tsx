"use client"

import { useState, useRef, useEffect } from "react"
import { Send, User, ChevronDown, Sparkles, Copy, Check } from "lucide-react"
import Image from "next/image"

interface Message {
  role: "user" | "assistant"
  content: string
  provider?: string
  model?: string
}

const models = [
  { label: "Llama 3.1 8B", sublabel: "Groq", value: "groq/llama-3.1-8b-instant", badge: "Fast" },
  { label: "Llama 3.3 70B", sublabel: "Groq", value: "groq/llama-3.3-70b-versatile", badge: "Smart" },
]
export default function ChatPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [loading, setLoading] = useState(false)
  const [selectedModel, setSelectedModel] = useState(models[0])
  const [showModelMenu, setShowModelMenu] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  function copyMessage(content: string, index: number) {
    navigator.clipboard.writeText(content)
    setCopiedIndex(index)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  async function sendMessage() {
    if (!input.trim() || loading) return

    const userMessage: Message = { role: "user", content: input }
    const newMessages = [...messages, userMessage]
    setMessages(newMessages)
    setInput("")
    setLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"
    }

    try {
      const [provider, model] = selectedModel.value.split("/")

      const response = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages, provider, model })
      })

      const data = await response.json()

      setMessages([...newMessages, {
        role: "assistant",
        content: data.success ? data.content : `Error: ${data.error}`,
        provider: data.provider,
        model: data.model
      }])
    } catch {
      setMessages([...newMessages, {
        role: "assistant",
        content: "Something went wrong. Please try again.",
      }])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col h-full">

      {/* Header */}
      <div className="flex items-center justify-between px-6 
      py-4 border-b border-white/[0.06] shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-7 h-7 rounded-lg bg-white/5 
          border border-white/10 flex items-center justify-center">
            <Sparkles size={14} className="text-white/60" />
          </div>
          <div>
            <h2 className="text-sm font-medium">New Chat</h2>
            <p className="text-xs text-white/30">
              {messages.length === 0 
                ? "Start a conversation" 
                : `${messages.length} messages`}
            </p>
          </div>
        </div>

        {/* Model selector */}
        <div className="relative">
          <button
            onClick={() => setShowModelMenu(!showModelMenu)}
            className="flex items-center gap-2 px-3 py-1.5 
            rounded-lg bg-white/5 border border-white/10
            hover:bg-white/8 hover:border-white/20
            transition-all duration-200 text-sm"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-green-400" />
            <span className="text-white/70">{selectedModel.label}</span>
            <span className="text-white/30 text-xs">
              {selectedModel.sublabel}
            </span>
            <ChevronDown size={13} className="text-white/30" />
          </button>

          {showModelMenu && (
            <div className="absolute right-0 top-full mt-2 w-56
            bg-[#141414] border border-white/10 rounded-xl
            shadow-2xl shadow-black/50 z-50 overflow-hidden">
              <div className="p-1">
                {models.map((model) => (
                  <button
                    key={model.value}
                    onClick={() => {
                      setSelectedModel(model)
                      setShowModelMenu(false)
                    }}
                    className={`w-full flex items-center justify-between
                    px-3 py-2.5 rounded-lg text-sm transition-all
                    ${selectedModel.value === model.value
                      ? "bg-white/10 text-white"
                      : "text-white/50 hover:bg-white/5 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div className={`w-1.5 h-1.5 rounded-full
                        ${selectedModel.value === model.value 
                          ? "bg-green-400" : "bg-white/20"}`} 
                      />
                      <span>{model.label}</span>
                      <span className="text-white/30 text-xs">
                        {model.sublabel}
                      </span>
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-md
                    bg-white/8 text-white/40">
                      {model.badge}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto px-6 py-6 space-y-6 min-h-0">
        
        {/* Empty state */}
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center 
          h-full text-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-white/[0.03] 
            border border-white/8 flex items-center justify-center">
              <Image
                src="/logo1.png"
                alt="Soma"
                width={36}
                height={36}
                className="object-contain opacity-60"
              />
            </div>
            <div>
              <h3 className="font-medium text-white/70 mb-1">
                Start a conversation
              </h3>
              <p className="text-sm text-white/30">
                Powered by {selectedModel.label} · {selectedModel.sublabel}
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2 mt-2">
              {[
                "Explain neural networks",
                "Write a React component",
                "Debug my Python code",
                "Summarize a topic"
              ].map((s) => (
                <button
                  key={s}
                  onClick={() => setInput(s)}
                  className="px-4 py-2.5 rounded-xl text-sm
                  bg-white/[0.03] border border-white/8
                  text-white/40 hover:text-white/70
                  hover:bg-white/[0.06] hover:border-white/15
                  transition-all duration-200 text-left"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Message list */}
        {messages.map((msg, i) => (
          <div key={i} className={`flex gap-4 group
            ${msg.role === "user" ? "justify-end" : "justify-start"}`}
          >
            {/* Assistant avatar */}
            {msg.role === "assistant" && (
              <div className="w-7 h-7 rounded-lg bg-white/5 
              border border-white/10 flex items-center 
              justify-center shrink-0 mt-0.5">
                <Image
                  src="/logo1.png"
                  alt="Soma"
                  width={16}
                  height={16}
                  className="object-contain"
                />
              </div>
            )}

            <div className="flex flex-col gap-1 max-w-[75%]">
              <div className={`px-4 py-3 rounded-2xl text-sm 
                leading-relaxed
                ${msg.role === "user"
                  ? "bg-white text-black rounded-tr-sm font-medium"
                  : "bg-white/10 border border-white/8 text-white rounded-tl-sm"
                }`}
              >
                {msg.content}
              </div>

              {/* Message meta */}
              <div className={`flex items-center gap-2 px-1
                opacity-0 group-hover:opacity-100 transition-opacity
                ${msg.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {msg.provider && (
                  <span className="text-xs text-white/20">
                    {msg.provider} · {msg.model}
                  </span>
                )}
                <button
                  onClick={() => copyMessage(msg.content, i)}
                  className="text-white/20 hover:text-white/50 
                  transition-colors"
                >
                  {copiedIndex === i 
                    ? <Check size={12} /> 
                    : <Copy size={12} />}
                </button>
              </div>
            </div>

            {/* User avatar */}
            {msg.role === "user" && (
              <div className="w-7 h-7 rounded-lg bg-white/10 
              flex items-center justify-center shrink-0 mt-0.5">
                <User size={13} className="text-white/70" />
              </div>
            )}
          </div>
        ))}

        {/* Loading */}
        {loading && (
          <div className="flex gap-4 justify-start">
            <div className="w-7 h-7 rounded-lg bg-white/5 
            border border-white/10 flex items-center 
            justify-center shrink-0 mt-0.5">
              <Image
                src="/logo1.png"
                alt="Soma"
                width={16}
                height={16}
                className="object-contain animate-pulse"
              />
            </div>
            <div className="bg-white/[0.04] border border-white/8 
            rounded-2xl rounded-tl-sm px-4 py-3">
              <div className="flex gap-1.5 items-center">
                <div className="w-1.5 h-1.5 rounded-full bg-white/30
                animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white/30
                animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-1.5 h-1.5 rounded-full bg-white/30
                animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input area */}
      <div className="px-6 py-4 border-t border-white/[0.06] shrink-0">
        <div className="relative bg-white/[0.04] border border-white/10 
        rounded-2xl hover:border-white/20 focus-within:border-white/20
        transition-all duration-300">
          
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
            placeholder="Ask anything... (Enter to send, Shift+Enter for new line)"
            rows={1}
            className="w-full bg-transparent text-white 
            placeholder:text-white/20 text-sm resize-none
            focus:outline-none leading-relaxed
            px-4 pt-3.5 pb-3 pr-14
            min-h-[48px] max-h-[120px]"
          />

          <button
            onClick={sendMessage}
            disabled={!input.trim() || loading}
            className="absolute right-3 bottom-3
            w-8 h-8 rounded-lg bg-white text-black
            flex items-center justify-center
            hover:bg-white/90 transition-all duration-200
            disabled:opacity-20 disabled:cursor-not-allowed
            shadow-lg"
          >
            <Send size={14} />
          </button>
        </div>

        <p className="text-center text-xs text-white/15 mt-2">
          SomaLabs can make mistakes. Verify important information.
        </p>
      </div>
    </div>
  )
}