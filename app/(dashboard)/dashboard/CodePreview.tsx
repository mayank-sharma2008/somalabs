"use client"

import { Sandpack } from "@codesandbox/sandpack-react"
import { X, Maximize2, Minimize2 } from "lucide-react"
import { useState } from "react"

interface CodePreviewProps {
  code: string
  language: string
  onClose: () => void
}

function detectTemplate(language: string, code: string): "react" | "vanilla" | "static" {
  const lang = language.toLowerCase()
  if (
    lang.includes("jsx") ||
    lang.includes("react") ||
    lang.includes("tsx") ||
    code.includes("useState") ||
    code.includes("export default function") ||
    code.includes("import React")
  ) {
    return "react"
  }
  if (lang.includes("html")) {
    return "static"
  }
  return "vanilla"
}

export default function CodePreview({ code, language, onClose }: CodePreviewProps) {
  const [expanded, setExpanded] = useState(false)
  const template = detectTemplate(language, code)

  let files: Record<string, string> = {}

  if (template === "react") {
    const hasImport = code.includes("import")
    const hasExport = code.includes("export default")

    let appCode = code

    if (!hasImport) {
      appCode = `import { useState, useEffect } from "react"\n\n${appCode}`
    }
    if (!hasExport) {
      appCode = `${appCode}\n\nexport default App`
    }

    files = {
      "/App.js": appCode,
      "/styles.css": `
@tailwind base;
@tailwind components;
@tailwind utilities;
`,
      "/index.js": `
import React from "react"
import ReactDOM from "react-dom/client"
import "./styles.css"
import App from "./App"

const root = ReactDOM.createRoot(document.getElementById("root"))
root.render(<App />)
`
    }
  } else if (template === "static") {
    files = { "/index.html": code }
  } else {
    files = { "/index.js": code }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm
    flex items-center justify-center p-4">
      <div className={`bg-[#0c0c0c] border border-white/10 rounded-2xl
      overflow-hidden flex flex-col shadow-2xl
      ${expanded ? "w-full h-full" : "w-full max-w-6xl h-[85vh]"}`}>

        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3
        border-b border-white/10 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400" />
            <span className="text-sm font-medium text-white/70">
              Live Preview
            </span>
            <span className="text-xs text-white/30 px-2 py-0.5
            rounded-md bg-white/5">
              {language || "code"}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 rounded-lg flex items-center
              justify-center text-white/40 hover:text-white
              hover:bg-white/10 transition-all"
            >
              {expanded ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
            </button>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center
              justify-center text-white/40 hover:text-white
              hover:bg-white/10 transition-all"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Sandpack */}
        <div className="flex-1 overflow-hidden">
          <Sandpack
            template={template === "react" ? "react" : template === "static" ? "static" : "vanilla"}
            files={files}
            theme="dark"
            options={{
              showNavigator: false,
              showTabs: template !== "static",
              showLineNumbers: true,
              showConsole: false,
              editorWidthPercentage: 45,
              externalResources: template === "react"
                ? ["https://cdn.tailwindcss.com"]
                : []
            }}
          />
        </div>
      </div>
    </div>
  )
}