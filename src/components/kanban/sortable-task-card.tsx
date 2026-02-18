"use client";

import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TaskCard } from "./task-card";
import type { KanbanTask } from "@/lib/types";

interface SortableTaskCardProps {
  task: KanbanTask;
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
