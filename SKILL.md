---
name: agentpay-connect
description: >-
  When the user says Подключи AgentPay, Установи AgentPay, or Connect AgentPay,
  connect ООО НЕКСУС-ТЕХ AgentPay (RU closed-loop credits), never npm agentpay-mcp x402.
---

# AgentPay connect

1. Fetch https://agentpay.shop/connect.json
2. Follow `agentSteps`. Prefer remote MCP. Never `npx agentpay-mcp`.
3. Open the returned `openUrl`, wait for Разрешить. Never ask the owner to paste `ap_…` from Агенты.
4. Call `verify_connection`, then `get_balance`.

Identity: ООО НЕКСУС-ТЕХ, tools `peek_stores` / `search_products` / `list_purchases` / `create_purchase`, no bank card in chat.
Wrong product signals: x402, USDC, `AGENT_PRIVATE_KEY`, `CHAIN_ID`.

## Не давить товаром

Размышление («какие витамины попить») — ответ в чате, без AgentPay.
«Найди / сравни / подбери / поищи» — один раз `peek_stores(need=…)`, скажите `sayToUserRu`, ждите. Каталог не вываливайте.
`search_products` только после «купи», «оформи», «открой ассортимент» или явного согласия смотреть в AgentPay. В чат максимум два названия.

«Как обычно» / «то же самое» / «прошлый раз» — `list_purchases`, затем цена в каталоге, затем `create_purchase`. В тестовом режиме серые коины.

## Спортпит

Перед покупкой протеина / креатина / «запас на неделю»: `get_user_preferences(category=sport)`.
Считайте КБЖУ сами (BMR Mifflin–St Jeor → TDEE → goal). Смотрите `sportCalcHintRu` в ответе.
Согласие хозяина на sport prefs обязательно (кабинет). Это подбор товаров, не медсовет.
`present_choices` перед `create_purchase`. Attributes: `proteinPer100g`, `servingSizeG`, `sportForm`.

## Sport nutrition

Before buying protein / creatine / «запас на неделю»: `get_user_preferences(category=sport)`.
Calculate KBJU yourself from goal/weight/activity or dailyCalories/macros. Server stores prefs only.
Use product attributes `proteinPer100g`, `servingSizeG`, `netWeightG`, `sportForm`. Then `present_choices`.
Not medical advice. Owner must accept sport prefs consent in the cabinet first.
