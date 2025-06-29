"use client"

import { useState, useEffect } from "react"
import type { ToolInfo, AgentGuardrailInfo, AgentToolsListResponse, AgentGuardrailsResponse } from "@/types/chat"

interface UseAgentDetailsReturn {
  tools: ToolInfo[]
  guardrails: AgentGuardrailInfo[]
  isLoadingTools: boolean
  isLoadingGuardrails: boolean
  toolsError: string | null
  guardrailsError: string | null
  refreshDetails: () => Promise<void>
}

export function useAgentDetails(agentName: string): UseAgentDetailsReturn {
  const [tools, setTools] = useState<ToolInfo[]>([])
  const [guardrails, setGuardrails] = useState<AgentGuardrailInfo[]>([])
  const [isLoadingTools, setIsLoadingTools] = useState(false)
  const [isLoadingGuardrails, setIsLoadingGuardrails] = useState(false)
  const [toolsError, setToolsError] = useState<string | null>(null)
  const [guardrailsError, setGuardrailsError] = useState<string | null>(null)

  const fetchTools = async (currentAgentName: string) => {
    try {
      setIsLoadingTools(true)
      setToolsError(null)

      const response = await fetch(`/api/agents/${encodeURIComponent(currentAgentName)}/tools`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: AgentToolsListResponse = await response.json()
      setTools(data.tools)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch tools"
      setToolsError(errorMessage)
      console.error("Error fetching tools:", err)
    } finally {
      setIsLoadingTools(false)
    }
  }

  const fetchGuardrails = async (currentAgentName: string) => {
    try {
      setIsLoadingGuardrails(true)
      setGuardrailsError(null)

      const response = await fetch(`/api/agents/${encodeURIComponent(currentAgentName)}/guardrails`)
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: AgentGuardrailsResponse = await response.json()
      setGuardrails(data.guardrails)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch guardrails"
      setGuardrailsError(errorMessage)
      console.error("Error fetching guardrails:", err)
    } finally {
      setIsLoadingGuardrails(false)
    }
  }

  const refreshDetails = async () => {
    await Promise.all([fetchTools(agentName), fetchGuardrails(agentName)])
  }

  useEffect(() => {
    if (agentName) {
      fetchTools(agentName)
      fetchGuardrails(agentName)
    }
  }, [agentName])

  return {
    tools,
    guardrails,
    isLoadingTools,
    isLoadingGuardrails,
    toolsError,
    guardrailsError,
    refreshDetails,
  }
}
