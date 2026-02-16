"use client";

import { useEffect } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { Dashboard } from "@/components/dashboard";
import { WaitingRoom } from "@/components/waiting-room";
import { SetupWizard } from "@/components/setup/setup-wizard";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { ArrowLeft } from "lucide-react";
import { LogoutButton } from "@/components/logout-button";
import { authClient } from "@/lib/auth-client";
import LoginPage from "@/app/login/page";

function FullScreenLoading({ label = "Loading..." }: { label?: string }) {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-pulse text-muted-foreground">{label}</div>
    </div>
  );
}

function useRequireAuth() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      navigate({ to: "/login", replace: true });
    }
  }, [isAuthenticated, isLoading, navigate]);

  return { user, isLoading, isAuthenticated };
}

export function HomeRouteView() {
  const { user, isLoading, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const hasWorkspaces = !!user.workspaces?.length;
      if (!hasWorkspaces) {
        navigate({ to: "/waiting", replace: true });
        return;
      }

      if (!user.onboarding?.completedAt) {
        navigate({ to: "/setup", replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  if (isLoading) {
    return <FullScreenLoading />;
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  if (!user) {
    return <FullScreenLoading />;
  }

  const hasWorkspaces = !!user.workspaces?.length;
  if (!hasWorkspaces || !user.onboarding?.completedAt) {
    return <FullScreenLoading />;
  }

  return <Dashboard user={user} />;
}

export function WaitingRouteView() {
  const { user, isLoading, isAuthenticated } = useRequireAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const hasWorkspaces = !!user.workspaces?.length;
      if (hasWorkspaces) {
        navigate({ to: "/", replace: true });
        return;
      }

      if (user.isApproved) {
        navigate({ to: "/setup", replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, user]);

  if (isLoading || !user) {
    return <FullScreenLoading />;
  }

  return <WaitingRoom user={user} />;
}

export function SetupRouteView() {
  const { user, isLoading, isAuthenticated } = useRequireAuth();
  const navigate = useNavigate();
  const searchStr = useRouterState({ select: (state) => state.location.searchStr });
  const step = new URLSearchParams(searchStr).get("step");

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      const hasWorkspaces = !!user.workspaces?.length;
      if (!hasWorkspaces && !user.isApproved) {
        navigate({ to: "/waiting", replace: true });
        return;
      }

      if (user.onboarding?.completedAt && !step) {
        navigate({ to: "/", replace: true });
      }
    }
  }, [isAuthenticated, isLoading, navigate, step, user]);

  if (isLoading || !user) {
    return <FullScreenLoading />;
  }

  return <SetupWizard user={user} />;
}

export function SettingsRouteView() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading || !user) {
    return <FullScreenLoading />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <Link
          to="/"
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

export function NewWorkspaceRouteView() {
  const { user, isLoading } = useRequireAuth();

  if (isLoading || !user) {
    return <FullScreenLoading />;
  }

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

export function LogoutRedirectRouteView() {
  const navigate = useNavigate();

  useEffect(() => {
    const run = async () => {
      try {
        await authClient.signOut();
      } finally {
        navigate({ to: "/login", replace: true });
      }
    };

    run();
  }, [navigate]);

  return <FullScreenLoading label="Signing out..." />;
}
