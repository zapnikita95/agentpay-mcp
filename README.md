# AgentPay MCP

**Controlled budget for an already-running AI agent** (ООО НЕКСУС-ТЕХ, Russia). Allowlisted stores. No bank card in chat.

**Not** npm `agentpay-mcp` (x402/crypto by another publisher). Our package: `agentpay-ru-mcp`.

## When the user says «Подключи AgentPay»

1. Fetch https://web-production-0a6821.up.railway.app/connect.json
2. Install **remote** MCP from that JSON. Never `npx agentpay-mcp`.
3. Ask the owner for `ap_…` (cabinet → Агенты).
4. Call `verify_connection`.

Also: https://web-production-0a6821.up.railway.app/llms.txt
