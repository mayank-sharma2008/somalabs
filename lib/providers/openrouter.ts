import { BaseProvider } from "./base"
import { ProviderConfig, ChatMessage } from "./base"
import { AIResponse, TaskType } from "../../types/ai"
import { normalizeError } from "../gateway/normalizer"

// OpenRouter's free model lineup rotates/dies often — "openrouter/free" is
// their own auto-router that always resolves to whatever's currently free,
// so it doesn't need constant manual updates like a hardcoded slug does.
const DEFAULT_TEXT_MODEL = "openrouter/free"
const DEFAULT_CODE_MODEL = "openrouter/free"

export class OpenRouterProvider extends BaseProvider {
  name = "openrouter"
  supportedTasks: TaskType[] = ["chat", "code"]

  async chat(
    messages: ChatMessage[],
    config?: ProviderConfig
  ): Promise<AIResponse> {
    const start = Date.now()
    const model = config?.model ?? DEFAULT_TEXT_MODEL

    try {
      const apiKey = process.env.OPENROUTER_API_KEY
      if (!apiKey) throw new Error("OPENROUTER_API_KEY is not set")

      const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
          "HTTP-Referer": "https://somalabs-two.vercel.app",
          "X-Title": "Soma Labs",
        },
        body: JSON.stringify({
          model,
          messages: messages.map((m) => ({
            role: m.role,
            content: m.content,
          })),
          max_tokens: config?.maxTokens ?? 1024,
          temperature: config?.temperature ?? 0.7,
        }),
      })

      const latencyMs = Date.now() - start

      if (!res.ok) {
        const errText = await res.text().catch(() => res.statusText)
        throw new Error(`OpenRouter returned ${res.status}: ${errText}`)
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content ?? ""

      if (!content) {
        throw new Error("OpenRouter returned empty content")
      }

      return this.buildResponse(
        content,
        data.model ?? model,
        latencyMs,
        {
          promptTokens: data.usage?.prompt_tokens ?? 0,
          completionTokens: data.usage?.completion_tokens ?? 0,
          totalTokens: data.usage?.total_tokens ?? 0,
        }
      )
    } catch (error) {
      console.error("OpenRouter error:", error)
      return normalizeError(error, this.name, model, Date.now() - start)
    }
  }

  async generateCode(
    prompt: string,
    config?: ProviderConfig
  ): Promise<AIResponse> {
    return this.chat(
      [
        {
          role: "system",
          content: "You are an expert programmer. Write clean, well commented, complete code.",
        },
        { role: "user", content: prompt },
      ],
      {
        ...config,
        model: config?.model ?? DEFAULT_CODE_MODEL,
        maxTokens: config?.maxTokens ?? 4096,
      }
    )
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.chat([{ role: "user", content: "Hi" }])
      return response.success
    } catch {
      return false
    }
  }
}

export const openrouterProvider = new OpenRouterProvider()