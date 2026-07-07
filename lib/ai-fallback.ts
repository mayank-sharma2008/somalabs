// Chat/code fallback chain. All four providers speak the same
// OpenAI-compatible /chat/completions schema, so one function handles all of them.

interface ChatMessage {
  role: string
  content: string
}

interface ProviderConfig {
  name: string
  baseUrl: string
  apiKey: string | undefined
  model: string
}

function buildProviderChain(preferredModel: "fast" | "code"): ProviderConfig[] {
  return [
    {
      name: "groq",
      baseUrl: "https://api.groq.com/openai/v1/chat/completions",
      apiKey: process.env.GROQ_API_KEY,
      model: "llama-3.3-70b-versatile",
    },
    {
      name: "gemini",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions",
      apiKey: process.env.GEMINI_API_KEY,
      model: "gemini-2.0-flash",
    },
    {
      name: "openrouter",
      baseUrl: "https://openrouter.ai/api/v1/chat/completions",
      apiKey: process.env.OPENROUTER_API_KEY,
      model: "meta-llama/llama-3.1-8b-instruct:free",
    },
    {
      name: "cerebras",
      baseUrl: "https://api.cerebras.ai/v1/chat/completions",
      apiKey: process.env.CEREBRAS_API_KEY,
      model: "llama3.1-8b",
    },
  ].filter((p) => !!p.apiKey) // skip providers with no key configured
}

// Errors that mean "this provider is exhausted, try the next one"
function isRetryableError(status: number) {
  return status === 429 || status === 503 || status === 500
}

export async function chatWithFallback(
  messages: ChatMessage[],
  opts: { maxTokens?: number } = {}
): Promise<{ content: string; provider: string; model: string }> {
  const chain = buildProviderChain("fast")

  if (chain.length === 0) {
    throw new Error("No chat providers configured — check your API keys in .env")
  }

  let lastError: any = null

  for (const provider of chain) {
    try {
      const res = await fetch(provider.baseUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${provider.apiKey}`,
        },
        body: JSON.stringify({
          model: provider.model,
          messages,
          max_tokens: opts.maxTokens ?? 1024,
        }),
      })

      if (!res.ok) {
        if (isRetryableError(res.status)) {
          console.warn(`[fallback] ${provider.name} rate-limited/unavailable (${res.status}), trying next provider...`)
          lastError = new Error(`${provider.name} returned ${res.status}`)
          continue // move to next provider in the chain
        }
        // Non-retryable error (bad request, auth issue) — still try next provider,
        // but log it distinctly since it might be a config problem worth fixing.
        console.error(`[fallback] ${provider.name} failed with non-retryable status ${res.status}`)
        lastError = new Error(`${provider.name} returned ${res.status}`)
        continue
      }

      const data = await res.json()
      const content = data.choices?.[0]?.message?.content

      if (!content) {
        console.warn(`[fallback] ${provider.name} returned empty content, trying next provider...`)
        continue
      }

      return { content, provider: provider.name, model: provider.model }
    } catch (err) {
      console.error(`[fallback] ${provider.name} threw an error:`, err)
      lastError = err
      continue
    }
  }

  // Every provider in the chain failed
  throw lastError ?? new Error("All chat providers failed")
}