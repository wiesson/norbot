"use client";

import { useState } from "react";
import { useQuery, useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Plus, Key, Trash2, Copy, Check } from "lucide-react";
import type { Id } from "@convex/_generated/dataModel";

interface ApiKeysSectionProps {
  workspaceId: Id<"workspaces">;
}

export function ApiKeysSection({ workspaceId }: ApiKeysSectionProps) {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [keyName, setKeyName] = useState("");
  const [selectedProjectId, setSelectedProjectId] = useState<string>("");
  const [newlyCreatedKey, setNewlyCreatedKey] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const apiKeys = useQuery(api.apiKeys.list, { workspaceId });
  const projects = useQuery(api.projects.list, { workspaceId });
  const createApiKey = useMutation(api.apiKeys.create);
  const deleteApiKey = useMutation(api.apiKeys.remove);

  const handleCreateKey = async () => {
    if (!keyName.trim() || !selectedProjectId) return;

    const result = await createApiKey({
      workspaceId,
      projectId: selectedProjectId as Id<"projects">,
      name: keyName.trim(),
    });

    setNewlyCreatedKey(result.key);
    setKeyName("");
    setSelectedProjectId("");
  };

  const handleCopyKey = async () => {
    if (newlyCreatedKey) {
      await navigator.clipboard.writeText(newlyCreatedKey);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleCloseDialog = () => {
    setCreateDialogOpen(false);
    setNewlyCreatedKey(null);
    setCopied(false);
  };

  const handleCopyMcpConfig = async (keyPrefix: string) => {
    const config = `{
  "mcpServers": {
    "norbot": {
      "command": "npx",
      "args": ["@norbot/mcp"],
      "env": {
        "NORBOT_API_KEY": "${keyPrefix.replace("...", "YOUR_FULL_KEY")}"
      }
    }
  }
}`;
    await navigator.clipboard.writeText(config);
  };

  return (
    <Card className="mb-6">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>API Keys</CardTitle>
        <Dialog open={createDialogOpen} onOpenChange={handleCloseDialog}>
          <DialogTrigger
            render={<Button variant="outline" size="sm" onClick={() => setCreateDialogOpen(true)} />}
          >
            <Plus className="h-4 w-4 mr-2" />
            Create Key
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {newlyCreatedKey ? "API Key Created" : "Create API Key"}
              </DialogTitle>
              <DialogDescription>
                {newlyCreatedKey
                  ? "Copy this key now. You won't be able to see it again."
                  : "Create a key to allow external tools (Claude Code, Cursor) to manage tasks."}
              </DialogDescription>
            </DialogHeader>

            {newlyCreatedKey ? (
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-3 bg-muted rounded-md text-sm font-mono break-all">
                    {newlyCreatedKey}
                  </code>
                  <Button variant="outline" size="icon" onClick={handleCopyKey}>
                    {copied ? (
                      <Check className="h-4 w-4 text-green-500" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label className="text-sm text-muted-foreground">
                    Add to ~/.claude/mcp.json:
                  </Label>
                  <pre className="p-3 bg-muted rounded-md text-xs overflow-x-auto">
{`{
  "mcpServers": {
    "norbot": {
      "command": "npx",
      "args": ["@norbot/mcp"],
      "env": {
        "NORBOT_API_KEY": "${newlyCreatedKey}"
      }
    }
  }
}`}
                  </pre>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Name</Label>
                  <Input
                    placeholder="e.g., Claude Code"
                    value={keyName}
                    onChange={(e) => setKeyName(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Project</Label>
                  <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a project" />
                    </SelectTrigger>
                    <SelectContent>
                      {projects?.map((project) => (
                        <SelectItem key={project._id} value={project._id}>
                          {project.shortCode} - {project.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Each key is scoped to one project for minimal token usage
                  </p>
                </div>
              </div>
            )}

            <DialogFooter>
              {newlyCreatedKey ? (
                <Button onClick={handleCloseDialog}>Done</Button>
              ) : (
                <Button
                  onClick={handleCreateKey}
                  disabled={!keyName.trim() || !selectedProjectId}
                >
                  Create Key
                </Button>
              )}
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </CardHeader>

      <CardContent>
        {apiKeys && apiKeys.length > 0 ? (
          <div className="space-y-3">
            {apiKeys.map((apiKey) => (
              <div
                key={apiKey.id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                <div className="flex items-center gap-3">
                  <Key className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <div className="font-medium">{apiKey.name}</div>
                    <div className="text-sm text-muted-foreground">
                      <code>{apiKey.keyPrefix}</code> · {apiKey.projectShortCode}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleCopyMcpConfig(apiKey.keyPrefix)}
                    title="Copy MCP config"
                  >
                    <Copy className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger
                      render={<Button variant="ghost" size="icon-sm" />}
                    >
                      <Trash2 className="h-4 w-4" />
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Delete API key?</AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete "{apiKey.name}"? Any
                          tools using this key will stop working.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => deleteApiKey({ keyId: apiKey.id })}
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-muted-foreground">
            <Key className="h-8 w-8 mx-auto mb-2 opacity-50" />
            <p>No API keys</p>
            <p className="text-sm">Create a key to integrate with Claude Code or Cursor</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
