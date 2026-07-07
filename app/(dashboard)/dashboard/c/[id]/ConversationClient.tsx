"use client"

import { useRouter } from "next/navigation"
import SomaDashboard, { type Capability, type DashboardMessage } from "@/components/soma/SomaDashboard"

export default function ConversationClient({
  conversation,
  initialMessages,
}: {
  conversation: any
  initialMessages: any[]
}) {
  const router = useRouter()

  const mapped: DashboardMessage[] = initialMessages.map((m) => ({
    role: m.role,
    content: m.content,
    type: m.metadata?.type ?? "text",
    imageUrl: m.metadata?.imageUrl,
    capability: m.metadata?.capability,
    sources: m.metadata?.sources,
    provider: m.metadata?.provider,
    model: m.metadata?.model,
    attachments: m.metadata?.attachments,
    timestamp: m.created_at ? new Date(m.created_at).getTime() : undefined,
  }))

  const initialCapability: Capability =
    conversation.mode && conversation.mode !== "chat" ? conversation.mode : "general"

  return (
    <SomaDashboard
      initialMessages={mapped}
      initialCapability={initialCapability}
      initialConversationId={conversation.id}
      onNewConversation={() => router.push("/dashboard")}
    />
  )
}