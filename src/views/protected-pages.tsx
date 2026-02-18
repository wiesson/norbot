"use client";

import { Link } from "@tanstack/react-router";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";

interface User {
  name: string;
  email: string;
  avatarUrl: string;
  githubUsername: string;
}

export function SettingsRouteView({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          to="/app"
          className={cn(buttonVariants({ variant: "ghost", size: "sm" }), "mb-6")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold mb-6">Settings</h1>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Profile</CardTitle>
          </CardHeader>
          <CardContent className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.avatarUrl} alt={user.name} />
              <AvatarFallback>{user.name[0]}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">{user.name}</p>
              <p className="text-sm text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground">@{user.githubUsername}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
          </CardHeader>
          <CardContent>
            <LogoutButton className={cn(buttonVariants({ variant: "destructive" }))}>
              Sign Out
            </LogoutButton>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

export function NewWorkspaceRouteView({ user }: { user: User }) {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center">
      <Card className="max-w-md w-full mx-4">
        <CardContent className="py-8 text-center">
          <h1 className="text-xl font-bold mb-2">Create a Workspace</h1>
          <p className="text-muted-foreground mb-6">
            Workspaces are created by connecting a Slack workspace. This allows Norbot to receive
            tasks and communicate with your team.
          </p>
          <a href="/setup?step=slack" className={cn(buttonVariants())}>
            Connect Slack
          </a>
        </CardContent>
      </Card>
    </div>
  );
}
