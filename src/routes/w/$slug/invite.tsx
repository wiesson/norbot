import { Link, createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Doc } from "@convex/_generated/dataModel";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ArrowLeft, Check, Clock, Copy, Github, UserPlus, Users, X } from "lucide-react";
import { useWorkspace } from "./route";

type Role = "admin" | "member" | "viewer";

export const Route = createFileRoute("/w/$slug/invite")({
  component: WorkspaceInvitePage,
});

function WorkspaceInvitePage() {
  const { slug } = Route.useParams();
  const { user } = Route.useRouteContext();
  const workspace = useWorkspace();

  const [githubUsername, setGithubUsername] = useState("");
  const [role, setRole] = useState<Role>("member");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<{
    type: "added_directly" | "invitation_created";
    token?: string;
  } | null>(null);

  const userMembership = useQuery(
    api.workspaces.getUserMembership,
    workspace ? { workspaceId: workspace._id, userId: user._id } : "skip"
  );
  const pendingInvitations = useQuery(
    api.invitations.getPendingForWorkspace,
    workspace ? { workspaceId: workspace._id } : "skip"
  );
  const waitingUsers = useQuery(api.users.listUsersWithoutWorkspaces);

  const createInvitation = useMutation(api.invitations.create);
  const cancelInvitation = useMutation(api.invitations.cancel);

  const isAdmin = userMembership?.role === "admin";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!workspace || !githubUsername.trim()) return;

    setIsSubmitting(true);
    setError(null);
    setLastResult(null);

    try {
      const result = await createInvitation({
        workspaceId: workspace._id,
        githubUsername: githubUsername.trim(),
        role,
        invitedById: user._id,
      });
      setLastResult(result);
      setGithubUsername("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create invitation");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancelInvitation = async (invitationId: Doc<"workspaceInvitations">["_id"]) => {
    try {
      await cancelInvitation({ invitationId });
    } catch (err) {
      console.error("Failed to cancel invitation:", err);
    }
  };

  const handleCopyLink = async (token: string) => {
    const inviteUrl = `${window.location.origin}/invite/${token}`;
    await navigator.clipboard.writeText(inviteUrl);
    setCopiedToken(token);
    setTimeout(() => setCopiedToken(null), 2000);
  };

  if (!workspace || userMembership === undefined) {
    return (
      <div className="py-12 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading...</div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <main className="py-6">
        <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8">
          <Link
            to="/w/$slug/settings"
            params={{ slug }}
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Settings
          </Link>

          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Only workspace admins can invite new members.</p>
            </CardContent>
          </Card>
        </div>
      </main>
    );
  }

  return (
    <main className="py-6">
      <div className="max-w-[900px] mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <Link
          to="/w/$slug/settings"
          params={{ slug }}
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Settings
        </Link>

        <h2 className="text-2xl font-semibold">Invite Members</h2>

        {waitingUsers && waitingUsers.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-amber-500" />
                Users Waiting for Access ({waitingUsers.length})
              </CardTitle>
              <CardDescription>
                Users who signed up but are not in any workspace yet.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {waitingUsers.map((waitingUser) => {
                  const candidate = waitingUser.githubUsername ?? "";

                  return (
                    <div
                      key={waitingUser._id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          {candidate ? (
                            <AvatarImage
                              src={`https://github.com/${candidate}.png`}
                              alt={candidate}
                            />
                          ) : null}
                          <AvatarFallback>
                            {(waitingUser.name?.[0] ?? "?").toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium">{waitingUser.name}</p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Github className="h-3 w-3" />
                            {candidate || "No GitHub username"}
                          </p>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setGithubUsername(candidate)}
                        disabled={!candidate}
                      >
                        <UserPlus className="h-4 w-4 mr-2" />
                        Invite
                      </Button>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle>Invite by GitHub Username</CardTitle>
            <CardDescription>Invite users into {workspace.name}.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex gap-3">
                <div className="flex-1 space-y-2">
                  <Label htmlFor="github-username">GitHub Username</Label>
                  <Input
                    id="github-username"
                    value={githubUsername}
                    onChange={(e) => setGithubUsername(e.target.value)}
                    placeholder="username"
                  />
                </div>

                <div className="space-y-2">
                  <Label>Role</Label>
                  <Select value={role} onValueChange={(value) => setRole(value as Role)}>
                    <SelectTrigger className="w-[120px]">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="member">Member</SelectItem>
                      <SelectItem value="viewer">Viewer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {error ? <p className="text-sm text-destructive">{error}</p> : null}

              {lastResult ? (
                <div className="rounded-lg border p-4 bg-muted/50 space-y-2">
                  {lastResult.type === "added_directly" ? (
                    <p className="text-sm text-green-600 dark:text-green-400 flex items-center gap-2">
                      <Check className="h-4 w-4" />
                      User added to workspace.
                    </p>
                  ) : (
                    <>
                      <p className="text-sm flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400" />
                        Invitation created.
                      </p>
                      <div className="flex gap-2">
                        <Input
                          readOnly
                          value={`${window.location.origin}/invite/${lastResult.token}`}
                          className="font-mono text-xs"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          size="icon"
                          onClick={() => handleCopyLink(lastResult.token!)}
                        >
                          {copiedToken === lastResult.token ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </>
                  )}
                </div>
              ) : null}

              <Button type="submit" disabled={isSubmitting || !githubUsername.trim()}>
                <UserPlus className="h-4 w-4 mr-2" />
                {isSubmitting ? "Inviting..." : "Send Invitation"}
              </Button>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>Invitations not accepted yet.</CardDescription>
          </CardHeader>
          <CardContent>
            {pendingInvitations && pendingInvitations.length > 0 ? (
              <div className="space-y-4">
                {pendingInvitations.map((invitation) => {
                  const isExpired = invitation.expiresAt < Date.now();
                  const daysLeft = Math.ceil(
                    (invitation.expiresAt - Date.now()) / (1000 * 60 * 60 * 24)
                  );

                  return (
                    <div
                      key={invitation._id}
                      className="flex items-center justify-between p-3 rounded-lg border"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`https://github.com/${invitation.githubUsername}.png`}
                            alt={invitation.githubUsername}
                          />
                          <AvatarFallback>
                            {invitation.githubUsername[0]?.toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium flex items-center gap-2">
                            <Github className="h-3 w-3" />
                            {invitation.githubUsername}
                          </p>
                          <p className="text-xs text-muted-foreground flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {isExpired ? (
                              <span className="text-destructive">Expired</span>
                            ) : (
                              <span>Expires in {daysLeft} day{daysLeft !== 1 ? "s" : ""}</span>
                            )}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="capitalize">
                          {invitation.role}
                        </Badge>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleCopyLink(invitation.token)}
                        >
                          {copiedToken === invitation.token ? (
                            <Check className="h-4 w-4" />
                          ) : (
                            <Copy className="h-4 w-4" />
                          )}
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon-sm"
                          onClick={() => handleCancelInvitation(invitation._id)}
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-center py-8 text-muted-foreground">No pending invitations.</p>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
