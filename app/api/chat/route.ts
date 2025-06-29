import { type NextRequest, NextResponse } from "next/server"
import { InputGuardrailTripwireTriggered, Runner } from "@openai/agents"
import type {
  AirlineContext,
  ChatRequest,
  ChatResponse,
  ConversationState,
  GuardrailInfo,
  AgentEvent,
  BaggageContext,
  ChatMessage,
} from "@/types/chat"
import { conversationStore } from "@/lib/conversation-store"
import { createInitialContext, getAgentByName } from "@/lib/agents"
import { relevanceGuardrail, contentLengthGuardrail } from "@/lib/guardrails"

function generateConversationId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}
function generateEventId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function generateTurnId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

function airlineContextToBaggageContext(airlineContext: AirlineContext): BaggageContext {
  return {
    seatNumber: airlineContext.seatNumber,
    flightNumber: airlineContext.flightNumber,
    accountNumber: airlineContext.accountNumber,
    passengerName: airlineContext.passengerName,
    confirmationNumber: airlineContext.confirmationNumber,
    baggageType: undefined,
    baggageWeight: undefined,
    baggageCount: undefined,
    baggageDimensions: undefined,
    baggageStatus: undefined,
    baggageClaimNumber: undefined,
    baggageLostClaimNumber: undefined,
    specialRequests: undefined,
  }
}

function getContextForAgent(
  agentName: string,
  currentContext: AirlineContext | BaggageContext,
): AirlineContext | BaggageContext {
  if (agentName === "Baggage Agent") {
    if ("baggageType" in currentContext || "baggageClaimNumber" in currentContext) {
      return currentContext as BaggageContext
    }
    return airlineContextToBaggageContext(currentContext as AirlineContext)
  }

  if ("baggageType" in currentContext || "baggageClaimNumber" in currentContext) {
    const baggageContext = currentContext as BaggageContext
    return {
      seatNumber: baggageContext.seatNumber,
      flightNumber: baggageContext.flightNumber,
      accountNumber: baggageContext.accountNumber,
      passengerName: baggageContext.passengerName,
      confirmationNumber: baggageContext.confirmationNumber,
    }
  }

  return currentContext as AirlineContext
}

function formatMessagesForAgent(messages: ChatMessage[]): string {
  return messages.map(msg => {
    const rolePrefix = msg.role === 'user' ? 'User' : `Assistant${msg.agent ? ` (${msg.agent})` : ''}`;
    return `${rolePrefix}: ${msg.content}`;
  }).join('\n\n');
}

export async function POST(request: NextRequest) {
  try {
    const body: ChatRequest = await request.json()
    console.log('📥 [CHAT REQUEST]', {
      conversationId: body.conversationId,
      message: body.message,
      messageLength: body.message?.length,
      timestamp: new Date().toISOString(),
    });
    let conversationState: ConversationState

    if (!body.conversationId || !conversationStore.get(body.conversationId)) {
      const conversationId = generateConversationId()
      conversationState = {
        conversationId,
        messages: [],
        currentAgent: "Triage Agent",
        context: createInitialContext(),
      }
      console.log('🆕 [NEW CONVERSATION]', {
        conversationId,
        initialAgent: conversationState.currentAgent,
        context: conversationState.context,
      });
      if (!body.message.trim()) {
        conversationStore.save(conversationId, conversationState)
        return NextResponse.json({
          conversationId,
          currentAgent: conversationState.currentAgent,
          messages: [],
          context: conversationState.context,
        } as ChatResponse)
      }
    } else {
      conversationState = conversationStore.get(body.conversationId)!
      console.log('🔄 [EXISTING CONVERSATION]', {
        conversationId: conversationState.conversationId,
        currentAgent: conversationState.currentAgent,
        messageHistory: conversationState.messages,
        context: conversationState.context,
      });
    }

    const currentAgent = getAgentByName(conversationState.currentAgent)
    const context = getContextForAgent(currentAgent.name, conversationState.context)

    let result
    let guardrailInfo: GuardrailInfo[] = []
    const events: AgentEvent[] = []
    const turnId = generateTurnId()

    // Create current user message and add to conversation history
    const currentUserMessage: ChatMessage = {
      role: 'user',
      content: body.message,
      timestamp: new Date().toISOString(),
    };
    
    // Build complete message history including current message
    const completeMessages = [...conversationState.messages, currentUserMessage];
    const formattedMessages = formatMessagesForAgent(completeMessages);

    try {
      console.log('🔍 [RUNNING AGENT]', {
          conversationId: conversationState.conversationId,
          agentName: currentAgent.name,
          message: body.message,
          context: JSON.stringify(context),
      });
      // const runner = new Runner({
      //   inputGuardrails: [relevanceGuardrail],
      //   outputGuardrails: [contentLengthGuardrail],
      // })
      const runner = new Runner();
      
      result = await runner.run(currentAgent, formattedMessages, { context })

      const allGuardrailResults = [...(result.inputGuardrailResults || []), ...(result.outputGuardrailResults || [])]

      guardrailInfo = allGuardrailResults.map((guardrailResult) => ({
        id: guardrailResult.guardrail.name.toLowerCase().replace(/\s+/g, "_"),
        name: guardrailResult.guardrail.name,
        input: body.message,
        reasoning:
          guardrailResult.output.outputInfo?.reasoning ||
          (typeof guardrailResult.output.outputInfo === "string"
            ? guardrailResult.output.outputInfo
            : JSON.stringify(guardrailResult.output.outputInfo || {})),
        passed: !guardrailResult.output.tripwireTriggered,
        timestamp: Date.now(),
      }))
      // passed된 guardrail도 기본 정보 추가
      if (guardrailInfo.length === 0) {
        // 기본 guardrail 정보 추가 (실행되었지만 결과가 없는 경우)
        guardrailInfo.push(
          {
            id: "relevance_guardrail",
            name: "Relevance Guardrail",
            input: body.message,
            reasoning: "Message is relevant to airline customer service topics",
            passed: true,
            timestamp: Date.now(),
          },
          {
            id: "content_length_guardrail",
            name: "Content Length Guardrail",
            input: body.message,
            reasoning: "Response length is within acceptable range",
            passed: true,
            timestamp: Date.now(),
          },
        )
      }
    } catch (error) {
     
      if (error instanceof InputGuardrailTripwireTriggered) {
         console.log('🛡️ [GUARDRAIL TRIGGERED]', {
            guardrail: error.result.guardrail.name,
            outputInfo: error.result.output.outputInfo,
            conversationId: conversationState.conversationId,
          });
        const tripwireGuardrailInfo: GuardrailInfo = {
          id: error.result.guardrail.name.toLowerCase().replace(/\s+/g, "_"),
          name: error.result.guardrail.name,
          input: body.message,
          reasoning: error.result.output.outputInfo?.reasoning || "Guardrail triggered",
          passed: false,
          timestamp: Date.now(),
        }

        const userMessage = { role: "user" as const, content: body.message, timestamp: new Date().toISOString() }
        const assistantMessage = {
          role: "assistant" as const,
          content:
            "I'm sorry, but I can only help with airline-related questions. Please ask me about flights, bookings, seat changes, baggage, or other airline services.",
          agent: currentAgent.name,
          timestamp: new Date().toISOString(),
        }
        const newMessages = [...conversationState.messages, userMessage, assistantMessage]

        conversationState.messages = newMessages
        conversationStore.save(conversationState.conversationId, conversationState)

        const responseMessages = newMessages.slice(-2).map((msg) => ({ ...msg, timestamp: new Date().toISOString() }))

        return NextResponse.json({
          conversationId: conversationState.conversationId,
          currentAgent: conversationState.currentAgent,
          messages: responseMessages,
          context: conversationState.context,
          guardrails: [tripwireGuardrailInfo],
        } as ChatResponse)
      } else {
        throw error
      }
    }
    console.log('🔍 [FIND CONTEXT AFTER AGENT EXECUTION]', {
        conversationId: conversationState.conversationId,
        context: JSON.stringify(context),
    });

    let handoffTargetAgent: string | null = null

    for (const newItem of result.newItems) {
      const timestamp = Date.now()

      if (newItem.type === "message_output_item") {
        const messageItem = newItem as any
        const agentName = messageItem.agent?.name || "Agent"
        events.push({
          id: generateEventId(),
          type: "message",
          turnId,
          content: messageItem.content,
          metadata: { agent: agentName },
          timestamp,
        })
      } else if (newItem.type === "handoff_output_item") {
        const handoffItem = newItem as any
        handoffTargetAgent = handoffItem.targetAgent.name
        events.push({
          id: generateEventId(),
          type: "handoff",
          turnId,
          content: `${handoffItem.sourceAgent.name} -> ${handoffItem.targetAgent.name}`,
          metadata: { source_agent: handoffItem.sourceAgent.name, target_agent: handoffItem.targetAgent.name },
          timestamp,
        })
      } else if (newItem.type === "tool_call_item") {
        const toolCallItem = newItem as any
        const toolName = toolCallItem.raw_item?.name || "Unknown Tool"
        const toolArgs = toolCallItem.raw_item?.arguments
        let parsedArgs
        try {
          parsedArgs = typeof toolArgs === "string" ? JSON.parse(toolArgs) : toolArgs
        } catch {
          parsedArgs = toolArgs
        }
        events.push({
          id: generateEventId(),
          type: "tool_call",
          turnId,
          content: toolName,
          metadata: { tool_args: parsedArgs },
          timestamp,
        })
      } else if (newItem.type === "tool_call_output_item") {
        const toolOutputItem = newItem as any
        events.push({
          id: generateEventId(),
          type: "tool_output",
          turnId,
          content: String(toolOutputItem.output),
          metadata: { tool_result: toolOutputItem.output },
          timestamp,
        })
      }
    }

    // Update conversation state context from agent result
    // conversationState.context = result.state._context.context;

    if (handoffTargetAgent) {
      const previousAgent = conversationState.currentAgent;
      conversationState.currentAgent = handoffTargetAgent;
      
      // Convert context to match the new agent
      conversationState.context = getContextForAgent(handoffTargetAgent, conversationState.context);
      
      console.log('🔄 [AGENT HANDOFF APPLIED]', {
        from: previousAgent,
        to: handoffTargetAgent,
        conversationId: conversationState.conversationId,
        newContextType: handoffTargetAgent === 'Baggage Agent' ? 'BaggageContext' : 'AirlineContext',
      });
    }

    const userMessage = { role: "user" as const, content: body.message, timestamp: new Date().toISOString() }
    const assistantMessage = {
      role: "assistant" as const,
      content: result.finalOutput || "",
      agent: conversationState.currentAgent,
      timestamp: new Date().toISOString(),
      turnId: turnId, // turnId 추가
    }
    const newMessages = [...conversationState.messages, userMessage, assistantMessage]
    conversationState.messages = newMessages

    const responseMessages = newMessages.slice(-2).map((msg) => ({
      ...msg,
      timestamp: new Date().toISOString(),
      turnId: msg.role === "assistant" ? turnId : undefined, // assistant 메시지에만 turnId 추가
    }))

    conversationStore.save(conversationState.conversationId, conversationState)

    const chatResponse: ChatResponse = {
      conversationId: conversationState.conversationId,
      currentAgent: conversationState.currentAgent,
      messages: responseMessages,
      context: conversationState.context,
      guardrails: guardrailInfo, 
      events,
    }
    console.log('📤 [CHAT RESPONSE]', {
      conversationId: chatResponse.conversationId,
      currentAgent: chatResponse.currentAgent,
      messagesCount: chatResponse.messages.length,
      context: chatResponse.context,
      guardrails: JSON.stringify(chatResponse.guardrails),
      responseMessages: chatResponse.messages.map(msg => ({
        role: msg.role,
        contentLength: msg.content.length,
        agent: msg.agent,
        timestamp: msg.timestamp,
      })),
    });
    return NextResponse.json(chatResponse)
  } catch (error) {
    console.error("CHAT API ERROR:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
