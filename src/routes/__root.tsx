import {
  Outlet,
  HeadContent,
  Scripts,
  createRootRoute,
} from "@tanstack/react-router";
import { Providers } from "@/app/providers";
import { Toaster } from "@/components/ui/sonner";
import appCss from "@/app/globals.css?url";

function RootComponent() {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body className="antialiased">
        <Providers>
          <Outlet />
          <Toaster />
        </Providers>
        <Scripts />
      </body>
    </html>
  );
}

export const Route = createRootRoute({
  component: RootComponent,
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Norbot - Task Agent" },
      {
        name: "description",
        content: "AI-powered task management with Claude Code integration",
      },
    ],
    links: [{ rel: "stylesheet", href: appCss }],
  }),
});
