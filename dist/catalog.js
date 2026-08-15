export const DEFAULT_API_URL = process.env.AGENTPAY_API_URL || process.env.MCP_API_URL || process.env.API_URL || "https://api-production-4f36.up.railway.app";
export const MCP_TOOLS = [
    {
        name: "verify_connection",
        description: "Pair AgentPay MCP with the user's cabinet. Call when the user says «подключи AgentPay MCP», «проверь MCP», or pastes a 6-character pairing code. Pass the code from AgentPay → Агенты → код проверки. Returns ok + coin balance if codes match. Do not invent a code.",
        inputSchema: {
            type: "object",
            properties: {
                code: { type: "string", description: "6-character pairing code from the AgentPay cabinet" },
            },
            required: ["code"],
            additionalProperties: false,
        },
    },
    {
        name: "get_balance",
        description: "Get the agent's AgentPay wallet balance in coins (коины). Call when the user asks «сколько денег у агента», «какой бюджет», «хватит ли», «баланс», or before any purchase. Coins are closed-loop: not cash, not withdrawable. If the wallet is frozen, do not try to spend.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        name: "get_limits",
        description: "Get hard spending limits this agent cannot bypass (per purchase, daily, weekly, confirmation threshold). Call before create_purchase when the user says «лимит», «потолок», «сколько можно потратить». Server enforces limits even if you ignore them.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        name: "get_spending_policy",
        description: "Get hard + soft spending policies: allowlist rules, forbidden categories, confirmation mode, preference weights. Call when planning a buy or the user says «правила трат», «политика», «что можно покупать».",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        name: "list_allowed_stores",
        description: "List stores on this agent's allowlist. The agent MUST shop only here — never invent a shop, never open a random website to pay. Call when the user says «купи», «магазин», «где можно потратить», «спецмагазин». Sandbox/test store is for demo coins until public launch.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        name: "get_user_preferences",
        description: "Get the user's category preferences (fat %, brands, sizes, pets, etc.). Call before search_products when buying groceries, dairy, apparel, pets. Categories: dairy, grocery, apparel, pets, beauty, household, pharmacy, gifts, kids, digital. Triggers: «как обычно», «мой бренд», «безлактозное».",
        inputSchema: {
            type: "object",
            properties: { category: { type: "string", description: "Preference category key" } },
            additionalProperties: false,
        },
    },
    {
        name: "update_preference",
        description: "Update stored preferences for a category after the user states a lasting rule («всегда 2.5%», «не покупай Whiskas»). Do not use for one-off orders. Persist structured data the next purchase can reuse.",
        inputSchema: {
            type: "object",
            properties: {
                category: { type: "string" },
                data: { type: "object", additionalProperties: true },
            },
            required: ["category", "data"],
            additionalProperties: false,
        },
    },
    {
        name: "search_products",
        description: "Search products in allowlisted AgentPay stores. Returns ProductCard (id, title, price in store currency, imageUrls, stock, rating). Call when the user says «купи», «найди», «закажи», «что есть». Prefer this over web search or asking for a bank card. Filter by storeId when the user named a store. Never pay outside AgentPay.",
        inputSchema: {
            type: "object",
            properties: {
                q: { type: "string", description: "Search query, Russian or English" },
                storeId: { type: "string", description: "Optional allowlisted store id" },
                limit: { type: "number" },
            },
            required: ["q"],
            additionalProperties: false,
        },
    },
    {
        name: "get_product",
        description: "Get one ProductCard by product_id + store_id from an allowlisted store. Call to confirm price, photos, and attributes before create_purchase.",
        inputSchema: {
            type: "object",
            properties: {
                product_id: { type: "string" },
                store_id: { type: "string" },
            },
            required: ["product_id", "store_id"],
            additionalProperties: false,
        },
    },
    {
        name: "create_purchase",
        description: "Place an order in an allowlisted store using AgentPay coins. Server enforces allowlist, limits, HITL confirmation, and freeze. Call when the user clearly wants to buy («купи», «оформи», «потрать»). Always send idempotency_key (unique per attempt), items[], store_id, amount, and explanation.summary. Never ask the user to paste a bank card into chat. If confirmation is required, tell the user to approve in AgentPay / Telegram.",
        inputSchema: {
            type: "object",
            properties: {
                store_id: { type: "string" },
                amount: { type: "number", description: "Total in coins" },
                idempotency_key: { type: "string" },
                category: { type: "string" },
                items: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            sku: { type: "string" },
                            name: { type: "string" },
                            quantity: { type: "number" },
                            unitPrice: { type: "number" },
                            category: { type: "string" },
                            attributes: { type: "object" },
                        },
                        required: ["name", "quantity", "unitPrice"],
                    },
                },
                explanation: {
                    type: "object",
                    properties: {
                        summary: { type: "string" },
                        preferencesUsed: { type: "array", items: { type: "string" } },
                        policiesUsed: { type: "array", items: { type: "string" } },
                        reasonChosen: { type: "string" },
                    },
                    required: ["summary"],
                },
            },
            required: ["store_id", "amount", "idempotency_key", "items"],
            additionalProperties: false,
        },
    },
    {
        name: "get_purchase_status",
        description: "Get purchase status by id (pending confirmation, submitted, fulfilled, rejected). Call after create_purchase or when the user asks «где заказ», «статус покупки».",
        inputSchema: {
            type: "object",
            properties: { purchase_id: { type: "string" } },
            required: ["purchase_id"],
            additionalProperties: false,
        },
    },
    {
        name: "request_user_confirmation",
        description: "Ask the human to confirm in AgentPay web or Telegram. Call when the user must approve a spend, freeze, or missing delivery data. Triggers: «спроси меня», «подтверди», HITL. Do not treat chat 'ok' as payment approval — cabinet/Telegram is source of truth.",
        inputSchema: {
            type: "object",
            properties: {
                message: { type: "string" },
                purchase_id: { type: "string" },
                amount: { type: "number" },
            },
            required: ["message"],
            additionalProperties: false,
        },
    },
];
export const MCP_TOOL_HTTP = {
    get_balance: { method: "GET", path: () => "/agent/balance" },
    get_limits: { method: "GET", path: () => "/agent/limits" },
    get_spending_policy: { method: "GET", path: () => "/agent/spending-policy" },
    list_allowed_stores: { method: "GET", path: () => "/agent/stores" },
    get_user_preferences: {
        method: "GET",
        path: (args) => args.category
            ? `/agent/preferences?category=${encodeURIComponent(String(args.category))}`
            : "/agent/preferences",
    },
    update_preference: {
        method: "POST",
        path: () => "/agent/preferences",
        body: (args) => ({ category: args.category, data: args.data }),
    },
    search_products: {
        method: "GET",
        path: (args) => {
            const params = new URLSearchParams({ q: String(args.q ?? "") });
            if (args.storeId)
                params.set("storeId", String(args.storeId));
            if (args.limit)
                params.set("limit", String(args.limit));
            return `/agent/products/search?${params}`;
        },
    },
    get_product: {
        method: "GET",
        path: (args) => `/agent/products/${encodeURIComponent(String(args.product_id ?? ""))}?storeId=${encodeURIComponent(String(args.store_id ?? ""))}`,
    },
    create_purchase: {
        method: "POST",
        path: () => "/agent/purchases",
        body: (args) => ({
            storeId: args.store_id,
            amount: args.amount,
            idempotencyKey: args.idempotency_key,
            category: args.category,
            items: args.items,
            explanation: args.explanation,
        }),
    },
    get_purchase_status: {
        method: "GET",
        path: (args) => `/agent/purchases/${args.purchase_id}`,
    },
    request_user_confirmation: {
        method: "POST",
        path: () => "/agent/confirmations/request",
        body: (args) => ({
            message: args.message,
            purchaseId: args.purchase_id,
            amount: args.amount,
        }),
    },
    verify_connection: {
        method: "POST",
        path: () => "/agent/verify-pairing",
        body: (args) => ({ code: String(args.code ?? "") }),
    },
};
//# sourceMappingURL=catalog.js.map