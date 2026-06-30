import { AIResponse, TaskType } from "../../types/ai"

export interface ProviderConfig {
  apiKey?: string
  model?: string
  systemPrompt?: string
  maxTokens?: number
  temperature?: number
}

export interface ChatMessage {
  role: "user" | "assistant" | "system"
  content: string
}

export interface AIProvider {
  name: string
  supportedTasks: TaskType[]
  
  chat(
    messages: ChatMessage[], 
    config?: ProviderConfig
  ): Promise<AIResponse>
  
  generateImage?(
    prompt: string, 
    config?: ProviderConfig
  ): Promise<AIResponse>
  
  generateCode?(
    prompt: string, 
    config?: ProviderConfig
  ): Promise<AIResponse>
  
  search?(
    query: string, 
    config?: ProviderConfig
  ): Promise<AIResponse>
  
  checkHealth?(): Promise<boolean>
}

export abstract class BaseProvider implements AIProvider {
  abstract name: string
  abstract supportedTasks: TaskType[]

  abstract chat(
    messages: ChatMessage[], 
    config?: ProviderConfig
  ): Promise<AIResponse>

  protected buildResponse(
    content: string,
    model: string,
    latencyMs: number,
    usage?: {
      promptTokens: number
      completionTokens: number
      totalTokens: number
    }
  ): AIResponse {
    return {
      success: true,
      content,
      provider: this.name,
      model,
      latencyMs,
      usage,
      cost: 0
    }
  }

  protected buildError(error: string): AIResponse {
    return {
      success: false,
      content: "",
      provider: this.name,
      model: "unknown",
      latencyMs: 0,
      error
    }
  }
}