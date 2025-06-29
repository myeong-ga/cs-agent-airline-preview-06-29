"use client"

import { useState, useEffect } from "react"
import type { AgentInfo, AgentsListResponse } from "@/types/chat"

interface UseAgentsReturn {
  agents: AgentInfo[]
  isLoading: boolean
  error: string | null
  refreshAgents: () => Promise<void>
}

export function useAgents(): UseAgentsReturn {
  const [agents, setAgents] = useState<AgentInfo[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAgents = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const response = await fetch("/api/agents")
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }

      const data: AgentsListResponse = await response.json()
      setAgents(data.agents)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch agents"
      setError(errorMessage)
      console.error("Error fetching agents:", err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    fetchAgents()
  }, [])

  return {
    agents,
    isLoading,
    error,
    refreshAgents: fetchAgents,
  }
}
