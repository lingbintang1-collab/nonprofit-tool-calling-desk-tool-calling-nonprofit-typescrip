import { createServer } from "node:http";
import { z } from "zod";
import { runAutomation } from "./automation_loop.js";

const requestBody = z.object({
  request: z.string().min(10).max(4000)
});

function sendJson(response: import("node:http").ServerResponse, status: number, body: unknown): void {
  response.writeHead(status, { "content-type": "application/json; charset=utf-8" });
  response.end(JSON.stringify(body));
}

const server = createServer(async (request, response) => {
  if (request.method !== "POST" || request.url !== "/automations") {
    sendJson(response, 404, { error: "Route not found" });
    return;
  }

  try {
    const chunks: Buffer[] = [];
    for await (const chunk of request) chunks.push(Buffer.from(chunk));
    const input = requestBody.parse(JSON.parse(Buffer.concat(chunks).toString("utf8")));
    sendJson(response, 200, await runAutomation(input.request));
  } catch (error) {
    if (error instanceof z.ZodError || error instanceof SyntaxError) {
      sendJson(response, 400, { error: "Request body must contain a valid request string." });
      return;
    }
    console.error(error);
    sendJson(response, 502, { error: "Automation could not be completed." });
  }
});

const port = Number(process.env.PORT ?? 3000);
server.listen(port, () => console.log(`Nonprofit automation listening on http://localhost:${port}`));
