import { useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { useMutation } from "convex/react";
import { api } from "@convex/_generated/api";
import { ChevronsUpDown, Check, Plus } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import type { Id } from "@convex/_generated/dataModel";

interface Workspace {
  _id: Id<"workspaces">;
  name: string;
  slug: string;
  role: string;
}

interface WorkspaceSwitcherProps {
  currentWorkspace: { _id: Id<"workspaces">; name: string; slug: string };
  workspaces: Workspace[];
  userId: Id<"users">;
}

function slugify(name: string) {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/[\s_]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function WorkspaceSwitcher({
  currentWorkspace,
  workspaces,
  userId,
}: WorkspaceSwitcherProps) {
  const navigate = useNavigate();
  const createWorkspace = useMutation(api.workspaces.create);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [slugTouched, setSlugTouched] = useState(false);
  const [creating, setCreating] = useState(false);

  function handleNameChange(value: string) {
    setName(value);
    if (!slugTouched) {
      setSlug(slugify(value));
    }
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim() || !slug.trim()) return;
    setCreating(true);
    try {
      const id = await createWorkspace({
        name: name.trim(),
        slug: slug.trim(),
        createdByUserId: userId,
      });
      setDialogOpen(false);
      setName("");
      setSlug("");
      setSlugTouched(false);
      navigate({ to: "/w/$workspaceId", params: { workspaceId: id } });
    } finally {
      setCreating(false);
    }
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          className={cn(
            "flex items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted transition-colors outline-none",
          )}
        >
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate">
              {currentWorkspace.name}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              /{currentWorkspace.slug}
            </p>
          </div>
          <ChevronsUpDown className="size-4 shrink-0 text-muted-foreground" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" sideOffset={4} className="w-56">
          <DropdownMenuLabel>Workspaces</DropdownMenuLabel>
          {workspaces.map((ws) => (
            <DropdownMenuItem
              key={ws._id}
              onSelect={() => {
                if (ws._id !== currentWorkspace._id) {
                  navigate({
                    to: "/w/$workspaceId",
                    params: { workspaceId: ws._id },
                  });
                }
              }}
            >
              <span className="truncate">{ws.name}</span>
              {ws._id === currentWorkspace._id && (
                <Check className="ml-auto size-4 shrink-0" />
              )}
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem onSelect={() => setDialogOpen(true)}>
            <Plus className="size-4" />
            Create workspace
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create workspace</DialogTitle>
            <DialogDescription>
              Add a new workspace to organize your projects.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleCreate} className="grid gap-4">
            <div className="grid gap-2">
              <Label htmlFor="ws-name">Name</Label>
              <Input
                id="ws-name"
                placeholder="My Workspace"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="ws-slug">Slug</Label>
              <Input
                id="ws-slug"
                placeholder="my-workspace"
                value={slug}
                onChange={(e) => {
                  setSlug(e.target.value);
                  setSlugTouched(true);
                }}
              />
            </div>
            <DialogFooter>
              <Button
                type="submit"
                disabled={creating || !name.trim() || !slug.trim()}
              >
                {creating ? "Creating..." : "Create"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
}
