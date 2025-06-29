import { type NextRequest, NextResponse } from "next/server"
import { getAgentByName } from "@/lib/agents"
import type { AgentGuardrailInfo, AgentGuardrailsResponse } from "@/types/chat"

function extractGuardrailInfo(guardrail: any, type: "input" | "output"): AgentGuardrailInfo {
  return {
    name: guardrail.name || "Unknown Guardrail",
    description: guardrail.description || `${type} guardrail for content validation`,
    type,
  }
}

export async function GET(request: NextRequest, { params }: { params: { agentName: string } }) {
 
   const { agentName } = await params
  try {
    const decoded = decodeURIComponent(agentName)
    const agent = getAgentByName(decoded)

    if (!agent) {
      return NextResponse.json({ error: "Agent not found" }, { status: 404 })
    }

    const guardrails: AgentGuardrailInfo[] = []

    if (agent.inputGuardrails) {
      guardrails.push(...agent.inputGuardrails.map((g: any) => extractGuardrailInfo(g, "input")))
    }

    if (agent.outputGuardrails) {
      guardrails.push(...agent.outputGuardrails.map((g: any) => extractGuardrailInfo(g, "output")))
    }

    const response: AgentGuardrailsResponse = {
      agentName: agent.name,
      guardrails,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("AGENT GUARDRAILS API ERROR:", error)
    return NextResponse.json({ error: "Failed to fetch agent guardrails" }, { status: 500 })
  }
}
