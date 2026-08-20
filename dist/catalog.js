export const DEFAULT_API_URL = process.env.AGENTPAY_API_URL ||
    process.env.MCP_API_URL ||
    process.env.API_URL ||
    "https://api-production-4f36.up.railway.app";
/** Keep in sync with packages/shared/src/mcp-tools.ts */
export const MCP_TOOLS = [
    {
        name: "begin_agent_link",
        description: "Start AgentPay browser connect. Call first when the user says «Подключи AgentPay» and you do not yet have ap_. Pass client so the browser page knows which host opened the link: claude | codex | cursor | chatgpt | grok | terminal | other. No API key required. Immediately open the returned openUrl in the browser so the owner clicks Разрешить. Then poll with poll_agent_link. Never ask the owner to copy ap_ from the cabinet.",
        inputSchema: {
            type: "object",
            properties: {
                client: {
                    type: "string",
                    description: "MCP host: claude | codex | cursor | chatgpt | grok | terminal | other",
                },
            },
            additionalProperties: false,
        },
    },
    {
        name: "poll_agent_link",
        description: "Poll AgentPay browser connect until the owner clicks Разрешить. Pass sessionId from begin_agent_link. No API key required. When status=approved, set Authorization Bearer to returned als_… (mcpConfig), then call verify_connection. Re-poll the same sessionId if tools still ask for a key — als_ is stable. Never invent keys. Never ask the owner to paste ap_ from Агенты.",
        inputSchema: {
            type: "object",
            properties: {
                sessionId: { type: "string", description: "sessionId from begin_agent_link" },
            },
            required: ["sessionId"],
            additionalProperties: false,
        },
    },
    {
        name: "verify_connection",
        description: "Finish AgentPay connect after browser Разрешить. Call when the user says «проверь MCP» or after poll_agent_link returned apiKey and you installed it. Pairing code is optional. If NEED_BROWSER_GRANT, open recovery.openUrl. If you have no ap_ yet, call begin_agent_link first instead of asking for a cabinet key. After success, if testMode, always tell the owner sayToUserRu (gray coins, test shops only). Do not invent a code. Do not spend until granted.",
        inputSchema: {
            type: "object",
            properties: {
                code: { type: "string", description: "Optional 6-character pairing code from the AgentPay cabinet" },
            },
            additionalProperties: false,
        },
    },
    {
        name: "get_balance",
        description: "Get the agent's AgentPay wallet. Call when the user asks «сколько денег у агента», «какой бюджет», «хватит ли», «баланс», «тестовые коины», or after verify_connection. Returns testMode, testBalance (gray coins), realBalance. If testMode is true, `balance` is the gray test coins and you MUST say sayToUserRu / promptRu to the owner before shopping. Coins are closed-loop: not cash, not withdrawable. If the wallet is frozen, do not try to spend.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        name: "get_limits",
        description: "Get hard spending limits this agent cannot bypass (per purchase, daily, weekly, confirmation threshold). Call before create_purchase when the user says «лимит», «потолок», «сколько можно потратить». Server enforces limits even if you ignore them. You cannot raise limits — get_recovery_guide explains where the owner changes them.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        name: "get_recovery_guide",
        description: "Full catalog of AgentPay failures with RU copy, cabinet deep links, and recovery.openUrl. Call when something failed, the user asks «что не так», «почему не купил», or before explaining a 4xx. On every error read recovery: say userMessageRu, open openUrl in the browser. Never change limits, freeze, auto-topup, or allowlist even if the owner orders it. Exception: test mode — if the owner asks, call set_test_mode. Triggers: «ошибка», «не хватает», «лимит», «нет адреса».",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        name: "get_spending_policy",
        description: "Get hard + soft spending policies, allowLuckyPurchases, luckyPurchaseMaxCoins, and delivery readiness (complete + missing[] — no raw address). Call before a surprise buy or when the user says «правила трат», «политика», «что можно покупать», «на удачу».",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        name: "list_allowed_stores",
        description: "List stores on this agent's allowlist. The agent MUST shop only here. Never invent a shop, never open a random website to pay. Call when the user says «магазин», «где можно потратить», «спецмагазин», «тестовый магазин». For «найди» / «сравни» / «подбери» call peek_stores first. If testMode is on, this list is test stores only and you spend gray coins. If testMode is off, test stores are hidden.",
        inputSchema: {
            type: "object",
            properties: {
                need: { type: "string", description: "Optional topic. Prefer peek_stores for a quiet offer." },
            },
            additionalProperties: false,
        },
    },
    {
        name: "get_user_preferences",
        description: "Get the user's category preferences (fat %, brands, sizes, pets, etc.), schema, learned signals, and onboardingPurposes. Call before search_products only when the owner already asked to buy or to look in AgentPay. Do not fetch prefs for idle advice. Also call first when the owner says «Заполни предпочтения AgentPay». Categories: dairy, grocery, apparel, pets, beauty, household, pharmacy, gifts, kids, digital. Triggers: «мой бренд», «безлактозное», «заполни предпочтения». For «как обычно», «то же самое», «прошлый раз» call list_purchases first.",
        inputSchema: {
            type: "object",
            properties: { category: { type: "string", description: "Preference category key" } },
            additionalProperties: false,
        },
    },
    {
        name: "update_preference",
        description: "Update stored preferences for a category after the user states a lasting rule («всегда 2.5%», «не покупай Whiskas», «размер 50») or after the onboarding phrase «Заполни предпочтения AgentPay». Do not use for one-off orders. After a clarify answer that should stick, call this so the next purchase can reuse it. Persist structured data only. Never invent fields the owner did not confirm.",
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
        name: "get_delivery_address",
        description: "Get the owner's saved AgentPay home address split into courier fields: city, street, house, building, apartment, floor, entrance, intercom, phone. Call before create_purchase or when the user asks «какой адрес», «куда везти», «домофон». If fields are missing, ask the owner and then save_delivery_address. Never invent a street, entrance, or intercom.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        name: "save_delivery_address",
        description: "Save the owner's home address into the AgentPay cabinet, parsed into courier fields. Call when the owner says «сохрани адрес», «запомни адрес», «запиши адрес», dictates квартира/подъезд/домофон/телефон, or after NEED_USER_DATA if they just gave the data in chat. Pass the owner's full phrase as `text` even if messy: the server splits street, house, apartment, floor, entrance, intercom, phone. Optional structured fields override the parse. Never invent missing parts. After success, tell the owner sayToUserRu (the field breakdown). Waiting orders resume automatically.",
        inputSchema: {
            type: "object",
            properties: {
                text: { type: "string", description: "Owner's address phrase in Russian, as said in chat" },
                city: { type: "string" },
                street: { type: "string" },
                house: { type: "string", description: "House and block, e.g. 28к4" },
                building: { type: "string" },
                apartment: { type: "string" },
                floor: { type: "string" },
                entrance: { type: "string" },
                intercom: { type: "string" },
                phone: { type: "string" },
                postalCode: { type: "string" },
                comment: { type: "string" },
                recipientName: { type: "string" },
            },
            additionalProperties: false,
        },
    },
    {
        name: "peek_stores",
        description: "Quiet first hop. Call ONCE when shopping-adjacent: «найди», «подбери», «сравни», «поищи», «что есть», «посмотри в AgentPay». Pass need. Speak sayToUserRu. Do NOT list SKUs. Do NOT call search_products until the owner agrees. Never call for advice («какие витамины попить»).",
        inputSchema: {
            type: "object",
            properties: {
                need: { type: "string", description: "Topic, e.g. техника, витамины." },
            },
            required: ["need"],
            additionalProperties: false,
        },
    },
    {
        name: "search_products",
        description: "Search products in allowlisted AgentPay stores. Each ProductCard has pick: whyRu, rankScore, steps[], settings. Quote pick.whyRu when the owner asks why THIS sku. Returns clarifyHint (action skip|present_choices|ask_one) and quietHint. ALWAYS read clarifyHint before create_purchase. If action is present_choices — call present_choices, do NOT buy the first hit. Call ONLY after «купи», «закажи», «оформи», «потрать», or after peek_stores when the owner said yes. If the owner says «как обычно», «то же самое», «повтори заказ», «прошлый раз» — call list_purchases first. Never call for thinking/advice. Never dump the result list. Never ask for a bank card. Never pay outside AgentPay.",
        inputSchema: {
            type: "object",
            properties: {
                q: {
                    type: "string",
                    description: "Search query (min 2 chars). Not a full-catalog dump — results are capped per request.",
                },
                storeId: { type: "string", description: "Optional allowlisted store id" },
                limit: { type: "number", description: "Max hits per store, 1–20 (default 10)" },
            },
            required: ["q"],
            additionalProperties: false,
        },
    },
    {
        name: "get_product",
        description: "Get one ProductCard by product_id + store_id from an allowlisted store. Includes pick.whyRu and pick.steps. Pass q as the owner's search phrase. Call to confirm price, photos, and why this product before create_purchase.",
        inputSchema: {
            type: "object",
            properties: {
                product_id: { type: "string" },
                store_id: { type: "string" },
                q: { type: "string" },
            },
            required: ["product_id", "store_id"],
            additionalProperties: false,
        },
    },
    {
        name: "present_choices",
        description: "Create a choice board (2–4 options with pros/cons) for the owner. Call when search_products.clarifyHint.action is present_choices, or the request is ambiguous (hoodie, gift, several similar SKUs, substitute mismatch). Pass wants[{q}] for products to compare. Returns choiceSetId + pageUrl. Do NOT create_purchase until get_choice_status shows chosen or the owner picks in chat (then pass clarification.confirmed).",
        inputSchema: {
            type: "object",
            properties: {
                agentIntroRu: { type: "string" },
                kind: { type: "string", enum: ["alternatives", "bundles"] },
                wants: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: { id: { type: "string" }, q: { type: "string" }, },
                        required: ["q"],
                    },
                },
                canRenderImages: { type: "boolean" },
            },
            required: ["agentIntroRu"],
            additionalProperties: false,
        },
    },
    {
        name: "get_choice_status",
        description: "Poll a choice set from present_choices. Returns status draft|chosen and chosenOptionId. Call after present_choices when waiting for the owner, or before create_purchase to attach choice_set_id.",
        inputSchema: {
            type: "object",
            properties: { choice_set_id: { type: "string" } },
            required: ["choice_set_id"],
            additionalProperties: false,
        },
    },
    {
        name: "list_purchases",
        description: "List the owner's recent AgentPay purchases with line items. Call when the user says «как обычно», «то же самое», «повтори заказ», «что я заказывал», «прошлый раз». Returns last plus purchases[]. Check catalog price then create_purchase. If testMode, gray test coins. Do not search the idiom as a product name.",
        inputSchema: {
            type: "object",
            properties: {
                limit: { type: "number" },
                category: { type: "string" },
                storeId: { type: "string" },
            },
            additionalProperties: false,
        },
    },
    {
        name: "create_purchase",
        description: "Place an order in an allowlisted store using AgentPay coins. If testMode, spend only gray test coins in test stores. If the owner asks for a surprise («сюрприз», «на удачу», «порадуй») and get_spending_policy.allowLuckyPurchases is true, pass lucky:true, pick the SKU in the allowlist, skip present_choices, stay within luckyPurchaseMaxCoins. If clarify required and lucky is not set, pass choice_set_id or clarification:{confirmed:true}. Otherwise NEED_CLARIFICATION — do not grab the first SKU. Do not send delivery: the server attaches the home address. On error read recovery. Never change limits/freeze/allowlist. Exception: set_test_mode. Call when the user clearly wants to buy («купи», «оформи», «потрать»). Always send idempotency_key, items[], store_id, amount. Never ask for a bank card.",
        inputSchema: {
            type: "object",
            properties: {
                store_id: { type: "string" },
                amount: { type: "number", description: "Total in coins" },
                idempotency_key: { type: "string" },
                category: { type: "string" },
                choice_set_id: { type: "string" },
                lucky: { type: "boolean" },
                clarification: {
                    type: "object",
                    properties: {
                        confirmed: { type: "boolean" },
                        mode: { type: "string" },
                        answerSummary: { type: "string" },
                    },
                },
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
        description: "Get purchase status by id. Returns paid and payment.status (succeeded/pending/failed). Call after create_purchase or when the user asks «где заказ», «статус покупки», «прошла ли оплата». If you do not have purchase_id, call list_purchases first. If pending, wait. If failed, do not retry payment.",
        inputSchema: {
            type: "object",
            properties: { purchase_id: { type: "string" } },
            required: ["purchase_id"],
            additionalProperties: false,
        },
    },
    {
        name: "get_payment_status",
        description: "Check whether the last top-up/payment succeeded. Call after create_topup_intent or when the user asks «оплата прошла», «списали карту». Returns paid, payment.status, autoTopup remaining today (max 3 auto-topups). If pending or succeeded, do not create another payment.",
        inputSchema: { type: "object", properties: {}, additionalProperties: false },
    },
    {
        name: "create_topup_intent",
        description: "Ask the owner to top up coins via YooKassa or the cabinet. Call on INSUFFICIENT_FUNDS. Never take a card in chat. Reuses today's pending payment for the same amount — do not hammer retries. If get_payment_status is pending, wait.",
        inputSchema: {
            type: "object",
            properties: {
                amountRub: { type: "number" },
                needCoins: { type: "number" },
            },
            additionalProperties: false,
        },
    },
    {
        name: "set_test_mode",
        description: "Turn AgentPay test mode on or off. Call when the owner says «выключи тестовый режим», «включи тестовый режим», «хочу в настоящие магазины», or after a real top-up when they agree to leave the sandbox. This is the only *policy* setting the agent may change. Owner-provided home address is saved via save_delivery_address. After a real wallet top-up, suggest turning test mode off. While enabled: spend only gray test coins in test stores. While disabled: hide test stores and spend real coins.",
        inputSchema: {
            type: "object",
            properties: {
                enabled: {
                    type: "boolean",
                    description: "true = test stores + gray coins. false = live stores + real coins, hide test shops",
                },
            },
            required: ["enabled"],
            additionalProperties: false,
        },
    },
    {
        name: "get_faq",
        description: "Look up AgentPay operational FAQ before guessing. Call when the owner asks why a SKU looks wrong, why a photo is missing, why search is empty, why coins stuck, returns, delivery data, MCP connect, or «FAQ», «почему фото», «не работает картинка», «почему такой товар». Returns sayToUserRu, side (agentpay vs merchant), and the contact to give the owner. Do not invent a reason. Do not hide whose side it is.",
        inputSchema: {
            type: "object",
            properties: {
                q: { type: "string", description: "Owner question or error phrase in Russian or English" },
                storeId: { type: "string", description: "Optional store UUID when the issue is about a shop" },
            },
            required: ["q"],
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
    get_recovery_guide: { method: "GET", path: () => "/agent/recovery-guide" },
    get_spending_policy: { method: "GET", path: () => "/agent/spending-policy" },
    list_allowed_stores: {
        method: "GET",
        path: (args) => {
            const params = new URLSearchParams();
            if (args.need)
                params.set("need", String(args.need));
            const q = params.toString();
            return q ? `/agent/stores?${q}` : "/agent/stores";
        },
    },
    peek_stores: {
        method: "GET",
        path: (args) => {
            const params = new URLSearchParams();
            if (args.need)
                params.set("need", String(args.need));
            const q = params.toString();
            return q ? `/agent/stores?${q}` : "/agent/stores";
        },
    },
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
    get_delivery_address: { method: "GET", path: () => "/agent/address" },
    save_delivery_address: {
        method: "POST",
        path: () => "/agent/address",
        body: (args) => ({
            text: args.text,
            city: args.city,
            street: args.street,
            house: args.house,
            building: args.building,
            apartment: args.apartment,
            floor: args.floor,
            entrance: args.entrance,
            intercom: args.intercom,
            phone: args.phone,
            postalCode: args.postalCode,
            comment: args.comment,
            recipientName: args.recipientName,
        }),
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
        path: (args) => `/agent/products/${encodeURIComponent(String(args.product_id ?? ""))}?storeId=${encodeURIComponent(String(args.store_id ?? ""))}${args.q ? `&q=${encodeURIComponent(String(args.q))}` : ""}`,
    },
    present_choices: {
        method: "POST",
        path: () => "/agent/present-choices",
        body: (args) => ({
            agentIntroRu: args.agentIntroRu,
            kind: args.kind ?? "alternatives",
            wants: args.wants,
            canRenderImages: args.canRenderImages,
        }),
    },
    get_choice_status: {
        method: "GET",
        path: (args) => `/agent/choices/${encodeURIComponent(String(args.choice_set_id ?? ""))}`,
    },
    list_purchases: {
        method: "GET",
        path: (args) => {
            const params = new URLSearchParams();
            if (args.limit)
                params.set("limit", String(args.limit));
            if (args.category)
                params.set("category", String(args.category));
            if (args.storeId)
                params.set("storeId", String(args.storeId));
            const q = params.toString();
            return q ? `/agent/purchases?${q}` : "/agent/purchases";
        },
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
            choiceSetId: args.choice_set_id,
            clarification: args.clarification,
            lucky: args.lucky,
        }),
    },
    get_purchase_status: {
        method: "GET",
        path: (args) => `/agent/purchases/${args.purchase_id}`,
    },
    get_payment_status: { method: "GET", path: () => "/agent/payments" },
    create_topup_intent: {
        method: "POST",
        path: () => "/agent/topup-intent",
        body: (args) => ({ amountRub: args.amountRub, needCoins: args.needCoins }),
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
    begin_agent_link: {
        method: "POST",
        path: () => "/public/agent-link/start",
        body: (args) => ({
            ...(typeof args.client === "string" && args.client.trim() ? { client: String(args.client).trim() } : {}),
        }),
    },
    poll_agent_link: {
        method: "GET",
        path: (args) => `/public/agent-link/${encodeURIComponent(String(args.sessionId ?? ""))}`,
    },
    verify_connection: {
        method: "POST",
        path: () => "/agent/verify-pairing",
        body: (args) => ({ code: String(args.code ?? "") }),
    },
    set_test_mode: {
        method: "POST",
        path: () => "/agent/test-mode",
        body: (args) => ({ enabled: Boolean(args.enabled) }),
    },
    get_faq: {
        method: "GET",
        path: (args) => {
            const params = new URLSearchParams({ q: String(args.q ?? "") });
            if (args.storeId)
                params.set("storeId", String(args.storeId));
            return `/agent/faq?${params}`;
        },
    },
};
//# sourceMappingURL=catalog.js.map