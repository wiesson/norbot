"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { toast } from "sonner";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import {
  Bug,
  Lightbulb,
  Zap,
  HelpCircle,
  CheckSquare,
  GitPullRequest,
  MessageSquare,
  ExternalLink,
  Clock,
  Loader2,
  Pencil,
  X,
  Check,
  FileIcon,
  ImageIcon,
  Download,
} from "lucide-react";
import { TiptapEditor } from "@/components/tiptap-editor";

interface TaskDetailModalProps {
  taskId: Id<"tasks">;
  onClose: () => void;
}

const priorityColors = {
  critical: "bg-red-500/10 text-red-600 border-red-200",
  high: "bg-orange-500/10 text-orange-600 border-orange-200",
  medium: "bg-yellow-500/10 text-yellow-600 border-yellow-200",
  low: "bg-slate-500/10 text-slate-600 border-slate-200",
};

const statusLabels = {
  backlog: "Backlog",
  todo: "To Do",
  in_progress: "In Progress",
  in_review: "In Review",
  done: "Done",
  cancelled: "Cancelled",
};

const taskTypeIcons = {
  bug: Bug,
  feature: Lightbulb,
  improvement: Zap,
  task: CheckSquare,
  question: HelpCircle,
};

const taskTypeColors = {
  bug: "text-red-500",
  feature: "text-purple-500",
  improvement: "text-blue-500",
  task: "text-slate-500",
  question: "text-amber-500",
};

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentItem({
  attachment,
}: {
  attachment: {
    storageId: Id<"_storage">;
    filename: string;
    mimeType: string;
    size: number;
  };
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
      <span className="text-muted-foreground text-xs shrink-0">
        {formatFileSize(attachment.size)}
      </span>
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
    </div>
  );
}

export function TaskDetailModal({ taskId, onClose }: TaskDetailModalProps) {
  const task = useQuery(api.tasks.getById, { id: taskId });
  const updateStatus = useMutation(api.tasks.updateStatus);
  const updateDescription = useMutation(api.tasks.updateDescription);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isEditingDescription, setIsEditingDescription] = useState(false);
  const [editedDescription, setEditedDescription] = useState("");
  const [isSavingDescription, setIsSavingDescription] = useState(false);

  if (!task) {
    return (
      <Dialog open onOpenChange={(open) => !open && onClose()}>
        <DialogContent className="sm:max-w-xl">
          <div className="animate-pulse text-muted-foreground text-center py-8">
            Loading task...
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  const TypeIcon = taskTypeIcons[task.taskType];

  const handleStatusChange = async (newStatus: string | null) => {
    if (!newStatus || isUpdatingStatus) return;
    setIsUpdatingStatus(true);
    try {
      await updateStatus({
        id: taskId,
        status: newStatus as
          | "backlog"
          | "todo"
          | "in_progress"
          | "in_review"
          | "done"
          | "cancelled",
      });
    } catch (error) {
      console.error("Failed to update status:", error);
      toast.error("Failed to update status");
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const handleStartEditing = () => {
    setEditedDescription(task.description ?? "");
    setIsEditingDescription(true);
  };

  const handleCancelEditing = () => {
    setIsEditingDescription(false);
    setEditedDescription("");
  };

  const handleSaveDescription = async () => {
    setIsSavingDescription(true);
    try {
      await updateDescription({
        id: taskId,
        description: editedDescription,
      });
      setIsEditingDescription(false);
    } catch (error) {
      console.error("Failed to update description:", error);
      toast.error("Failed to update description");
    } finally {
      setIsSavingDescription(false);
    }
  };

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-2xl max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-2 mb-1">
            <TypeIcon
              className={cn("h-5 w-5", taskTypeColors[task.taskType])}
            />
            <span className="font-mono text-sm text-muted-foreground">
              {task.displayId}
            </span>
            <Badge
              variant="outline"
              className={cn("ml-auto", priorityColors[task.priority])}
            >
              {task.priority}
            </Badge>
          </div>
          <DialogTitle className="text-xl">{task.title}</DialogTitle>
        </DialogHeader>

        {/* Description */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-sm font-medium">Description</h4>
            {!isEditingDescription ? (
              <Button variant="ghost" size="sm" className="h-7 px-2" onClick={handleStartEditing}>
                <Pencil className="size-3 mr-1" />
                Edit
              </Button>
            ) : (
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 px-2"
                  onClick={handleCancelEditing}
                  disabled={isSavingDescription}
                >
                  <X className="size-3 mr-1" />
                  Cancel
                </Button>
                <Button
                  variant="default"
                  size="sm"
                  className="h-7 px-2"
                  onClick={handleSaveDescription}
                  disabled={isSavingDescription}
                >
                  {isSavingDescription ? (
                    <Loader2 className="size-3 mr-1 animate-spin" />
                  ) : (
                    <Check className="size-3 mr-1" />
                  )}
                  Save
                </Button>
              </div>
            )}
          </div>
          {isEditingDescription ? (
            <TiptapEditor
              value={editedDescription}
              onChange={setEditedDescription}
              editable
              placeholder="Add a description..."
            />
          ) : task.description ? (
            <TiptapEditor value={task.description} editable={false} />
          ) : (
            <p className="text-sm text-muted-foreground italic">No description</p>
          )}
        </div>

        <Separator />

        {/* Attachments */}
        {task.attachments && task.attachments.length > 0 && (
          <>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Attachments</h4>
              {/* Image thumbnails */}
              {task.attachments.some((a) => a.mimeType.startsWith("image/")) && (
                <div className="flex flex-wrap gap-2">
                  {task.attachments
                    .filter((a) => a.mimeType.startsWith("image/"))
                    .map((attachment) => (
                      <AttachmentThumbnail
                        key={attachment.storageId}
                        storageId={attachment.storageId as Id<"_storage">}
                        filename={attachment.filename}
                      />
                    ))}
                </div>
              )}
              {/* File list */}
              <div className="space-y-1.5">
                {task.attachments.map((attachment) => (
                  <AttachmentItem
                    key={attachment.storageId}
                    attachment={attachment as { storageId: Id<"_storage">; filename: string; mimeType: string; size: number }}
                  />
                ))}
              </div>
            </div>
            <Separator />
          </>
        )}

        {/* Status & Actions */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Status
            </label>
            <Select value={task.status} onValueChange={handleStatusChange} disabled={isUpdatingStatus}>
              <SelectTrigger className="w-full">
                {isUpdatingStatus ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : (
                  <SelectValue />
                )}
              </SelectTrigger>
              <SelectContent>
                {Object.entries(statusLabels).map(([value, label]) => (
                  <SelectItem key={value} value={value}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground mb-1.5 block">
              Type
            </label>
            <div className="flex items-center gap-2 h-9 px-3 border rounded-md bg-muted/50">
              <TypeIcon
                className={cn("size-4", taskTypeColors[task.taskType])}
              />
              <span className="text-sm capitalize">{task.taskType}</span>
            </div>
          </div>
        </div>

        {/* Source Info */}
        {task.source.type === "slack" && task.source.slackChannelName && (
          <div className="bg-muted/50 rounded-lg p-3">
            <div className="flex items-center gap-2 text-sm">
              <MessageSquare className="size-4 text-muted-foreground" />
              <span className="text-muted-foreground">From Slack:</span>
              <span className="font-medium">
                #{task.source.slackChannelName}
              </span>
              {task.source.slackPermalink && (
                <a
                  href={task.source.slackPermalink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    buttonVariants({ variant: "ghost", size: "sm" }),
                    "ml-auto h-7 px-2"
                  )}
                >
                  <ExternalLink className="h-3 w-3 mr-1" />
                  View in Slack
                </a>
              )}
            </div>
          </div>
        )}

        {/* Code Context */}
        {task.codeContext && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Code Context</h4>
            <div className="bg-muted/50 rounded-lg p-3 space-y-2">
              {task.codeContext.filePaths &&
                task.codeContext.filePaths.length > 0 && (
                  <div>
                    <span className="text-xs text-muted-foreground">
                      Files:
                    </span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {task.codeContext.filePaths.map((path) => (
                        <Badge
                          key={path}
                          variant="secondary"
                          className="font-mono text-xs"
                        >
                          {path}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              {task.codeContext.errorMessage && (
                <div>
                  <span className="text-xs text-muted-foreground">Error:</span>
                  <pre className="mt-1 text-xs bg-red-50 dark:bg-red-950/20 text-red-600 p-2 rounded overflow-x-auto">
                    {task.codeContext.errorMessage}
                  </pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Claude Code Execution */}
        {task.claudeCodeExecution && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium flex items-center gap-2">
              <GitPullRequest className="size-4" />
              Claude Code
            </h4>
            <div className="bg-muted/50 rounded-lg p-3">
              <div className="flex items-center justify-between">
                <Badge
                  className={cn({
                    "bg-yellow-100 text-yellow-700":
                      task.claudeCodeExecution.status === "pending",
                    "bg-blue-100 text-blue-700":
                      task.claudeCodeExecution.status === "running",
                    "bg-green-100 text-green-700":
                      task.claudeCodeExecution.status === "completed",
                    "bg-red-100 text-red-700":
                      task.claudeCodeExecution.status === "failed",
                  })}
                >
                  {task.claudeCodeExecution.status}
                </Badge>
                {task.claudeCodeExecution.pullRequestUrl && (
                  <a
                    href={task.claudeCodeExecution.pullRequestUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={cn(
                      buttonVariants({ variant: "outline", size: "sm" })
                    )}
                  >
                    <GitPullRequest className="h-3 w-3 mr-1" />
                    View PR
                  </a>
                )}
              </div>
              {task.claudeCodeExecution.branchName && (
                <div className="mt-2 text-xs text-muted-foreground">
                  Branch: <code>{task.claudeCodeExecution.branchName}</code>
                </div>
              )}
              {task.claudeCodeExecution.errorMessage && (
                <pre className="mt-2 text-xs bg-red-50 dark:bg-red-950/20 text-red-600 p-2 rounded overflow-x-auto">
                  {task.claudeCodeExecution.errorMessage}
                </pre>
              )}
            </div>
          </div>
        )}

        {/* Labels */}
        {task.labels.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-sm font-medium">Labels</h4>
            <div className="flex flex-wrap gap-1">
              {task.labels.map((label) => (
                <Badge key={label} variant="secondary">
                  {label}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {/* Metadata */}
        <div className="flex items-center gap-4 text-xs text-muted-foreground pt-2">
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

        <DialogFooter showCloseButton />
      </DialogContent>
    </Dialog>
  );
}

function AttachmentThumbnail({
  storageId,
  filename,
}: {
  storageId: Id<"_storage">;
  filename: string;
}) {
  const fileUrl = useQuery(api.tasks.getFileUrl, { storageId });

  if (!fileUrl) return null;

  return (
    <a
      href={fileUrl}
      target="_blank"
      rel="noopener noreferrer"
      className="block rounded-md overflow-hidden border hover:ring-2 hover:ring-ring transition-shadow"
    >
      <img
        src={fileUrl}
        alt={filename}
        className="h-20 w-auto object-cover"
      />
    </a>
  );
}
