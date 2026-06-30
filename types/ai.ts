export interface AIResponse {
  success: boolean
  content: string
  provider: string
  model: string
  latencyMs: number
  usage?: {
    promptTokens: number
    completionTokens: number
    totalTokens: number
  }
  cost?: number
  error?: string
}

export type TaskType = 
  | "chat" 
  | "image" 
  | "video" 
  | "code" 
  | "audio" 
  | "search"

export type ProviderStatus = 
  | "healthy" 
  | "slow" 
  | "down"

export interface ProviderHealth {
  provider: string
  status: ProviderStatus
  avgLatencyMs: number
  lastChecked: Date
}