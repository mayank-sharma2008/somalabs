import { supabase } from "@/lib/supabase"
import { auth } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import ConversationClient from "./ConversationClient"

export default async function ConversationPage({
  params
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params
  const { userId } = await auth()
  if (!userId) redirect("/sign-in")

  const { data: conv } = await supabase
    .from("conversations")
    .select("*")
    .eq("id", id)
    .eq("user_id", userId)
    .single()

  if (!conv) redirect("/dashboard")

  const { data: messages } = await supabase
    .from("messages")
    .select("*")
    .eq("conversation_id", id)
    .order("created_at", { ascending: true })

  return (
    <ConversationClient
      conversation={conv}
      initialMessages={messages ?? []}
    />
  )
}