"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import { BubbleMenu, FloatingMenu } from "@tiptap/react/menus";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Placeholder from "@tiptap/extension-placeholder";
import { Markdown } from "@tiptap/markdown";
import { useEffect, useCallback } from "react";
import { cn } from "@/lib/utils";
import {
  Bold,
  Italic,
  Heading2,
  List,
  ListOrdered,
  ListChecks,
  Code2,
  Plus,
  Link as LinkIcon,
} from "lucide-react";

interface TiptapEditorProps {
  value: string;
  onChange?: (markdown: string) => void;
  editable?: boolean;
  placeholder?: string;
  className?: string;
  minHeight?: number;
  showFixedToolbar?: boolean;
  enableFloatingMenus?: boolean;
}

export function TiptapEditor({
  value,
  onChange,
  editable = true,
  placeholder = "Write something...",
  className,
  minHeight = 120,
  showFixedToolbar = false,
  enableFloatingMenus = true,
}: TiptapEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: { levels: [2, 3] },
      }),
      Link.configure({
        openOnClick: !editable,
        HTMLAttributes: { class: "text-primary underline cursor-pointer" },
      }),
      TaskList,
      TaskItem.configure({ nested: true }),
      Placeholder.configure({ placeholder }),
      Markdown,
    ],
    content: value,
    contentType: "markdown",
    editable,
    editorProps: {
      attributes: {
        class: cn(
          "tiptap prose prose-sm dark:prose-invert max-w-none focus:outline-none",
          editable && "px-3 py-3",
          !editable && "px-0 py-0",
        ),
        style: `min-height:${minHeight}px`,
      },
    },
    onUpdate: ({ editor }) => {
      if (onChange) {
        const md = editor.getMarkdown();
        onChange(md);
      }
    },
  });

  // Sync external value changes
  useEffect(() => {
    if (!editor) return;
    const currentMd = editor.getMarkdown();
    if (value !== currentMd) {
      editor.commands.setContent(value);
    }
  }, [value, editor]);

  // Sync editable prop
  useEffect(() => {
    if (editor) {
      editor.setEditable(editable);
    }
  }, [editable, editor]);

  const setLink = useCallback(() => {
    if (!editor) return;
    const previousUrl = editor.getAttributes("link").href;
    const url = window.prompt("URL", previousUrl);
    if (url === null) return;
    if (url === "") {
      editor.chain().focus().extendMarkRange("link").unsetLink().run();
      return;
    }
    editor.chain().focus().extendMarkRange("link").setLink({ href: url }).run();
  }, [editor]);

  if (!editor) return null;

  return (
    <div
      className={cn(
        "rounded-md border bg-background",
        editable && "focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-1",
        className,
      )}
    >
      {editable && showFixedToolbar && (
        <div className="flex flex-wrap gap-0.5 border-b px-2 py-1.5">
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBold().run()}
            active={editor.isActive("bold")}
            title="Bold"
          >
            <Bold className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleItalic().run()}
            active={editor.isActive("italic")}
            title="Italic"
          >
            <Italic className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            active={editor.isActive("heading", { level: 2 })}
            title="Heading"
          >
            <Heading2 className="size-4" />
          </ToolbarButton>
          <div className="w-px bg-border mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            active={editor.isActive("bulletList")}
            title="Bullet list"
          >
            <List className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            active={editor.isActive("orderedList")}
            title="Ordered list"
          >
            <ListOrdered className="size-4" />
          </ToolbarButton>
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            active={editor.isActive("taskList")}
            title="Task list"
          >
            <ListChecks className="size-4" />
          </ToolbarButton>
          <div className="w-px bg-border mx-1" />
          <ToolbarButton
            onClick={() => editor.chain().focus().toggleCodeBlock().run()}
            active={editor.isActive("codeBlock")}
            title="Code block"
          >
            <Code2 className="size-4" />
          </ToolbarButton>
          <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link">
            <LinkIcon className="size-4" />
          </ToolbarButton>
        </div>
      )}
      {editable && enableFloatingMenus && (
        <>
          <BubbleMenu editor={editor}>
            <div className="flex items-center gap-0.5 rounded-md border bg-background px-1 py-1 shadow-md">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBold().run()}
                active={editor.isActive("bold")}
                title="Bold"
              >
                <Bold className="size-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleItalic().run()}
                active={editor.isActive("italic")}
                title="Italic"
              >
                <Italic className="size-4" />
              </ToolbarButton>
              <ToolbarButton onClick={setLink} active={editor.isActive("link")} title="Link">
                <LinkIcon className="size-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleCodeBlock().run()}
                active={editor.isActive("codeBlock")}
                title="Code block"
              >
                <Code2 className="size-4" />
              </ToolbarButton>
            </div>
          </BubbleMenu>
          <FloatingMenu editor={editor}>
            <div className="flex items-center gap-0.5 rounded-md border bg-background px-1 py-1 shadow-md">
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
                active={editor.isActive("heading", { level: 2 })}
                title="Heading"
              >
                <Heading2 className="size-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleBulletList().run()}
                active={editor.isActive("bulletList")}
                title="Bullet list"
              >
                <List className="size-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleOrderedList().run()}
                active={editor.isActive("orderedList")}
                title="Ordered list"
              >
                <ListOrdered className="size-4" />
              </ToolbarButton>
              <ToolbarButton
                onClick={() => editor.chain().focus().toggleTaskList().run()}
                active={editor.isActive("taskList")}
                title="Task list"
              >
                <ListChecks className="size-4" />
              </ToolbarButton>
              <span className="text-muted-foreground inline-flex items-center gap-1 px-1 text-xs">
                <Plus className="size-3" />
                blocks
              </span>
            </div>
          </FloatingMenu>
        </>
      )}
      <EditorContent editor={editor} />
    </div>
  );
}

function ToolbarButton({
  onClick,
  active,
  title,
  children,
}: {
  onClick: () => void;
  active: boolean;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={cn(
        "inline-flex items-center justify-center rounded-md size-7 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors",
        active && "bg-muted text-foreground",
      )}
    >
      {children}
    </button>
  );
}
