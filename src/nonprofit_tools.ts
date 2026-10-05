import { z } from "zod";
import type { ChatCompletionTool } from "openai/resources/chat/completions";

const receiptInput = z.object({
  receiptId: z.string().min(1),
  donorName: z.string().min(1),
  amountCents: z.number().int().positive(),
  donatedOn: z.string().date(),
});

const reminderInput = z.object({
  reminderId: z.string().min(1),
  volunteerName: z.string().min(1),
  shiftStartsAt: z.string().datetime({ offset: true }),
});

const reportInput = z.object({
  campaignName: z.string().min(1),
  goalCents: z.number().int().positive(),
  raisedCents: z.number().int().nonnegative(),
  volunteerHours: z.number().nonnegative(),
});

export const toolDefinitions = [
  {
    type: "function" as const,
    function: {
      name: "prepare_donor_receipt",
      description: "Prepare an acknowledgement receipt for a recorded donation.",
      parameters: {
        type: "object",
        properties: {
          receiptId: { type: "string" },
          donorName: { type: "string" },
          amountCents: { type: "integer", minimum: 1 },
          donatedOn: { type: "string", format: "date" }
        },
        required: ["receiptId", "donorName", "amountCents", "donatedOn"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "schedule_volunteer_reminder",
      description: "Prepare a reminder for an upcoming volunteer shift.",
      parameters: {
        type: "object",
        properties: {
          reminderId: { type: "string" },
          volunteerName: { type: "string" },
          shiftStartsAt: { type: "string", format: "date-time" }
        },
        required: ["reminderId", "volunteerName", "shiftStartsAt"],
        additionalProperties: false
      }
    }
  },
  {
    type: "function" as const,
    function: {
      name: "summarize_campaign",
      description: "Calculate a compact campaign progress report.",
      parameters: {
        type: "object",
        properties: {
          campaignName: { type: "string" },
          goalCents: { type: "integer", minimum: 1 },
          raisedCents: { type: "integer", minimum: 0 },
          volunteerHours: { type: "number", minimum: 0 }
        },
        required: ["campaignName", "goalCents", "raisedCents", "volunteerHours"],
        additionalProperties: false
      }
    }
  }
] satisfies ChatCompletionTool[];

export type ToolResult = Record<string, string | number>;

export function executeNonprofitTool(name: string, rawArguments: string): ToolResult {
  const parsed: unknown = JSON.parse(rawArguments);

  if (name === "prepare_donor_receipt") {
    const input = receiptInput.parse(parsed);
    return {
      receiptId: input.receiptId,
      status: "prepared",
      acknowledgement: `${input.donorName} donated $${(input.amountCents / 100).toFixed(2)} on ${input.donatedOn}.`
    };
  }

  if (name === "schedule_volunteer_reminder") {
    const input = reminderInput.parse(parsed);
    return {
      reminderId: input.reminderId,
      status: "scheduled",
      message: `${input.volunteerName}, your volunteer shift starts at ${input.shiftStartsAt}.`
    };
  }

  if (name === "summarize_campaign") {
    const input = reportInput.parse(parsed);
    const progressPercent = Math.min(100, Math.round((input.raisedCents / input.goalCents) * 100));
    return {
      campaignName: input.campaignName,
      progressPercent,
      remainingCents: Math.max(0, input.goalCents - input.raisedCents),
      volunteerHours: input.volunteerHours
    };
  }

  throw new Error(`Unknown tool: ${name}`);
}
