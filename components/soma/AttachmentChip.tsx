"use client"

import { X, FileText, Loader2 } from "lucide-react"
import type { Attachment } from "./types"

export function AttachmentChip({
  attachment,
  uploading,
  onRemove,
}: {
  attachment: Attachment | { name: string; type: "image" | "document"; localPreview?: string }
  uploading?: boolean
  onRemove: () => void
}) {
  const isImage = attachment.type === "image"
  const preview = "url" in attachment ? attachment.url : (attachment as any).localPreview

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