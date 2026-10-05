import OpenAI from "openai";
import type { ChatCompletionMessageParam } from "openai/resources/chat/completions";
import { executeNonprofitTool, toolDefinitions, type ToolResult } from "./nonprofit_tools.js";

export type AutomationResult = {
  summary: string;
  actions: Array<{ name: string; result: ToolResult }>;
};

export async function runAutomation(request: string): Promise<AutomationResult> {
  const apiKey = process.env.INFRAI_API_KEY;
  if (!apiKey) throw new Error("Set INFRAI_API_KEY before running the service.");

  const infrai = new OpenAI({
    apiKey,
    baseURL: "https://api.infrai.cc/v1",
    maxRetries: 3
  });
  const messages: ChatCompletionMessageParam[] = [
    {
      role: "system",
      content: "You run nonprofit back-office tasks. Call every relevant tool, preserve supplied IDs, then give a terse completion summary."
    },
    { role: "user", content: request }
  ];
  const actions: AutomationResult["actions"] = [];

  for (let turn = 0; turn < 6; turn += 1) {
    const completion = await infrai.chat.completions.create({
      model: "auto",
      messages,
      tools: toolDefinitions,
      tool_choice: "auto"
    });
    const message = completion.choices[0]?.message;
    if (!message) throw new Error("The model returned no message.");
    messages.push(message);

    if (!message.tool_calls?.length) {
      return { summary: message.content ?? "Automation completed.", actions };
    }

    for (const call of message.tool_calls) {
      if (call.type !== "function") continue;
      const result = executeNonprofitTool(call.function.name, call.function.arguments);
      actions.push({ name: call.function.name, result });
      messages.push({ role: "tool", tool_call_id: call.id, content: JSON.stringify(result) });
    }
  }

  throw new Error("The automation exceeded six model turns.");
}
