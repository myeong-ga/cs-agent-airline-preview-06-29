import { type NextRequest, NextResponse } from "next/server"
import { getAgentByName } from "@/lib/agents"
import type { ToolInfo, AgentToolsListResponse } from "@/types/chat"

function extractToolInfo(tool: any): ToolInfo {
  const toolSchema = tool.parameters || tool.inputSchema || {}
  const properties = toolSchema.properties || {}

  const argumentsInfo: Record<string, any> = {}

  Object.entries(properties).forEach(([key, value]: [string, any]) => {
    argumentsInfo[key] = {
      type: value.type || "string",
      description: value.description || "",
      required: toolSchema.required?.includes(key) || false,
    }
  })

  return {
    name: tool.name,
    description: tool.description || `Tool: ${tool.name}`,
    arguments: argumentsInfo,
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

    const tools: ToolInfo[] = agent.tools?.map(extractToolInfo) || []

    const response: AgentToolsListResponse = {
      agentName: agent.name,
      tools,
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("AGENT TOOLS API ERROR:", error)
    return NextResponse.json({ error: "Failed to fetch agent tools" }, { status: 500 })
  }
}
