import { MouseEvent, ReactNode } from "react";

interface DialogProps {
  open: boolean;
  title: string;
  children: ReactNode;
  onClose: () => void;
  footer?: ReactNode;
  /** Content width in px. Defaults to the standard 480; pass a larger value for wide
   * content like charts or the two-panel application form. Ignored when `fullScreen`. */
  width?: number;
  /** Fixed body height (number in px, or any CSS length). When set, the dialog becomes a
   * flex column and its body scrolls within this height instead of growing with content.
   * Ignored when `fullScreen`. */
  height?: number | string;
  /** Fill the entire viewport — no scrim margin, no rounded corners, no shadow. Implies
   * the flex-column body layout. */
  fullScreen?: boolean;
  /** Drop the body's uniform 20px padding so the content can run its own edge-to-edge
   * layout, e.g. side-by-side panels. */
  disablePadding?: boolean;
}

export function Dialog({
  open,
  title,
  children,
  onClose,
  footer,
  width = 480,
  height,
  fullScreen = false,
  disablePadding = false,
}: DialogProps) {
  if (!open) return null;

  const stop = (e: MouseEvent) => e.stopPropagation();
  const columnLayout = fullScreen || height != null;
  const radius = fullScreen ? 0 : "var(--radius-l)";

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
        padding: fullScreen ? 0 : height != null ? 24 : 0,
      }}
    >
      <div
        onClick={stop}
        style={{
          width: fullScreen ? "100vw" : width,
          maxWidth: fullScreen ? "none" : "90vw",
          height: fullScreen ? "100vh" : height,
          maxHeight: fullScreen ? "none" : height != null ? "90vh" : undefined,
          background: "var(--bg-surface)",
          borderRadius: radius,
          boxShadow: fullScreen ? "none" : "var(--shadow-l)",
          overflowX: "hidden",
          overflowY: columnLayout ? "hidden" : undefined,
          display: columnLayout ? "flex" : undefined,
          flexDirection: columnLayout ? "column" : undefined,
        }}
      >
        <div
          style={{
            padding: "18px 20px",
            borderBottom: "1px solid var(--border-default)",
            borderTopLeftRadius: radius,
            borderTopRightRadius: radius,
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            flexShrink: 0,
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
            flex: columnLayout ? 1 : undefined,
            minHeight: columnLayout ? 0 : undefined,
            overflowY: columnLayout && !disablePadding ? "auto" : undefined,
            display: columnLayout ? "flex" : undefined,
            flexDirection: columnLayout ? "column" : undefined,
            padding: disablePadding ? 0 : 20,
            borderBottomLeftRadius: footer ? undefined : radius,
            borderBottomRightRadius: footer ? undefined : radius,
          }}
        >
          {children}
        </div>
        {footer && (
          <div
            style={{
              padding: "14px 20px",
              borderTop: "1px solid var(--border-default)",
              borderBottomLeftRadius: radius,
              borderBottomRightRadius: radius,
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              flexShrink: 0,
            }}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
