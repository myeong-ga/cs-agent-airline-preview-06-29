import { Agent, handoff, type RunContext } from "@openai/agents"
import { z } from "zod"
import { google } from "@ai-sdk/google"
import { aisdk } from "@openai/agents-extensions"
import type { AirlineContext, BaggageContext } from "@/types/chat"
import {
  faqLookupTool,
  updateSeatTool,
  flightStatusTool,
  cancelFlightTool,
  baggageStatusTool,
  reportLostBaggageTool,
  baggageFeesTool,
} from "./tools"
import { relevanceGuardrail, contentLengthGuardrail } from "./guardrails"

// const model = aisdk(google("gemini-2.5-flash"));

const emptyInputSchema = z.object({})

const baggageContextSchema = z.object({
  baggageStatus: z.enum(["checked", "lost", "delayed", "delivered"]).optional().nullable(),
  baggageType: z.enum(["checked", "carry-on", "oversized"]).optional().nullable(),
  lostBaggageReportId: z.string().optional().nullable(),
  baggageFee: z.number().optional().nullable(),
  confirmationNumber: z.string().optional().nullable(),
  flightNumber: z.string().optional().nullable(),
})

function generateRandomNumber(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function generateConfirmationNumber(): string {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
  let result = ""
  for (let i = 0; i < 6; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length))
  }
  return result
}

function generateFlightNumber(): string {
  return `FLT-${generateRandomNumber(100, 999)}`
}

async function onBaggageHandoff(context: RunContext<BaggageContext>): Promise<void> {
  if (!context.context.flightNumber) {
    context.context.flightNumber = generateFlightNumber()
  }
  if (!context.context.confirmationNumber) {
    context.context.confirmationNumber = generateConfirmationNumber()
  }
  if (!context.context.baggageClaimNumber) {
    context.context.baggageClaimNumber = `BAG-${generateRandomNumber(100000, 999999)}`
  }
  if (!context.context.baggageType) {
    context.context.baggageType = "checked"
  }
}

async function onFlightStatusHandoff(context: RunContext<AirlineContext>): Promise<void> {
  if (!context.context.flightNumber) {
    context.context.flightNumber = generateFlightNumber()
  }
  if (!context.context.confirmationNumber) {
    context.context.confirmationNumber = generateConfirmationNumber()
  }
}

async function onSeatBookingHandoff(context: RunContext<AirlineContext>): Promise<void> {
  if (!context.context.flightNumber) {
    context.context.flightNumber = generateFlightNumber()
  }
  if (!context.context.confirmationNumber) {
    context.context.confirmationNumber = generateConfirmationNumber()
  }
}

async function onCancellationHandoff(context: RunContext<AirlineContext>): Promise<void> {
  if (!context.context.confirmationNumber) {
    context.context.confirmationNumber = generateConfirmationNumber()
  }
  if (!context.context.flightNumber) {
    context.context.flightNumber = generateFlightNumber()
  }
}

export const faqAgent: Agent<AirlineContext> = new Agent<AirlineContext>({
  model: "gpt-4.1",
  name: "FAQ Agent",
  instructions: [
    "You are an FAQ agent for an airline customer service system.",
    "Use the faq_lookup_tool to answer customer questions.",
    "Respond to the customer with the answer.",
  ].join(" "),
  handoffDescription: "A helpful agent that can answer questions about the airline",
  tools: [faqLookupTool],
  inputGuardrails: [relevanceGuardrail],
  outputGuardrails: [contentLengthGuardrail],
})

export const baggageAgent: Agent<BaggageContext> = new Agent<BaggageContext>({
  model: "gpt-4.1",
  name: "Baggage Agent",
  instructions: (runContext) => {
    const context = runContext.context
    const confirmation = context.confirmationNumber || "[unknown]"
    const flight = context.flightNumber || "[unknown]"
    return [
      "You are a Baggage Agent for an airline customer service system.",
      `The customer's confirmation number is ${confirmation} and flight number is ${flight}.`,
      "You specialize in handling all baggage-related inquiries including:",
      "- Baggage allowance and fees",
      "- Lost or delayed baggage reports",
      "- Baggage status tracking",
      "- Oversized or special baggage handling",
      "If confirmation number or flight number is not available, ask the customer for the missing information.",
      "Use the appropriate baggage tools to help customers with their baggage needs.",
      "If the customer asks something unrelated to baggage, transfer back to the triage agent.",
    ].join(" ")
  },
  handoffDescription: "A specialized agent for handling all baggage-related inquiries and issues",
  tools: [baggageStatusTool, reportLostBaggageTool, baggageFeesTool],
  inputGuardrails: [relevanceGuardrail],
  outputGuardrails: [contentLengthGuardrail],
})

export const seatBookingAgent: Agent<AirlineContext> = new Agent<AirlineContext>({
  model: "gpt-4.1",
  name: "Seat Booking Agent",
  instructions: (runContext) => {
    const context = runContext.context
    const confirmation = context.confirmationNumber || "[unknown]"
    return [
      "You are a seat booking agent for an airline customer service system.",
      `The customer's confirmation number is ${confirmation}.`,
      "If confirmation number is not available, ask the customer for it.",
      "Ask the customer what their desired seat number is.",
      "Use the update_seat tool to update the seat on the flight.",
      "If the customer asks something unrelated, transfer back to the triage agent.",
    ].join(" ")
  },
  handoffDescription: "A helpful agent that can update a seat on a flight",
  tools: [updateSeatTool],
  inputGuardrails: [relevanceGuardrail],
  outputGuardrails: [contentLengthGuardrail],
})

export const flightStatusAgent: Agent<AirlineContext> = new Agent<AirlineContext>({
  model: "gpt-4.1",
  name: "Flight Status Agent",
  instructions: (runContext) => {
    const context = runContext.context
    const confirmation = context.confirmationNumber || "[unknown]"
    const flight = context.flightNumber || "[unknown]"
    return [
      "You are a Flight Status Agent for an airline customer service system.",
      `The customer's confirmation number is ${confirmation} and flight number is ${flight}.`,
      "If either is not available, ask the customer for the missing information.",
      "Use the flight_status_tool to report the status of the flight.",
      "If the customer asks something unrelated to flight status, transfer back to the triage agent.",
    ].join(" ")
  },
  handoffDescription: "An agent to provide flight status information",
  tools: [flightStatusTool],
  inputGuardrails: [relevanceGuardrail],
  outputGuardrails: [contentLengthGuardrail],
})

export const cancellationAgent: Agent<AirlineContext> = new Agent<AirlineContext>({
  model: "gpt-4.1",
  name: "Cancellation Agent",
  instructions: (runContext) => {
    const context = runContext.context
    const confirmation = context.confirmationNumber || "[unknown]"
    const flight = context.flightNumber || "[unknown]"
    return [
      "You are a Cancellation Agent for an airline customer service system.",
      `The customer's confirmation number is ${confirmation} and flight number is ${flight}.`,
      "If either is not available, ask the customer for the missing information.",
      "If the customer confirms, use the cancel_flight tool to cancel their flight.",
      "If the customer asks anything else, transfer back to the triage agent.",
    ].join(" ")
  },
  handoffDescription: "An agent to cancel flights",
  tools: [cancelFlightTool],
  inputGuardrails: [relevanceGuardrail],
  outputGuardrails: [contentLengthGuardrail],
})

export const triageAgent: Agent<AirlineContext> = new Agent({
  model: "gpt-4.1",
  name: "Triage Agent",
  instructions: [
    "You are a helpful triaging agent for an airline customer service system.",
    "You can delegate questions to other appropriate agents based on customer needs.",
    "For FAQ questions, transfer to FAQ Agent.",
    "For seat changes, transfer to Seat Booking Agent.",
    "For flight status inquiries, transfer to Flight Status Agent.",
    "For cancellations, transfer to Cancellation Agent.",
    "For baggage-related inquiries (lost baggage, baggage fees, baggage status, etc.), transfer to Baggage Agent.",
  ].join(" "),
  handoffDescription: "A triage agent that can delegate requests to appropriate agents",
  handoffs: [
    faqAgent,
    handoff(seatBookingAgent, {
      onHandoff: onSeatBookingHandoff,
      inputType: emptyInputSchema,
    }),
    handoff(flightStatusAgent, {
      onHandoff: onFlightStatusHandoff,
      inputType: emptyInputSchema,
    }),
    handoff(cancellationAgent, {
      onHandoff: onCancellationHandoff,
      inputType: emptyInputSchema,
    }),
    handoff(baggageAgent, {
      onHandoff: onBaggageHandoff,
      inputType: emptyInputSchema,
    }),
  ],
  inputGuardrails: [relevanceGuardrail],
  outputGuardrails: [contentLengthGuardrail],
})

faqAgent.handoffs.push(triageAgent)
seatBookingAgent.handoffs.push(triageAgent)
flightStatusAgent.handoffs.push(triageAgent)
cancellationAgent.handoffs.push(triageAgent)
baggageAgent.handoffs.push(triageAgent)

export function createInitialContext(): AirlineContext | BaggageContext {
  return {
    accountNumber: generateRandomNumber(10000000, 99999999).toString(),
  }
}

export function getAgentByName(name: string): Agent<AirlineContext | BaggageContext> {
  const agents: Record<string, Agent<any>> = {
    "Triage Agent": triageAgent,
    "FAQ Agent": faqAgent,
    "Seat Booking Agent": seatBookingAgent,
    "Flight Status Agent": flightStatusAgent,
    "Cancellation Agent": cancellationAgent,
    "Baggage Agent": baggageAgent,
  }
  return agents[name] || triageAgent
}
