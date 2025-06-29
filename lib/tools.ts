import { z } from "zod"
import { tool } from "@openai/agents"
import type { BaggageContext } from "@/types/chat"

export const faqLookupTool = tool({
  name: "faq_lookup_tool",
  description: "Lookup frequently asked questions",
  parameters: z.object({
    question: z.string().describe("The question to lookup"),
  }),
  execute: async ({ question }) => {
    const q = question.toLowerCase()
    if (q.includes("bag") || q.includes("baggage")) {
      return "You are allowed to bring one bag on the plane. It must be under 50 pounds and 22 inches x 14 inches x 9 inches."
    } else if (q.includes("seats") || q.includes("plane")) {
      return "There are 120 seats on the plane. There are 22 business class seats and 98 economy seats. Exit rows are rows 4 and 16. Rows 5-8 are Economy Plus, with extra legroom."
    } else if (q.includes("wifi")) {
      return "We have free wifi on the plane, join Airline-Wifi"
    }
    return "I'm sorry, I don't know the answer to that question."
  },
})

export const updateSeatTool = tool({
  name: "update_seat",
  description: "Update the seat for a given confirmation number",
  parameters: z.object({
    confirmationNumber: z.string().describe("The confirmation number"),
    seatNumber: z.string().describe("The new seat number"),
  }),
  execute: async ({ confirmationNumber, seatNumber },runContext) => {
    if (runContext && runContext.context) {
      const airplaneContext = runContext.context as BaggageContext
      airplaneContext.seatNumber = seatNumber
    }
    return `Updated seat to ${seatNumber} for confirmation number ${confirmationNumber}`
  },
})

export const flightStatusTool = tool({
  name: "flight_status_tool",
  description: "Lookup status for a flight",
  parameters: z.object({
    flightNumber: z.string().describe("The flight number to check"),
  }),
  execute: async ({ flightNumber }) => {
    return `Flight ${flightNumber} is on time and scheduled to depart at gate A10.`
  },
})

export const baggageStatusTool = tool({
  name: "baggage_status_tool",
  description: "Check the status of checked baggage",
  parameters: z.object({
    claimNumber: z.string().describe("The baggage claim number"),
  }),
  execute: async ({ claimNumber }, runContext) => {
    const statuses = ["checked", "lost", "delayed", "delivered"]
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]

    if (runContext && runContext.context) {
      const baggageContext = runContext.context as BaggageContext
      baggageContext.baggageClaimNumber = claimNumber
      baggageContext.baggageStatus = randomStatus as "checked" | "lost" | "delayed" | "delivered"
    }

    return `Baggage with claim number ${claimNumber} is currently ${randomStatus}. Expected delivery time: ${new Date(Date.now() + 2 * 60 * 60 * 1000).toLocaleTimeString()}.`
  },
})

export const reportLostBaggageTool = tool({
  name: "report_lost_baggage",
  description: "Report lost or delayed baggage",
  parameters: z.object({
    confirmationNumber: z.string().describe("The confirmation number for the flight"),
    baggageDescription: z.string().describe("Description of the lost baggage"),
    contactInfo: z.string().describe("Contact information for follow-up"),
  }),
  execute: async ({ confirmationNumber, baggageDescription: _baggageDescription, contactInfo }, runContext) => {
    const baggageLostClaimNumber = `BAG-${Math.floor(Math.random() * 999999)
      .toString()
      .padStart(6, "0")}`
    if (runContext && runContext.context) {
      const baggageContext = runContext.context as BaggageContext
      baggageContext.confirmationNumber = confirmationNumber
      baggageContext.baggageLostClaimNumber = baggageLostClaimNumber
      baggageContext.baggageStatus = "lost"
    }

    return `ConfirmationNumber ${confirmationNumber} Lost baggage report filed successfully. Your claim number is ${baggageLostClaimNumber}. We will contact you at ${contactInfo} with updates. Expected resolution time: 24-48 hours.`
  },
})
export const baggageFeesTool = tool({
  name: "baggage_fees_calculator",
  description: "Calculate baggage fees based on weight and dimensions",
  parameters: z.object({
    weight: z.number().describe("Weight of the baggage in kilograms"),
    baggageType: z.enum(["carry-on", "checked", "oversized"]).describe("Type of baggage"),
  }),
  execute: async ({ weight, baggageType }, runContext) => {
    let fee = 0
    let breakdown = ""

    if (baggageType === "checked" || baggageType === "oversized") {
      if (weight > 50) {
        fee += 75
        breakdown += `Overweight fee (${weight} lbs): $75. `
      }
      if (weight > 70) {
        fee += 200
        breakdown += `Heavy bag fee (${weight} lbs): $200. `
      }
    }

    if (fee === 0) {
      return `No additional fees for your ${baggageType} baggage.`
    }

    if (runContext && runContext.context) {
      const baggageContext = runContext.context as BaggageContext
      baggageContext.baggageType = baggageType
      baggageContext.baggageWeight = weight
    }

    return `Total baggage fees: $${fee}. ${breakdown}`
  },
})

export const cancelFlightTool = tool({
  name: "cancel_flight",
  description: "Cancel a flight",
  parameters: z.object({
    confirmationNumber: z.string().describe("The confirmation number"),
  }),
  execute: async ({ confirmationNumber }) => {
    return `Flight with confirmation ${confirmationNumber} successfully cancelled`
  },
})
