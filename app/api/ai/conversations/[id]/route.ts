import { auth } from "@clerk/nextjs/server"
import { supabase } from "@/lib/supabase"
import { NextRequest, NextResponse } from "next/server"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { userId } = await auth()
    if (!userId) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { id } = await params

    // Confirm this conversation actually belongs to the requesting user
    const { data: conv, error: fetchError } = await supabase
      .from("conversations")
      .select("id")
      .eq("id", id)
      .eq("user_id", userId)
      .single()

    if (fetchError || !conv) {
      return NextResponse.json({ error: "Not found" }, { status: 404 })
    }

    // Delete messages first in case there's no ON DELETE CASCADE configured
    const { error: msgDeleteError } = await supabase
      .from("messages")
      .delete()
      .eq("conversation_id", id)

    if (msgDeleteError) {
      console.error("Failed to delete messages:", msgDeleteError)
      return NextResponse.json({ error: "Failed to delete messages" }, { status: 500 })
    }

    const { error: convDeleteError } = await supabase
      .from("conversations")
      .delete()
      .eq("id", id)
      .eq("user_id", userId)

    if (convDeleteError) {
      console.error("Failed to delete conversation:", convDeleteError)
      return NextResponse.json({ error: "Failed to delete conversation" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Delete conversation error:", error)
    return NextResponse.json({ error: "Server error", details: String(error) }, { status: 500 })
  }
}