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

export const Route = createFileRoute("/signup")({
  beforeLoad: async ({ context }) => {
    await redirectAuthenticatedToHome(context);
  },
  loader: () => getProviders(),
  component: SignupRouteView,
});

function SignupRouteView() {
  const providers = Route.useLoaderData();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSignUp = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!name.trim() || !email.trim() || !password.trim()) {
      setError("All fields are required");
      return;
    }

    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      const result = await authClient.signUp.email({
        email: email.trim(),
        password,
        name: name.trim(),
      });
      if (result.error) {
        setError(result.error.message || "Failed to sign up");
        setIsLoading(false);
        return;
      }
      window.location.href = "/";
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to sign up");
      setIsLoading(false);
    }
  };

  const handleSocialSignIn = async (provider: "github" | "google") => {
    setError(null);
    setIsLoading(true);

    try {
      await authClient.signIn.social({
        provider,
        callbackURL: "/",
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to start sign-up");
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 dark:bg-neutral-950 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle>Create an account</CardTitle>
          <CardDescription>
            Sign up for Norbot to get started.
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
            <form onSubmit={handleSignUp} className="space-y-3">
              <div>
                <Label htmlFor="signup-name">Name</Label>
                <Input
                  id="signup-name"
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Your name"
                  autoComplete="name"
                />
              </div>
              <div>
                <Label htmlFor="signup-email">Email</Label>
                <Input
                  id="signup-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@company.com"
                  autoComplete="email"
                />
              </div>
              <div>
                <Label htmlFor="signup-password">Password</Label>
                <Input
                  id="signup-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="At least 8 characters"
                  autoComplete="new-password"
                />
              </div>
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                Create Account
              </Button>
            </form>
          )}

          <div className="text-center text-sm text-muted-foreground">
            Already have an account?{" "}
            <a href="/login" className="text-primary hover:underline">
              Sign in
            </a>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}
        </CardContent>
      </Card>
    </div>
  );
}
