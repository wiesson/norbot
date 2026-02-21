import { createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import {
  Github,
  MessageCircle,
  ClipboardList,
  Bot,
  CheckCircle,
  GitPullRequest,
  ArrowRight,
  Sparkles,
  FileText,
  Zap,
} from "lucide-react";

export const Route = createFileRoute("/")({
  beforeLoad: async ({ context }) => {
    if (context.isAuthenticated) {
      throw redirect({ to: "/w" });
    }
  },
  component: LandingPage,
});

const pipelineSteps = [
  {
    icon: MessageCircle,
    label: "Slack",
    description: '"@norbot there\'s a bug"',
  },
  {
    icon: Bot,
    label: "AI Intake",
    description: "Asks clarifying questions",
  },
  {
    icon: ClipboardList,
    label: "Task",
    description: "Structured with context",
  },
  {
    icon: Github,
    label: "GitHub",
    description: "Issue auto-created",
  },
  {
    icon: GitPullRequest,
    label: "PR",
    description: "Ready to merge",
  },
];

const benefits = [
  {
    icon: Sparkles,
    title: "Zero manual triage",
    description:
      "AI extracts title, priority, and type from natural conversation. No forms to fill out.",
  },
  {
    icon: FileText,
    title: "Context preserved",
    description:
      "Screenshots, code snippets, thread history. Everything the fixer needs, captured automatically.",
  },
  {
    icon: Zap,
    title: "Automated fixes",
    description:
      "Triggers Claude Code to investigate and fix. Simple bugs get auto-PRs.",
  },
];

function LandingPage() {
  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent dark:from-primary/[0.05]" />

        <div className="relative mx-auto max-w-4xl px-6 pt-24 pb-20 text-center sm:pt-32 sm:pb-28">
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-border/60 bg-background px-4 py-1.5 text-sm text-muted-foreground animate-in fade-in slide-in-from-bottom-2 duration-500">
            <CheckCircle className="h-3.5 w-3.5 text-primary" />
            Now with Claude Code integration
          </div>

          <h1
            className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl lg:text-6xl animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
            style={{ animationDelay: "100ms" }}
          >
            From bug report to PR.
            <br />
            <span className="text-primary">Automatically.</span>
          </h1>

          <p
            className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
            style={{ animationDelay: "200ms" }}
          >
            From &ldquo;@norbot there&apos;s a bug&rdquo; to &ldquo;PR ready for review&rdquo;
            <br className="hidden sm:block" />
            without lifting a finger.
          </p>

          <div
            className="mt-10 flex flex-col items-center gap-4 sm:flex-row sm:justify-center animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
            style={{ animationDelay: "300ms" }}
          >
            <a href="/login">
              <Button type="button" size="lg" className="h-12 px-8 text-base">
                Continue to Login
              </Button>
            </a>
            <a
              href="#how-it-works"
              className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              See how it works
              <ArrowRight className="h-4 w-4" />
            </a>
          </div>
        </div>
      </section>

      <section id="how-it-works" className="border-t border-border/40 bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="mb-16 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
            How it works
          </h2>

          <div className="hidden lg:block">
            <div className="relative flex items-start justify-between">
              <div className="absolute top-8 left-12 right-12 h-px bg-border" />

              {pipelineSteps.map((step, index) => (
                <div
                  key={step.label}
                  className="relative flex w-36 flex-col items-center text-center animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                  style={{ animationDelay: `${400 + index * 100}ms` }}
                >
                  <div className="relative z-10 flex h-16 w-16 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                    <step.icon className="h-7 w-7 text-primary" />
                  </div>

                  {index < pipelineSteps.length - 1 && (
                    <ArrowRight className="absolute -right-8 top-5 h-5 w-5 text-muted-foreground/50" />
                  )}

                  <p className="mt-4 text-sm font-semibold text-foreground">{step.label}</p>
                  <p className="mt-1 text-xs text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="lg:hidden">
            <div className="relative mx-auto max-w-xs">
              <div className="absolute top-8 bottom-8 left-8 w-px bg-border" />

              <div className="space-y-8">
                {pipelineSteps.map((step, index) => (
                  <div
                    key={step.label}
                    className="relative flex items-start gap-5 animate-in fade-in slide-in-from-left-4 duration-500 fill-mode-both"
                    style={{ animationDelay: `${400 + index * 100}ms` }}
                  >
                    <div className="relative z-10 flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl border border-border bg-background shadow-sm">
                      <step.icon className="h-7 w-7 text-primary" />
                    </div>

                    <div className="pt-3">
                      <p className="text-sm font-semibold text-foreground">{step.label}</p>
                      <p className="mt-0.5 text-sm text-muted-foreground">{step.description}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 sm:py-28">
        <div className="mx-auto max-w-5xl px-6">
          <div className="grid gap-12 sm:grid-cols-3 sm:gap-8">
            {benefits.map((benefit, index) => (
              <div
                key={benefit.title}
                className="text-center sm:text-left animate-in fade-in slide-in-from-bottom-4 duration-500 fill-mode-both"
                style={{ animationDelay: `${600 + index * 100}ms` }}
              >
                <div className="mb-4 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <benefit.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-base font-semibold text-foreground">{benefit.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {benefit.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="border-t border-border/40 bg-muted/30 py-20 sm:py-28">
        <div className="mx-auto max-w-md px-6 text-center">
          <h2
            className="text-2xl font-bold text-foreground sm:text-3xl animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
            style={{ animationDelay: "800ms" }}
          >
            Ready to ship faster?
          </h2>
          <p
            className="mt-3 text-muted-foreground animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
            style={{ animationDelay: "900ms" }}
          >
            Connect your Slack and GitHub. Norbot handles the rest.
          </p>
          <div
            className="mt-8 animate-in fade-in slide-in-from-bottom-3 duration-500 fill-mode-both"
            style={{ animationDelay: "1000ms" }}
          >
            <a href="/login">
              <Button type="button" size="lg" className="h-12 px-8 text-base">
                Continue to Login
              </Button>
            </a>
          </div>
          <p
            className="mt-4 text-xs text-muted-foreground animate-in fade-in duration-500 fill-mode-both"
            style={{ animationDelay: "1100ms" }}
          >
            Free to start. No credit card required.
          </p>
        </div>
      </section>

      <footer className="border-t border-border/40 py-8">
        <div className="mx-auto max-w-5xl px-6">
          <div className="flex flex-col items-center justify-between gap-4 text-sm text-muted-foreground sm:flex-row">
            <p className="font-medium text-foreground">Norbot</p>
            <div className="flex items-center gap-4">
              <a
                href="https://github.com/wiesson"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                <span>wiesson</span>
              </a>
              <a
                href="https://x.com/wiesson"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
                </svg>
              </a>
              <a
                href="https://www.linkedin.com/in/arnewiese"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 transition-colors hover:text-foreground"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
