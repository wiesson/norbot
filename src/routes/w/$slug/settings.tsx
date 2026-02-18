import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { ChevronLeft, LogOut, UserPlus } from "lucide-react";
import { requireApprovedUser } from "@/lib/route-auth";

export const Route = createFileRoute("/w/$slug/settings")({
  beforeLoad: async ({ context }) => {
    return await requireApprovedUser(context);
  },
  component: WorkspaceSettingsPage,
});

function WorkspaceSettingsPage() {
  const { slug } = Route.useParams();
  const { user } = Route.useRouteContext();

  const workspace = useQuery(api.workspaces.getBySlug, { slug });
  const members = useQuery(
    api.workspaces.getMembers,
    workspace ? { workspaceId: workspace._id } : "skip"
  );

  if (workspace === undefined) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (workspace === null) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground">Workspace not found.</div>
      </div>
    );
  }

  const currentMembership = members?.find((m: any) => m.userId === user._id);
  const isAdmin = currentMembership?.role === "admin";

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b bg-white dark:bg-neutral-900 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href={`/w/${slug}`}
              className={cn(
                buttonVariants({ variant: "ghost", size: "icon" }),
                "mr-2"
              )}
            >
              <ChevronLeft className="h-5 w-5" />
            </a>
            <div>
              <h1 className="text-lg font-bold">
                {workspace.name} - Settings
              </h1>
              <p className="text-xs text-muted-foreground">/{workspace.slug}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
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
              href="/logout"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }))}
            >
              <LogOut className="h-5 w-5" />
            </a>
          </div>
        </div>
      </header>

      <main className="py-6">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          {/* General */}
          <Card>
            <CardHeader>
              <CardTitle>General</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium">Name</p>
                <p className="text-muted-foreground">{workspace.name}</p>
              </div>
              <div>
                <p className="text-sm font-medium">Slug</p>
                <p className="text-muted-foreground">/{workspace.slug}</p>
              </div>
              {workspace.slackTeamName && (
                <div>
                  <p className="text-sm font-medium">Slack Team</p>
                  <p className="text-muted-foreground">
                    {workspace.slackTeamName}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Members */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle>Members</CardTitle>
              {isAdmin && (
                <a href={`/w/${slug}/invite`}>
                  <Button variant="outline" size="sm">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite
                  </Button>
                </a>
              )}
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {members?.map((member: any) => (
                  <div
                    key={member.membershipId ?? member.userId}
                    className="flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarImage
                          src={member.avatarUrl ?? undefined}
                          alt={member.name}
                        />
                        <AvatarFallback>
                          {member.name?.[0] ?? "?"}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium">
                          {member.name}
                          {member.userId === user._id && (
                            <span className="text-muted-foreground ml-1">
                              (you)
                            </span>
                          )}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {member.email}
                        </p>
                      </div>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {member.role}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
