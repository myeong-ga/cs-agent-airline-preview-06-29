import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Database, Wrench, Shield, AlertCircle, Check, X } from "lucide-react"
import type { AirlineContext, BaggageContext, ToolInfo, AgentGuardrailInfo, GuardrailInfo } from "@/types/chat"

interface ContextPanelProps {
  context: AirlineContext | BaggageContext | null
  currentAgent: string
  tools: ToolInfo[]
  guardrails: AgentGuardrailInfo[]
  executedGuardrails: GuardrailInfo[]
  isLoadingTools: boolean
  isLoadingGuardrails: boolean
  toolsError: string | null
  guardrailsError: string | null
}

const ContextItem = ({ label, value }: { label: string; value?: string | number | null }) => {
  if (!value) return null
  return (
    <div className="border border-border rounded-lg p-3 bg-muted/30 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-medium text-sm text-foreground">{label}</span>
      </div>
      <div className="text-sm text-muted-foreground font-mono bg-card px-3 py-2 rounded border border-border break-all">
        {value}
      </div>
    </div>
  )
}

const ToolItem = ({ tool }: { tool: ToolInfo }) => (
  <div className="border border-border rounded-lg p-3 bg-muted/30 shadow-sm">
    <div className="flex items-center justify-between mb-2">
      <span className="font-semibold text-sm text-foreground">{tool.name}</span>
      <Badge variant="outline" className="text-xs bg-secondary text-secondary-foreground">
        Tool
      </Badge>
    </div>
    <div className="text-sm text-muted-foreground mb-3">{tool.description}</div>
    {Object.keys(tool.arguments).length > 0 && (
      <div className="text-sm bg-card p-3 rounded border border-border">
        <div className="font-medium mb-2 text-foreground">Arguments:</div>
        {Object.entries(tool.arguments).map(([key, value]: [string, any]) => (
          <div key={key} className="ml-2 mb-1">
            <span className="font-mono text-accent">{key}</span>
            <span className="text-muted-foreground">: {value.type}</span>
            {value.required && <span className="text-destructive ml-1">*</span>}
          </div>
        ))}
      </div>
    )}
  </div>
)

const GuardrailItem = ({
  guardrail,
  executedGuardrails,
}: {
  guardrail: AgentGuardrailInfo
  executedGuardrails: GuardrailInfo[]
}) => {
  const executedResult = executedGuardrails.find((executed) => executed.name === guardrail.name)
  const isPassed = executedResult ? executedResult.passed : true
  const reasoning = executedResult?.reasoning

  return (
    <div className="border border-border rounded-lg p-3 bg-muted/30 shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <span className="font-semibold text-sm text-foreground">{guardrail.name}</span>
        <Badge
          className={`text-xs flex items-center space-x-1 ${
            isPassed
              ? "bg-primary hover:bg-primary/90 text-primary-foreground"
              : "bg-destructive hover:bg-destructive/90 text-destructive-foreground"
          }`}
        >
          {isPassed ? (
            <>
              <Check className="h-3 w-3" />
              <span>Passed</span>
            </>
          ) : (
            <>
              <X className="h-3 w-3" />
              <span>Failed</span>
            </>
          )}
        </Badge>
      </div>
      <div className="text-sm text-muted-foreground mb-2">{guardrail.description}</div>
      {reasoning && !isPassed && (
        <div className="text-sm bg-destructive/10 border border-destructive/20 p-2 rounded">
          <div className="font-medium text-destructive mb-1">Failure Reason:</div>
          <div className="text-destructive/80">{reasoning}</div>
        </div>
      )}
      {executedResult && (
        <div className="text-xs text-muted-foreground mt-2">
          Last checked: {new Date(executedResult.timestamp).toLocaleTimeString()}
        </div>
      )}
    </div>
  )
}

export function ContextPanel({
  context,
  currentAgent,
  tools,
  guardrails,
  executedGuardrails,
  isLoadingTools,
  isLoadingGuardrails,
  toolsError,
  guardrailsError,
}: ContextPanelProps) {
  const isBaggageContext = context && ("baggageClaimNumber" in context || "baggageType" in context)
  const agentType = currentAgent.includes("Baggage") ? "Baggage Claim" : "General Airline"

  return (
    <Card className="h-full flex flex-col bg-card border-border shadow-lg">
      <CardHeader className="pb-2"></CardHeader>
      <CardContent className="flex-1 p-0 flex flex-col">
        <div className="flex-1 flex flex-col">
          <div className="flex-1 border-b border-border">
            <div className="p-3 border-b border-border bg-muted/50">
              <h3 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                <Database className="h-4 w-4 text-primary" />
                <span>Context</span>
              </h3>
            </div>
            <ScrollArea className="h-[calc(33vh-120px)]">
              <div className="p-3 space-y-3">
                {context ? (
                  <>
                    <Badge
                      variant="outline"
                      className={
                        agentType === "Baggage Claim"
                          ? "bg-chart-5/20 text-chart-5 border-chart-5/30"
                          : "bg-secondary/20 text-secondary border-secondary/30"
                      }
                    >
                      {agentType} Context
                    </Badge>
                    <ContextItem label="Passenger Name" value={context.passengerName} />
                    <ContextItem label="Confirmation #" value={context.confirmationNumber} />
                    <ContextItem label="Flight #" value={context.flightNumber} />
                    <ContextItem label="Account #" value={context.accountNumber} />
                    <ContextItem label="Seat #" value={context.seatNumber} />
                    {isBaggageContext && (
                      <>
                        <ContextItem label="Baggage Claim #" value={(context as BaggageContext).baggageClaimNumber} />
                        <ContextItem label="Baggage Status" value={(context as BaggageContext).baggageStatus} />
                        <ContextItem label="Baggage Type" value={(context as BaggageContext).baggageType} />
                        <ContextItem label="Baggage Weight" value={(context as BaggageContext).baggageWeight} />
                        <ContextItem label="Lost Claim #" value={(context as BaggageContext).baggageLostClaimNumber} />
                      </>
                    )}
                  </>
                ) : (
                  <div className="text-center text-muted-foreground p-6 text-sm">
                    Context will appear here once the conversation starts.
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1 border-b border-border">
            <div className="p-3 border-b border-border bg-muted/50">
              <h3 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                <Wrench className="h-4 w-4 text-secondary" />
                <span>Tools</span>
                {isLoadingTools && (
                  <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full"></div>
                )}
              </h3>
            </div>
            <ScrollArea className="h-[calc(33vh-120px)]">
              <div className="p-3 space-y-3">
                {toolsError ? (
                  <div className="text-center text-destructive p-4 text-sm flex items-center justify-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Error loading tools</span>
                  </div>
                ) : tools.length > 0 ? (
                  tools.map((tool) => <ToolItem key={tool.name} tool={tool} />)
                ) : (
                  <div className="text-center text-muted-foreground p-6 text-sm">
                    {isLoadingTools ? "Loading tools..." : "No tools available for this agent."}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>

          <div className="flex-1">
            <div className="p-3 border-b border-border bg-muted/50">
              <h3 className="text-sm font-semibold text-foreground flex items-center space-x-2">
                <Shield className="h-4 w-4 text-accent" />
                <span>Guardrails</span>
                {isLoadingGuardrails && (
                  <div className="animate-spin h-3 w-3 border border-primary border-t-transparent rounded-full"></div>
                )}
              </h3>
            </div>
            <ScrollArea className="h-[calc(33vh-120px)]">
              <div className="p-3 space-y-3">
                {guardrailsError ? (
                  <div className="text-center text-destructive p-4 text-sm flex items-center justify-center space-x-2">
                    <AlertCircle className="h-4 w-4" />
                    <span>Error loading guardrails</span>
                  </div>
                ) : guardrails.length > 0 ? (
                  guardrails.map((guardrail, index) => (
                    <GuardrailItem
                      key={`${guardrail.name}-${index}`}
                      guardrail={guardrail}
                      executedGuardrails={executedGuardrails}
                    />
                  ))
                ) : (
                  <div className="text-center text-muted-foreground p-6 text-sm">
                    {isLoadingGuardrails ? "Loading guardrails..." : "No guardrails configured for this agent."}
                  </div>
                )}
              </div>
            </ScrollArea>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
