"use client"

import { useState } from "react"
import { Menu } from "lucide-react"
import Image from "next/image"
import SidebarClient from "./SidebarClient"

export default function DashboardShell({
  user,
  children,
}: {
  user: { firstName?: string | null }
  children: React.ReactNode
}) {
  const [mobileOpen, setMobileOpen] = useState(false)

  return (
    <div className="flex h-screen bg-[#0c0c0c] text-white overflow-hidden">
      {/* Mobile overlay — only rendered when drawer is open, only exists below md */}
      {mobileOpen && (
        <div
          className="fixed inset-0 z-40 md:hidden"
          style={{ background: "rgba(0,0,0,0.6)" }}
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Sidebar: fixed off-canvas drawer on mobile, static in-flow on desktop */}
      <div
        className={`fixed md:static inset-y-0 left-0 z-50 h-full
        transition-transform duration-300 ease-in-out
        ${mobileOpen ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <SidebarClient
          user={user}
          onNavigate={() => setMobileOpen(false)}
        />
      </div>

      <main className="flex-1 overflow-auto flex flex-col min-w-0">
        {/* Mobile top bar — hidden on desktop, untouched design there */}
        <div
          className="md:hidden flex items-center gap-3 px-4 py-3 shrink-0 sticky top-0 z-30"
          style={{ background: "#000000", borderBottom: "1px solid #1A1A1A" }}
        >
          <button
            onClick={() => setMobileOpen(true)}
            className="flex items-center justify-center w-9 h-9 rounded-lg"
            style={{ color: "#A3A3A3" }}
          >
            <Menu size={19} />
          </button>
          <div className="w-6 h-6 rounded-full overflow-hidden shrink-0">
            <Image
              src="/logo1.png"
              alt="SOMA"
              width={24}
              height={24}
              className="object-cover w-full h-full"
            />
          </div>
          <span
            className="text-white font-medium text-xs"
            style={{ letterSpacing: "0.18em" }}
          >
            SOMA LABS
          </span>
        </div>

        <div className="flex-1 min-h-0">
          {children}
        </div>
      </main>
    </div>
  )
}