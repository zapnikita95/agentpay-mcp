export declare const DEFAULT_API_URL: string;
export type McpToolDef = {
    name: string;
    description: string;
    inputSchema: Record<string, unknown>;
};
/** Keep in sync with packages/shared/src/mcp-tools.ts */
export declare const MCP_TOOLS: McpToolDef[];
export declare const MCP_TOOL_HTTP: Record<string, {
    method: "GET" | "POST";
    path: (args: Record<string, unknown>) => string;
    body?: (args: Record<string, unknown>) => unknown;
}>;
//# sourceMappingURL=catalog.d.ts.map