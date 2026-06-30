import { auth } from "@clerk/nextjs/server"
import { supabase } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { title, model, mode, messages } = await req.json()

    console.log("Creating conversation for user:", userId)

    const { data: conv, error: convError } = await supabase
      .from("conversations")
      .insert({
        user_id: userId,
        title: title ?? "New conversation",
        model: model ?? "llama-3.3-70b-versatile",
        mode: mode ?? "chat"
      })
      .select()
      .single()

    if (convError) {
      console.error("Supabase conversation insert error:", convError)
      return NextResponse.json({ error: "Failed to save", details: convError }, { status: 500 })
    }

    if (!conv) {
      console.error("No conversation returned")
      return NextResponse.json({ error: "No conversation returned" }, { status: 500 })
    }

    console.log("Conversation created:", conv.id)

    if (messages && messages.length > 0) {
      const { error: msgError } = await supabase.from("messages").insert(
        messages.map((m: any) => ({
          conversation_id: conv.id,
          role: m.role,
          content: m.content,
          metadata: m.metadata ?? null
        }))
      )

      if (msgError) {
        console.error("Supabase messages insert error:", msgError)
      }
    }

    return NextResponse.json({ success: true, id: conv.id })
  } catch (error) {
    console.error("Conversation API error:", error)
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 })
  }
}

export async function GET() {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { data } = await supabase
      .from("conversations")
      .select("id, title, mode, created_at")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(20)

    return NextResponse.json({ conversations: data ?? [] })
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 })
  }
}