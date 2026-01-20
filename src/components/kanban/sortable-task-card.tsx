"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "./task-card";
import type { Id } from "@convex/_generated/dataModel";

interface Task {
  _id: Id<"tasks">;
  displayId: string;
  title: string;
  description?: string;
  priority: "critical" | "high" | "medium" | "low";
  taskType: "bug" | "feature" | "improvement" | "task" | "question";
  labels: string[];
  projectShortCode?: string;
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
}

interface SortableTaskCardProps {
  task: Task;
  onClick?: () => void;
  isPending?: boolean;
  isOptimistic?: boolean;
}

export function SortableTaskCard({
  task,
  onClick,
  isPending = false,
  isOptimistic = false,
}: SortableTaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({
    id: task._id,
    data: {
      type: "task",
      task,
    },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div ref={setNodeRef} style={style} {...attributes} {...listeners}>
      <TaskCard
        task={task}
        onClick={onClick}
        isDragging={isDragging}
        isPending={isPending}
        isOptimistic={isOptimistic}
      />
    </div>
  );
}
