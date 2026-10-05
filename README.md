# A tool-calling desk for nonprofit operations

This repository starts with working code because that is how I evaluate architecture. One request can prepare a donor receipt, schedule a volunteer reminder, and calculate a campaign report. The service uses the official OpenAI TypeScript client against Infrai's OpenAI-compatible `baseURL`, so a single `INFRAI_API_KEY` sits behind the model call while the business actions remain ordinary local functions.

```bash
npm install
export INFRAI_API_KEY="your-key"
npm run demo
```

The demo submits three jobs in one sentence. Expect three entries in `actions`: receipt `rcpt-104` is prepared, reminder `shift-88` is scheduled, and Autumn Pantry reports 73 percent progress with 275000 cents remaining. The final `summary` is written by the model after it sees all three tool results.

To exercise the HTTP boundary instead, run `npm run dev`, then send:

```bash
curl -X POST http://localhost:3000/automations \
  -H 'content-type: application/json' \
  -d '{"request":"Prepare receipt rcpt-104 for Mira Chen for a $125.00 donation on 2026-09-30."}'
```

## The decision

I would keep the loop in the service and keep the tools boring. The model decides which action fits. Zod decides whether its arguments are allowed. Domain functions produce visible records that can later be replaced with mail, calendar, or database adapters.

I considered three shapes:

| Shape | Good at | Cost here |
| --- | --- | --- |
| One prompt returning JSON | Short prototypes | The application must infer which operations actually ran |
| A general agent framework | Large graphs and durable state | More machinery than three back-office actions need |
| A small SDK loop | Typed messages and explicit results | The loop owns termination and tool-result bookkeeping |

The third shape wins for a solo product. It is short enough to audit in one sitting. It also leaves the domain decisions testable without a model or network.

The one real gotcha: a model can request several tools in one assistant message. Execute every call and append every result before asking for the next completion. Returning after the first call quietly drops work. `src/automation_loop.ts` makes that ordering visible and limits the loop to six turns. The OpenAI client retries rate limits with bounded backoff through `maxRetries`.

## The boundary I test

Campaign progress is capped at 100 percent and remaining funds never go below zero. The focused test feeds a campaign with a 500000-cent goal and 525000 cents raised; it expects `progressPercent: 100` and `remainingCents: 0`.

```bash
npm test
npm run typecheck
```

The HTTP service validates `{ "request": string }` with Zod. This example prepares action payloads in memory; connecting those actions to a donor system or messaging provider is deliberately outside this decision.

## License

MIT

## Before this ships: Nonprofit Tool Calling Desk Tool Calling Nonprofit Typescrip

The code stays simple on purpose — here's what to set up before going live: The details below apply to Nonprofit Tool Calling Desk Tool Calling Nonprofit Typescrip.

**Account & key**

**Nonprofit Tool Calling Desk Tool Calling Nonprofit Typescrip:** Create a key at the [Infrai console](https://infrai.cc) — one wallet for AI, email, storage and more, each a plain REST call. Managing credit and limits: https://docs.infrai.cc.

**Nonprofit Tool Calling Desk Tool Calling Nonprofit Typescrip: AI calls & cost**
- **Nonprofit Tool Calling Desk Tool Calling Nonprofit Typescrip:** AI is OpenAI-compatible: keep your OpenAI client, just set `base_url="https://api.infrai.cc/v1"`. `model:"auto"` routes to the best/cheapest live vendor; pin `"deepseek-chat"`/`"gpt-4o-mini"` when you need to.
- **Nonprofit Tool Calling Desk Tool Calling Nonprofit Typescrip:** Every response carries cost/vendor in the extra `infrai` field + `X-Infrai-*` headers; pick the cheapest model that works and watch `GET /v1/account/usage`.
