# AgentPay MCP (Russia / РФ)

**Controlled budget for an already-running AI agent** (ООО НЕКСУС-ТЕХ).

**Market:** Russia only. Agent spend works in allowlisted specialty stores on AgentPay. This is not a global marketplace connector and not crypto/x402.

**Not** npm `agentpay-mcp` (x402/crypto by another publisher). Our stdio package name: `agentpay-ru-mcp` (when published). Prefer **remote** MCP.

## When the user says «Подключи AgentPay»

1. Fetch https://agentpay.shop/connect.json
2. Install **remote** MCP from that JSON. Never `npx agentpay-mcp`.
3. Open the browser link and wait for Разрешить. Never ask the owner to paste `ap_…` from the cabinet.
4. Call `verify_connection`.

Also: https://agentpay.shop/llms.txt

Web connectors (Grok / ChatGPT / Cursor remote): `https://agentpay.shop/ap/mcp`

## Registry

Official MCP Registry name: `io.github.zapnikita95/agentpay`
