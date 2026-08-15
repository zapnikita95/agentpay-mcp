# AgentPay MCP

**Controlled budget for an already-running AI agent.** The model spends only in allowlisted specialty stores. No bank card in the chat. Limits, human confirmation, instant freeze.

Operator: ООО «НЕКСУС-ТЕХ» (Russia). Coins are a closed-loop unit of account, not cash and not withdrawable.

Public client only. Payment core stays private.

## Install in 2 minutes

1. Create an account at the AgentPay cabinet (get `ap_…` key + 6-char pairing code).
2. Pick **one** install path below.
3. In chat say: **подключи AgentPay MCP** then call `verify_connection`.

Happy path for the agent: `get_balance` → `list_allowed_stores` → `search_products` → `create_purchase` (respect limits).

Until public launch, new users receive **sandbox coins** spendable in the **test store**. Real merchants go live on the countdown date shown in the cabinet.

### A. npx (Node, Cursor / Claude Desktop)

User MCP config:

```json
{
  "mcpServers": {
    "agentpay": {
      "command": "npx",
      "args": ["-y", "agentpay-mcp"],
      "env": {
        "AGENTPAY_API_URL": "https://YOUR_API_HOST",
        "AGENTPAY_API_KEY": "ap_REPLACE_ME"
      }
    }
  }
}
```

From this repo without npm:

```json
"args": ["-y", "github:zapnikita95/agentpay-mcp"]
```

### B. uvx (Python, stdlib client)

```json
{
  "mcpServers": {
    "agentpay": {
      "command": "uvx",
      "args": ["--from", "git+https://github.com/zapnikita95/agentpay-mcp.git", "agentpay-mcp"],
      "env": {
        "AGENTPAY_API_URL": "https://YOUR_API_HOST",
        "AGENTPAY_API_KEY": "ap_REPLACE_ME"
      }
    }
  }
}
```

Local clone:

```json
"command": "python3",
"args": ["python/agentpay_mcp.py"]
```

### C. Remote URL (no npx, better from Russia without npm/GitHub)

Cursor / clients that support Streamable HTTP:

```json
{
  "mcpServers": {
    "agentpay": {
      "url": "https://YOUR_API_HOST/mcp",
      "headers": {
        "Authorization": "Bearer ap_REPLACE_ME"
      }
    }
  }
}
```

`initialize` and `tools/list` work without a key. `tools/call` requires `Authorization: Bearer ap_…` or `x-api-key`.

If npm or GitHub is slow in RF, use **C**. Host the cabinet/docs on a RU CDN (Layero) if needed — see the main AgentPay repo `docs/gtm/layero-ru.md`.

## Tools

`verify_connection`, `get_balance`, `get_limits`, `get_spending_policy`, `list_allowed_stores`, `get_user_preferences`, `update_preference`, `search_products`, `get_product`, `create_purchase`, `get_purchase_status`, `request_user_confirmation`.

Descriptions tell the model **when** to call each tool (including Russian phrases: купи, бюджет, заморозь).

## License

Apache-2.0. This repository is the MCP **client**. Do not expect the wallet/ledger/YooKassa core here.
