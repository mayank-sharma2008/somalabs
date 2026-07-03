"use client"

import { useRouter, usePathname } from "next/navigation"
import Image from "next/image"
import { useUser, useClerk } from "@clerk/nextjs"
import {
  Plus,
  Clock,
  ChevronDown,
  Command,
  MessageSquare,
  ImageIcon,
  Code,
  Search,
  Music,
  Video,
  LogOut,
  Menu,
  PanelLeftClose,
} from "lucide-react"
import { useEffect, useState, useRef } from "react"

interface Conversation {
  id: string
  title: string
  mode?: string
  created_at: string
}

const modeIcons: Record<string, any> = {
  chat: MessageSquare,
  image: ImageIcon,
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
  onNavigate,
}: {
  user: { firstName?: string | null; emailAddress?: string | null }
  onNavigate?: () => void
}) {
  const router = useRouter()
  const pathname = usePathname()
  const { user: clerkUser } = useUser()
  const { signOut } = useClerk()
  const [recents, setRecents] = useState<Conversation[]>([])
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [collapsed, setCollapsed] = useState(false)
  const [hydrated, setHydrated] = useState(false)
  const profileRef = useRef<HTMLDivElement>(null)

  // Restore collapsed state from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem("soma-sidebar-collapsed")
    if (stored === "true") setCollapsed(true)
    setHydrated(true)
  }, [])

  function toggleCollapsed() {
    setCollapsed((prev) => {
      const next = !prev
      localStorage.setItem("soma-sidebar-collapsed", String(next))
      return next
    })
  }

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

  // Close menu when clicking outside
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setShowUserMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => document.removeEventListener("mousedown", handleClickOutside)
  }, [])

  function handleNew() {
    if (pathname === "/dashboard") {
      window.location.href = "/dashboard"
    } else {
      router.push("/dashboard")
    }
    setTimeout(fetchRecents, 500)
    onNavigate?.()
  }

  function handleRecentClick(id: string) {
    if (pathname === `/dashboard/c/${id}`) {
      window.location.href = `/dashboard/c/${id}`
    } else {
      router.push(`/dashboard/c/${id}`)
    }
    onNavigate?.()
  }

  async function handleSignOut() {
    await signOut()
    router.push("/sign-in")
  }

  const initials = (
    user.firstName ?? clerkUser?.firstName ?? "M"
  ).charAt(0).toUpperCase()

  const email =
    user.emailAddress ??
    clerkUser?.primaryEmailAddress?.emailAddress ??
    "user@somalabs.ai"

  const displayName =
    user.firstName ?? clerkUser?.firstName ?? "Mayank"

  return (
    <>
      <style>{`
        .soma-sidebar-scroll::-webkit-scrollbar { width: 3px; }
        .soma-sidebar-scroll::-webkit-scrollbar-track { background: transparent; }
        .soma-sidebar-scroll::-webkit-scrollbar-thumb { background: #2A2A2A; border-radius: 99px; }
        .soma-sidebar-scroll::-webkit-scrollbar-thumb:hover { background: #3A3A3A; }
        .soma-sidebar-scroll { scrollbar-width: thin; scrollbar-color: #2A2A2A transparent; }
      `}</style>

      <aside
        className="flex flex-col shrink-0 h-full"
        style={{
          width: collapsed ? "72px" : "260px",
          background: "#000000",
          borderRight: "1px solid #1A1A1A",
          transition: hydrated ? "width 0.2s ease" : "none",
          overflow: "hidden",
        }}
      >
        {/* Logo + collapse toggle — same row, like Claude's title bar */}
        <div
          className={`flex items-center pt-5 pb-4 ${collapsed ? "justify-center px-0" : "justify-between px-5"}`}
        >
          <div className={`flex items-center ${collapsed ? "" : "gap-2.5"}`}>
            <div className="w-7 h-7 rounded-full overflow-hidden shrink-0">
              <Image
                src="/logo1.png"
                alt="SOMA"
                width={28}
                height={28}
                className="object-cover w-full h-full"
              />
            </div>
            {!collapsed && (
              <span
                className="text-white font-medium text-sm whitespace-nowrap"
                style={{ letterSpacing: "0.18em" }}
              >
                SOMA LABS
              </span>
            )}
          </div>

          {!collapsed && (
            <button
              onClick={toggleCollapsed}
              title="Collapse sidebar"
              className="flex items-center justify-center w-7 h-7 rounded-lg transition-colors duration-150"
              style={{ color: "#6B6B6B" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#A3A3A3")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B6B6B")}
            >
              <PanelLeftClose size={16} />
            </button>
          )}
        </div>

        {/* When collapsed, the expand trigger drops below the centered logo */}
        {collapsed && (
          <div className="flex justify-center pb-3 -mt-1">
            <button
              onClick={toggleCollapsed}
              title="Expand sidebar"
              className="flex items-center justify-center w-8 h-8 rounded-lg transition-colors duration-150"
              style={{ color: "#6B6B6B" }}
              onMouseEnter={(e) => (e.currentTarget.style.color = "#A3A3A3")}
              onMouseLeave={(e) => (e.currentTarget.style.color = "#6B6B6B")}
            >
              <Menu size={16} />
            </button>
          </div>
        )}

        {/* New Chat button */}
        <div className={`mb-1 ${collapsed ? "px-3" : "px-3"}`}>
          <button
            onClick={handleNew}
            title="New Chat"
            className={`flex items-center rounded-xl transition-all duration-150
            ${collapsed ? "justify-center w-full h-10" : "justify-between w-full px-3.5 py-2.5"}`}
            style={{ background: "#1A1A1A" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#222222")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "#1A1A1A")}
          >
            <div className={`flex items-center ${collapsed ? "" : "gap-2.5"}`}>
              <Plus size={15} style={{ color: "rgba(255,255,255,0.7)" }} />
              {!collapsed && (
                <span className="text-white text-sm font-medium whitespace-nowrap">New Chat</span>
              )}
            </div>
            {!collapsed && (
              <div
                className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-md"
                style={{ background: "#2A2A2A" }}
              >
                <Command size={10} style={{ color: "#6B6B6B" }} />
                <span className="text-[11px] font-medium" style={{ color: "#6B6B6B" }}>N</span>
              </div>
            )}
          </button>
        </div>

        {/* Recents button */}
        <div className={`mb-3 ${collapsed ? "px-3" : "px-3"}`}>
          <button
            title="Recents"
            className={`flex items-center rounded-xl transition-all duration-150
            ${collapsed ? "justify-center w-full h-9" : "gap-2.5 w-full px-3.5 py-2.5"}`}
            style={{ background: "transparent" }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "#111111")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
          >
            <Clock size={15} style={{ color: "#6B6B6B" }} />
            {!collapsed && (
              <span className="text-sm font-medium whitespace-nowrap" style={{ color: "#A3A3A3" }}>
                Recents
              </span>
            )}
          </button>
        </div>

        {/* Divider */}
        <div className={`mb-3 ${collapsed ? "mx-3" : "mx-3"}`} style={{ height: "1px", background: "#1A1A1A" }} />

        {/* Conversations list OR empty state — hidden entirely when collapsed */}
        {!collapsed && (
          <div className="flex-1 overflow-auto min-h-0 px-3 soma-sidebar-scroll">
            {recents.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 py-8">
                <Image
                  src="/logo1.png"
                  alt=""
                  width={60}
                  height={60}
                  className="object-contain"
                  style={{ opacity: 0.12 }}
                />
                <div className="text-center">
                  <p className="text-white text-sm font-semibold mb-1">No recent chats yet</p>
                  <p className="text-xs leading-relaxed" style={{ color: "#A3A3A3" }}>
                    Your conversations will
                    <br />
                    appear here.
                  </p>
                </div>
              </div>
            ) : (
              <div className="flex flex-col gap-0.5 pb-2">
                {recents.map((conv) => {
                  const ModeIcon = getModeIcon(conv.mode)
                  const isActive = pathname === `/dashboard/c/${conv.id}`
                  return (
                    <button
                      key={conv.id}
                      onClick={() => handleRecentClick(conv.id)}
                      className="flex items-center gap-2.5 px-3 py-2
                      rounded-xl w-full text-left transition-all duration-150 text-xs"
                      style={{
                        background: isActive ? "#1A1A1A" : "transparent",
                        color: isActive ? "#ffffff" : "#A3A3A3",
                      }}
                      onMouseEnter={(e) => {
                        if (!isActive) e.currentTarget.style.background = "#111111"
                      }}
                      onMouseLeave={(e) => {
                        if (!isActive) e.currentTarget.style.background = "transparent"
                      }}
                    >
                      <ModeIcon size={11} className="shrink-0" style={{ opacity: 0.45 }} />
                      <span className="truncate">{conv.title ?? "New conversation"}</span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* Spacer to push profile to bottom when collapsed (no recents list) */}
        {collapsed && <div className="flex-1" />}

        {/* User profile card with logout popup */}
        <div className={`pb-4 relative ${collapsed ? "px-3" : "px-3"}`} ref={profileRef}>
          {showUserMenu && (
            <div
              className={`absolute bottom-full mb-2 rounded-xl overflow-hidden shadow-2xl z-50
              ${collapsed ? "left-3 w-48" : "left-3 right-3"}`}
              style={{ background: "#121212", border: "1px solid #2A2A2A" }}
            >
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2.5 w-full px-4 py-3 text-sm transition-colors duration-150"
                style={{ color: "#FF6B6B" }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "#1A1A1A")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
              >
                <LogOut size={14} />
                Sign out
              </button>
            </div>
          )}

          <button
            onClick={() => setShowUserMenu((prev) => !prev)}
            title={displayName}
            className={`flex items-center rounded-2xl transition-all duration-150 text-left
            ${collapsed ? "justify-center w-full h-10" : "gap-3 w-full px-3 py-2.5"}`}
            style={{
              background: showUserMenu ? "#222222" : "#1A1A1A",
              border: `1px solid ${showUserMenu ? "#3A3A3A" : "#2A2A2A"}`,
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "#222222"
              e.currentTarget.style.borderColor = "#3A3A3A"
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = showUserMenu ? "#222222" : "#1A1A1A"
              e.currentTarget.style.borderColor = showUserMenu ? "#3A3A3A" : "#2A2A2A"
            }}
          >
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center
              shrink-0 text-sm font-semibold text-white"
              style={{ background: "#2A2A2A" }}
            >
              {initials}
            </div>
            {!collapsed && (
              <>
                <div className="flex-1 min-w-0">
                  <p className="text-white text-sm font-medium truncate">{displayName}</p>
                  <p className="text-xs truncate" style={{ color: "#6B6B6B" }}>{email}</p>
                </div>
                <ChevronDown
                  size={14}
                  className="shrink-0 transition-transform duration-200"
                  style={{
                    color: "#6B6B6B",
                    transform: showUserMenu ? "rotate(180deg)" : "rotate(0deg)",
                  }}
                />
              </>
            )}
          </button>
        </div>
      </aside>
    </>
  )
}