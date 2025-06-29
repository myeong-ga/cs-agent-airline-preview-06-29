"use client"

import { useState, useCallback } from "react"
import type { ChatMessage, ChatResponse, GuardrailInfo, AgentEvent, AirlineContext, BaggageContext } from "@/types/chat"

interface UseChatReturn {
  messages: ChatMessage[]
  isLoading: boolean
  error: string | null
  conversationId: string | null
  currentAgent: string
  context: AirlineContext | BaggageContext | null
  guardrails: GuardrailInfo[]
  events: AgentEvent[]
  sendMessage: (content: string) => Promise<void>
  clearChat: () => void
  updateAgentStatus: (agentName: string, status: "available" | "busy" | "active") => void
}

export function useChat(): UseChatReturn {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [guardrails, setGuardrails] = useState<GuardrailInfo[]>([])
  const [events, setEvents] = useState<AgentEvent[]>([])
  const [currentAgent, setCurrentAgent] = useState<string>("Triage Agent")
  const [context, setContext] = useState<AirlineContext | BaggageContext | null>(null)
  const [conversationId, setConversationId] = useState<string | null>(null)

  const sendMessage = useCallback(
    async (content: string) => {
      if (!content.trim() || isLoading) return

      const userMessage: ChatMessage = {
        role: "user",
        content: content.trim(),
        timestamp: new Date().toISOString(),
      }

      setMessages((prev) => [...prev, userMessage])
      setIsLoading(true)
      setError(null)
      setGuardrails([]) 
      try {
        const response = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: content.trim(), conversationId }),
        })

        if (!response.ok) {
          const errorBody = await response.text()
          throw new Error(`HTTP ${response.status}: ${response.statusText} - ${errorBody}`)
        }

        const data: ChatResponse = await response.json()

        setConversationId(data.conversationId)
        setCurrentAgent(data.currentAgent)
        setContext(data.context)

        if (data.guardrails) {
          setGuardrails(data.guardrails)
        }
        if (data.events) {
          setEvents((prev) => [...prev, ...data.events!])
        }

        const assistantMessage = data.messages.find((m) => m.role === "assistant")
        if (assistantMessage) {
          setMessages((prev) => [...prev, assistantMessage])
        }
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Unknown error occurred"
        setError(errorMessage)
        setMessages((prev) => [
          ...prev,
          {
            role: "assistant",
            content: `Error: ${errorMessage}`,
            timestamp: new Date().toISOString(),
            agent: "System",
          },
        ])
      } finally {
        setIsLoading(false)
      }
    },
    [conversationId, isLoading],
  )

  const clearChat = useCallback(() => {
    setMessages([])
    setError(null)
    setGuardrails([])
    setEvents([])
    setCurrentAgent("Triage Agent")
    setContext(null)
    setConversationId(null)
  }, [])

  const updateAgentStatus = useCallback((agentName: string, status: "available" | "busy" | "active") => {
    // This could be used to update agent status in the future
    console.log(`Agent ${agentName} status updated to ${status}`)
  }, [])

  return {
    messages,
    isLoading,
    error,
    conversationId,
    currentAgent,
    context,
    guardrails,
    events,
    sendMessage,
    clearChat,
    updateAgentStatus,
  }
}
