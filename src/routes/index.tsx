import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  component: LandingPage,
});

function LandingPage() {
  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex flex-col">
      <header className="border-b bg-white dark:bg-neutral-900">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <h1 className="text-xl font-bold text-emerald-600">Norbot</h1>
          <a href="/login">
            <Button variant="outline" size="sm">
              Sign In
            </Button>
          </a>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center">
        <div className="text-center max-w-2xl px-4 space-y-6">
          <h2 className="text-4xl font-bold tracking-tight">
            AI-Powered Task Management
          </h2>
          <p className="text-lg text-muted-foreground">
            Extract tasks from Slack, manage them on a kanban board, and let
            Claude Code fix bugs automatically.
          </p>
          <div className="flex gap-4 justify-center">
            <a href="/signup">
              <Button size="lg">Get Started</Button>
            </a>
            <a href="/login">
              <Button variant="outline" size="lg">
                Sign In
              </Button>
            </a>
          </div>
        </div>
      </main>
    </div>
  );
}
