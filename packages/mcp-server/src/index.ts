#!/usr/bin/env node
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";

const API_URL = process.env.NORBOT_API_URL || "https://norbot.convex.site";
const API_KEY = process.env.NORBOT_API_KEY;

if (!API_KEY) {
  console.error("NORBOT_API_KEY environment variable is required");
  process.exit(1);
}

async function callApi(action: string, args: Record<string, unknown> = {}) {
  const res = await fetch(`${API_URL}/api/mcp/tasks`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": API_KEY!,
    },
    body: JSON.stringify({ action, ...args }),
  });

  if (!res.ok) {
    const error = await res.text();
    throw new Error(`API error: ${error}`);
  }

  return res.json();
}

const server = new McpServer({
  name: "norbot",
  version: "0.1.0",
});

// List tasks
server.tool(
  "norbot_list",
  "List Norbot tasks",
  {
    status: z.enum(["backlog", "todo", "in_progress", "in_review", "done"]).optional(),
    limit: z.number().max(50).optional(),
  },
  async (args) => {
    const tasks = await callApi("list", args);

    if (!tasks.length) {
      return { content: [{ type: "text", text: "No tasks found" }] };
    }

    const lines = tasks.map(
      (t: { id: string; title: string; status: string; priority: string }) =>
        `${t.id}: ${t.title} [${t.status}] ${t.priority}`
    );

    return { content: [{ type: "text", text: lines.join("\n") }] };
  }
);

// Create task
server.tool(
  "norbot_create",
  "Create a Norbot task",
  {
    title: z.string().describe("Task title"),
    description: z.string().optional().describe("Task details"),
    priority: z.enum(["critical", "high", "medium", "low"]).optional(),
    type: z.enum(["bug", "feature", "improvement", "task"]).optional(),
  },
  async (args) => {
    const result = await callApi("create", args);

    if (result.error) {
      return { content: [{ type: "text", text: `Error: ${result.error}` }] };
    }

    return {
      content: [
        {
          type: "text",
          text: `Created ${result.id}: "${result.title}" (${result.priority}, ${result.type})`,
        },
      ],
    };
  }
);

// Update task
server.tool(
  "norbot_update",
  "Update a Norbot task",
  {
    id: z.string().describe("Task ID (e.g. TM-42)"),
    title: z.string().optional(),
    description: z.string().optional(),
    priority: z.enum(["critical", "high", "medium", "low"]).optional(),
  },
  async (args) => {
    const result = await callApi("update", args);

    if (result.error) {
      return { content: [{ type: "text", text: `Error: ${result.error}` }] };
    }

    return { content: [{ type: "text", text: `Updated ${args.id}` }] };
  }
);

// Update status
server.tool(
  "norbot_status",
  "Update task status",
  {
    id: z.string().describe("Task ID (e.g. TM-42)"),
    status: z.enum(["backlog", "todo", "in_progress", "in_review", "done", "cancelled"]),
    note: z.string().optional().describe("Context for the change"),
  },
  async (args) => {
    const result = await callApi("status", args);

    if (result.error) {
      return { content: [{ type: "text", text: `Error: ${result.error}` }] };
    }

    return {
      content: [{ type: "text", text: `${result.id}: ${result.from} → ${result.to}` }],
    };
  }
);

// Start server
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch(console.error);
