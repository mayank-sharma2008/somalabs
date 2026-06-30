import { AIResponse } from "@/types/ai"

export function normalizeResponse(
  raw: any,
  provider: string,
  model: string,
  latencyMs: number
): AIResponse {
  try {
    switch (provider.toLowerCase()) {
      case "groq":
      case "openai":
        return {
          success: true,
          content: raw.choices?.[0]?.message?.content ?? "",
          provider,
          model,
          latencyMs,
          usage: {
            promptTokens: raw.usage?.prompt_tokens ?? 0,
            completionTokens: raw.usage?.completion_tokens ?? 0,
            totalTokens: raw.usage?.total_tokens ?? 0
          },
          cost: 0
        }

      case "gemini":
        return {
          success: true,
          content: raw.candidates?.[0]?.content?.parts?.[0]?.text ?? "",
          provider,
          model,
          latencyMs,
          usage: {
            promptTokens: raw.usageMetadata?.promptTokenCount ?? 0,
            completionTokens: raw.usageMetadata?.candidatesTokenCount ?? 0,
            totalTokens: raw.usageMetadata?.totalTokenCount ?? 0
          },
          cost: 0
        }

      case "mistral":
        return {
          success: true,
          content: raw.choices?.[0]?.message?.content ?? "",
          provider,
          model,
          latencyMs,
          usage: {
            promptTokens: raw.usage?.prompt_tokens ?? 0,
            completionTokens: raw.usage?.completion_tokens ?? 0,
            totalTokens: raw.usage?.total_tokens ?? 0
          },
          cost: 0
        }

      case "openrouter":
        return {
          success: true,
          content: raw.choices?.[0]?.message?.content ?? "",
          provider,
          model,
          latencyMs,
          usage: {
            promptTokens: raw.usage?.prompt_tokens ?? 0,
            completionTokens: raw.usage?.completion_tokens ?? 0,
            totalTokens: raw.usage?.total_tokens ?? 0
          },
          cost: raw.usage?.cost ?? 0
        }

      default:
        return {
          success: true,
          content: raw.choices?.[0]?.message?.content 
            ?? raw.candidates?.[0]?.content?.parts?.[0]?.text 
            ?? raw.content
            ?? "",
          provider,
          model,
          latencyMs,
          cost: 0
        }
    }
  } catch (error) {
    return {
      success: false,
      content: "",
      provider,
      model,
      latencyMs,
      error: `Normalization failed: ${error}`
    }
  }
}

export function normalizeError(
  error: any,
  provider: string,
  model: string,
  latencyMs: number
): AIResponse {
  const message =
    error?.response?.data?.error?.message ??
    error?.message ??
    "Unknown error occurred"

  return {
    success: false,
    content: "",
    provider,
    model,
    latencyMs,
    error: message
  }
}