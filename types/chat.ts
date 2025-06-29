export interface AirlineContext {
  passengerName?: string
  confirmationNumber?: string
  seatNumber?: string
  flightNumber?: string
  accountNumber?: string
}

export interface SharedContextFields {
  seatNumber?: string
  flightNumber?: string
  accountNumber?: string
}

export interface BaggageContext extends SharedContextFields {
  passengerName?: string
  confirmationNumber?: string
  baggageType?: "carry-on" | "checked" | "oversized" | "special"
  baggageWeight?: number
  baggageCount?: number
  baggageDimensions?: string
  baggageStatus?: "checked" | "lost" | "delayed" | "delivered"
  baggageClaimNumber?: string
  baggageLostClaimNumber?: string
  specialRequests?: string[]
}

export interface ChatMessage {
  role: "user" | "assistant"
  content: string
  agent?: string
  turnId?: string
  timestamp: string
}

export interface ConversationState {
  conversationId: string
  messages: ChatMessage[]
  currentAgent: string
  context: AirlineContext | BaggageContext
}

export interface ChatRequest {
  conversationId?: string
  message: string
}

export interface GuardrailInfo {
  id: string
  name: string
  input: string
  reasoning: string
  passed: boolean
  timestamp: number
}

export type EventType = "message" | "handoff" | "tool_call" | "tool_output"

export interface MessageEventMetadata {
  agent: string
}

export interface HandoffEventMetadata {
  source_agent: string
  target_agent: string
}

export interface ToolCallEventMetadata {
  tool_args?: Record<string, any>
}

export interface ToolOutputEventMetadata {
  tool_result?: any
}

export type EventMetadata =
  | MessageEventMetadata
  | HandoffEventMetadata
  | ToolCallEventMetadata
  | ToolOutputEventMetadata
  | Record<string, any>

export interface AgentEvent {
  id: string
  type: EventType
  turnId: string
  content: string
  metadata?: EventMetadata
  timestamp: number
}

export interface ChatResponse {
  conversationId: string
  currentAgent: string
  messages: ChatMessage[]
  context: AirlineContext | BaggageContext
  guardrails?: GuardrailInfo[]
  events?: AgentEvent[]
}

export interface AgentInfo {
  name: string
  description: string
  handoffs: string[]
  tools: string[]
  status: "available" | "busy" | "active"
  specialty?: string
}


export interface ToolInfo {
  name: string
  description: string
  arguments: Record<string, any>
}

export interface AgentGuardrailInfo {
  name: string
  description: string
  type: "input" | "output"
}

export interface AgentsListResponse {
  agents: AgentInfo[]
  currentAgent: string
}

export interface AgentToolsListResponse {
  agentName: string
  tools: ToolInfo[]
}

export interface AgentGuardrailsResponse {
  agentName: string
  guardrails: AgentGuardrailInfo[]
}
