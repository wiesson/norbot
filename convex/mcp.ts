import { v } from "convex/values";
import { internalQuery, internalMutation } from "./_generated/server";

// ===========================================
// MCP API - Minimal operations for LLM tools
// ===========================================

// Validate API key and return project context
export const validateApiKey = internalQuery({
  args: { key: v.string() },
  handler: async (ctx, args) => {
    const apiKey = await ctx.db
      .query("apiKeys")
      .withIndex("by_key", (q) => q.eq("key", args.key))
      .first();

    if (!apiKey) return null;

    const project = await ctx.db.get(apiKey.projectId);
    if (!project) return null;

    // Update last used (fire and forget via scheduler would be better)
    return {
      workspaceId: apiKey.workspaceId,
      projectId: apiKey.projectId,
      projectShortCode: project.shortCode,
    };
  },
});

// List tasks - returns minimal data for markdown formatting
export const listTasks = internalQuery({
  args: {
    projectId: v.id("projects"),
    status: v.optional(
      v.union(
        v.literal("backlog"),
        v.literal("todo"),
        v.literal("in_progress"),
        v.literal("in_review"),
        v.literal("done")
      )
    ),
    limit: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const limit = Math.min(args.limit ?? 10, 50);

    let query = ctx.db
      .query("tasks")
      .withIndex("by_project", (q) => q.eq("projectId", args.projectId));

    if (args.status) {
      query = ctx.db
        .query("tasks")
        .withIndex("by_project_and_status", (q) =>
          q.eq("projectId", args.projectId).eq("status", args.status!)
        );
    }

    const tasks = await query.take(limit);

    return tasks.map((t) => ({
      id: t.displayId,
      title: t.title,
      status: t.status,
      priority: t.priority,
    }));
  },
});

// Create task - minimal input, auto-generates display ID
export const createTask = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    title: v.string(),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low"))
    ),
    taskType: v.optional(
      v.union(v.literal("bug"), v.literal("feature"), v.literal("improvement"), v.literal("task"))
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const project = await ctx.db.get(args.projectId);
    if (!project) return { error: "Project not found" };

    // Get/increment counter
    const counter = await ctx.db
      .query("projectCounters")
      .withIndex("by_project_and_type", (q) =>
        q.eq("projectId", args.projectId).eq("counterType", "task_number")
      )
      .first();

    let taskNumber: number;
    if (counter) {
      taskNumber = counter.currentValue + 1;
      await ctx.db.patch(counter._id, { currentValue: taskNumber });
    } else {
      taskNumber = 1;
      await ctx.db.insert("projectCounters", {
        projectId: args.projectId,
        counterType: "task_number",
        currentValue: 1,
      });
    }

    const displayId = `${project.shortCode}-${taskNumber}`;
    const priority = args.priority ?? "medium";
    const taskType = args.taskType ?? "task";

    await ctx.db.insert("tasks", {
      workspaceId: args.workspaceId,
      projectId: args.projectId,
      taskNumber,
      displayId,
      title: args.title,
      description: args.description,
      status: "backlog",
      priority,
      taskType,
      source: { type: "api" },
      labels: [],
      createdAt: now,
      updatedAt: now,
    });

    return { id: displayId, title: args.title, priority, type: taskType };
  },
});

// Update task - by display ID
export const updateTask = internalMutation({
  args: {
    projectId: v.id("projects"),
    displayId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    priority: v.optional(
      v.union(v.literal("critical"), v.literal("high"), v.literal("medium"), v.literal("low"))
    ),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_display_id", (q) => q.eq("displayId", args.displayId))
      .first();

    if (!task) return { error: `Task ${args.displayId} not found` };
    if (task.projectId?.toString() !== args.projectId.toString()) {
      return { error: `Task ${args.displayId} not in this project` };
    }

    const updates: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.title !== undefined) updates.title = args.title;
    if (args.description !== undefined) updates.description = args.description;
    if (args.priority !== undefined) updates.priority = args.priority;

    await ctx.db.patch(task._id, updates);

    return { id: args.displayId, updated: true };
  },
});

// Update status - with optional note
export const updateStatus = internalMutation({
  args: {
    projectId: v.id("projects"),
    displayId: v.string(),
    status: v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("done"),
      v.literal("cancelled")
    ),
    note: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_display_id", (q) => q.eq("displayId", args.displayId))
      .first();

    if (!task) return { error: `Task ${args.displayId} not found` };
    if (task.projectId?.toString() !== args.projectId.toString()) {
      return { error: `Task ${args.displayId} not in this project` };
    }

    const now = Date.now();
    const oldStatus = task.status;

    await ctx.db.patch(task._id, {
      status: args.status,
      updatedAt: now,
      ...(args.status === "done" ? { completedAt: now } : {}),
    });

    // Log activity
    await ctx.db.insert("taskActivity", {
      taskId: task._id,
      activityType: "status_changed",
      changes: {
        field: "status",
        oldValue: oldStatus,
        newValue: args.status,
      },
      metadata: args.note ? { source: args.note } : undefined,
      createdAt: now,
    });

    return { id: args.displayId, from: oldStatus, to: args.status };
  },
});
