import assert from "node:assert/strict";
import test from "node:test";
import { MCP_TOOLS, MCP_TOOL_HTTP } from "./catalog.js";

test("every tool has a when-to-call description", () => {
  for (const t of MCP_TOOLS) {
    assert.ok(t.description.length > 80, t.name);
    assert.ok(MCP_TOOL_HTTP[t.name], t.name);
  }
});

test("buy/budget RU triggers exist on spend tools", () => {
  const blob = MCP_TOOLS.map((t) => t.description).join("\n");
  for (const w of ["купи", "бюджет", "лимит", "тестовый", "почему фото", "сохрани адрес", "peek_stores", "прошлый раз"]) {
    assert.ok(blob.includes(w), w);
  }
  assert.ok(MCP_TOOLS.some((t) => t.name === "list_purchases"));
  const search = MCP_TOOLS.find((t) => t.name === "search_products");
  assert.ok(search && !search.description.includes("«найди»"));
});
