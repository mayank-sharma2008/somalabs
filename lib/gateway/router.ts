import { AIResponse, ProviderHealth, ProviderStatus } from "../../types/ai"
import { AIProvider, ChatMessage, ProviderConfig } from "../providers/base"
import { groqProvider } from "../providers/groq"
import { geminiProvider } from "../providers/gemini"
import { openrouterProvider } from "../providers/openrouter"
import { cerebrasProvider } from "../providers/cerebras"

const providerMap: Record<string, AIProvider> = {
  groq: groqProvider,
  gemini: geminiProvider,
  openrouter: openrouterProvider,
  cerebras: cerebrasProvider,
}

// Groq is the known-reliable provider — always try it first regardless of
// what preferredProvider is passed, then fall back to the rest in this order.
const FALLBACK_ORDER = ["groq", "gemini", "openrouter", "cerebras"]

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
  // Build the try-order: preferredProvider first (if valid and not already
  // Groq), then Groq, then the rest — de-duplicated.
  const order = [preferredProvider, ...FALLBACK_ORDER].filter(
    (name, idx, arr) => name && providerMap[name] && arr.indexOf(name) === idx
  ) as string[]

  for (const name of order) {
    const provider = providerMap[name]
    console.log("Trying provider:", provider.name)

    const response = await provider.chat(messages, config)
    updateHealth(provider.name, response.latencyMs, response.success)

    if (response.success && response.content) {
      console.log("Provider succeeded:", provider.name)
      return response
    }
    console.warn(`Provider ${provider.name} failed or returned empty (${response.error ?? "no error message"}), trying next...`)
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