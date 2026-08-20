#!/usr/bin/env node
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { CallToolRequestSchema, ListToolsRequestSchema } from "@modelcontextprotocol/sdk/types.js";
import { DEFAULT_API_URL, MCP_TOOLS, MCP_TOOL_HTTP } from "./catalog.js";

const API_URL = DEFAULT_API_URL.replace(/\/$/, "");
const API_KEY = process.env.AGENTPAY_API_KEY || "";

if (!API_KEY) {
  console.error("AGENTPAY_API_KEY is required (agent key from AgentPay cabinet, starts with ap_)");
}

async function api(pathname: string, init?: RequestInit) {
  const res = await fetch(`${API_URL}${pathname}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      "x-api-key": API_KEY,
      ...(init?.headers ?? {}),
    },
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      typeof data === "object" && data && "error" in data
        ? String((data as { error: string }).error)
        : res.statusText;
    throw new Error(msg);
  }
  return data;
}

const server = new Server({ name: "agentpay", version: "0.2.2" }, { capabilities: { tools: {} } });

server.setRequestHandler(ListToolsRequestSchema, async () => ({
  tools: MCP_TOOLS.map((t) => ({
    name: t.name,
    description: t.description,
    inputSchema: t.inputSchema,
  })),
}));

server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const name = request.params.name;
  const args = (request.params.arguments ?? {}) as Record<string, unknown>;
  const spec = MCP_TOOL_HTTP[name];
  if (!spec) {
    return {
      isError: true,
      content: [{ type: "text", text: `Unknown tool: ${name}` }],
    };
  }
  try {
    const result = await api(spec.path(args), {
      method: spec.method,
      body: spec.body ? JSON.stringify(spec.body(args)) : undefined,
    });
    return { content: [{ type: "text", text: JSON.stringify(result, null, 2) }] };
  } catch (e) {
    return {
      isError: true,
      content: [{ type: "text", text: e instanceof Error ? e.message : String(e) }],
    };
  }
});

const transport = new StdioServerTransport();
await server.connect(transport);
