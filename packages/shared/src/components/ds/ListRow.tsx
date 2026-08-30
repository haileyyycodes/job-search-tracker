"use client";

import { CSSProperties, MouseEvent, ReactNode, useState } from "react";

interface ListRowProps {
  children: ReactNode;
  /** Makes the whole row the click target. Omit for a static row. */
  onClick?: (e: MouseEvent<HTMLDivElement>) => void;
  /** Grid column template. Omit for a plain block row (text that flows). */
  columns?: string;
  /** Row padding shorthand. */
  padding?: string;
  /** Bottom divider border. */
  divider?: boolean;
  /** Vertical alignment of grid cells. */
  align?: CSSProperties["alignItems"];
  style?: CSSProperties;
}

/**
 * One row in a list. The entire row is the click target, with a deliberately
 * subtle hover/press wash so it never competes with `TextLink`s or other
 * controls sitting inside the row.
 */
export function ListRow({
  children,
  onClick,
  columns,
  padding = "14px 4px",
  divider = true,
  align = "center",
  style,
}: ListRowProps) {
  const [hover, setHover] = useState(false);
  const [pressed, setPressed] = useState(false);
  const interactive = !!onClick;

  const background = !interactive
    ? "transparent"
    : pressed
      ? "var(--bg-surface-hover)"
      : hover
        ? "var(--bg-surface-sunken)"
        : "transparent";

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => interactive && setHover(true)}
      onMouseLeave={() => {
        setHover(false);
        setPressed(false);
      }}
      onMouseDown={() => interactive && setPressed(true)}
      onMouseUp={() => setPressed(false)}
      style={{
        ...(columns
          ? { display: "grid", gridTemplateColumns: columns, columnGap: 16, alignItems: align }
          : { display: "block" }),
        padding,
        borderBottom: divider ? "1px solid var(--border-default)" : "none",
        cursor: interactive ? "pointer" : "default",
        background,
        transition: "background var(--duration-fast) var(--ease-standard)",
        ...style,
      }}
    >
      {children}
    </div>
  );
}
