import { BaseProvider } from "./base"
import { ProviderConfig, ChatMessage } from "./base"
import { AIResponse, TaskType } from "../../types/ai"
import { normalizeError } from "../gateway/normalizer"

export class GeminiProvider extends BaseProvider {
  name = "gemini"
  supportedTasks: TaskType[] = ["chat", "code", "search"]

  async chat(
    messages: ChatMessage[],
    config?: ProviderConfig
  ): Promise<AIResponse> {
    const start = Date.now()

    try {
      const apiKey = process.env.GEMINI_API_KEY ?? ""
      const model = config?.model ?? "gemini-2.0-flash"
      // Get system message if any
      const systemMessage = messages.find(m => m.role === "system")
      
      // Filter and format messages - fix consecutive same-role messages
      const filtered = messages.filter(m => m.role !== "system")
      
      const formattedMessages: any[] = []
      for (const m of filtered) {
        const role = m.role === "assistant" ? "model" : "user"
        const last = formattedMessages[formattedMessages.length - 1]
        
        if (last && last.role === role) {
          // Merge consecutive same-role messages
          last.parts[0].text += "\n" + m.content
        } else {
          formattedMessages.push({
            role,
            parts: [{ text: m.content }]
          })
        }
      }

      // Gemini requires first message to be from user
      if (formattedMessages.length === 0 || formattedMessages[0].role !== "user") {
        formattedMessages.unshift({
          role: "user",
          parts: [{ text: "Hello" }]
        })
      }

      const body: any = {
        contents: formattedMessages,
        generationConfig: {
          maxOutputTokens: config?.maxTokens ?? 1024,
          temperature: config?.temperature ?? 0.7
        }
      }

      if (systemMessage) {
        body.systemInstruction = {
          parts: [{ text: systemMessage.content }]
        }
      }

      console.log("Gemini request:", JSON.stringify(body, null, 2))

      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body)
        }
      )

      const raw = await response.json()
      console.log("Gemini response:", JSON.stringify(raw))

      if (!response.ok) {
        throw new Error(raw.error?.message ?? "Gemini API error")
      }

      const content = raw.candidates?.[0]?.content?.parts?.[0]?.text ?? ""

      return this.buildResponse(
        content,
        model,
        Date.now() - start,
        {
          promptTokens: raw.usageMetadata?.promptTokenCount ?? 0,
          completionTokens: raw.usageMetadata?.candidatesTokenCount ?? 0,
          totalTokens: raw.usageMetadata?.totalTokenCount ?? 0
        }
      )
    } catch (error) {
      console.error("Gemini error:", error)
      return normalizeError(
        error,
        this.name,
        config?.model ?? "gemini-1.5-flash",
        Date.now() - start
      )
    }
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

export const geminiProvider = new GeminiProvider()