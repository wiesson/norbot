import { useConvexQuery } from "@/hooks/use-convex-query";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import type { Id } from "@convex/_generated/dataModel";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { Hash } from "lucide-react";

export function ProjectSettingsForm({
  projectId,
}: {
  projectId: Id<"projects">;
}) {
  const { data: project } = useConvexQuery(api.projects.getById, {
    id: projectId,
  });
  const { data: channels } = useConvexQuery(
    api.channelMappings.listByProject,
    { projectId }
  );
  const { data: githubSync } = useConvexQuery(api.projects.getGitHubSync, {
    projectId,
  });

  const updateProject = useMutation(api.projects.update);
  const updateGitHubSync = useMutation(api.projects.updateGitHubSync);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [domain, setDomain] = useState("");
  const [keywords, setKeywords] = useState("");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (project) {
      setName(project.name);
      setDescription(project.description ?? "");
      setDomain(project.domain ?? "");
      setKeywords((project.keywords ?? []).join(", "));
    }
  }, [project]);

  if (!project) return null;

  async function handleSaveGeneral(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProject({
        id: projectId,
        name: name.trim(),
        description: description.trim() || undefined,
        domain: domain.trim() || undefined,
        keywords: keywords
          .split(",")
          .map((k) => k.trim())
          .filter(Boolean),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleSync(
    field: keyof NonNullable<typeof githubSync>,
    value: boolean
  ) {
    if (!githubSync) return;
    await updateGitHubSync({
      projectId,
      githubSync: { ...githubSync, [field]: value },
    });
  }

  return (
    <div className="space-y-8">
      {/* General */}
      <section>
        <h3 className="text-sm font-medium mb-3">General</h3>
        <form onSubmit={handleSaveGeneral} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="settings-name">Name</Label>
            <Input
              id="settings-name"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="settings-desc">Description</Label>
            <Textarea
              id="settings-desc"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="settings-domain">Domain</Label>
              <Input
                id="settings-domain"
                placeholder="example.com"
                value={domain}
                onChange={(e) => setDomain(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="settings-keywords">Keywords</Label>
              <Input
                id="settings-keywords"
                placeholder="ios, swift, mobile"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
              />
            </div>
          </div>
          <Button
            type="submit"
            size="sm"
            disabled={!name.trim() || saving}
          >
            {saving ? "Saving..." : saved ? "Saved" : "Save"}
          </Button>
        </form>
      </section>

      {/* Channels */}
      <section>
        <h3 className="text-sm font-medium mb-3">Slack Channels</h3>
        {channels && channels.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {channels.map((ch) => (
              <Badge key={ch._id} variant="secondary" className="gap-1">
                <Hash className="h-3 w-3" />
                {ch.slackChannelName}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No channels mapped to this project. Manage channel mappings in
            workspace settings.
          </p>
        )}
      </section>

      {/* GitHub Sync */}
      {githubSync && (
        <section>
          <h3 className="text-sm font-medium mb-3">GitHub Sync</h3>
          <div className="space-y-4">
            {(
              [
                ["enabled", "Enabled", "Enable GitHub synchronization"],
                [
                  "autoCreateIssues",
                  "Auto-create issues",
                  "Create GitHub issues from tasks",
                ],
                [
                  "autoCreateTasks",
                  "Auto-create tasks",
                  "Create tasks from GitHub issues",
                ],
                [
                  "syncStatus",
                  "Sync status",
                  "Bidirectional status synchronization",
                ],
              ] as const
            ).map(([field, label, desc]) => (
              <div key={field} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{label}</p>
                  <p className="text-xs text-muted-foreground">{desc}</p>
                </div>
                <Switch
                  checked={githubSync[field]}
                  onCheckedChange={(checked: boolean) =>
                    handleToggleSync(field, checked)
                  }
                />
              </div>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
