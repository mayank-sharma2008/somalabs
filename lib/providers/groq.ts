import Groq from "groq-sdk"
import { BaseProvider } from "./base"
import { ProviderConfig, ChatMessage } from "./base"
import { AIResponse, TaskType } from "../../types/ai"
import { normalizeError } from "../gateway/normalizer"

// Groq deprecated llama-3.1-8b-instant and llama-3.3-70b-versatile on Jun 17, 2026.
// Migrate targets per Groq's own deprecation notice:
const DEFAULT_TEXT_MODEL = "openai/gpt-oss-120b"
const DEFAULT_CODE_MODEL = "openai/gpt-oss-120b"
// Vision is currently a preview model on Groq — swap this if they promote a stable one.
const VISION_MODEL = "qwen/qwen3.6-27b"

function hasImage(messages: ChatMessage[]): boolean {
  return messages.some(
    (m) => Array.isArray(m.content) && m.content.some((p) => p.type === "image_url")
  )
}

export class GroqProvider extends BaseProvider {
  name = "groq"
  supportedTasks: TaskType[] = ["chat", "code"]

  private getClient(): Groq {
    const apiKey = process.env.GROQ_API_KEY
    if (!apiKey) throw new Error("GROQ_API_KEY is not set")
    return new Groq({ apiKey })
  }

  async chat(
    messages: ChatMessage[],
    config?: ProviderConfig
  ): Promise<AIResponse> {
    const start = Date.now()

    try {
      const client = this.getClient()
      // If caller didn't pin a model, auto-pick: vision model when an image is present.
      const model = config?.model ?? (hasImage(messages) ? VISION_MODEL : DEFAULT_TEXT_MODEL)

      const response = await client.chat.completions.create({
        model,
        messages: messages.map((m) => ({
          role: m.role,
          content: m.content
        })) as any, // groq-sdk's types lag the OpenAI-compatible multimodal content spec
        max_tokens: config?.maxTokens ?? 1024,
        temperature: config?.temperature ?? 0.7
      })

      const latencyMs = Date.now() - start
      const content = response.choices[0]?.message?.content ?? ""

      return this.buildResponse(
        content,
        response.model,
        latencyMs,
        {
          promptTokens: response.usage?.prompt_tokens ?? 0,
          completionTokens: response.usage?.completion_tokens ?? 0,
          totalTokens: response.usage?.total_tokens ?? 0
        }
      )
    } catch (error) {
      console.error("Groq error:", error)
      return normalizeError(
        error,
        this.name,
        config?.model ?? DEFAULT_TEXT_MODEL,
        Date.now() - start
      )
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
          content: "You are an expert programmer. Write clean, well commented, complete code."
        },
        { role: "user", content: prompt }
      ],
      {
        ...config,
        model: config?.model ?? DEFAULT_CODE_MODEL,
        maxTokens: config?.maxTokens ?? 4096
      }
    )
  }

  async checkHealth(): Promise<boolean> {
    try {
      const response = await this.chat([
        { role: "user", content: "Hi" }
      ])
      return response.success
    } catch {
      return false
    }
  }
}

export const groqProvider = new GroqProvider()