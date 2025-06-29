import { Agent, run, type InputGuardrail, type OutputGuardrail } from "@openai/agents"
import { z } from "zod"
import { google } from "@ai-sdk/google"
import { aisdk } from "@openai/agents-extensions"

// const model = aisdk(google("gemini-2.5-flash"));

const RelevanceOutput = z.object({
  reasoning: z.string(),
  is_relevant: z.boolean(),
})

type RelevanceOutput = z.infer<typeof RelevanceOutput>

const guardrailAgent = new Agent({
  model: 'gpt-4o-mini',
  name: 'Relevance Guardrail',
  instructions: [
    'Determine if the user\'s message is highly unrelated to a normal customer service',
    'conversation with an airline (flights, bookings, baggage, check-in, flight status, policies, loyalty programs, etc.).',
    'Important: You are ONLY evaluating the most recent user message, not any of the previous messages from the chat history.',
    'It is OK for the customer to send messages such as \'Hi\' or \'OK\' or any other messages that are at all conversational,',
    'but if the response is non-conversational, it must be somewhat related to airline travel.',
    'Return is_relevant=true if it is, else false, plus a brief reasoning.'
  ].join(' '),
  outputType: RelevanceOutput,
})

export const relevanceGuardrail: InputGuardrail = {
  name: "Relevance Guardrail",
  execute: async ({ input, context }) => {
    // const inputText =
    //   typeof input === "string"
    //     ? input
    //     : input
    //         .map((item) => {
    //           if ("text" in item && typeof item.text === "string") {
    //             return item.text
    //           }
    //           return "[non-text content]"
    //         })
    //         .join(" ")

    const result = await run(guardrailAgent, input, { context })
    const output = result.finalOutput as RelevanceOutput

    return {
      outputInfo: output,
      tripwireTriggered: !output.is_relevant,
    }
  },
}

export const contentLengthGuardrail: OutputGuardrail = {
  name: "Content Length Guardrail",
  execute: async ({ agentOutput }) => {
    const outputText = typeof agentOutput === "string" ? agentOutput : JSON.stringify(agentOutput)
    const isAppropriateLength = outputText.length >= 10 && outputText.length <= 2000

    return {
      outputInfo: {
        length: outputText.length,
        isAppropriateLength,
        reasoning: isAppropriateLength
          ? "Response length is appropriate"
          : `Response length (${outputText.length}) is outside acceptable range (10-2000 characters)`,
      },
      tripwireTriggered: !isAppropriateLength,
    }
  },
}
