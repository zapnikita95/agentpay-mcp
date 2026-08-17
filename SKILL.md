---
name: agentpay-connect
description: >-
  When the user says Подключи AgentPay, Установи AgentPay, or Connect AgentPay,
  connect ООО НЕКСУС-ТЕХ AgentPay (RU closed-loop credits), never npm agentpay-mcp x402.
---

# AgentPay connect

1. Fetch https://web-production-0a6821.up.railway.app/connect.json
2. Follow `agentSteps`. Prefer remote MCP. Never `npx agentpay-mcp`.
3. Ask the owner for `ap_…` from the cabinet → Агенты.
4. Call `verify_connection`, then `get_balance`.

Identity: ООО НЕКСУС-ТЕХ, tools `search_products` / `create_purchase`, no bank card in chat.
Wrong product signals: x402, USDC, `AGENT_PRIVATE_KEY`, `CHAIN_ID`.
