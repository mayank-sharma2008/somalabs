export type Capability = "general" | "image" | "code" | "search" | "audio" | "video"

export interface Attachment {
  id: string
  name: string
  type: "image" | "document"
  mimeType: string
  url: string
  extractedText?: string
  size: number
}

export interface Source {
  index: number
  title: string
  url: string
  snippet: string
}

export interface Message {
  role: "user" | "assistant"
  content: string
  type: "text" | "image" | "audio" | "video"
  imageUrl?: string
  capability?: Capability
  provider?: string
  model?: string
  sources?: Source[]
  attachments?: Attachment[]   // NEW — files the user attached to this message
}