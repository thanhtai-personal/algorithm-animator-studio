"use client";

import { useEffect, type ReactNode } from "react";
import {
  Bold,
  Heading2,
  Heading3,
  Italic,
  List,
  ListOrdered,
  Redo2,
  Strikethrough,
  Undo2,
} from "lucide-react";
import { EditorContent, useEditor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { cn } from "@/utils/className";

interface RichTextEditorProps {
  label: string;
  value: string;
  onValueChange: (value: string) => void;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
}

function normalizeEditorHtml(value: string): string {
  const normalized = value.trim();
  if (!normalized || normalized === "<p></p>") {
    return "";
  }
  return normalized;
}

interface ToolbarButtonProps {
  label: string;
  active?: boolean;
  disabled?: boolean;
  onClick: () => void;
  icon: ReactNode;
}

function ToolbarButton({ label, active, disabled, onClick, icon }: ToolbarButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      disabled={disabled}
      onMouseDown={(event) => {
        event.preventDefault();
        onClick();
      }}
      className={cn(
        "inline-flex h-8 w-8 items-center justify-center rounded-md border text-muted-foreground transition-colors",
        active
          ? "border-primary/60 bg-primary/10 text-primary"
          : "border-transparent bg-background hover:border-border hover:text-foreground",
        disabled ? "cursor-not-allowed opacity-50" : null
      )}
    >
      {icon}
    </button>
  );
}

export function RichTextEditor({
  label,
  value,
  onValueChange,
  placeholder,
  disabled,
  className,
}: RichTextEditorProps) {
  const editor = useEditor({
    immediatelyRender: false,
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
    ],
    content: value,
    editable: !disabled,
    onUpdate: ({ editor: currentEditor }) => {
      onValueChange(normalizeEditorHtml(currentEditor.getHTML()));
    },
  });

  useEffect(() => {
    if (!editor) return;

    const normalizedIncoming = normalizeEditorHtml(value);
    const normalizedCurrent = normalizeEditorHtml(editor.getHTML());

    if (normalizedIncoming !== normalizedCurrent) {
      editor.commands.setContent(normalizedIncoming || "<p></p>", {
        emitUpdate: false,
      });
    }
  }, [editor, value]);

  useEffect(() => {
    if (!editor) return;
    editor.setEditable(!disabled);
  }, [disabled, editor]);

  return (
    <label className={cn("block space-y-2", className)}>
      <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{label}</span>

      <div className="overflow-hidden rounded-lg border border-border bg-background">
        <div className="flex flex-wrap gap-1 border-b border-border bg-muted/30 p-1.5">
          <ToolbarButton
            label="Heading 2"
            active={editor?.isActive("heading", { level: 2 })}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 2 }).run()}
            icon={<Heading2 className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Heading 3"
            active={editor?.isActive("heading", { level: 3 })}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleHeading({ level: 3 }).run()}
            icon={<Heading3 className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Bold"
            active={editor?.isActive("bold")}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleBold().run()}
            icon={<Bold className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Italic"
            active={editor?.isActive("italic")}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleItalic().run()}
            icon={<Italic className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Strike"
            active={editor?.isActive("strike")}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleStrike().run()}
            icon={<Strikethrough className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Bullet List"
            active={editor?.isActive("bulletList")}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleBulletList().run()}
            icon={<List className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Ordered List"
            active={editor?.isActive("orderedList")}
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().toggleOrderedList().run()}
            icon={<ListOrdered className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Undo"
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().undo().run()}
            icon={<Undo2 className="h-4 w-4" />}
          />
          <ToolbarButton
            label="Redo"
            disabled={!editor || disabled}
            onClick={() => editor?.chain().focus().redo().run()}
            icon={<Redo2 className="h-4 w-4" />}
          />
        </div>

        <div className="relative">
          {placeholder && editor?.isEmpty ? (
            <span className="pointer-events-none absolute left-3 top-2 z-[1] text-sm text-muted-foreground">
              {placeholder}
            </span>
          ) : null}
          <EditorContent
            editor={editor}
            className={cn(
              "text-sm text-foreground",
              "[&_.ProseMirror]:min-h-[120px] [&_.ProseMirror]:p-3 [&_.ProseMirror]:outline-none",
              "[&_.ProseMirror_h2]:mb-2 [&_.ProseMirror_h2]:text-base [&_.ProseMirror_h2]:font-semibold",
              "[&_.ProseMirror_h3]:mb-2 [&_.ProseMirror_h3]:text-sm [&_.ProseMirror_h3]:font-semibold",
              "[&_.ProseMirror_p]:mb-2 [&_.ProseMirror_p:last-child]:mb-0",
              "[&_.ProseMirror_ul]:mb-2 [&_.ProseMirror_ul]:list-disc [&_.ProseMirror_ul]:pl-6",
              "[&_.ProseMirror_ol]:mb-2 [&_.ProseMirror_ol]:list-decimal [&_.ProseMirror_ol]:pl-6"
            )}
          />
        </div>
      </div>
    </label>
  );
}
