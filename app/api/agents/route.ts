import { NextResponse } from "next/server"
import {
  triageAgent,
  faqAgent,
  seatBookingAgent,
  flightStatusAgent,
  cancellationAgent,
  baggageAgent,
} from "@/lib/agents"
import type { AgentInfo, AgentsListResponse } from "@/types/chat"

function extractAgentInfo(agent: any): AgentInfo {
  const handoffs = agent.handoffs?.map((h: any) => h.name || h.targetAgent?.name).filter(Boolean) || []
  const tools = agent.tools?.map((t: any) => t.name).filter(Boolean) || []

  const specialtyMap: Record<string, string> = {
    "Triage Agent": "Customer Request Routing",
    "FAQ Agent": "General Information",
    "Seat Booking Agent": "Seat Management",
    "Flight Status Agent": "Flight Information",
    "Cancellation Agent": "Booking Cancellation",
    "Baggage Agent": "Baggage Services",
  }

  return {
    name: agent.name,
    description: agent.handoffDescription || `${agent.name} for airline customer service`,
    handoffs,
    tools,
    status: "available",
    specialty: specialtyMap[agent.name] || "Customer Service",
  }
}

export async function GET() {
  try {
    const allAgents = [triageAgent, faqAgent, seatBookingAgent, flightStatusAgent, cancellationAgent, baggageAgent]

    const agentsInfo: AgentInfo[] = allAgents.map(extractAgentInfo)

    const response: AgentsListResponse = {
      agents: agentsInfo,
      currentAgent: "Triage Agent",
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("AGENTS API ERROR:", error)
    return NextResponse.json({ error: "Failed to fetch agents" }, { status: 500 })
  }
}
