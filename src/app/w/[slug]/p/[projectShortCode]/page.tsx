"use client";

import { use, useEffect, useMemo } from "react";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { useAuth } from "@/hooks/use-auth";
import { useRouter, useRouterState } from "@tanstack/react-router";
import { KanbanBoard } from "@/components/kanban/kanban-board";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Settings, LogOut, ChevronLeft, GitBranch, Slack } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";

interface ProjectPageProps {
  params: Promise<{ slug: string; projectShortCode: string }>;
}

export default function ProjectPage({ params }: ProjectPageProps) {
  const { slug, projectShortCode } = use(params);
  const { user, isLoading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const searchParams = useMemo(() => {
    const raw = searchStr.startsWith("?") ? searchStr.slice(1) : searchStr;
    return new URLSearchParams(raw);
  }, [searchStr]);

  const repoFilter = searchParams.get("repo");
  const isAllProjects = projectShortCode.toLowerCase() === "all";

  const workspace = useQuery(api.workspaces.getBySlug, { slug });
  const repositories = useQuery(
    api.repositories.list,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const projects = useQuery(
    api.projects.list,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  const selectedProject = isAllProjects
    ? undefined
    : projects?.find((p) => p.shortCode.toUpperCase() === projectShortCode.toUpperCase());

  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.history.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  const updateRepoFilter = (value: string | null) => {
    if (value === null) return;
    const params = new URLSearchParams(searchParams.toString());
    if (value === "all") {
      params.delete("repo");
    } else {
      params.set("repo", value);
    }
    const query = params.toString();
    router.history.push(query ? `?${query}` : "?");
  };

  if (authLoading || !workspace || !projects) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (!isAllProjects && !selectedProject) {
    return (
      <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
        <div className="container mx-auto px-4 py-8 max-w-2xl">
          <a
            href={`/w/${slug}`}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}
          >
            <ChevronLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </a>
          <Card>
            <CardContent className="py-8 text-center space-y-2">
              <p className="font-medium">Project not found</p>
              <p className="text-sm text-muted-foreground">
                No project with code <code>{projectShortCode}</code> exists in this workspace.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b bg-white dark:bg-neutral-900 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href={`/w/${slug}`}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "mr-2")}
            >
              <ChevronLeft className="h-5 w-5" />
            </a>
            <div>
              <h1 className="text-lg font-bold flex items-center gap-2">
                {workspace.name}
                <Badge variant="secondary" className="text-xs font-normal">
                  <Slack className="h-3 w-3 mr-1" />
                  {workspace.slackTeamName}
                </Badge>
                <Badge>{isAllProjects ? "ALL" : selectedProject?.shortCode}</Badge>
              </h1>
              <p className="text-xs text-muted-foreground">
                {isAllProjects ? "All workspace tasks" : selectedProject?.name}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden lg:flex gap-1">
              <a href={`/w/${slug}/p/all`} className={buttonVariants({ size: "sm", variant: isAllProjects ? "default" : "outline" })}>
                All
              </a>
              {projects.map((project) => (
                <a
                  key={project._id}
                  href={`/w/${slug}/p/${project.shortCode}`}
                  className={buttonVariants({
                    size: "sm",
                    variant: !isAllProjects && selectedProject?._id === project._id ? "default" : "outline",
                  })}
                >
                  {project.shortCode}
                </a>
              ))}
            </div>

            {repositories && repositories.length > 0 && (
              <Select
                value={repoFilter ?? "all"}
                onValueChange={updateRepoFilter}
              >
                <SelectTrigger className="w-[200px]">
                  <GitBranch className="size-4 mr-2 text-muted-foreground" />
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All repositories</SelectItem>
                  {repositories.map((repo) => (
                    <SelectItem key={repo._id} value={repo._id}>
                      {repo.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}

            <a
              href={`/w/${slug}/settings`}
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            >
              <Settings className="h-5 w-5" />
            </a>
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={user.avatarUrl} alt={user.name} />
                <AvatarFallback>{user.name[0]}</AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium hidden sm:inline">
                {user.name}
              </span>
            </div>
            <a
              href="/api/auth/logout"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            >
              <LogOut className="h-5 w-5" />
            </a>
          </div>
        </div>
      </header>

      <main className="py-6">
        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8">
          <KanbanBoard
            workspaceId={workspace._id}
            repositoryId={repoFilter ? (repoFilter as Id<"repositories">) : undefined}
            projectId={selectedProject?._id}
          />
        </div>
      </main>
    </div>
  );
}
