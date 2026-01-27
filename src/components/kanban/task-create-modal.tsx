"use client";

import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  Bug,
  Lightbulb,
  Zap,
  HelpCircle,
  CheckSquare,
  ChevronDown,
  ChevronUp,
  Loader2,
} from "lucide-react";

interface TaskCreateModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaceId: Id<"workspaces">;
  repositoryId?: Id<"repositories">;
  projectId?: Id<"projects">;
  initialStatus?: "backlog" | "todo" | "in_progress" | "in_review";
}

const taskTypes = [
  { value: "task", label: "Task", icon: CheckSquare, color: "text-slate-500" },
  { value: "bug", label: "Bug", icon: Bug, color: "text-red-500" },
  { value: "feature", label: "Feature", icon: Lightbulb, color: "text-purple-500" },
  { value: "improvement", label: "Improvement", icon: Zap, color: "text-blue-500" },
  { value: "question", label: "Question", icon: HelpCircle, color: "text-amber-500" },
] as const;

const priorities = [
  { value: "critical", label: "Critical", color: "bg-red-500" },
  { value: "high", label: "High", color: "bg-orange-500" },
  { value: "medium", label: "Medium", color: "bg-yellow-500" },
  { value: "low", label: "Low", color: "bg-slate-400" },
] as const;

const statuses = [
  { value: "backlog", label: "Backlog" },
  { value: "todo", label: "To Do" },
  { value: "in_progress", label: "In Progress" },
  { value: "in_review", label: "In Review" },
] as const;

type TaskType = (typeof taskTypes)[number]["value"];
type Priority = (typeof priorities)[number]["value"];
type Status = (typeof statuses)[number]["value"];

export function TaskCreateModal({
  open,
  onOpenChange,
  workspaceId,
  repositoryId: defaultRepositoryId,
  projectId: defaultProjectId,
  initialStatus = "backlog",
}: TaskCreateModalProps) {
  // Form state
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [taskType, setTaskType] = useState<TaskType>("task");
  const [priority, setPriority] = useState<Priority>("medium");
  const [status, setStatus] = useState<Status>(initialStatus);
  const [projectId, setProjectId] = useState<Id<"projects"> | undefined>(defaultProjectId);
  const [repositoryId, setRepositoryId] = useState<Id<"repositories"> | undefined>(
    defaultRepositoryId
  );
  const [dueDate, setDueDate] = useState<string>("");
  const [labels, setLabels] = useState<string[]>([]);
  const [labelInput, setLabelInput] = useState("");

  // Code context state
  const [showCodeContext, setShowCodeContext] = useState(false);
  const [filePaths, setFilePaths] = useState<string[]>([]);
  const [filePathInput, setFilePathInput] = useState("");
  const [errorMessage, setErrorMessage] = useState("");
  const [stackTrace, setStackTrace] = useState("");
  const [codeSnippet, setCodeSnippet] = useState("");
  const [suggestedFix, setSuggestedFix] = useState("");
  const [branch, setBranch] = useState("");
  const [commitSha, setCommitSha] = useState("");

  // Collapsible sections
  const [showOrganization, setShowOrganization] = useState(false);

  // Submission state
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Queries
  const projects = useQuery(api.projects.list, { workspaceId });
  const repositories = useQuery(api.repositories.list, { workspaceId });

  // Mutation
  const createTask = useMutation(api.tasks.create);

  const resetForm = () => {
    setTitle("");
    setDescription("");
    setTaskType("task");
    setPriority("medium");
    setStatus(initialStatus);
    setProjectId(defaultProjectId);
    setRepositoryId(defaultRepositoryId);
    setDueDate("");
    setLabels([]);
    setLabelInput("");
    setShowCodeContext(false);
    setFilePaths([]);
    setFilePathInput("");
    setErrorMessage("");
    setStackTrace("");
    setCodeSnippet("");
    setSuggestedFix("");
    setBranch("");
    setCommitSha("");
    setShowOrganization(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      // Build code context if any fields are filled
      const hasCodeContext =
        filePaths.length > 0 ||
        errorMessage ||
        stackTrace ||
        codeSnippet ||
        suggestedFix ||
        branch ||
        commitSha;

      const codeContext = hasCodeContext
        ? {
            filePaths: filePaths.length > 0 ? filePaths : undefined,
            errorMessage: errorMessage || undefined,
            stackTrace: stackTrace || undefined,
            codeSnippet: codeSnippet || undefined,
            suggestedFix: suggestedFix || undefined,
            branch: branch || undefined,
            commitSha: commitSha || undefined,
          }
        : undefined;

      await createTask({
        workspaceId,
        repositoryId,
        projectId,
        title: title.trim(),
        description: description.trim() || undefined,
        priority,
        taskType,
        status,
        dueDate: dueDate ? new Date(dueDate).getTime() : undefined,
        source: { type: "manual" },
        codeContext,
        labels: labels.length > 0 ? labels : undefined,
      });

      resetForm();
      onOpenChange(false);
    } catch (error) {
      console.error("Failed to create task:", error);
      toast.error("Failed to create task");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddLabel = () => {
    const label = labelInput.trim();
    if (label && !labels.includes(label)) {
      setLabels([...labels, label]);
      setLabelInput("");
    }
  };

  const handleRemoveLabel = (label: string) => {
    setLabels(labels.filter((l) => l !== label));
  };

  const handleAddFilePath = () => {
    const path = filePathInput.trim();
    if (path && !filePaths.includes(path)) {
      setFilePaths([...filePaths, path]);
      setFilePathInput("");
    }
  };

  const handleRemoveFilePath = (path: string) => {
    setFilePaths(filePaths.filter((p) => p !== path));
  };

  const selectedTaskType = taskTypes.find((t) => t.value === taskType);
  const TaskTypeIcon = selectedTaskType?.icon ?? CheckSquare;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Create Task</DialogTitle>
            <DialogDescription>
              Add a new task to your workspace. Fill in the details below.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Title */}
            <div className="space-y-2">
              <Label htmlFor="title">
                Title <span className="text-red-500">*</span>
              </Label>
              <Input
                id="title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter task title..."
                required
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the task..."
                rows={3}
              />
            </div>

            {/* Type, Priority, Status Row */}
            <div className="grid grid-cols-3 gap-3">
              {/* Task Type */}
              <div className="space-y-2">
                <Label>Type</Label>
                <Select value={taskType} onValueChange={(v) => setTaskType(v as TaskType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        <TaskTypeIcon className={cn("size-4", selectedTaskType?.color)} />
                        {selectedTaskType?.label}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {taskTypes.map((type) => {
                      const Icon = type.icon;
                      return (
                        <SelectItem key={type.value} value={type.value}>
                          <Icon className={cn("size-4", type.color)} />
                          {type.label}
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Priority */}
              <div className="space-y-2">
                <Label>Priority</Label>
                <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
                  <SelectTrigger className="w-full">
                    <SelectValue>
                      <span className="flex items-center gap-2">
                        <span
                          className={cn(
                            "size-2 rounded-full",
                            priorities.find((p) => p.value === priority)?.color
                          )}
                        />
                        {priorities.find((p) => p.value === priority)?.label}
                      </span>
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {priorities.map((p) => (
                      <SelectItem key={p.value} value={p.value}>
                        <span className={cn("size-2 rounded-full", p.color)} />
                        {p.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label>Status</Label>
                <Select value={status} onValueChange={(v) => setStatus(v as Status)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {statuses.map((s) => (
                      <SelectItem key={s.value} value={s.value}>
                        {s.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Organization Section (collapsible) */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setShowOrganization(!showOrganization)}
                className="flex items-center justify-between w-full p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <span>Assignment & Organization</span>
                {showOrganization ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>

              {showOrganization && (
                <div className="p-3 pt-0 space-y-3 border-t">
                  {/* Project */}
                  <div className="space-y-2">
                    <Label>Project</Label>
                    <Select
                      value={projectId ?? "none"}
                      onValueChange={(v) => setProjectId(v === "none" ? undefined : (v as Id<"projects">))}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select project..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No project</SelectItem>
                        {projects?.map((project) => (
                          <SelectItem key={project._id} value={project._id}>
                            {project.shortCode} - {project.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Repository */}
                  <div className="space-y-2">
                    <Label>Repository</Label>
                    <Select
                      value={repositoryId ?? "none"}
                      onValueChange={(v) =>
                        setRepositoryId(v === "none" ? undefined : (v as Id<"repositories">))
                      }
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Select repository..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No repository</SelectItem>
                        {repositories?.map((repo) => (
                          <SelectItem key={repo._id} value={repo._id}>
                            {repo.fullName}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Due Date */}
                  <div className="space-y-2">
                    <Label htmlFor="dueDate">Due Date</Label>
                    <Input
                      id="dueDate"
                      type="date"
                      value={dueDate}
                      onChange={(e) => setDueDate(e.target.value)}
                    />
                  </div>

                  {/* Labels */}
                  <div className="space-y-2">
                    <Label>Labels</Label>
                    <div className="flex gap-2">
                      <Input
                        value={labelInput}
                        onChange={(e) => setLabelInput(e.target.value)}
                        placeholder="Add label..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddLabel();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddLabel}>
                        Add
                      </Button>
                    </div>
                    {labels.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {labels.map((label) => (
                          <span
                            key={label}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-muted rounded-full"
                          >
                            {label}
                            <button
                              type="button"
                              onClick={() => handleRemoveLabel(label)}
                              className="hover:text-destructive"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Code Context Section (collapsible, shown for bugs) */}
            <div className="border rounded-lg">
              <button
                type="button"
                onClick={() => setShowCodeContext(!showCodeContext)}
                className="flex items-center justify-between w-full p-3 text-sm font-medium hover:bg-muted/50 transition-colors"
              >
                <span>Code Context {taskType === "bug" && "(Recommended for bugs)"}</span>
                {showCodeContext ? (
                  <ChevronUp className="size-4" />
                ) : (
                  <ChevronDown className="size-4" />
                )}
              </button>

              {showCodeContext && (
                <div className="p-3 pt-0 space-y-3 border-t">
                  {/* File Paths */}
                  <div className="space-y-2">
                    <Label>File Paths</Label>
                    <div className="flex gap-2">
                      <Input
                        value={filePathInput}
                        onChange={(e) => setFilePathInput(e.target.value)}
                        placeholder="src/components/..."
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            e.preventDefault();
                            handleAddFilePath();
                          }
                        }}
                      />
                      <Button type="button" variant="outline" onClick={handleAddFilePath}>
                        Add
                      </Button>
                    </div>
                    {filePaths.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {filePaths.map((path) => (
                          <span
                            key={path}
                            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-muted rounded-full font-mono"
                          >
                            {path}
                            <button
                              type="button"
                              onClick={() => handleRemoveFilePath(path)}
                              className="hover:text-destructive"
                            >
                              &times;
                            </button>
                          </span>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Error Message */}
                  <div className="space-y-2">
                    <Label htmlFor="errorMessage">Error Message</Label>
                    <Textarea
                      id="errorMessage"
                      value={errorMessage}
                      onChange={(e) => setErrorMessage(e.target.value)}
                      placeholder="TypeError: Cannot read property..."
                      rows={2}
                    />
                  </div>

                  {/* Stack Trace */}
                  <div className="space-y-2">
                    <Label htmlFor="stackTrace">Stack Trace</Label>
                    <Textarea
                      id="stackTrace"
                      value={stackTrace}
                      onChange={(e) => setStackTrace(e.target.value)}
                      placeholder="at Component.render (src/...)"
                      rows={3}
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* Code Snippet */}
                  <div className="space-y-2">
                    <Label htmlFor="codeSnippet">Code Snippet</Label>
                    <Textarea
                      id="codeSnippet"
                      value={codeSnippet}
                      onChange={(e) => setCodeSnippet(e.target.value)}
                      placeholder="Paste relevant code..."
                      rows={4}
                      className="font-mono text-xs"
                    />
                  </div>

                  {/* Suggested Fix */}
                  <div className="space-y-2">
                    <Label htmlFor="suggestedFix">Suggested Fix</Label>
                    <Textarea
                      id="suggestedFix"
                      value={suggestedFix}
                      onChange={(e) => setSuggestedFix(e.target.value)}
                      placeholder="Describe the potential fix..."
                      rows={2}
                    />
                  </div>

                  {/* Branch & Commit Row */}
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-2">
                      <Label htmlFor="branch">Branch</Label>
                      <Input
                        id="branch"
                        value={branch}
                        onChange={(e) => setBranch(e.target.value)}
                        placeholder="main"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="commitSha">Commit SHA</Label>
                      <Input
                        id="commitSha"
                        value={commitSha}
                        onChange={(e) => setCommitSha(e.target.value)}
                        placeholder="abc123..."
                        className="font-mono"
                      />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={!title.trim() || isSubmitting}>
              {isSubmitting && <Loader2 className="size-4 mr-2 animate-spin" />}
              Create Task
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
