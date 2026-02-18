import { createFileRoute } from "@tanstack/react-router";
import { handler } from "@/lib/auth-server";

export const Route = createFileRoute("/logout")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const signOutUrl = new URL("/api/auth/sign-out", url.origin);

        const signOutResponse = await handler(
          new Request(signOutUrl, {
            method: "POST",
            headers: request.headers,
          })
        );

        const headers = new Headers();
        const setCookie = signOutResponse.headers.getSetCookie?.() ?? [];
        for (const cookie of setCookie) {
          headers.append("Set-Cookie", cookie);
        }
        headers.set("Location", "/login");

        return new Response(null, { status: 302, headers });
      },
    },
  },
});
