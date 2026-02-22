import { createFileRoute, Link, Navigate } from "@tanstack/react-router";
import { useConvexQuery } from "@/hooks/use-convex-query";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { ProjectSettingsDialog } from "@/components/features/project-settings-dialog";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Settings } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/w/$workspaceId/p/$projectId")({
  component: ProjectPage,
});

function ProjectPage() {
  const { workspaceId, projectId } = Route.useParams();
  const { data: project, error } = useConvexQuery(api.projects.getById, {
    id: projectId as Id<"projects">,
  });
  const [settingsOpen, setSettingsOpen] = useState(false);

  if (project === undefined && !error) return null;

  if (!project) {
    return <Navigate to="/w/$workspaceId" params={{ workspaceId }} />;
  }

  return (
    <main className="flex flex-col h-[calc(100vh-3.5rem)]">
      <div className="px-4 sm:px-6 lg:px-8 py-3 border-b flex items-center gap-3">
        <Link
          to="/w/$workspaceId"
          params={{ workspaceId }}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
        </Link>
        <h2 className="text-lg font-semibold">{project.name}</h2>
        <Button
          variant="ghost"
          size="icon-sm"
          onClick={() => setSettingsOpen(true)}
          className="ml-auto text-muted-foreground"
        >
          <Settings className="h-4 w-4" />
        </Button>
        <ProjectSettingsDialog
          projectId={project._id}
          open={settingsOpen}
          onOpenChange={setSettingsOpen}
        />
      </div>
      <div className="flex-1 overflow-hidden">
        <KanbanBoard
          workspaceId={project.workspaceId}
          projectId={project._id}
        />
      </div>
    </main>
  );
}
