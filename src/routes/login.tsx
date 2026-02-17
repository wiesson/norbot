import { FormEvent, useEffect, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { useNavigate } from "@tanstack/react-router";
import { redirectAuthenticatedToHome } from "@/lib/route-auth";

const getProviders = createServerFn({ method: "GET" }).handler(async () => {
  return await fetchAuthQuery(api.auth.providersStatus, {});
});

function LoginRouteView() {
  const navigate = useNavigate();
  const { data: session } = authClient.useSession();
  const providers = Route.useLoaderData();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (session) {
      navigate({ to: "/", replace: true });
    }
  }, [navigate, session]);

  const handleSocialSignIn = async (provider: "github" | "google") => {
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start sign-in");
      setIsLoading(false);
    }
  };

  const handleMagicLink = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!email.trim()) {
      setError("Email is required");
      return;
    }

    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      await (authClient.signIn as any).magicLink({
        email: email.trim(),
        callbackURL: "/",
      });
      setMessage("Magic link sent. Check your inbox.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to send magic link");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Sign in to Norbot</CardTitle>
          <CardDescription>
            Available login methods are shown based on server configuration.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {providers?.github && (
            <Button
              type="button"
              className="w-full"
              disabled={isLoading}
              onClick={() => handleSocialSignIn("github")}
            >
              Continue with GitHub
            </Button>
          )}

          {providers?.google && (
            <Button
              type="button"
              className="w-full"
              variant="outline"
              disabled={isLoading}
              onClick={() => handleSocialSignIn("google")}
            >
              Continue with Google
            </Button>
          )}

          {providers?.magicLink && (
            <>
              {(providers.github || providers.google) && (
                <div className="relative py-1">
                  <div className="absolute inset-0 flex items-center">
                    <span className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center text-xs uppercase">
                    <span className="bg-card px-2 text-muted-foreground">or</span>
                  </div>
                </div>
              )}
              <form onSubmit={handleMagicLink} className="space-y-3">
                <Label htmlFor="magic-link-email">Email</Label>
                <Input
                  id="magic-link-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
                <Button type="submit" variant="secondary" className="w-full" disabled={isLoading}>
                  Send Magic Link
                </Button>
              </form>
            </>
          )}

          {providers &&
            !providers.github &&
            !providers.google &&
            !providers.magicLink && (
              <p className="text-sm text-muted-foreground">
                No login methods are configured yet. Please contact the admin.
              </p>
            )}

          {message && <p className="text-sm text-emerald-600">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}

export const Route = createFileRoute("/login")({
  beforeLoad: ({ context }) => {
    redirectAuthenticatedToHome(context);
  },
  loader: () => getProviders(),
  component: LoginRouteView,
});
