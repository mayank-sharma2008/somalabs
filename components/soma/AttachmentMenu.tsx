"use client"

import { useRef, useState, useEffect } from "react"
import { Paperclip, Image as ImageIcon, FileText } from "lucide-react"

export default function AttachmentMenu({
  onFilesSelected,
}: {
  onFilesSelected: (files: File[]) => void
}) {
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
    e.target.value = "" // allow re-selecting the same file later
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
        accept=".pdf,.txt,.csv,.docx,application/pdf,text/plain,text/csv,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
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