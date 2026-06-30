import { AIResponse, ProviderHealth, ProviderStatus } from "../../types/ai"
import { AIProvider, ChatMessage, ProviderConfig } from "../providers/base"
import { groqProvider } from "../providers/groq"
import { geminiProvider } from "../providers/gemini"

const providerMap: Record<string, AIProvider> = {
  groq: groqProvider,
  gemini: geminiProvider,
}

const healthMap: Record<string, ProviderHealth> = {}

function updateHealth(provider: string, latencyMs: number, success: boolean) {
  const prev = healthMap[provider]
  const avgLatency = prev ? Math.round((prev.avgLatencyMs + latencyMs) / 2) : latencyMs
  let status: ProviderStatus = "healthy"
  if (!success) status = "down"
  else if (avgLatency > 3000) status = "slow"
  healthMap[provider] = { provider, status, avgLatencyMs: avgLatency, lastChecked: new Date() }
}

export async function routeChat(
  messages: ChatMessage[],
  config?: ProviderConfig,
  preferredProvider?: string
): Promise<AIResponse> {
  console.log("Routing to provider:", preferredProvider, "model:", config?.model)

  // Try preferred provider first
  if (preferredProvider && providerMap[preferredProvider]) {
    const provider = providerMap[preferredProvider]
    console.log("Using provider:", provider.name)
    
    const response = await provider.chat(messages, config)
    console.log("Response success:", response.success, "content length:", response.content?.length)
    
    updateHealth(provider.name, response.latencyMs, response.success)
    if (response.success && response.content) return response
    console.warn(`Provider ${provider.name} failed or returned empty, trying fallback...`)
  }

  // Fallback to other providers
  const fallbacks = Object.values(providerMap).filter(p => p.name !== preferredProvider)
  
  for (const provider of fallbacks) {
    const response = await provider.chat(messages, config)
    updateHealth(provider.name, response.latencyMs, response.success)
    if (response.success && response.content) return response
  }

  return {
    success: false,
    content: "",
    provider: "none",
    model: "none",
    latencyMs: 0,
    error: "All providers failed or returned empty content"
  }
}

export async function routeCode(
  prompt: string,
  config?: ProviderConfig
): Promise<AIResponse> {
  const provider = groqProvider
  if (provider.generateCode) {
    return provider.generateCode(prompt, config)
  }
  return routeChat([{ role: "user", content: prompt }], config, "groq")
}

export function getHealthStatus(): ProviderHealth[] {
  return Object.values(healthMap)
}

export function getAllProviders(): string[] {
  return Object.keys(providerMap)
}