"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { Editor, EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";
import { DropdownSurface, isInsideDropdownSurface } from "./DropdownSurface";
import { MenuItem } from "./MenuItem";

interface RichTextEditorProps {
  value: string;
  onChange: (html: string) => void;
  /** Fires on blur with the current HTML — for editors that autosave on blur rather
   * than through an explicit form submit. */
  onBlur?: (html: string) => void;
  placeholder?: string;
  ariaLabel: string;
  /** Minimum height of the editable area, in px. Grows beyond this if content is taller. */
  minHeight?: number;
}

/** Paragraph/heading (H1-H3) + bold/italic/underline/strikethrough + bulleted/numbered
 * lists — the toolbar surfaces exactly what the schema allows. */
export function RichTextEditor({ value, onChange, onBlur, placeholder, ariaLabel, minHeight = 240 }: RichTextEditorProps) {
  const lastKnownValue = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        heading: { levels: [1, 2, 3] },
        horizontalRule: false,
        link: false,
        dropcursor: false,
        gapcursor: false,
      }),
      Placeholder.configure({ placeholder }),
    ],
    content: value,
    immediatelyRender: false,
    onUpdate: ({ editor: updatedEditor }) => {
      const html = updatedEditor.getHTML();
      lastKnownValue.current = html;
      onChange(html);
    },
    onBlur: ({ editor: blurredEditor }) => {
      onBlur?.(blurredEditor.getHTML());
    },
    editorProps: {
      attributes: {
        role: "textbox",
        "aria-multiline": "true",
        "aria-label": ariaLabel,
      },
    },
  });

  useEffect(() => {
    if (!editor) return;
    if (value !== lastKnownValue.current && value !== editor.getHTML()) {
      lastKnownValue.current = value;
      editor.commands.setContent(value, { emitUpdate: false });
    }
  }, [value, editor]);

  const formatState = useEditorState({
    editor,
    selector: (ctx) => ({
      bold: ctx.editor?.isActive("bold") ?? false,
      italic: ctx.editor?.isActive("italic") ?? false,
      underline: ctx.editor?.isActive("underline") ?? false,
      strike: ctx.editor?.isActive("strike") ?? false,
      bulletList: ctx.editor?.isActive("bulletList") ?? false,
      orderedList: ctx.editor?.isActive("orderedList") ?? false,
      blockType: (ctx.editor?.isActive("heading", { level: 1 })
        ? "h1"
        : ctx.editor?.isActive("heading", { level: 2 })
          ? "h2"
          : ctx.editor?.isActive("heading", { level: 3 })
            ? "h3"
            : "paragraph") as BlockType,
    }),
  });

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        flex: 1,
        minHeight: 0,
        border: "1px solid var(--border-default)",
        borderRadius: 12,
        background: "var(--bg-surface-sunken)",
        overflow: "hidden",
      }}
    >
      <div
        role="toolbar"
        aria-label={`${ariaLabel} formatting`}
        style={{
          display: "flex",
          gap: 4,
          padding: "6px 8px",
          borderBottom: "1px solid var(--border-default)",
          background: "var(--bg-surface)",
          flex: "none",
        }}
      >
        <BlockTypeDropdown editor={editor} blockType={formatState?.blockType ?? "paragraph"} />
        <span
          aria-hidden
          style={{ width: 1, alignSelf: "stretch", margin: "2px 2px", background: "var(--border-default)" }}
        />
        <ToolbarButton
          label="Bold"
          pressed={formatState?.bold ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBold().run()}
        >
          <strong>B</strong>
        </ToolbarButton>
        <ToolbarButton
          label="Italic"
          pressed={formatState?.italic ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleItalic().run()}
        >
          <em>I</em>
        </ToolbarButton>
        <ToolbarButton
          label="Underline"
          pressed={formatState?.underline ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleUnderline().run()}
        >
          <span style={{ textDecoration: "underline" }}>U</span>
        </ToolbarButton>
        <ToolbarButton
          label="Strikethrough"
          pressed={formatState?.strike ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleStrike().run()}
        >
          <span style={{ textDecoration: "line-through" }}>S</span>
        </ToolbarButton>
        <span
          aria-hidden
          style={{ width: 1, alignSelf: "stretch", margin: "2px 2px", background: "var(--border-default)" }}
        />
        <ToolbarButton
          label="Bulleted list"
          pressed={formatState?.bulletList ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleBulletList().run()}
        >
          ☰
        </ToolbarButton>
        <ToolbarButton
          label="Numbered list"
          pressed={formatState?.orderedList ?? false}
          disabled={!editor}
          onClick={() => editor?.chain().focus().toggleOrderedList().run()}
        >
          1.
        </ToolbarButton>
      </div>
      <div
        className="rte-content"
        style={{
          flex: 1,
          minHeight,
          overflow: "auto",
          padding: "12px 14px",
          fontSize: 14,
          lineHeight: 1.6,
          color: "var(--text-primary)",
        }}
      >
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}

type BlockType = "paragraph" | "h1" | "h2" | "h3";

const BLOCK_TYPE_OPTIONS: { value: BlockType; label: string }[] = [
  { value: "paragraph", label: "Paragraph" },
  { value: "h1", label: "Heading 1" },
  { value: "h2", label: "Heading 2" },
  { value: "h3", label: "Heading 3" },
];

interface BlockTypeDropdownProps {
  editor: Editor | null;
  blockType: BlockType;
}

/** Switches the current block between a plain paragraph and heading levels 1-3. */
function BlockTypeDropdown({ editor, blockType }: BlockTypeDropdownProps) {
  const [open, setOpen] = useState(false);
  const [hover, setHover] = useState(false);
  const anchorRef = useRef<HTMLButtonElement>(null);
  const current = BLOCK_TYPE_OPTIONS.find((o) => o.value === blockType) ?? BLOCK_TYPE_OPTIONS[0];

  useEffect(() => {
    if (!open) return;
    const handleOutsideClick = (e: MouseEvent) => {
      if (anchorRef.current?.contains(e.target as Node)) return;
      if (isInsideDropdownSurface(e.target)) return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, [open]);

  const setBlockType = (value: BlockType) => {
    if (!editor) return;
    const chain = editor.chain().focus();
    if (value === "paragraph") {
      chain.setParagraph().run();
    } else {
      chain.setHeading({ level: Number(value.slice(1)) as 1 | 2 | 3 }).run();
    }
    setOpen(false);
  };

  return (
    <div style={{ position: "relative" }}>
      <button
        ref={anchorRef}
        type="button"
        title="Paragraph style"
        aria-label="Paragraph style"
        aria-haspopup="listbox"
        aria-expanded={open}
        disabled={!editor}
        onClick={() => setOpen(!open)}
        onMouseEnter={() => setHover(true)}
        onMouseLeave={() => setHover(false)}
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: 6,
          height: 26,
          padding: "0 8px",
          border: 0,
          borderRadius: "var(--radius-xs)",
          fontSize: 13,
          lineHeight: 1,
          cursor: editor ? "pointer" : "not-allowed",
          background: open ? "var(--blue-100)" : hover ? "var(--bg-surface-hover)" : "transparent",
          color: !editor ? "var(--text-tertiary)" : open ? "var(--blue-700)" : "var(--text-secondary)",
          transition: "background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
        }}
      >
        <span>{current.label}</span>
        <span aria-hidden style={{ fontSize: 10, color: "var(--text-tertiary)" }}>
          ▾
        </span>
      </button>
      <DropdownSurface open={open} anchorRef={anchorRef} minWidth={150}>
        {BLOCK_TYPE_OPTIONS.map((o) => (
          <MenuItem key={o.value} selected={o.value === blockType} onClick={() => setBlockType(o.value)}>
            {o.label}
          </MenuItem>
        ))}
      </DropdownSurface>
    </div>
  );
}

interface ToolbarButtonProps {
  label: string;
  pressed: boolean;
  disabled: boolean;
  onClick: () => void;
  children: ReactNode;
}

function ToolbarButton({ label, pressed, disabled, onClick, children }: ToolbarButtonProps) {
  const [hover, setHover] = useState(false);

  return (
    <button
      type="button"
      title={label}
      aria-label={label}
      aria-pressed={pressed}
      disabled={disabled}
      onClick={onClick}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      style={{
        width: 30,
        height: 26,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: 0,
        borderRadius: "var(--radius-xs)",
        fontSize: 13,
        lineHeight: 1,
        cursor: disabled ? "not-allowed" : "pointer",
        background: pressed ? "var(--blue-100)" : hover ? "var(--bg-surface-hover)" : "transparent",
        color: disabled ? "var(--text-tertiary)" : pressed ? "var(--blue-700)" : "var(--text-secondary)",
        transition: "background var(--duration-fast) var(--ease-standard), color var(--duration-fast) var(--ease-standard)",
      }}
    >
      {children}
    </button>
  );
}
