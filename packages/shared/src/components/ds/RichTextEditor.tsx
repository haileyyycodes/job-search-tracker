"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { EditorContent, useEditor, useEditorState } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Placeholder from "@tiptap/extension-placeholder";

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

/** Bold/italic/underline/strikethrough + bulleted/numbered lists — the toolbar surfaces
 * exactly what the schema allows. */
export function RichTextEditor({ value, onChange, onBlur, placeholder, ariaLabel, minHeight = 240 }: RichTextEditorProps) {
  const lastKnownValue = useRef(value);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        blockquote: false,
        code: false,
        codeBlock: false,
        heading: false,
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
