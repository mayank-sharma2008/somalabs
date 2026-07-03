"use client"

import { useState } from "react"
import { Play, Copy, Check } from "lucide-react"
import ReactMarkdown from "react-markdown"
import CodePreview from "@/app/(dashboard)/dashboard/CodePreview"

export function CodeBlock({ language, code }: { language: string; code: string }) {
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
              <button onClick={() => setShowPreview(true)} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: "#6B6B6B" }}>
                <Play size={10} />Preview
              </button>
            )}
            <button onClick={handleCopy} className="flex items-center gap-1.5 text-xs transition-colors" style={{ color: "#6B6B6B" }}>
              {copied ? <><Check size={10} />Copied</> : <><Copy size={10} />Copy</>}
            </button>
          </div>
        </div>
        <pre className="p-4 overflow-auto text-xs font-mono leading-relaxed" style={{ background: "#000000", color: "#4ADE80" }}>
          <code>{code}</code>
        </pre>
      </div>
      {showPreview && <CodePreview code={code} language={language} onClose={() => setShowPreview(false)} />}
    </>
  )
}

export function SomaMarkdown({ content }: { content: string }) {
  return (
    <div className="text-sm" style={{ color: "#D4D4D4", lineHeight: "1.8" }}>
      <ReactMarkdown
        components={{
          h1: ({ children }) => <h1 className="text-xl font-semibold mb-4 mt-2" style={{ color: "#ffffff" }}>{children}</h1>,
          h2: ({ children }) => <h2 className="text-base font-semibold mb-3 mt-5" style={{ color: "#ffffff" }}>{children}</h2>,
          h3: ({ children }) => <h3 className="text-sm font-semibold mb-2 mt-4" style={{ color: "#E5E5E5" }}>{children}</h3>,
          p: ({ children }) => <p className="mb-3 last:mb-0" style={{ lineHeight: "1.8" }}>{children}</p>,
          strong: ({ children }) => <strong className="font-semibold" style={{ color: "#ffffff" }}>{children}</strong>,
          em: ({ children }) => <em className="italic" style={{ color: "#A3A3A3" }}>{children}</em>,
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-")
            const lang = className?.replace("language-", "") ?? ""
            if (isBlock) return <CodeBlock language={lang} code={String(children).replace(/\n$/, "")} />
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
          blockquote: ({ children }) => <blockquote className="border-l-2 pl-4 my-4 italic" style={{ borderColor: "#2A2A2A", color: "#6B6B6B" }}>{children}</blockquote>,
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  )
}