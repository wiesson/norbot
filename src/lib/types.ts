import type { Doc, Id } from "@convex/_generated/dataModel";

// Task document type from Convex schema
export type TaskDoc = Doc<"tasks">;
export type TaskStatus = TaskDoc["status"];
export type TaskPriority = TaskDoc["priority"];
export type TaskType = TaskDoc["taskType"];

// Kanban-specific task interface (subset of TaskDoc for UI)
export interface KanbanTask {
  _id: Id<"tasks">;
  displayId: string;
  title: string;
  description?: string;
  priority: TaskPriority;
  taskType: TaskType;
  labels: string[];
  projectShortCode?: string;
  status: TaskStatus;
  source: {
    type: "slack" | "manual" | "github" | "api";
    slackChannelName?: string;
  };
  claudeCodeExecution?: {
    status: "pending" | "running" | "completed" | "failed";
    pullRequestUrl?: string;
  };
  assignee?: {
    name: string;
    avatarUrl?: string;
  };
  _isOptimistic?: boolean; // Flag for optimistic state detection
}

// Kanban data structure returned by getKanban query
export interface KanbanData {
  columns: {
    backlog: KanbanTask[];
    todo: KanbanTask[];
    in_progress: KanbanTask[];
    in_review: KanbanTask[];
    done: KanbanTask[];
  };
  stats: {
    total: number;
    byPriority: {
      critical: number;
      high: number;
      medium: number;
      low: number;
    };
  };
}

// Column keys type
export type ColumnKey = keyof KanbanData["columns"];

// Kanban query arguments
export interface KanbanArgs {
  workspaceId: Id<"workspaces">;
  repositoryId?: Id<"repositories">;
  projectId?: Id<"projects">;
}
