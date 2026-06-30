import { currentUser } from "@clerk/nextjs/server"
import { auth } from "@clerk/nextjs/server"
import { supabase } from "@/lib/supabase"
import SidebarClient from "./SidebarClient"

async function getRecentConversations(userId: string) {
  const { data } = await supabase
    .from("conversations")
    .select("id, title, created_at")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .limit(15)
  return data ?? []
}

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const user = await currentUser()
  const { userId } = await auth()
  const recents = userId ? await getRecentConversations(userId) : []

  return (
    <div className="flex h-screen bg-[#0c0c0c] text-white overflow-hidden">
      <SidebarClient
        user={{ firstName: user?.firstName }}
      />
      <main className="flex-1 overflow-auto">
        {children}
      </main>
    </div>
  )
}