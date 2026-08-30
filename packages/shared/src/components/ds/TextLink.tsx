"use client";

import { CSSProperties, KeyboardEvent, MouseEvent, ReactNode, useState } from "react";

interface TextLinkProps {
  children: ReactNode;
  /** In-app navigation (e.g. open a detail view). Ignored when `href` is set. */
  onClick?: (e: MouseEvent<HTMLElement>) => void;
  /** Real URL. Renders an <a>; pair with `external` for off-site links. */
  href?: string;
  external?: boolean;
  /**
   * Nothing to link to — renders the text muted and inert (no pointer, no
   * hover). Lets callers keep a stable slot when the target is missing.
   */
  disabled?: boolean;
  /** Stop the click from reaching an enclosing clickable row. */
  stopPropagation?: boolean;
  style?: CSSProperties;
  title?: string;
}

/**
 * Inline text link with a clear hover state (colour shift + underline) applied
 * consistently, whether it navigates a URL or just fires an in-app handler.
 */
export function TextLink({ children, onClick, href, external, disabled, stopPropagation, style, title }: TextLinkProps) {
  const [hover, setHover] = useState(false);

  if (disabled) {
    return (
      <span style={{ color: "var(--text-tertiary)", ...style }} title={title}>
        {children}
      </span>
    );
  }

  const handleClick = (e: MouseEvent<HTMLElement>) => {
    if (stopPropagation) e.stopPropagation();
    onClick?.(e);
  };

  const linkStyle: CSSProperties = {
    color: hover ? "var(--text-link-hover)" : "var(--text-link)",
    textDecoration: hover ? "underline" : "none",
    textUnderlineOffset: 2,
    cursor: "pointer",
    transition: "color var(--duration-fast) var(--ease-standard)",
    ...style,
  };

  const shared = {
    onClick: handleClick,
    onMouseEnter: () => setHover(true),
    onMouseLeave: () => setHover(false),
    style: linkStyle,
    title,
  };

  if (href) {
    return (
      <a href={href} {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})} {...shared}>
        {children}
      </a>
    );
  }

  return (
    <span
      role="button"
      tabIndex={0}
      onKeyDown={(e: KeyboardEvent<HTMLSpanElement>) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          handleClick(e as unknown as MouseEvent<HTMLElement>);
        }
      }}
      {...shared}
    >
      {children}
    </span>
  );
}
