#!/usr/bin/env python3
"""Stdlib MCP stdio client for AgentPay. Used via uvx or python3 python/agentpay_mcp.py"""
from __future__ import annotations

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

API_URL = os.environ.get("AGENTPAY_API_URL") or os.environ.get("MCP_API_URL") or "https://api-production-4f36.up.railway.app"
API_KEY = os.environ.get("AGENTPAY_API_KEY") or ""

TOOLS = [
    {
        "name": "verify_connection",
        "description": "Pair AgentPay MCP with the cabinet. User says «подключи AgentPay MCP». Pass the 6-char code. Do not invent a code.",
        "inputSchema": {
            "type": "object",
            "properties": {"code": {"type": "string"}},
            "required": ["code"],
        },
    },
    {
        "name": "get_balance",
        "description": "Wallet. Call for «бюджет», «баланс», «хватит ли», «тестовые коины». If testMode, say sayToUserRu. Coins are not cash.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_limits",
        "description": "Hard limits the agent cannot bypass. Call for «лимит», «потолок». You cannot raise them — get_recovery_guide has the cabinet link.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_recovery_guide",
        "description": "Catalog of failures with RU copy and openUrl. Call on errors. Say userMessageRu, open the link. Never change limits/freeze except set_test_mode. Triggers: «ошибка», «не хватает», «лимит», «нет адреса».",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "get_spending_policy",
        "description": "Hard + soft spending policies, allowLuckyPurchases, luckyPurchaseMaxCoins, delivery.complete/missing. Call for «правила трат», «на удачу». Do not send delivery on create_purchase.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "list_allowed_stores",
        "description": "Allowlisted stores. Call for «магазин», «где можно потратить». For «найди»/«сравни» call peek_stores first.",
        "inputSchema": {
            "type": "object",
            "properties": {"need": {"type": "string"}},
        },
    },
    {
        "name": "peek_stores",
        "description": "Quiet first hop. Call once for «найди», «подбери», «сравни», «поищи». Pass need. Speak sayToUserRu. Do not list SKUs. Do not search until the owner agrees. Never call for advice («какие витамины попить»).",
        "inputSchema": {
            "type": "object",
            "properties": {"need": {"type": "string"}},
            "required": ["need"],
        },
    },
    {
        "name": "get_user_preferences",
        "description": "User preferences, schema, onboardingPurposes. Call before search or when owner says «Заполни предпочтения AgentPay». If you know lasting facts, propose them; if nothing known, say so and ask free-form.",
        "inputSchema": {
            "type": "object",
            "properties": {"category": {"type": "string"}},
        },
    },
    {
        "name": "update_preference",
        "description": "Persist a lasting preference («всегда 2.5%» or after «Заполни предпочтения AgentPay»). Never invent unconfirmed fields.",
        "inputSchema": {
            "type": "object",
            "properties": {"category": {"type": "string"}, "data": {"type": "object"}},
            "required": ["category", "data"],
        },
    },
    {
        "name": "search_products",
        "description": "Search allowlisted stores. Call only after «купи», «закажи», «оформи», or after peek_stores when the owner said yes. Never for advice. Max two names in chat. Never ask for a bank card.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "q": {"type": "string"},
                "storeId": {"type": "string"},
                "limit": {"type": "number"},
            },
            "required": ["q"],
        },
    },
    {
        "name": "get_product",
        "description": "One ProductCard by product_id and store_id. Includes pick.whyRu. Pass q as the owner's search phrase.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "product_id": {"type": "string"},
                "store_id": {"type": "string"},
                "q": {"type": "string"},
            },
            "required": ["product_id", "store_id"],
        },
    },
    {
        "name": "get_delivery_address",
        "description": "Saved home address split into courier fields. Call for «какой адрес», «куда везти», «домофон». Never invent street, entrance, or intercom. If fields missing, ask then save_delivery_address.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "save_delivery_address",
        "description": "Save the owner's home address. Call for «сохрани адрес», «запомни адрес», or after NEED_USER_DATA if they dictated it in chat. Pass the full phrase as text. Waiting orders resume automatically.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "text": {"type": "string"},
                "city": {"type": "string"},
                "street": {"type": "string"},
                "house": {"type": "string"},
                "building": {"type": "string"},
                "apartment": {"type": "string"},
                "floor": {"type": "string"},
                "entrance": {"type": "string"},
                "intercom": {"type": "string"},
                "phone": {"type": "string"},
                "postalCode": {"type": "string"},
                "comment": {"type": "string"},
                "recipientName": {"type": "string"},
            },
        },
    },
    {
        "name": "list_purchases",
        "description": "Owner purchase history with line items. Call for «как обычно», «то же самое», «повтори заказ», «прошлый раз», «что я заказывал». Then check catalog price and create_purchase. Test mode uses gray coins.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "limit": {"type": "number"},
                "category": {"type": "string"},
                "storeId": {"type": "string"},
            },
        },
    },
    {
        "name": "create_purchase",
        "description": "Buy with AgentPay coins in an allowlisted store. Call for «купи», «оформи», «потрать», «сюрприз», «на удачу». Send idempotency_key. Do not send delivery: server attaches the home address. lucky:true skips present_choices within luckyPurchaseMaxCoins. Never put a card in chat.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "store_id": {"type": "string"},
                "amount": {"type": "number"},
                "idempotency_key": {"type": "string"},
                "category": {"type": "string"},
                "lucky": {"type": "boolean", "description": "true = surprise buy; skip present_choices"},
                "items": {"type": "array"},
                "explanation": {"type": "object"},
            },
            "required": ["store_id", "amount", "idempotency_key", "items"],
        },
    },
    {
        "name": "get_purchase_status",
        "description": "Purchase status. Returns paid and payment.status. Call for «где заказ», «прошла ли оплата». Without purchase_id call list_purchases. Do not retry if pending/failed.",
        "inputSchema": {
            "type": "object",
            "properties": {"purchase_id": {"type": "string"}},
            "required": ["purchase_id"],
        },
    },
    {
        "name": "set_test_mode",
        "description": "Turn test mode on or off. Call when the owner says «выключи тестовый режим», «включи тестовый режим», «хочу в настоящие магазины». After a real top-up, suggest turning it off. This is the only setting the agent may change. Test mode: gray coins and test shops only.",
        "inputSchema": {
            "type": "object",
            "properties": {"enabled": {"type": "boolean"}},
            "required": ["enabled"],
        },
    },
    {
        "name": "get_faq",
        "description": "Look up FAQ before guessing. Call for «почему фото», «не работает картинка», «почему такой товар», «FAQ», empty search, stuck coins, returns. Returns sayToUserRu, side agentpay or merchant, and the contact. Do not invent a reason.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "q": {"type": "string"},
                "storeId": {"type": "string"},
            },
            "required": ["q"],
        },
    },
    {
        "name": "request_user_confirmation",
        "description": "HITL confirm in AgentPay / Telegram. Chat 'ok' is not payment approval.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "message": {"type": "string"},
                "purchase_id": {"type": "string"},
                "amount": {"type": "number"},
            },
            "required": ["message"],
        },
    },
    {
        "name": "get_payment_status",
        "description": "Whether the last payment/top-up succeeded. Call for «оплата прошла». If pending, do not create another payment. Auto-topup max 3/day.",
        "inputSchema": {"type": "object", "properties": {}},
    },
    {
        "name": "create_topup_intent",
        "description": "Ask the owner to top up coins. Never take a card in chat. Reuses today's pending payment — do not hammer retries.",
        "inputSchema": {
            "type": "object",
            "properties": {
                "amountRub": {"type": "number"},
                "needCoins": {"type": "number"},
            },
        },
    },
]


def _http(method: str, path: str, body: dict | None = None) -> dict:
    url = API_URL.rstrip("/") + path
    data = None if body is None else json.dumps(body).encode()
    req = urllib.request.Request(
        url,
        data=data,
        method=method,
        headers={"content-type": "application/json", "x-api-key": API_KEY},
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as res:
            raw = res.read().decode()
            return json.loads(raw) if raw else {}
    except urllib.error.HTTPError as e:
        raw = e.read().decode()
        try:
            parsed = json.loads(raw)
            raise RuntimeError(json.dumps(parsed, ensure_ascii=False))
        except json.JSONDecodeError:
            raise RuntimeError(raw or str(e)) from e


def call_tool(name: str, args: dict) -> dict:
    if name == "get_balance":
        return _http("GET", "/agent/balance")
    if name == "get_limits":
        return _http("GET", "/agent/limits")
    if name == "get_recovery_guide":
        return _http("GET", "/agent/recovery-guide")
    if name == "get_spending_policy":
        return _http("GET", "/agent/spending-policy")
    if name == "list_allowed_stores" or name == "peek_stores":
        params = {}
        if args.get("need"):
            params["need"] = str(args["need"])
        qs = urllib.parse.urlencode(params)
        return _http("GET", "/agent/stores" + (f"?{qs}" if qs else ""))
    if name == "get_user_preferences":
        q = urllib.parse.urlencode({"category": args["category"]}) if args.get("category") else ""
        return _http("GET", "/agent/preferences" + (f"?{q}" if q else ""))
    if name == "update_preference":
        return _http("POST", "/agent/preferences", {"category": args.get("category"), "data": args.get("data")})
    if name == "search_products":
        params = {"q": str(args.get("q") or "")}
        if args.get("storeId"):
            params["storeId"] = str(args["storeId"])
        if args.get("limit") is not None:
            params["limit"] = str(args["limit"])
        return _http("GET", "/agent/products/search?" + urllib.parse.urlencode(params))
    if name == "get_product":
        pid = urllib.parse.quote(str(args.get("product_id") or ""), safe="")
        params = {"storeId": str(args.get("store_id") or "")}
        if args.get("q"):
            params["q"] = str(args["q"])
        return _http("GET", f"/agent/products/{pid}?" + urllib.parse.urlencode(params))
    if name == "get_delivery_address":
        return _http("GET", "/agent/address")
    if name == "save_delivery_address":
        return _http(
            "POST",
            "/agent/address",
            {
                "text": args.get("text"),
                "city": args.get("city"),
                "street": args.get("street"),
                "house": args.get("house"),
                "building": args.get("building"),
                "apartment": args.get("apartment"),
                "floor": args.get("floor"),
                "entrance": args.get("entrance"),
                "intercom": args.get("intercom"),
                "phone": args.get("phone"),
                "postalCode": args.get("postalCode"),
                "comment": args.get("comment"),
                "recipientName": args.get("recipientName"),
            },
        )
    if name == "list_purchases":
        params = {}
        if args.get("limit") is not None:
            params["limit"] = str(args["limit"])
        if args.get("category"):
            params["category"] = str(args["category"])
        if args.get("storeId"):
            params["storeId"] = str(args["storeId"])
        q = urllib.parse.urlencode(params)
        return _http("GET", "/agent/purchases" + (f"?{q}" if q else ""))
    if name == "create_purchase":
        return _http(
            "POST",
            "/agent/purchases",
            {
                "storeId": args.get("store_id"),
                "amount": args.get("amount"),
                "idempotencyKey": args.get("idempotency_key"),
                "category": args.get("category"),
                "items": args.get("items"),
                "explanation": args.get("explanation"),
                "choiceSetId": args.get("choice_set_id"),
                "clarification": args.get("clarification"),
                "lucky": args.get("lucky"),
            },
        )
    if name == "get_purchase_status":
        return _http("GET", f"/agent/purchases/{args.get('purchase_id')}")
    if name == "get_payment_status":
        return _http("GET", "/agent/payments")
    if name == "create_topup_intent":
        body = {}
        if args.get("amountRub") is not None:
            body["amountRub"] = args.get("amountRub")
        if args.get("needCoins") is not None:
            body["needCoins"] = args.get("needCoins")
        return _http("POST", "/agent/topup-intent", body)
    if name == "request_user_confirmation":
        return _http(
            "POST",
            "/agent/confirmations/request",
            {
                "message": args.get("message"),
                "purchaseId": args.get("purchase_id"),
                "amount": args.get("amount"),
            },
        )
    if name == "verify_connection":
        return _http("POST", "/agent/verify-pairing", {"code": str(args.get("code") or "")})
    if name == "set_test_mode":
        return _http("POST", "/agent/test-mode", {"enabled": bool(args.get("enabled"))})
    if name == "get_faq":
        params = {"q": str(args.get("q") or "")}
        if args.get("storeId"):
            params["storeId"] = str(args["storeId"])
        return _http("GET", "/agent/faq?" + urllib.parse.urlencode(params))
    raise RuntimeError(f"Unknown tool: {name}")


def respond(msg_id, result=None, error=None) -> None:
    payload: dict = {"jsonrpc": "2.0", "id": msg_id}
    if error is not None:
        payload["error"] = error
    else:
        payload["result"] = result
    sys.stdout.write(json.dumps(payload, ensure_ascii=False) + "\n")
    sys.stdout.flush()


def main() -> None:
    if not API_KEY:
        sys.stderr.write("AGENTPAY_API_KEY is required\n")
    for line in sys.stdin:
        line = line.strip()
        if not line:
            continue
        msg = json.loads(line)
        method = msg.get("method")
        msg_id = msg.get("id")
        if method == "initialize":
            respond(
                msg_id,
                {
                    "protocolVersion": msg.get("params", {}).get("protocolVersion") or "2025-11-25",
                    "capabilities": {"tools": {}},
                    "serverInfo": {"name": "agentpay", "version": "0.2.0"},
                },
            )
            continue
        if method == "notifications/initialized" or msg_id is None:
            continue
        if method == "ping":
            respond(msg_id, {})
            continue
        if method == "tools/list":
            respond(msg_id, {"tools": TOOLS})
            continue
        if method == "tools/call":
            params = msg.get("params") or {}
            try:
                data = call_tool(params.get("name"), params.get("arguments") or {})
                respond(
                    msg_id,
                    {"content": [{"type": "text", "text": json.dumps(data, ensure_ascii=False, indent=2)}]},
                )
            except Exception as e:  # noqa: BLE001
                respond(
                    msg_id,
                    {
                        "content": [{"type": "text", "text": str(e)}],
                        "isError": True,
                    },
                )
            continue
        respond(msg_id, error={"code": -32601, "message": f"Unknown method {method}"})


if __name__ == "__main__":
    main()
