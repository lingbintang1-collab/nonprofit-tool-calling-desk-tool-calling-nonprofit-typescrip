import { runAutomation } from "./automation_loop.js";

const request = [
  "Prepare receipt rcpt-104 for donor Mira Chen: $125.00 donated on 2026-09-30.",
  "Schedule reminder shift-88 for volunteer Luis, whose shift starts at 2026-10-05T09:00:00+08:00.",
  "Report on Autumn Pantry: goal $10,000, raised $7,250, with 184 volunteer hours."
].join(" ");

console.log(JSON.stringify(await runAutomation(request), null, 2));
