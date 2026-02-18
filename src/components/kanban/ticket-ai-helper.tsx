"use client";

import { useState } from "react";
import { useAction } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { toast } from "sonner";
import { Sparkles, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

type TicketAssistMode = "summarize" | "rewrite" | "structure";

interface TicketAiHelperProps {
  workspaceId: Id<"workspaces">;
  text: string;
  title?: string;
  taskType?: "bug" | "feature" | "improvement" | "task" | "question";
  onApply: (nextText: string) => void;
  disabled?: boolean;
}

const assistModes: Array<{ mode: TicketAssistMode; label: string }> = [
  { mode: "summarize", label: "Summarize" },
  { mode: "rewrite", label: "Rewrite" },
  { mode: "structure", label: "Structure" },
];

export function TicketAiHelper({
  workspaceId,
  text,
  title,
  taskType,
  onApply,
  disabled = false,
}: TicketAiHelperProps) {
  const assistTicketText = useAction(api.ai.assistTicketText);
  const [activeMode, setActiveMode] = useState<TicketAssistMode | null>(null);

  const runAssist = async (mode: TicketAssistMode) => {
    if (!text.trim()) {
      toast.error("Write some description text first");
      return;
    }

    setActiveMode(mode);
    try {
      const result = await assistTicketText({
        workspaceId,
        text,
        mode,
        title: title?.trim() || undefined,
        taskType,
      });

      const nextText = result.text.trim();
      if (!nextText) {
        toast.error("No suggestion returned");
        return;
      }

      onApply(nextText);
    } catch {
      toast.error("AI helper failed");
    } finally {
      setActiveMode(null);
    }
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-xs text-muted-foreground inline-flex items-center gap-1">
        <Sparkles className="size-3" />
        AI helper
      </span>
      {assistModes.map(({ mode, label }) => (
        <Button
          key={mode}
          type="button"
          variant="outline"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={disabled || activeMode !== null}
          onClick={() => runAssist(mode)}
        >
          {activeMode === mode && <Loader2 className="size-3 mr-1 animate-spin" />}
          {label}
        </Button>
      ))}
    </div>
  );
}
