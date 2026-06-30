import { supabase } from "@/lib/supabase"
import { AIResponse, TaskType } from "../../types/ai"

const costPer1kTokens: Record<string, number> = {
  "groq/llama3-8b-8192": 0.0001,
  "groq/llama3-70b-8192": 0.0008,
  "gemini/gemini-1.5-flash": 0.0002,
  "gemini/gemini-1.5-pro": 0.0035,
}

export function calculateCost(
  provider: string,
  model: string,
  totalTokens: number
): number {
  const key = `${provider}/${model}`
  const rate = costPer1kTokens[key] ?? 0
  return (totalTokens / 1000) * rate
}

export async function logUsage(
  userId: string,
  response: AIResponse,
  taskType: TaskType
) {
  const cost = calculateCost(
    response.provider,
    response.model,
    response.usage?.totalTokens ?? 0
  )

  const { error } = await supabase
    .from("usage_logs")
    .insert({
      user_id: userId,
      provider: response.provider,
      model: response.model,
      tokens: response.usage?.totalTokens ?? 0,
      cost,
      latency: response.latencyMs,
      task_type: taskType
    })

  if (error) {
    console.error("Failed to log usage:", error)
  }
}

export async function getUserUsage(userId: string) {
  const { data, error } = await supabase
    .from("usage_logs")
    .select("*")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })

  if (error) return []
  return data
}