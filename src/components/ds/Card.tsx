"use client";

import { MouseEventHandler, ReactNode, useState } from "react";

export type CardPadding = "sm" | "md" | "lg";

interface CardProps {
  children: ReactNode;
  padding?: CardPadding;
  hover?: boolean;
  onClick?: MouseEventHandler<HTMLDivElement>;
}

const paddingMap: Record<CardPadding, number> = { sm: 12, md: 16, lg: 24 };

export function Card({ children, padding = "md", hover = false, onClick }: CardProps) {
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      onClick={onClick}
      onMouseEnter={() => hover && setIsHovered(true)}
      onMouseLeave={() => hover && setIsHovered(false)}
      style={{
        background: "var(--bg-surface)",
        border: "1px solid var(--border-default)",
        borderRadius: "var(--radius-m)",
        padding: paddingMap[padding],
        boxShadow: isHovered ? "var(--shadow-m)" : "var(--shadow-s)",
        transition: "box-shadow var(--duration-base) var(--ease-standard), transform var(--duration-base)",
        cursor: onClick ? "pointer" : "default",
        transform: isHovered && onClick ? "translateY(-2px)" : "none",
      }}
    >
      {children}
    </div>
  );
}
