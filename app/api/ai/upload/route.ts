import { NextRequest, NextResponse } from "next/server"
import { auth } from "@clerk/nextjs/server"
import { supabaseAdmin } from "@/lib/supabase-admin"

export const runtime = "nodejs" // pdf-parse/mammoth need Node, not edge

const MAX_SIZE = 15 * 1024 * 1024 // 15MB
const ALLOWED = {
  "image/png": "image",
  "image/jpeg": "image",
  "image/webp": "image",
  "image/gif": "image",
  "application/pdf": "document",
  "text/plain": "document",
  "text/csv": "document",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document": "document",
} as const

export async function POST(req: NextRequest) {
  const { userId } = await auth()
  if (!userId) {
    return NextResponse.json({ success: false, error: "Unauthorized" }, { status: 401 })
  }

  const formData = await req.formData()
  const file = formData.get("file") as File | null
  if (!file) {
    return NextResponse.json({ success: false, error: "No file provided" }, { status: 400 })
  }

  const kind = ALLOWED[file.type as keyof typeof ALLOWED]
  if (!kind) {
    return NextResponse.json({ success: false, error: `Unsupported file type: ${file.type}` }, { status: 400 })
  }
  if (file.size > MAX_SIZE) {
    return NextResponse.json({ success: false, error: "File too large (max 15MB)" }, { status: 400 })
  }

  const buffer = Buffer.from(await file.arrayBuffer())
  const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_")
  const path = `${userId}/${Date.now()}-${safeName}`

  // Upload the raw file to storage regardless of type — keeps an original copy
  const { error: uploadError } = await supabaseAdmin.storage
    .from("attachments")
    .upload(path, buffer, { contentType: file.type, upsert: false })

  if (uploadError) {
    console.error("Upload failed:", uploadError)
    return NextResponse.json({ success: false, error: "Upload failed" }, { status: 500 })
  }

  const { data: publicUrlData } = supabaseAdmin.storage
    .from("attachments")
    .getPublicUrl(path)

  const url = publicUrlData.publicUrl

  // Extract text for documents so the (non-vision) chat model can "read" them
  let extractedText: string | undefined

  try {
    if (file.type === "application/pdf") {
      const pdfParseModule: any = await import("pdf-parse")
      const pdfParse = pdfParseModule.default ?? pdfParseModule
      const parsed = await pdfParse(buffer)
      extractedText = parsed.text.slice(0, 20000) // guard against huge docs blowing context
    } else if (
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      const mammothModule: any = await import("mammoth")
      const mammoth = mammothModule.default ?? mammothModule        
      const result = await mammoth.extractRawText({ buffer })
      extractedText = result.value.slice(0, 20000)
    } else if (file.type === "text/plain" || file.type === "text/csv") {
      extractedText = buffer.toString("utf-8").slice(0, 20000)
    }
  } catch (e) {
    console.error("Text extraction failed:", e)
    // Non-fatal — image/doc still uploaded, just no extracted context
  }

  return NextResponse.json({
    success: true,
    id: path,
    name: file.name,
    type: kind, // "image" | "document"
    mimeType: file.type,
    url,
    size: file.size,
    extractedText,
  })
}