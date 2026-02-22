"use client";

import { useState, useMemo, useCallback, useRef } from "react";
import { useQuery, useMutation } from "convex/react";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { api } from "@convex/_generated/api";
import {
  DndContext,
  DragOverlay,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
  type DragOverEvent,
} from "@dnd-kit/core";
import { KanbanColumn } from "./kanban-column";
import { TaskCard } from "./task-card";
import { TaskDetailModal } from "./task-detail-modal";
import { TaskCreateModal } from "./task-create-modal";
import { optimisticStatusUpdate } from "@/lib/optimistic-updates";
import type { Id } from "@convex/_generated/dataModel";
import type { KanbanTask, KanbanArgs, ColumnKey } from "@/lib/types";

interface KanbanBoardProps {
  workspaceId: Id<"workspaces">;
  repositoryId?: Id<"repositories">;
  projectId?: Id<"projects">;
}

const columns = [
  { key: "backlog", title: "Backlog", color: "slate" },
  { key: "todo", title: "To Do", color: "blue" },
  { key: "in_progress", title: "In Progress", color: "amber" },
  { key: "in_review", title: "In Review", color: "purple" },
  { key: "done", title: "Done", color: "emerald" },
] as const;

export function KanbanBoard({ workspaceId, repositoryId, projectId }: KanbanBoardProps) {
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const searchParams = useMemo(() => {
    const raw = searchStr.startsWith("?") ? searchStr.slice(1) : searchStr;
    return new URLSearchParams(raw);
  }, [searchStr]);

  // URL-based task selection (persist modal state to URL)
  const taskIdFromUrl = searchParams.get("task") as Id<"tasks"> | null;

  // URL is the source of truth for selected task
  const selectedTaskId = taskIdFromUrl;
  const setSelectedTaskId = useCallback(
    (id: Id<"tasks"> | null) => {
      const params = new URLSearchParams(searchParams.toString());
      if (id) {
        params.set("task", id);
      } else {
        params.delete("task");
      }
      const query = params.toString();
      router.history.replace(query ? `${pathname}?${query}` : pathname);
    },
    [pathname, router, searchParams]
  );

  // Modal states
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [createModalStatus, setCreateModalStatus] = useState<
    "backlog" | "todo" | "in_progress" | "in_review"
  >("backlog");

  // Drag state
  const [activeTask, setActiveTask] = useState<KanbanTask | null>(null);

  // Query arguments for optimistic updates
  const kanbanArgs: KanbanArgs = useMemo(
    () => ({ workspaceId, repositoryId, projectId }),
    [workspaceId, repositoryId, projectId]
  );

  // Keep ref current for optimistic update callback (assign during render)
  const kanbanArgsRef = useRef(kanbanArgs);
  kanbanArgsRef.current = kanbanArgs;

  const kanbanData = useQuery(api.tasks.getKanban, kanbanArgs);

  // Mutation with optimistic update - use ref to avoid stale closure
  const updateStatus = useMutation(api.tasks.updateStatus).withOptimisticUpdate(
    (localStore, { id, status }) => {
      optimisticStatusUpdate(localStore, kanbanArgsRef.current, id, status);
    }
  );

  // Sensors for drag detection
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: {
      distance: 8, // 8px movement required to start drag
    },
  });

  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: {
      delay: 200, // 200ms hold required for touch drag
      tolerance: 5,
    },
  });

  const sensors = useSensors(pointerSensor, touchSensor);

  // Find task by ID across all columns
  const findTaskById = useCallback(
    (taskId: Id<"tasks">): KanbanTask | undefined => {
      if (!kanbanData) return undefined;
      for (const columnKey of Object.keys(kanbanData.columns) as ColumnKey[]) {
        const found = kanbanData.columns[columnKey].find((t) => t._id === taskId);
        if (found) return found as KanbanTask;
      }
      return undefined;
    },
    [kanbanData]
  );

  // Drag handlers
  const handleDragStart = useCallback(
    (event: DragStartEvent) => {
      const { active } = event;
      const taskId = active.id as Id<"tasks">;
      const task = findTaskById(taskId);
      if (task) {
        setActiveTask(task);
      }
    },
    [findTaskById]
  );

  const handleDragOver = useCallback((_event: DragOverEvent) => {
    // Could be used for preview animations during drag
  }, []);

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      setActiveTask(null);

      if (!over) return;

      const taskId = active.id as Id<"tasks">;
      let newStatus: ColumnKey | undefined;

      // Check if dropped over a column
      if (columns.some((col) => col.key === over.id)) {
        newStatus = over.id as ColumnKey;
      } else {
        // Dropped over another task - get its column
        const overTask = findTaskById(over.id as Id<"tasks">);
        if (overTask && overTask.status !== "cancelled") {
          newStatus = overTask.status;
        }
      }

      if (!newStatus) return;

      // Find current task status
      const currentTask = findTaskById(taskId);
      if (!currentTask || currentTask.status === newStatus) return;

      // Update the task status
      updateStatus({ id: taskId, status: newStatus });
    },
    [findTaskById, updateStatus]
  );

  const handleDragCancel = useCallback(() => {
    setActiveTask(null);
  }, []);

  // Task click handler
  const handleTaskClick = useCallback((taskId: Id<"tasks">) => {
    setSelectedTaskId(taskId);
  }, [setSelectedTaskId]);

  const handleCloseModal = useCallback(() => {
    setSelectedTaskId(null);
  }, [setSelectedTaskId]);

  // Add task handler - opens create modal for specific column
  const handleAddTask = useCallback((status: "backlog" | "todo" | "in_progress" | "in_review") => {
    setCreateModalStatus(status);
    setIsCreateModalOpen(true);
  }, []);

  if (!kanbanData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-pulse text-muted-foreground">Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
      >
        <div className="flex-1 overflow-x-auto py-4 scroll-pl-4 sm:scroll-pl-6 lg:scroll-pl-8">
          <div className="flex gap-4 w-max mx-auto pl-4 sm:pl-6 lg:pl-8">
            {columns.map((column) => (
              <KanbanColumn
                key={column.key}
                title={column.title}
                status={column.key}
                color={column.color}
                tasks={kanbanData.columns[column.key] || []}
                onTaskClick={handleTaskClick}
                onAddTask={
                  column.key !== "done"
                    ? () => handleAddTask(column.key as "backlog" | "todo" | "in_progress" | "in_review")
                    : undefined
                }
              />
            ))}
          </div>
        </div>

        {/* Drag Overlay - the ghost card that follows the cursor */}
        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragOverlay /> : null}
        </DragOverlay>
      </DndContext>

      {/* Stats Bar */}
      <div className="pl-4 sm:pl-6 lg:pl-8 py-2 flex items-center gap-4 text-sm text-muted-foreground">
        <span>Total: {kanbanData.stats.total}</span>
        <span className="text-red-500">Critical: {kanbanData.stats.byPriority.critical}</span>
        <span className="text-orange-500">High: {kanbanData.stats.byPriority.high}</span>
        <span className="text-yellow-500">Medium: {kanbanData.stats.byPriority.medium}</span>
        <span className="text-slate-500">Low: {kanbanData.stats.byPriority.low}</span>
      </div>

      {/* Task Detail Modal */}
      {selectedTaskId && <TaskDetailModal taskId={selectedTaskId} onClose={handleCloseModal} />}

      {/* Task Create Modal */}
      <TaskCreateModal
        open={isCreateModalOpen}
        onOpenChange={setIsCreateModalOpen}
        workspaceId={workspaceId}
        repositoryId={repositoryId}
        projectId={projectId}
        initialStatus={createModalStatus}
      />
    </div>
  );
}
