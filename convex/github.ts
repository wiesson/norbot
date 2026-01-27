import { v } from "convex/values";
import { z } from "zod";
import { action, mutation, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { internal } from "./_generated/api";

// ===========================================
// ZOD SCHEMAS FOR GITHUB API VALIDATION
// ===========================================

const GitHubRepoApiSchema = z.object({
  id: z.number(),
  node_id: z.string(),
  name: z.string(),
  full_name: z.string(),
  clone_url: z.string(),
  default_branch: z.string(),
  private: z.boolean(),
  description: z.string().nullable(),
  updated_at: z.string(),
});

const GitHubReposApiResponseSchema = z.array(GitHubRepoApiSchema);

const GitHubIssueApiResponseSchema = z.object({
  number: z.number(),
  html_url: z.string(),
  title: z.string().optional(),
  state: z.string().optional(),
});

// ===========================================
// INTERNAL QUERIES
// ===========================================

export const getUserGithubToken = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    return user?.githubAccessToken;
  },
});

// ===========================================
// ACTIONS
// ===========================================

export const listUserRepos = action({
  args: { userId: v.id("users") },
  handler: async (ctx, args): Promise<GitHubRepo[]> => {
    const token = await ctx.runQuery(internal.github.getUserGithubToken, {
      userId: args.userId,
    });

    if (!token) {
      throw new Error("No GitHub access token found");
    }

    const response = await fetch(
      "https://api.github.com/user/repos?per_page=100&sort=updated&affiliation=owner,collaborator,organization_member",
      {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github+json",
          "X-GitHub-Api-Version": "2022-11-28",
        },
      }
    );

    if (!response.ok) {
      throw new Error(`GitHub API error: ${response.status}`);
    }

    const rawRepos = await response.json();

    // Validate GitHub API response with Zod
    const parseResult = GitHubReposApiResponseSchema.safeParse(rawRepos);
    if (!parseResult.success) {
      console.error("GitHub API response validation failed:", parseResult.error);
      throw new Error("Invalid response from GitHub API");
    }

    return parseResult.data.map((repo) => ({
      githubId: repo.id,
      githubNodeId: repo.node_id,
      name: repo.name,
      fullName: repo.full_name,
      cloneUrl: repo.clone_url,
      defaultBranch: repo.default_branch,
      isPrivate: repo.private,
      description: repo.description,
      updatedAt: repo.updated_at,
    }));
  },
});

// ===========================================
// MUTATIONS
// ===========================================

export const connectRepos = mutation({
  args: {
    workspaceId: v.id("workspaces"),
    repos: v.array(
      v.object({
        githubId: v.number(),
        githubNodeId: v.string(),
        name: v.string(),
        fullName: v.string(),
        cloneUrl: v.string(),
        defaultBranch: v.string(),
      })
    ),
  },
  handler: async (ctx, args) => {
    const now = Date.now();
    const created: string[] = [];

    for (const repo of args.repos) {
      // Check if already exists
      const existing = await ctx.db
        .query("repositories")
        .withIndex("by_github_id", (q) => q.eq("githubId", repo.githubId))
        .first();

      if (existing) {
        // Skip already linked repos
        continue;
      }

      const id = await ctx.db.insert("repositories", {
        workspaceId: args.workspaceId,
        name: repo.name,
        fullName: repo.fullName,
        cloneUrl: repo.cloneUrl,
        defaultBranch: repo.defaultBranch,
        githubId: repo.githubId,
        githubNodeId: repo.githubNodeId,
        settings: {
          claudeCodeEnabled: true,
          autoCreateBranches: true,
        },
        isActive: true,
        createdAt: now,
        updatedAt: now,
      });
      created.push(id);
    }

    return created;
  },
});

// ===========================================
// TYPES
// ===========================================

interface GitHubApiRepo {
  id: number;
  node_id: string;
  name: string;
  full_name: string;
  clone_url: string;
  default_branch: string;
  private: boolean;
  description: string | null;
  updated_at: string;
}

export interface GitHubRepo {
  githubId: number;
  githubNodeId: string;
  name: string;
  fullName: string;
  cloneUrl: string;
  defaultBranch: string;
  isPrivate: boolean;
  description: string | null;
  updatedAt: string;
}

// ===========================================
// CREATE GITHUB ISSUE (for Claude integration)
// ===========================================

interface CreateIssueResult {
  success: boolean;
  error?: string;
  issueNumber?: number;
  issueUrl?: string;
  repositoryName?: string;
}

export const createIssue = internalAction({
  args: {
    taskId: v.id("tasks"),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<CreateIssueResult> => {
    // Get task with full context
    const task = await ctx.runQuery(internal.github.getTaskWithContext, {
      taskId: args.taskId,
    });

    if (!task) {
      return { success: false, error: "Task not found" };
    }

    // Get repository - from project or fallback to channel mapping
    let repository = null;
    if (task.project?.repositoryId) {
      repository = await ctx.runQuery(internal.github.getRepository, {
        repositoryId: task.project.repositoryId,
      });
    }

    if (!repository) {
      return {
        success: false,
        error: "No repository linked. Use '@norbot add repo github.com/owner/repo' first.",
      };
    }

    // Get user's GitHub token
    const token = await ctx.runQuery(internal.github.getUserGithubToken, {
      userId: args.userId,
    });
    if (!token) {
      return {
        success: false,
        error: "GitHub not connected. Please log in with GitHub first.",
      };
    }

    // Build issue body
    const issueBody = buildIssueBody(task);

    // Create GitHub issue
    try {
      const response = await fetch(
        `https://api.github.com/repos/${repository.fullName}/issues`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Norbot",
          },
          body: JSON.stringify({
            title: `[${task.displayId}] ${task.title}`,
            body: issueBody,
            labels: getLabelsForTask(task),
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        console.error("GitHub API error:", error);
        return {
          success: false,
          error: `GitHub API error: ${error.message || response.statusText}`,
        };
      }

      const rawIssue = await response.json();

      // Validate GitHub issue response with Zod
      const parseResult = GitHubIssueApiResponseSchema.safeParse(rawIssue);
      if (!parseResult.success) {
        console.error("GitHub issue response validation failed:", parseResult.error);
        return {
          success: false,
          error: "Invalid response from GitHub API",
        };
      }

      const issue = parseResult.data;

      // Update task with GitHub issue info
      await ctx.runMutation(internal.github.updateTaskGitHubIntegration, {
        taskId: args.taskId,
        issueNumber: issue.number,
        issueUrl: issue.html_url,
        sentByUserId: args.userId,
      });

      return {
        success: true,
        issueNumber: issue.number,
        issueUrl: issue.html_url,
        repositoryName: repository.fullName,
      };
    } catch (error) {
      console.error("Failed to create GitHub issue:", error);
      return {
        success: false,
        error: `Failed to create issue: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

// ===========================================
// LINK REPOSITORY TO PROJECT
// ===========================================

interface LinkRepoResult {
  success: boolean;
  error?: string;
  repositoryId?: string;
  fullName?: string;
  linkedToProject?: boolean;
}

export const linkRepositoryToProject = internalAction({
  args: {
    repoUrl: v.string(),
    workspaceId: v.id("workspaces"),
    projectId: v.optional(v.id("projects")),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<LinkRepoResult> => {
    // Parse repo URL
    const match = args.repoUrl.match(/github\.com\/([^\/]+)\/([^\/\s]+)/);
    if (!match) {
      return { success: false, error: "Invalid GitHub URL. Use format: github.com/owner/repo" };
    }

    const [, owner, repoName] = match;
    const fullName = `${owner}/${repoName.replace(/\.git$/, "")}`;

    // Get user's GitHub token
    const token = await ctx.runQuery(internal.github.getUserGithubToken, {
      userId: args.userId,
    });
    if (!token) {
      return { success: false, error: "GitHub not connected. Please log in with GitHub first." };
    }

    // Verify repo access
    try {
      const response = await fetch(`https://api.github.com/repos/${fullName}`, {
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/vnd.github.v3+json",
          "User-Agent": "Norbot",
        },
      });

      if (!response.ok) {
        if (response.status === 404) {
          return { success: false, error: `Repository not found or no access: ${fullName}` };
        }
        return { success: false, error: `GitHub API error: ${response.statusText}` };
      }

      const repo = await response.json();

      // Create or update repository record
      const repositoryId = await ctx.runMutation(internal.github.upsertRepository, {
        workspaceId: args.workspaceId,
        githubId: repo.id,
        githubNodeId: repo.node_id,
        name: repo.name,
        fullName: repo.full_name,
        cloneUrl: repo.clone_url,
        defaultBranch: repo.default_branch,
      });

      // Link to project if specified
      if (args.projectId) {
        await ctx.runMutation(internal.github.linkProjectToRepo, {
          projectId: args.projectId,
          repositoryId,
        });
      }

      return {
        success: true,
        repositoryId,
        fullName: repo.full_name,
        linkedToProject: !!args.projectId,
      };
    } catch (error) {
      console.error("Failed to link repository:", error);
      return {
        success: false,
        error: `Failed to link repository: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

// ===========================================
// ADDITIONAL INTERNAL QUERIES
// ===========================================

export const getTaskWithContext = internalQuery({
  args: { taskId: v.id("tasks") },
  handler: async (ctx, args) => {
    const task = await ctx.db.get(args.taskId);
    if (!task) return null;

    // Get project if exists
    let project = null;
    if (task.projectId) {
      project = await ctx.db.get(task.projectId);
    }

    // Get recent messages from thread
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_task", (q) => q.eq("taskId", args.taskId))
      .order("asc")
      .take(10);

    return {
      ...task,
      project,
      messages,
    };
  },
});

export const getRepository = internalQuery({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.repositoryId);
  },
});

export const listRepositoriesForWorkspace = internalQuery({
  args: { workspaceId: v.id("workspaces") },
  handler: async (ctx, args) => {
    const repos = await ctx.db
      .query("repositories")
      .withIndex("by_workspace", (q) => q.eq("workspaceId", args.workspaceId))
      .filter((q) => q.eq(q.field("isActive"), true))
      .collect();

    return repos.map((r) => ({
      id: r._id,
      name: r.name,
      fullName: r.fullName,
      defaultBranch: r.defaultBranch,
    }));
  },
});

export const getTaskByDisplayId = internalQuery({
  args: { displayId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("tasks")
      .withIndex("by_display_id", (q) => q.eq("displayId", args.displayId.toUpperCase()))
      .first();
  },
});

// ===========================================
// ADDITIONAL INTERNAL MUTATIONS
// ===========================================

export const updateTaskGitHubIntegration = internalMutation({
  args: {
    taskId: v.id("tasks"),
    issueNumber: v.number(),
    issueUrl: v.string(),
    sentByUserId: v.id("users"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.taskId, {
      githubIntegration: {
        issueNumber: args.issueNumber,
        issueUrl: args.issueUrl,
        sentAt: Date.now(),
        sentByUserId: args.sentByUserId,
      },
      status: "in_progress",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("taskActivity", {
      taskId: args.taskId,
      userId: args.sentByUserId,
      activityType: "claude_code_started",
      metadata: {
        issueNumber: args.issueNumber,
        issueUrl: args.issueUrl,
      },
      createdAt: Date.now(),
    });
  },
});

export const updateTaskWithPR = internalMutation({
  args: {
    displayId: v.string(),
    pullRequestNumber: v.number(),
    pullRequestUrl: v.string(),
  },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_display_id", (q) => q.eq("displayId", args.displayId))
      .first();
    if (!task) return;

    await ctx.db.patch(task._id, {
      githubIntegration: {
        ...task.githubIntegration,
        pullRequestNumber: args.pullRequestNumber,
        pullRequestUrl: args.pullRequestUrl,
      },
      status: "in_review",
      updatedAt: Date.now(),
    });

    await ctx.db.insert("taskActivity", {
      taskId: task._id,
      activityType: "pr_created",
      metadata: {
        pullRequestNumber: args.pullRequestNumber,
        pullRequestUrl: args.pullRequestUrl,
      },
      createdAt: Date.now(),
    });
  },
});

export const markTaskMerged = internalMutation({
  args: { displayId: v.string() },
  handler: async (ctx, args) => {
    const task = await ctx.db
      .query("tasks")
      .withIndex("by_display_id", (q) => q.eq("displayId", args.displayId))
      .first();
    if (!task) return;

    const now = Date.now();
    await ctx.db.patch(task._id, {
      status: "done",
      completedAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("taskActivity", {
      taskId: task._id,
      activityType: "pr_merged",
      createdAt: now,
    });
  },
});

export const upsertRepository = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    githubId: v.number(),
    githubNodeId: v.string(),
    name: v.string(),
    fullName: v.string(),
    cloneUrl: v.string(),
    defaultBranch: v.string(),
  },
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("repositories")
      .withIndex("by_github_id", (q) => q.eq("githubId", args.githubId))
      .first();

    const now = Date.now();

    if (existing) {
      await ctx.db.patch(existing._id, {
        name: args.name,
        fullName: args.fullName,
        cloneUrl: args.cloneUrl,
        defaultBranch: args.defaultBranch,
        isActive: true,
        updatedAt: now,
      });
      return existing._id;
    }

    return await ctx.db.insert("repositories", {
      workspaceId: args.workspaceId,
      githubId: args.githubId,
      githubNodeId: args.githubNodeId,
      name: args.name,
      fullName: args.fullName,
      cloneUrl: args.cloneUrl,
      defaultBranch: args.defaultBranch,
      settings: {
        claudeCodeEnabled: true,
        autoCreateBranches: true,
      },
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const linkProjectToRepo = internalMutation({
  args: {
    projectId: v.id("projects"),
    repositoryId: v.id("repositories"),
  },
  handler: async (ctx, args) => {
    await ctx.db.patch(args.projectId, {
      repositoryId: args.repositoryId,
      updatedAt: Date.now(),
    });
  },
});

// ===========================================
// HELPER FUNCTIONS
// ===========================================

interface TaskForIssue {
  displayId: string;
  title: string;
  description?: string;
  priority: string;
  taskType: string;
  source?: { slackChannelName?: string };
  codeContext?: {
    errorMessage?: string;
    stackTrace?: string;
    filePaths?: string[];
    codeSnippet?: string;
  };
  messages?: { content: string }[];
}

function buildIssueBody(task: TaskForIssue): string {
  const sections: string[] = [];

  sections.push(`## Issue from Norbot\n`);
  sections.push(`**Task:** ${task.displayId}`);
  sections.push(`**Type:** ${task.taskType} | **Priority:** ${task.priority}`);
  if (task.source?.slackChannelName) {
    sections.push(`**Reported in:** #${task.source.slackChannelName}`);
  }
  sections.push("");

  sections.push(`### Description\n`);
  sections.push(task.description || task.title);
  sections.push("");

  if (task.codeContext) {
    sections.push(`### Code Context\n`);
    if (task.codeContext.errorMessage) {
      sections.push(`**Error:** \`${task.codeContext.errorMessage}\``);
    }
    if (task.codeContext.filePaths?.length) {
      sections.push(`**Files mentioned:** ${task.codeContext.filePaths.map((f) => `\`${f}\``).join(", ")}`);
    }
    if (task.codeContext.stackTrace) {
      sections.push(`\n<details><summary>Stack trace</summary>\n\n\`\`\`\n${task.codeContext.stackTrace}\n\`\`\`\n</details>`);
    }
    sections.push("");
  }

  if (task.messages?.length) {
    sections.push(`### Discussion Thread\n`);
    for (const msg of task.messages.slice(0, 5)) {
      sections.push(`> ${msg.content.slice(0, 200)}${msg.content.length > 200 ? "..." : ""}`);
    }
    sections.push("");
  }

  sections.push(`### Instructions for @claude\n`);
  sections.push(`Please investigate this ${task.taskType} and create a PR with the fix:`);
  sections.push(`1. Find the root cause`);
  sections.push(`2. Implement a fix`);
  sections.push(`3. Add tests to prevent regression`);
  sections.push("");

  sections.push(`---`);
  sections.push(`*Created by Norbot from Slack*`);

  return sections.join("\n");
}

function getLabelsForTask(task: { taskType: string; priority: string }): string[] {
  const labels: string[] = [];

  if (task.taskType === "bug") labels.push("bug");
  else if (task.taskType === "feature") labels.push("enhancement");

  if (task.priority === "critical") labels.push("priority: critical");
  else if (task.priority === "high") labels.push("priority: high");

  labels.push("norbot");

  return labels;
}

// ===========================================
// CLOSE GITHUB ISSUE
// ===========================================

export const closeIssue = internalAction({
  args: {
    taskId: v.id("tasks"),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const task = await ctx.runQuery(internal.github.getTaskWithContext, {
      taskId: args.taskId,
    });

    if (!task || !task.githubIntegration?.issueNumber) {
      return { success: false, error: "Task not found or no linked GitHub issue" };
    }

    // Get repository
    let repository = null;
    if (task.project?.repositoryId) {
      repository = await ctx.runQuery(internal.github.getRepository, {
        repositoryId: task.project.repositoryId,
      });
    }

    if (!repository) {
      return { success: false, error: "No repository linked to project" };
    }

    // Get user's GitHub token
    const token = await ctx.runQuery(internal.github.getUserGithubToken, {
      userId: args.userId,
    });
    if (!token) {
      return { success: false, error: "GitHub not connected" };
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${repository.fullName}/issues/${task.githubIntegration.issueNumber}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Norbot",
          },
          body: JSON.stringify({
            state: "closed",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: `GitHub API error: ${error.message || response.statusText}` };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to close issue: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

// ===========================================
// REOPEN GITHUB ISSUE
// ===========================================

export const reopenIssue = internalAction({
  args: {
    taskId: v.id("tasks"),
    userId: v.id("users"),
  },
  handler: async (ctx, args): Promise<{ success: boolean; error?: string }> => {
    const task = await ctx.runQuery(internal.github.getTaskWithContext, {
      taskId: args.taskId,
    });

    if (!task || !task.githubIntegration?.issueNumber) {
      return { success: false, error: "Task not found or no linked GitHub issue" };
    }

    // Get repository
    let repository = null;
    if (task.project?.repositoryId) {
      repository = await ctx.runQuery(internal.github.getRepository, {
        repositoryId: task.project.repositoryId,
      });
    }

    if (!repository) {
      return { success: false, error: "No repository linked to project" };
    }

    // Get user's GitHub token
    const token = await ctx.runQuery(internal.github.getUserGithubToken, {
      userId: args.userId,
    });
    if (!token) {
      return { success: false, error: "GitHub not connected" };
    }

    try {
      const response = await fetch(
        `https://api.github.com/repos/${repository.fullName}/issues/${task.githubIntegration.issueNumber}`,
        {
          method: "PATCH",
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
            Accept: "application/vnd.github.v3+json",
            "User-Agent": "Norbot",
          },
          body: JSON.stringify({
            state: "open",
          }),
        }
      );

      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: `GitHub API error: ${error.message || response.statusText}` };
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to reopen issue: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  },
});

// ===========================================
// CREATE TASK FROM GITHUB ISSUE
// ===========================================

export const createTaskFromGithubIssue = internalAction({
  args: {
    repositoryFullName: v.string(),
    issueNumber: v.number(),
    issueUrl: v.string(),
    issueTitle: v.string(),
    issueBody: v.optional(v.string()),
    labels: v.array(v.string()),
    state: v.string(),
  },
  handler: async (
    ctx,
    args
  ): Promise<{ success: boolean; taskId?: string; displayId?: string; error?: string }> => {
    // Find repository by fullName
    const repository = await ctx.runQuery(internal.github.getRepositoryByFullName, {
      fullName: args.repositoryFullName,
    });

    if (!repository) {
      return { success: false, error: `Repository not found: ${args.repositoryFullName}` };
    }

    // Find project linked to this repository
    const projectLink = await ctx.runQuery(internal.github.getProjectForRepository, {
      repositoryId: repository._id,
    });

    if (!projectLink) {
      return { success: false, error: "No project linked to this repository" };
    }

    const project = await ctx.runQuery(internal.github.getProjectById, {
      projectId: projectLink.projectId,
    });

    if (!project?.githubSync?.enabled || !project.githubSync.autoCreateTasks) {
      return { success: false, error: "GitHub sync not enabled for this project" };
    }

    // Check if task already exists for this issue
    const existingTask = await ctx.runQuery(internal.github.getTaskByGitHubIssue, {
      issueNumber: args.issueNumber,
      repositoryId: repository._id,
    });

    if (existingTask) {
      return {
        success: true,
        taskId: existingTask._id,
        displayId: existingTask.displayId,
        error: "Task already exists for this issue",
      };
    }

    // Map GitHub labels to task type and priority
    const taskType = mapLabelsToTaskType(args.labels);
    const priority = mapLabelsToPriority(args.labels);

    // Create the task
    const result = await ctx.runMutation(internal.github.createTaskInternal, {
      workspaceId: project.workspaceId,
      projectId: project._id,
      repositoryId: repository._id,
      title: args.issueTitle,
      description: args.issueBody,
      taskType,
      priority,
      status: args.state === "closed" ? "done" : "todo",
      source: {
        type: "github",
        githubIssueNumber: args.issueNumber,
        githubIssueUrl: args.issueUrl,
      },
      githubIntegration: {
        issueNumber: args.issueNumber,
        issueUrl: args.issueUrl,
      },
    });

    return { success: true, taskId: result.taskId, displayId: result.displayId };
  },
});

// ===========================================
// UPDATE TASK STATUS FROM GITHUB
// ===========================================

export const updateTaskStatusFromGitHub = internalMutation({
  args: {
    issueNumber: v.number(),
    repositoryFullName: v.string(),
    newState: v.string(),
  },
  handler: async (ctx, args) => {
    // Find repository by fullName
    const repository = await ctx.db
      .query("repositories")
      .filter((q) => q.eq(q.field("fullName"), args.repositoryFullName))
      .first();

    if (!repository) return;

    // Find task with this GitHub issue
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_repository", (q) => q.eq("repositoryId", repository._id))
      .collect();

    const task = tasks.find((t) => t.githubIntegration?.issueNumber === args.issueNumber);
    if (!task) return;

    // Check if project has sync enabled
    if (task.projectId) {
      const project = await ctx.db.get(task.projectId);
      if (!project?.githubSync?.enabled || !project.githubSync.syncStatus) {
        return;
      }
    }

    // Map GitHub state to task status
    const now = Date.now();
    const oldStatus = task.status;
    const newStatus = args.newState === "closed" ? "done" : "in_progress";

    // Don't update if already in the expected state
    if (
      (args.newState === "closed" && task.status === "done") ||
      (args.newState === "open" && task.status !== "done" && task.status !== "cancelled")
    ) {
      return;
    }

    await ctx.db.patch(task._id, {
      status: newStatus,
      updatedAt: now,
      ...(newStatus === "done" ? { completedAt: now } : {}),
    });

    await ctx.db.insert("taskActivity", {
      taskId: task._id,
      activityType: "status_changed",
      changes: {
        field: "status",
        oldValue: oldStatus,
        newValue: newStatus,
      },
      metadata: { source: "github_webhook" },
      createdAt: now,
    });
  },
});

// ===========================================
// ADDITIONAL INTERNAL QUERIES FOR GITHUB SYNC
// ===========================================

export const getRepositoryByFullName = internalQuery({
  args: { fullName: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("repositories")
      .filter((q) => q.eq(q.field("fullName"), args.fullName))
      .first();
  },
});

export const getProjectForRepository = internalQuery({
  args: { repositoryId: v.id("repositories") },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("projectRepositories")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
      .first();
  },
});

export const getProjectById = internalQuery({
  args: { projectId: v.id("projects") },
  handler: async (ctx, args) => {
    return await ctx.db.get(args.projectId);
  },
});

export const getTaskByGitHubIssue = internalQuery({
  args: {
    issueNumber: v.number(),
    repositoryId: v.id("repositories"),
  },
  handler: async (ctx, args) => {
    const tasks = await ctx.db
      .query("tasks")
      .withIndex("by_repository", (q) => q.eq("repositoryId", args.repositoryId))
      .collect();

    return tasks.find((t) => t.githubIntegration?.issueNumber === args.issueNumber);
  },
});

// ===========================================
// INTERNAL MUTATION FOR CREATING TASKS
// ===========================================

export const createTaskInternal = internalMutation({
  args: {
    workspaceId: v.id("workspaces"),
    projectId: v.id("projects"),
    repositoryId: v.id("repositories"),
    title: v.string(),
    description: v.optional(v.string()),
    taskType: v.union(
      v.literal("bug"),
      v.literal("feature"),
      v.literal("improvement"),
      v.literal("task"),
      v.literal("question")
    ),
    priority: v.union(
      v.literal("critical"),
      v.literal("high"),
      v.literal("medium"),
      v.literal("low")
    ),
    status: v.union(
      v.literal("backlog"),
      v.literal("todo"),
      v.literal("in_progress"),
      v.literal("in_review"),
      v.literal("done")
    ),
    source: v.object({
      type: v.literal("github"),
      githubIssueNumber: v.number(),
      githubIssueUrl: v.string(),
    }),
    githubIntegration: v.object({
      issueNumber: v.number(),
      issueUrl: v.string(),
    }),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    // Get project for displayId prefix
    const project = await ctx.db.get(args.projectId);
    if (!project) throw new Error("Project not found");

    // Get or create counter for task numbering (per project)
    let counter = await ctx.db
      .query("projectCounters")
      .withIndex("by_project_and_type", (q) =>
        q.eq("projectId", args.projectId).eq("counterType", "task_number")
      )
      .first();

    let taskNumber: number;
    if (counter) {
      taskNumber = counter.currentValue + 1;
      await ctx.db.patch(counter._id, { currentValue: taskNumber });
    } else {
      taskNumber = 1;
      await ctx.db.insert("projectCounters", {
        projectId: args.projectId,
        counterType: "task_number",
        currentValue: 1,
      });
    }

    const displayId = `${project.shortCode}-${taskNumber}`;

    const taskId = await ctx.db.insert("tasks", {
      workspaceId: args.workspaceId,
      repositoryId: args.repositoryId,
      projectId: args.projectId,
      taskNumber,
      displayId,
      title: args.title,
      description: args.description,
      status: args.status,
      priority: args.priority,
      taskType: args.taskType,
      source: args.source,
      githubIntegration: {
        issueNumber: args.githubIntegration.issueNumber,
        issueUrl: args.githubIntegration.issueUrl,
        sentAt: now,
      },
      labels: [],
      createdAt: now,
      updatedAt: now,
    });

    await ctx.db.insert("taskActivity", {
      taskId,
      activityType: "created",
      metadata: { source: "github_webhook" },
      createdAt: now,
    });

    return { taskId, displayId };
  },
});

// ===========================================
// HELPER FUNCTIONS FOR LABEL MAPPING
// ===========================================

function mapLabelsToTaskType(
  labels: string[]
): "bug" | "feature" | "improvement" | "task" | "question" {
  const labelsLower = labels.map((l) => l.toLowerCase());

  if (labelsLower.includes("bug")) return "bug";
  if (labelsLower.includes("feature") || labelsLower.includes("enhancement")) return "feature";
  if (labelsLower.includes("improvement")) return "improvement";
  if (labelsLower.includes("question")) return "question";

  return "task";
}

function mapLabelsToPriority(labels: string[]): "critical" | "high" | "medium" | "low" {
  const labelsLower = labels.map((l) => l.toLowerCase());

  if (labelsLower.some((l) => l.includes("critical"))) return "critical";
  if (labelsLower.some((l) => l.includes("high") || l.includes("urgent"))) return "high";
  if (labelsLower.some((l) => l.includes("low"))) return "low";

  return "medium";
}
