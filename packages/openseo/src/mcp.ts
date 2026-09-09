const MCP_URL = "https://app.openseo.so/mcp";

export interface OpenSEOMcpOptions {
  apiKey: string;
  projectId?: string;
}

export class OpenSEOMcpError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenSEOMcpError";
  }
}

type McpToolResult = {
  content?: Array<{ type: string; text?: string }>;
  structuredContent?: unknown;
  isError?: boolean;
};

export class OpenSEOMcpClient {
  private projectIdCache?: string;

  constructor(private readonly options: OpenSEOMcpOptions) {}

  async callTool<T = unknown>(name: string, args: Record<string, unknown>): Promise<T> {
    const res = await fetch(MCP_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.options.apiKey}`,
        Accept: "application/json, text/event-stream",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        method: "tools/call",
        params: { name, arguments: args },
        id: Date.now(),
      }),
    });

    if (!res.ok) {
      throw new OpenSEOMcpError(`OpenSEO MCP HTTP ${res.status}`);
    }

    const json = (await res.json()) as {
      error?: { message?: string };
      result?: McpToolResult;
    };

    if (json.error?.message) {
      throw new OpenSEOMcpError(json.error.message);
    }

    const result = json.result;
    if (!result) {
      throw new OpenSEOMcpError(`OpenSEO MCP empty result for ${name}`);
    }

    if (result.isError) {
      const detail = result.content?.map((c) => c.text).filter(Boolean).join("; ");
      throw new OpenSEOMcpError(detail || `OpenSEO tool ${name} failed`);
    }

    if (result.structuredContent !== undefined) {
      return result.structuredContent as T;
    }

    const text = result.content?.find((c) => c.type === "text")?.text;
    if (text) {
      try {
        return JSON.parse(text) as T;
      } catch {
        throw new OpenSEOMcpError(`OpenSEO tool ${name} returned non-JSON text`);
      }
    }

    throw new OpenSEOMcpError(`OpenSEO tool ${name} returned no structured content`);
  }

  async getProjectId(): Promise<string> {
    if (this.options.projectId) return this.options.projectId;
    if (this.projectIdCache) return this.projectIdCache;

    const data = await this.callTool<{ projects?: Array<{ id: string }> }>("list_projects", {});
    const projectId = data.projects?.[0]?.id;
    if (!projectId) {
      throw new OpenSEOMcpError(
        "No OpenSEO project found. Create one at app.openseo.so or set OPENSEO_PROJECT_ID.",
      );
    }

    this.projectIdCache = projectId;
    return projectId;
  }
}

export { MCP_URL };
