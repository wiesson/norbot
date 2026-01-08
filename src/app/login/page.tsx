import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Github, MessageCircle, ClipboardList, Bot, CheckCircle, GitPullRequest } from "lucide-react";

const workflowSteps = [
  {
    number: 1,
    title: "Agentic Intake",
    icon: MessageCircle,
    points: [
      '"@norbot there\'s a bug"',
      "Bot asks questions",
      "Collects screenshots & context",
    ],
  },
  {
    number: 2,
    title: "Task Created",
    icon: ClipboardList,
    points: [
      "Structured: title, description",
      "Images & code context",
      "Assigned to project",
    ],
  },
  {
    number: 3,
    title: "Trigger AI Coder",
    icon: Bot,
    points: [
      "Creates GitHub issue",
      "Triggers Claude Code",
      "Or Gemini / Cursor / etc.",
    ],
  },
  {
    number: 4,
    title: "Verification",
    icon: CheckCircle,
    points: [
      '"I can reproduce this"',
      "Identifies files involved",
      "Prepares the fix",
    ],
  },
  {
    number: 5,
    title: "PR",
    icon: GitPullRequest,
    points: [
      "Simple: merge & deploy",
      "Complex: handover to human",
      "Full context preserved",
    ],
  },
];

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-linear-to-br from-neutral-50 to-neutral-100 dark:from-neutral-950 dark:to-neutral-900">
      {/* Login Section */}
      <div className="flex items-center justify-center pt-24 pb-16 px-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Norbot</CardTitle>
            <CardDescription>AI-powered task management with Claude Code integration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <form action="/api/auth/github" method="POST">
              <Button type="submit" size="lg" className="w-full">
                <Github className="mr-2 h-5 w-5" />
                Continue with GitHub
              </Button>
            </form>
            <p className="text-xs text-center text-muted-foreground">
              By continuing, you agree to our Terms of Service and Privacy Policy
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Workflow Section */}
      <section className="max-w-6xl mx-auto px-4 pb-24">
        <h2 className="text-center text-2xl font-semibold text-neutral-800 dark:text-neutral-200 mb-10">
          How Norbot Works
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {workflowSteps.map((step) => (
            <Card key={step.number} className="relative">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-bold">
                    {step.number}
                  </span>
                  <step.icon className="w-5 h-5 text-primary" />
                </div>
                <CardTitle className="text-base mt-2">{step.title}</CardTitle>
              </CardHeader>
              <CardContent className="pt-0">
                <ul className="text-sm text-muted-foreground space-y-1">
                  {step.points.map((point, i) => (
                    <li key={i}>• {point}</li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>
    </div>
  );
}
