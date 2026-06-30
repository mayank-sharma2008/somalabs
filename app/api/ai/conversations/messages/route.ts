import { auth } from "@clerk/nextjs/server"
import { supabase } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json(
      { error: "Unauthorized" }, { status: 401 }
    )

    const { conversationId, messages } = await req.json()

    await supabase.from("messages").insert(
      messages.map((m: any) => ({
        conversation_id: conversationId,
        role: m.role,
        content: m.content,
        metadata: m.metadata ?? null
      }))
    )

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}