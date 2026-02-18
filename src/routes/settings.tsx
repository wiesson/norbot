import { createFileRoute } from "@tanstack/react-router";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { LogOut, ChevronLeft } from "lucide-react";
import { requireAuthWithUser } from "@/lib/route-auth";

export const Route = createFileRoute("/settings")({
  beforeLoad: async ({ context }) => {
    return await requireAuthWithUser(context);
  },
  component: SettingsPage,
});

function SettingsPage() {
  const { user } = Route.useRouteContext();

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950">
      <header className="border-b bg-white dark:bg-neutral-900 sticky top-0 z-10">
        <div className="container mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <a
              href="/"
              className={cn(buttonVariants({ variant: "ghost", size: "icon" }), "mr-2")}
            >
              <ChevronLeft className="h-5 w-5" />
            </a>
            <h1 className="text-lg font-bold">Account Settings</h1>
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
        <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Profile</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16" size="lg">
                  <AvatarImage src={user.avatarUrl} alt={user.name} />
                  <AvatarFallback className="text-lg">{user.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-medium text-lg">{user.name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Workspaces</CardTitle>
            </CardHeader>
            <CardContent>
              {user.workspaces?.length ? (
                <div className="space-y-2">
                  {user.workspaces.map((ws: any) => (
                    <a
                      key={ws._id}
                      href={`/w/${ws.slug}`}
                      className="flex items-center justify-between p-3 rounded-lg border hover:bg-muted/50 transition-colors"
                    >
                      <div>
                        <p className="font-medium">{ws.name}</p>
                        <p className="text-xs text-muted-foreground">
                          /{ws.slug}
                        </p>
                      </div>
                      <span className="text-xs text-muted-foreground capitalize">
                        {ws.role}
                      </span>
                    </a>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">
                  You are not a member of any workspaces yet.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
