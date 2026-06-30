"use client"

import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { UserButton } from "@clerk/nextjs"
import {
  Plus,
  Clock,
  MessageSquare,
  ImageIcon as ImageLucide,
  Code,
  Search,
  Music,
  Video
} from "lucide-react"
import { useEffect, useState } from "react"

interface Conversation {
  id: string
  title: string
  mode?: string
  created_at: string
}

const modeIcons: Record<string, any> = {
  chat: MessageSquare,
  image: ImageLucide,
  code: Code,
  search: Search,
  audio: Music,
  video: Video,
}

function getModeIcon(mode?: string) {
  return modeIcons[mode ?? "chat"] ?? MessageSquare
}

export default function SidebarClient({
  user,
}: {
  user: { firstName?: string | null }
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [recents, setRecents] = useState<Conversation[]>([])

  async function fetchRecents() {
    try {
      const res = await fetch("/api/ai/conversations")
      const data = await res.json()
      setRecents(data.conversations ?? [])
    } catch {
      console.error("Failed to fetch recents")
    }
  }

  useEffect(() => {
    fetchRecents()
  }, [pathname])

  function handleNew() {
    if (pathname === "/dashboard") {
      window.location.href = "/dashboard"
    } else {
      router.push("/dashboard")
    }
    setTimeout(fetchRecents, 500)
  }

  function handleRecentClick(id: string) {
    if (pathname === `/dashboard/c/${id}`) {
      window.location.href = `/dashboard/c/${id}`
    } else {
      router.push(`/dashboard/c/${id}`)
    }
  }

  return (
    <aside className="w-56 flex flex-col py-4 px-3 shrink-0
    border-r border-white/[0.06] h-full">

      {/* Logo */}
      <div className="flex items-center gap-2 px-2 mb-6">
        <div className="w-6 h-6 rounded-full overflow-hidden
        flex items-center justify-center">
          <Image
            src="/logo1.png"
            alt="SomaLabs"
            width={24}
            height={24}
            className="object-cover w-full h-full"
          />
      </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm tracking-widest uppercase">
            Soma
          </span>
          <span className="text-[9px] tracking-[0.2em] text-white/30
          uppercase -mt-0.5">
            Unified AI Studio
          </span>
        </div>
      </div>

      {/* New button */}
      <button
        onClick={handleNew}
        className="flex items-center gap-2 px-3 py-2.5
        rounded-lg bg-white/6 border border-white/10
        text-sm font-medium mb-4 hover:bg-white/10
        transition-all duration-200 w-full text-left"
      >
        <Plus size={15} />
        New Chat
      </button>

      {/* Recent conversations */}
      <div className="flex-1 overflow-auto min-h-0">
        <div className="flex items-center gap-2 px-2 py-2
        text-xs text-white/25 font-medium">
          <Clock size={12} />
          Recent
        </div>

        {recents.length === 0 ? (
          <div className="px-2 py-2 text-xs text-white/15">
            No recent chats yet
          </div>
        ) : (
          <div className="flex flex-col gap-0.5">
            {recents.map((conv) => {
              const ModeIcon = getModeIcon(conv.mode)
              return (
                <button
                  key={conv.id}
                  onClick={() => handleRecentClick(conv.id)}
                  className={`flex items-center gap-2 px-3 py-2
                  rounded-lg text-xs w-full text-left
                  transition-all duration-200 group
                  ${pathname === `/dashboard/c/${conv.id}`
                    ? "bg-white/10 text-white"
                    : "text-white/40 hover:text-white/70 hover:bg-white/5"
                  }`}
                >
                  <ModeIcon size={11} className="shrink-0 opacity-50" />
                  <span className="truncate">
                    {conv.title ?? "New conversation"}
                  </span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* User */}
      <div className="flex items-center gap-2 px-2 pt-3
      border-t border-white/[0.06]">
        <UserButton />
        <span className="text-sm text-white/40 truncate">
          {user?.firstName}
        </span>
      </div>
    </aside>
  )
}