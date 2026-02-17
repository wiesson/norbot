import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/router-devtools";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";
import appCss from "@/app/globals.css?url";

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <meta charSet="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <HeadContent />
      </head>
      <body className="antialiased">
        <Providers>
          <Outlet />
          <Toaster />
        </Providers>
        <TanStackRouterDevtools />
        <Scripts />
      </body>
    </html>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [
      { title: "Norbot - Task Agent" },
      {
        name: "description",
        content: "AI-powered task management with Claude Code integration",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
});
