"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Doc, Id } from "@convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Bug,
  Check,
  CheckSquare,
  Clock,
  Download,
  ExternalLink,
  FileIcon,
  HelpCircle,
  ImageIcon,
  Lightbulb,
  Loader2,
  MessageSquare,
  Paperclip,
  X,
  Zap,
} from "lucide-react";
import { TiptapEditor } from "@/components/tiptap-editor";
import { TicketAiHelper } from "@/components/kanban/ticket-ai-helper";

interface TaskDetailModalProps {
  taskId: Id<"tasks">;
  onClose: () => void;
}

interface UploadedFile {
  storageId: Id<"_storage">;
  filename: string;
  mimeType: string;
  size: number;
  slackFileId?: string;
}

interface UploadingFile {
  file: File;
  progress: "uploading" | "done" | "error";
  result?: UploadedFile;
}

interface TaskFormState {
  workspaceId: Id<"workspaces">;
  title: string;
  description: string;
  taskType: "bug" | "feature" | "improvement" | "task" | "question";
  priority: "critical" | "high" | "medium" | "low";
  status: "backlog" | "todo" | "in_progress" | "in_review" | "done" | "cancelled";
  repositoryId?: Id<"repositories">;
  projectId?: Id<"projects">;
  assigneeId?: Id<"users">;
  dueDate: string;
  labels: string[];
  attachments: UploadedFile[];
  codeContext: {
    url: string;
    filePaths: string[];
    errorMessage: string;
    stackTrace: string;
    codeSnippet: string;
    suggestedFix: string;
    branch: string;
    commitSha: string;
  };
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
  { value: "done", label: "Done" },
  { value: "cancelled", label: "Cancelled" },
] as const;

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function toDateInputValue(timestamp?: number): string {
  if (!timestamp) return "";
  const date = new Date(timestamp);
  const timezoneOffsetMs = date.getTimezoneOffset() * 60_000;
  return new Date(date.getTime() - timezoneOffsetMs).toISOString().slice(0, 10);
}

function buildFormState(task: Doc<"tasks">): TaskFormState {
  return {
    workspaceId: task.workspaceId,
    title: task.title,
    description: task.description ?? "",
    taskType: task.taskType,
    priority: task.priority,
    status: task.status,
    repositoryId: task.repositoryId,
    projectId: task.projectId,
    assigneeId: task.assigneeId,
    dueDate: toDateInputValue(task.dueDate),
    labels: task.labels ?? [],
    attachments: (task.attachments ?? []) as UploadedFile[],
    codeContext: {
      url: task.codeContext?.url ?? "",
      filePaths: task.codeContext?.filePaths ?? [],
      errorMessage: task.codeContext?.errorMessage ?? "",
      stackTrace: task.codeContext?.stackTrace ?? "",
      codeSnippet: task.codeContext?.codeSnippet ?? "",
      suggestedFix: task.codeContext?.suggestedFix ?? "",
      branch: task.codeContext?.branch ?? "",
      commitSha: task.codeContext?.commitSha ?? "",
    },
  };
}

function formSignature(form: TaskFormState): string {
  return JSON.stringify({
    ...form,
    title: form.title.trim(),
    description: form.description.trim(),
    labels: form.labels.map((label) => label.trim()).filter(Boolean),
    codeContext: {
      ...form.codeContext,
      url: form.codeContext.url.trim(),
      filePaths: form.codeContext.filePaths.map((path) => path.trim()).filter(Boolean),
      errorMessage: form.codeContext.errorMessage.trim(),
      stackTrace: form.codeContext.stackTrace.trim(),
      codeSnippet: form.codeContext.codeSnippet.trim(),
      suggestedFix: form.codeContext.suggestedFix.trim(),
      branch: form.codeContext.branch.trim(),
      commitSha: form.codeContext.commitSha.trim(),
    },
  });
}

function normalizeCodeContext(form: TaskFormState): {
  url?: string;
  filePaths?: string[];
  errorMessage?: string;
  stackTrace?: string;
  codeSnippet?: string;
  suggestedFix?: string;
  branch?: string;
  commitSha?: string;
} | undefined {
  const url = form.codeContext.url.trim();
  const filePaths = form.codeContext.filePaths.map((path) => path.trim()).filter(Boolean);
  const errorMessage = form.codeContext.errorMessage.trim();
  const stackTrace = form.codeContext.stackTrace.trim();
  const codeSnippet = form.codeContext.codeSnippet.trim();
  const suggestedFix = form.codeContext.suggestedFix.trim();
  const branch = form.codeContext.branch.trim();
  const commitSha = form.codeContext.commitSha.trim();

  if (!url && filePaths.length === 0 && !errorMessage && !stackTrace && !codeSnippet && !suggestedFix && !branch && !commitSha) {
    return undefined;
  }

  return {
    url: url || undefined,
    filePaths: filePaths.length > 0 ? filePaths : undefined,
    errorMessage: errorMessage || undefined,
    stackTrace: stackTrace || undefined,
    codeSnippet: codeSnippet || undefined,
    suggestedFix: suggestedFix || undefined,
    branch: branch || undefined,
    commitSha: commitSha || undefined,
  };
}

function AttachmentItem({
  attachment,
  onRemove,
}: {
  attachment: UploadedFile;
  onRemove?: () => void;
}) {
  const fileUrl = useQuery(api.tasks.getFileUrl, { storageId: attachment.storageId });
  const isImage = attachment.mimeType.startsWith("image/");

  return (
    <div className="flex items-center gap-2 bg-muted/50 rounded-md px-2.5 py-1.5">
      {isImage ? (
        <ImageIcon className="size-4 text-muted-foreground shrink-0" />
      ) : (
        <FileIcon className="size-4 text-muted-foreground shrink-0" />
      )}
      <span className="text-sm truncate flex-1">{attachment.filename}</span>
      <span className="text-muted-foreground text-xs shrink-0">{formatFileSize(attachment.size)}</span>
      {fileUrl && (
        <a
          href={fileUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-muted-foreground hover:text-foreground shrink-0"
          download={attachment.filename}
        >
          <Download className="size-3.5" />
        </a>
      )}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="text-muted-foreground hover:text-destructive shrink-0"
        >
          <X className="size-3.5" />
        </button>
      )}
    </div>
  );
}

export function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const task = useQuery(api.tasks.getById, { id: taskId });
  const updateTask = useMutation(api.tasks.update);
  const generateUploadUrl = useMutation(api.web.generateUploadUrl);

  const [form, setForm] = useState<TaskFormState | null>(null);
  const [labelInput, setLabelInput] = useState("");
  const [filePathInput, setFilePathInput] = useState("");
  const [uploadingFiles, setUploadingFiles] = useState<UploadingFile[]>([]);
  const [saveState, setSaveState] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [saveError, setSaveError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const lastSavedSignatureRef = useRef("");
  const saveRequestIdRef = useRef(0);
  const initializedTaskIdRef = useRef<Id<"tasks"> | null>(null);

  const projects = useQuery(api.projects.list, task ? { workspaceId: task.workspaceId } : "skip");
  const repositories = useQuery(api.repositories.list, task ? { workspaceId: task.workspaceId } : "skip");
  const members = useQuery(api.workspaces.getMembers, task ? { workspaceId: task.workspaceId } : "skip");

  useEffect(() => {
    if (!task) return;
    if (initializedTaskIdRef.current === taskId) return;

    const nextForm = buildFormState(task);
    setForm(nextForm);
    setLabelInput("");
    setFilePathInput("");
    setUploadingFiles([]);
    setSaveState("idle");
    setSaveError(null);
    lastSavedSignatureRef.current = formSignature(nextForm);
    saveRequestIdRef.current = 0;
    initializedTaskIdRef.current = taskId;
  }, [taskId, task]);

  const handleSave = useCallback(
    async (snapshot: TaskFormState, signature: string) => {
      if (!snapshot.title.trim()) return;

      const requestId = ++saveRequestIdRef.current;
      setSaveState("saving");
      setSaveError(null);

      try {
        const labels = Array.from(
          new Set(
            snapshot.labels
              .map((label) => label.trim())
              .filter(Boolean)
          )
        );

        await updateTask({
          id: taskId,
          repositoryId: snapshot.repositoryId,
          projectId: snapshot.projectId,
          title: snapshot.title.trim(),
          description: snapshot.description.trim() || undefined,
          priority: snapshot.priority,
          taskType: snapshot.taskType,
          status: snapshot.status,
          dueDate: snapshot.dueDate ? new Date(snapshot.dueDate).getTime() : undefined,
          labels,
          assigneeId: snapshot.assigneeId,
          attachments: snapshot.attachments.length > 0 ? snapshot.attachments : undefined,
          codeContext: normalizeCodeContext(snapshot),
        });

        if (saveRequestIdRef.current !== requestId) {
          return;
        }

        lastSavedSignatureRef.current = signature;
        setSaveState("saved");
      } catch (error) {
        setSaveState("error");
        setSaveError(error instanceof Error ? error.message : "Failed to save");
      }
    },
    [taskId, updateTask]
  );

  useEffect(() => {
    if (!form) return;
    if (uploadingFiles.some((file) => file.progress === "uploading")) return;

    const signature = formSignature(form);
    if (signature === lastSavedSignatureRef.current) return;

    const timer = window.setTimeout(() => {
      void handleSave(form, signature);
    }, 300);

    return () => {
      window.clearTimeout(timer);
    };
  }, [form, uploadingFiles, handleSave]);

  const handleFileUpload = async (files: FileList) => {
    const newFiles: UploadingFile[] = Array.from(files).map((file) => ({
      file,
      progress: "uploading" as const,
    }));

    setUploadingFiles((prev) => [...prev, ...newFiles]);

    for (const uploadingFile of newFiles) {
      const file = uploadingFile.file;
      try {
        const url = await generateUploadUrl();
        const result = await fetch(url, {
          method: "POST",
          headers: { "Content-Type": file.type },
          body: file,
        });
        const { storageId } = await result.json();

        const uploaded: UploadedFile = {
          storageId,
          filename: file.name,
          mimeType: file.type,
          size: file.size,
        };

        setUploadingFiles((prev) =>
          prev.map((item) =>
            item.file === file ? { ...item, progress: "done" as const, result: uploaded } : item
          )
        );
        setForm((prev) => (prev ? { ...prev, attachments: [...prev.attachments, uploaded] } : prev));
      } catch {
        setUploadingFiles((prev) =>
          prev.map((item) => (item.file === file ? { ...item, progress: "error" as const } : item))
        );
        toast.error(`Failed to upload ${file.name}`);
      }
    }
  };

  const handleAddLabel = () => {
    const label = labelInput.trim();
    if (!label || !form || form.labels.includes(label)) return;
    setForm({ ...form, labels: [...form.labels, label] });
    setLabelInput("");
  };

  const handleAddFilePath = () => {
    const path = filePathInput.trim();
    if (!path || !form || form.codeContext.filePaths.includes(path)) return;
    setForm({
      ...form,
      codeContext: { ...form.codeContext, filePaths: [...form.codeContext.filePaths, path] },
    });
    setFilePathInput("");
  };

  if (!task || !form) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-4xl">
          <div className="animate-pulse text-muted-foreground text-center py-8">Loading task...</div>
        </DialogContent>
      </Dialog>
    );
  }

  const selectedTaskType = taskTypes.find((type) => type.value === form.taskType);
  const TaskTypeIcon = selectedTaskType?.icon ?? CheckSquare;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <TaskTypeIcon className={cn("size-4", selectedTaskType?.color)} />
            <span className="font-mono">{task.displayId}</span>
            <Badge variant="outline" className="ml-auto">
              {saveState === "saving" && (
                <span className="inline-flex items-center gap-1">
                  <Loader2 className="size-3 animate-spin" />
                  Saving...
                </span>
              )}
              {saveState === "saved" && (
                <span className="inline-flex items-center gap-1 text-emerald-600">
                  <Check className="size-3" />
                  Saved
                </span>
              )}
              {saveState === "error" && <span className="text-destructive">Save failed</span>}
              {saveState === "idle" && "Autosave enabled"}
            </Badge>
          </div>
          <DialogTitle>Edit Task</DialogTitle>
          <DialogDescription>
            Changes are autosaved 300ms after you stop typing.
            {saveError && <span className="text-destructive block mt-1">{saveError}</span>}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="task-title">
              Title <span className="text-red-500">*</span>
            </Label>
            <Input
              id="task-title"
              value={form.title}
              onChange={(event) => setForm({ ...form, title: event.target.value })}
              placeholder="Enter task title..."
            />
          </div>

          <div className="space-y-2">
            <Label>Description</Label>
            <TicketAiHelper
              workspaceId={form.workspaceId}
              text={form.description}
              title={form.title}
              taskType={form.taskType}
              onApply={(nextText) => setForm({ ...form, description: nextText })}
            />
            <TiptapEditor
              value={form.description}
              onChange={(next) => setForm({ ...form, description: next })}
              editable
              placeholder="Describe the task..."
              minHeight={240}
            />
          </div>

          <div className="space-y-2">
            <Label>Attachments</Label>
            <div>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                className="hidden"
                onChange={(event) => {
                  if (event.target.files?.length) {
                    void handleFileUpload(event.target.files);
                    event.target.value = "";
                  }
                }}
              />
              <Button type="button" variant="outline" size="sm" onClick={() => fileInputRef.current?.click()}>
                <Paperclip className="size-4 mr-1.5" />
                Attach files
              </Button>
            </div>
            {(form.attachments.length > 0 || uploadingFiles.length > 0) && (
              <div className="space-y-1.5 mt-2">
                {form.attachments.map((attachment, index) => (
                  <AttachmentItem
                    key={`${attachment.storageId}-${index}`}
                    attachment={attachment}
                    onRemove={() =>
                      setForm({
                        ...form,
                        attachments: form.attachments.filter((_, itemIndex) => itemIndex !== index),
                      })
                    }
                  />
                ))}
                {uploadingFiles
                  .filter((file) => file.progress !== "done")
                  .map((uploadingFile, index) => (
                    <div
                      key={`${uploadingFile.file.name}-${index}`}
                      className="flex items-center gap-2 text-sm bg-muted/50 rounded-md px-2.5 py-1.5"
                    >
                      {uploadingFile.file.type.startsWith("image/") ? (
                        <ImageIcon className="size-4 text-muted-foreground shrink-0" />
                      ) : (
                        <FileIcon className="size-4 text-muted-foreground shrink-0" />
                      )}
                      <span className="truncate flex-1">{uploadingFile.file.name}</span>
                      <span className="text-muted-foreground text-xs shrink-0">
                        {formatFileSize(uploadingFile.file.size)}
                      </span>
                      {uploadingFile.progress === "uploading" && (
                        <Loader2 className="size-3.5 animate-spin text-muted-foreground shrink-0" />
                      )}
                      {uploadingFile.progress === "error" && (
                        <span className="text-destructive text-xs shrink-0">Failed</span>
                      )}
                    </div>
                  ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select
                value={form.taskType}
                onValueChange={(value) =>
                  setForm({ ...form, taskType: value as TaskFormState["taskType"] })
                }
              >
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

            <div className="space-y-2">
              <Label>Priority</Label>
              <Select
                value={form.priority}
                onValueChange={(value) =>
                  setForm({ ...form, priority: value as TaskFormState["priority"] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue>
                    <span className="flex items-center gap-2">
                      <span
                        className={cn(
                          "size-2 rounded-full",
                          priorities.find((priority) => priority.value === form.priority)?.color
                        )}
                      />
                      {priorities.find((priority) => priority.value === form.priority)?.label}
                    </span>
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((priority) => (
                    <SelectItem key={priority.value} value={priority.value}>
                      <span className={cn("size-2 rounded-full", priority.color)} />
                      {priority.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(value) =>
                  setForm({ ...form, status: value as TaskFormState["status"] })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {statuses.map((status) => (
                    <SelectItem key={status.value} value={status.value}>
                      {status.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Assignee</Label>
              <Select
                value={form.assigneeId ?? "none"}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    assigneeId: value === "none" ? undefined : (value as Id<"users">),
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Unassigned</SelectItem>
                  {members?.map((member) => (
                    <SelectItem key={member.userId} value={member.userId}>
                      <span className="flex items-center gap-2">
                        {member.avatarUrl ? (
                          <span
                            className="size-4 rounded-full bg-cover bg-center"
                            style={{ backgroundImage: `url(${member.avatarUrl})` }}
                          />
                        ) : (
                          <span className="size-4 rounded-full bg-muted" />
                        )}
                        {member.name}
                      </span>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Input
                type="date"
                value={form.dueDate}
                onChange={(event) => setForm({ ...form, dueDate: event.target.value })}
              />
            </div>

            <div className="space-y-2">
              <Label>Project</Label>
              <Select
                value={form.projectId ?? "none"}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    projectId: value === "none" ? undefined : (value as Id<"projects">),
                  })
                }
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

            <div className="space-y-2">
              <Label>Repository</Label>
              <Select
                value={form.repositoryId ?? "none"}
                onValueChange={(value) =>
                  setForm({
                    ...form,
                    repositoryId: value === "none" ? undefined : (value as Id<"repositories">),
                  })
                }
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select repository..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No repository</SelectItem>
                  {repositories?.map((repository) => (
                    <SelectItem key={repository._id} value={repository._id}>
                      {repository.fullName}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Labels</Label>
            <div className="flex gap-2">
              <Input
                value={labelInput}
                onChange={(event) => setLabelInput(event.target.value)}
                placeholder="Add label..."
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    handleAddLabel();
                  }
                }}
              />
              <Button type="button" variant="outline" onClick={handleAddLabel}>
                Add
              </Button>
            </div>
            {form.labels.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {form.labels.map((label) => (
                  <span
                    key={label}
                    className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-muted rounded-full"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() =>
                        setForm({ ...form, labels: form.labels.filter((item) => item !== label) })
                      }
                      className="hover:text-destructive"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <Separator />

          <div className="space-y-3">
            <h4 className="text-sm font-medium">Code Context</h4>
            <div className="space-y-2">
              <Label htmlFor="task-url">URL</Label>
              <Input
                id="task-url"
                value={form.codeContext.url}
                onChange={(event) =>
                  setForm({
                    ...form,
                    codeContext: { ...form.codeContext, url: event.target.value },
                  })
                }
                placeholder="https://example.com/page"
              />
            </div>

            <div className="space-y-2">
              <Label>File Paths</Label>
              <div className="flex gap-2">
                <Input
                  value={filePathInput}
                  onChange={(event) => setFilePathInput(event.target.value)}
                  placeholder="src/components/..."
                  onKeyDown={(event) => {
                    if (event.key === "Enter") {
                      event.preventDefault();
                      handleAddFilePath();
                    }
                  }}
                />
                <Button type="button" variant="outline" onClick={handleAddFilePath}>
                  Add
                </Button>
              </div>
              {form.codeContext.filePaths.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {form.codeContext.filePaths.map((path) => (
                    <span
                      key={path}
                      className="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-muted rounded-full font-mono"
                    >
                      {path}
                      <button
                        type="button"
                        onClick={() =>
                          setForm({
                            ...form,
                            codeContext: {
                              ...form.codeContext,
                              filePaths: form.codeContext.filePaths.filter((item) => item !== path),
                            },
                          })
                        }
                        className="hover:text-destructive"
                      >
                        &times;
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="error-message">Error Message</Label>
              <Textarea
                id="error-message"
                value={form.codeContext.errorMessage}
                onChange={(event) =>
                  setForm({
                    ...form,
                    codeContext: { ...form.codeContext, errorMessage: event.target.value },
                  })
                }
                rows={2}
                placeholder="TypeError: Cannot read property..."
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="stack-trace">Stack Trace</Label>
              <Textarea
                id="stack-trace"
                value={form.codeContext.stackTrace}
                onChange={(event) =>
                  setForm({
                    ...form,
                    codeContext: { ...form.codeContext, stackTrace: event.target.value },
                  })
                }
                rows={3}
                placeholder="at Component.render (src/...)"
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="code-snippet">Code Snippet</Label>
              <Textarea
                id="code-snippet"
                value={form.codeContext.codeSnippet}
                onChange={(event) =>
                  setForm({
                    ...form,
                    codeContext: { ...form.codeContext, codeSnippet: event.target.value },
                  })
                }
                rows={4}
                placeholder="Paste relevant code..."
                className="font-mono text-xs"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="suggested-fix">Suggested Fix</Label>
              <Textarea
                id="suggested-fix"
                value={form.codeContext.suggestedFix}
                onChange={(event) =>
                  setForm({
                    ...form,
                    codeContext: { ...form.codeContext, suggestedFix: event.target.value },
                  })
                }
                rows={2}
                placeholder="Describe the potential fix..."
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="branch">Branch</Label>
                <Input
                  id="branch"
                  value={form.codeContext.branch}
                  onChange={(event) =>
                    setForm({ ...form, codeContext: { ...form.codeContext, branch: event.target.value } })
                  }
                  placeholder="main"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="commit-sha">Commit SHA</Label>
                <Input
                  id="commit-sha"
                  value={form.codeContext.commitSha}
                  onChange={(event) =>
                    setForm({ ...form, codeContext: { ...form.codeContext, commitSha: event.target.value } })
                  }
                  placeholder="abc123..."
                  className="font-mono"
                />
              </div>
            </div>
          </div>

          <Separator />

          {task.source.type === "slack" && task.source.slackChannelName && (
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center gap-2 text-sm">
                <MessageSquare className="size-4 text-muted-foreground" />
                <span className="text-muted-foreground">From Slack:</span>
                <span className="font-medium">#{task.source.slackChannelName}</span>
                {task.source.slackPermalink && (
                  <a
                    href={task.source.slackPermalink}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "ml-auto h-7 px-2")}
                  >
                    <ExternalLink className="h-3 w-3 mr-1" />
                    View in Slack
                  </a>
                )}
              </div>
            </div>
          )}

          <div className="flex items-center gap-4 text-xs text-muted-foreground pt-1">
            <div className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              Created {new Date(task.createdAt).toLocaleDateString()}
            </div>
            {task.completedAt && (
              <div className="flex items-center gap-1">
                <CheckSquare className="h-3 w-3" />
                Completed {new Date(task.completedAt).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
