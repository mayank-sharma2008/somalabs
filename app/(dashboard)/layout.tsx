import { currentUser } from "@clerk/nextjs/server"
import { auth } from "@clerk/nextjs/server"
import { supabase } from "@/lib/supabase"
import DashboardShell from "./DashboardShell"

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
    <DashboardShell user={{ firstName: user?.firstName }}>
      {children}
    </DashboardShell>
  )
}