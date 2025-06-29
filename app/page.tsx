"use client"
import { Clock } from "lucide-react"
import { useChat } from "@/hooks/use-chat"
import { useAgents } from "@/hooks/use-agents"
import { useAgentDetails } from "@/hooks/use-agent-details"
import { ContextPanel } from "@/components/context-panel"
import { ChatPanel } from "@/components/chat-panel"
import { EventsPanel } from "@/components/events-panel"
import { AgentsHeader } from "@/components/agents-header"

export default function AirlineAssistantSimulator() {
  const { messages, isLoading, currentAgent, context, events, guardrails, sendMessage } = useChat()
  const { agents, isLoading: agentsLoading, refreshAgents } = useAgents()
  const {
    tools,
    guardrails: agentGuardrails,
    isLoadingTools,
    isLoadingGuardrails,
    toolsError,
    guardrailsError,
  } = useAgentDetails(currentAgent)

  return (

    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      <header className="bg-white border-b border-slate-200 p-4">

        <div className="max-w-7xl mx-auto">
          

          <AgentsHeader
            agents={agents}
            currentAgent={currentAgent}
            isLoading={agentsLoading}
            onRefresh={refreshAgents}
          />
        </div>
      </header>

      <main className="max-w-7xl mx-auto p-4">
        <div className="grid grid-cols-12 gap-4 h-[calc(100vh-110px)]">
          <div className="col-span-3">
            <ContextPanel
              context={context}
              currentAgent={currentAgent}
              tools={tools}
              guardrails={agentGuardrails}
              executedGuardrails={guardrails}
              isLoadingTools={isLoadingTools}
              isLoadingGuardrails={isLoadingGuardrails}
              toolsError={toolsError}
              guardrailsError={guardrailsError}
            />
          </div>
          <div className="col-span-6">
            <ChatPanel
              messages={messages}
              currentAgent={currentAgent}
              isLoading={isLoading}
              onSendMessage={sendMessage}
            />
          </div>
          <div className="col-span-3">
            <EventsPanel events={events} />
          </div>
        </div>
      </main>
    </div>
  )
}
