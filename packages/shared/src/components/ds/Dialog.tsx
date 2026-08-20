import { MouseEvent, ReactNode } from "react";

interface DialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
}

export function Dialog({ open, title, children, onClose, footer }: DialogProps) {
  if (!open) return null;

  const stop = (e: MouseEvent) => e.stopPropagation();

  return (
    <div
      onClick={onClose}
      style={{
        position: "fixed",
        inset: 0,
        background: "oklch(20% 0.02 250 / 0.45)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 100,
      }}
    >
      <div
        onClick={stop}
        style={{
          width: 480,
          maxWidth: "90vw",
          background: "var(--bg-surface)",
          borderRadius: "var(--radius-l)",
          boxShadow: "var(--shadow-l)",
          overflowX: "hidden",
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid var(--border-default)",
            borderTopLeftRadius: "var(--radius-l)",
            borderTopRightRadius: "var(--radius-l)",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <h3 style={{ font: "var(--text-heading-m)", margin: 0, color: "var(--text-primary)" }}>{title}</h3>
          <button
            onClick={onClose}
            style={{ background: "none", border: "none", fontSize: 16, color: "var(--text-tertiary)", cursor: "pointer" }}
          >
            ✕
          </button>
        </div>
        <div
          style={{
            padding: 20,
            borderBottomLeftRadius: footer ? undefined : "var(--radius-l)",
            borderBottomRightRadius: footer ? undefined : "var(--radius-l)",
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid var(--border-default)",
              borderBottomLeftRadius: "var(--radius-l)",
              borderBottomRightRadius: "var(--radius-l)",
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
