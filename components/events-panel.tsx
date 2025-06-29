import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Activity, ArrowRight, MessageSquare, Wrench, CheckSquare } from "lucide-react"
import type { AgentEvent, HandoffEventMetadata, ToolCallEventMetadata } from "@/types/chat"
import type { MessageEventMetadata } from "@/types/chat"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

interface EventsPanelProps {
  events: AgentEvent[]
}

const EventCard = ({ event }: { event: AgentEvent }) => {
  const renderContent = () => {
    switch (event.type) {
      case "handoff":
        const handoffMeta = event.metadata as HandoffEventMetadata
        return (
          <>
            <div className="flex items-center space-x-2 text-sm font-medium text-foreground">
              <ArrowRight className="h-4 w-4 text-accent" />
              <span>Agent Handoff</span>
            </div>
            <div className="text-sm space-y-1 mt-2 bg-card p-3 rounded border border-border">
              <div>
                <strong className="text-foreground">From:</strong>{" "}
                <span className="text-muted-foreground">{handoffMeta.source_agent}</span>
              </div>
              <div>
                <strong className="text-foreground">To:</strong>{" "}
                <span className="text-muted-foreground">{handoffMeta.target_agent}</span>
              </div>
            </div>
          </>
        )
      case "tool_call":
        const toolCallMeta = event.metadata as ToolCallEventMetadata
        return (
          <>
            <div className="flex items-center space-x-2 text-sm font-medium text-foreground">
              <Wrench className="h-4 w-4 text-secondary" />
              <span>Tool Call: {event.content}</span>
            </div>
            <div className="text-sm mt-2 bg-card p-3 rounded border border-border">
              <pre className="whitespace-pre-wrap font-mono text-xs text-muted-foreground">
                {JSON.stringify(toolCallMeta.tool_args, null, 2)}
              </pre>
            </div>
          </>
        )
      case "tool_output":
        return (
          <>
            <div className="flex items-center space-x-2 text-sm font-medium text-foreground">
              <CheckSquare className="h-4 w-4 text-primary" />
              <span>Tool Output</span>
            </div>
            <div className="text-sm mt-2 bg-card p-3 rounded border border-border break-all text-muted-foreground">
              {event.content}
            </div>
          </>
        )
      case "message":
      default:
        const messageMeta = event.metadata as MessageEventMetadata | undefined
        const agentName = messageMeta?.agent || "System"
        return (
          <>
            <div className="flex items-center space-x-2 text-sm font-medium text-foreground">
              <MessageSquare className="h-4 w-4 text-chart-3" />
              <span>Message from {agentName}</span>
            </div>
            <div className="text-sm mt-2 bg-card p-3 rounded border border-border text-muted-foreground">
              {event.content}
            </div>
          </>
        )
    }
  }

  return (
    <div className="border border-border rounded-lg p-3 bg-muted/30 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <Badge variant="outline" className="text-xs capitalize bg-muted text-muted-foreground">
          {event.type.replace("_", " ")}
        </Badge>
        <span className="text-xs text-muted-foreground">{new Date(event.timestamp).toLocaleTimeString()}</span>
      </div>
      {renderContent()}
    </div>
  )
}

export function EventsPanel({ events }: EventsPanelProps) {
  const eventsByTurn = events.reduce(
    (acc, event) => {
      const turnId = event.turnId
      if (!acc[turnId]) {
        acc[turnId] = []
      }
      acc[turnId].push(event)
      return acc
    },
    {} as Record<string, AgentEvent[]>,
  )

  const sortedTurnIds = Object.keys(eventsByTurn).sort((a, b) => {
    const aLatest = Math.max(...eventsByTurn[a].map((e) => e.timestamp))
    const bLatest = Math.max(...eventsByTurn[b].map((e) => e.timestamp))
    return bLatest - aLatest
  })

  const getTurnSummary = (events: AgentEvent[]) => {
    const eventTypes = [...new Set(events.map((e) => e.type))]
    const firstEvent = events.sort((a, b) => a.timestamp - b.timestamp)[0]
    return {
      types: eventTypes,
      timestamp: firstEvent.timestamp,
      count: events.length,
    }
  }

  return (
    <Card className="h-full bg-card border-border shadow-lg">
      <CardHeader className="pb-3 border-b border-border">
        <CardTitle className="text-lg flex items-center space-x-2">
          <Activity className="h-4 w-4 text-primary" />
          <span className="text-foreground font-light tracking-tight">System Events</span>
        </CardTitle>
        <p className="text-sm text-muted-foreground">Real-time event tracking by conversation turns</p>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[calc(100vh-320px)]">
          <div className="p-4">
            {sortedTurnIds.length > 0 ? (
              <Accordion type="single" collapsible className="space-y-2">
                {sortedTurnIds.map((turnId) => {
                  const turnEvents = eventsByTurn[turnId]
                  const summary = getTurnSummary(turnEvents)

                  return (
                    <AccordionItem key={turnId} value={turnId} className="border border-border rounded-lg bg-muted/20">
                      <AccordionTrigger className="px-4 py-3 hover:no-underline">
                        <div className="flex items-center justify-between w-full mr-4">
                          <div className="flex items-center space-x-3">
                            <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20">
                              Turn {turnId.slice(-6)}
                            </Badge>
                            <div className="flex space-x-1">
                              {summary.types.map((type) => (
                                <Badge
                                  key={type}
                                  variant="secondary"
                                  className="text-xs capitalize bg-secondary/20 text-secondary"
                                >
                                  {type.replace("_", " ")}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="text-xs text-muted-foreground">
                            {summary.count} events • {new Date(summary.timestamp).toLocaleTimeString()}
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {turnEvents
                            .sort((a, b) => a.timestamp - b.timestamp)
                            .map((event) => (
                              <EventCard key={event.id} event={event} />
                            ))}
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  )
                })}
              </Accordion>
            ) : (
              <div className="text-center text-muted-foreground p-8">System events will appear here.</div>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}
