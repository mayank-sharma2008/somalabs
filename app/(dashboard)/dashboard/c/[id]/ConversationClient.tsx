"use client"

import SomaChat from "@/components/soma/SomaChat"
import type { Capability, Message } from "@/components/soma/types"

export default function ConversationClient({
  conversation,
  initialMessages,
}: {
  conversation: any
  initialMessages: any[]
}) {
  const mapped: Message[] = initialMessages.map((m) => ({
    role: m.role,
    content: m.content,
    type: m.metadata?.imageUrl ? "image" : "text",
    imageUrl: m.metadata?.imageUrl,
    capability: conversation.mode && conversation.mode !== "chat" ? conversation.mode : "general",
  }))

  const initialCapability: Capability =
    conversation.mode && conversation.mode !== "chat" ? conversation.mode : "general"

  return (
    <SomaChat
      initialMessages={mapped}
      initialCapability={initialCapability}
      conversationId={conversation.id}
    />
  )
}