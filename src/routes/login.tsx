import { FormEvent, useState } from "react";
import { createFileRoute } from "@tanstack/react-router";
import { createServerFn } from "@tanstack/react-start";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fetchAuthQuery } from "@/lib/auth-server";
import { api } from "@convex/_generated/api";
import { authClient } from "@/lib/auth-client";
import { redirectAuthenticatedToHome } from "@/lib/route-auth";

const getProviders = createServerFn({ method: "GET" }).handler(async () => {
  return await fetchAuthQuery(api.authFunctions.providersStatus, {});
});

export const Route = createFileRoute("/login")({
  validateSearch: (search: Record<string, unknown>) => {
    const redirectTo =
      typeof search.redirect === "string" ? search.redirect : undefined;
    const isSafeRedirect = redirectTo?.startsWith("/")
      ? redirectTo
      : undefined;
    return { redirect: isSafeRedirect };
  },
  beforeLoad: async ({ context, search }) => {
    await redirectAuthenticatedToHome(context, search.redirect);
  },
  loader: () => getProviders(),
  component: LoginRouteView,
});

function LoginRouteView() {
  const { redirect: redirectTo } = Route.useSearch();
  const providers = Route.useLoaderData();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleEmailPasswordSignIn = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!email.trim() || !password.trim()) {
      setError("Email and password are required");
      return;
    }

    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      const result = await authClient.signIn.email({
        email: email.trim(),
        password,
      });
      if (result.error) {
        setError(result.error.message || "Failed to sign in");
        setIsLoading(false);
        return;
      }
      window.location.href = redirectTo || "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign in");
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "github" | "google") => {
    setError(null);
    setMessage(null);
    setIsLoading(true);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: redirectTo || "/",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start sign-in");
      setIsLoading(false);
    }
  };

  const handleMagicLink = async () => {
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
        callbackURL: redirectTo || "/",
      });
      setMessage("Magic link sent. Check your inbox.");
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to send magic link"
      );
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
            Sign in to your account to continue.
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

          {(providers?.github || providers?.google) && (
            <div className="relative py-1">
              <div className="absolute inset-0 flex items-center">
                <span className="w-full border-t" />
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-card px-2 text-muted-foreground">or</span>
              </div>
            </div>
          )}

          {providers?.password && (
            <form onSubmit={handleEmailPasswordSignIn} className="space-y-3">
              <div>
                <Label htmlFor="login-email">Email</Label>
                <Input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="login-password">Password</Label>
                <Input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Your password"
                  autoComplete="current-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                Sign In
              </Button>
            </form>
          )}

          {providers?.magicLink && (
            <Button
              type="button"
              variant="secondary"
              className="w-full"
              disabled={isLoading || !email.trim()}
              onClick={handleMagicLink}
            >
              Send Magic Link
            </Button>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Don&apos;t have an account?{" "}
            <a href="/signup" className="text-primary hover:underline">
              Sign up
            </a>
          </div>

          {message && <p className="text-sm text-emerald-600">{message}</p>}
          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
