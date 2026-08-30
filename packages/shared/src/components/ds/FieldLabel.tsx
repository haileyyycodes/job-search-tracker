"use client";

import { CSSProperties, ReactNode } from "react";

interface FieldLabelProps {
  children: ReactNode;
  /** Appends a red asterisk marking the field as required. */
  required?: boolean;
  /** Render as a block-level label with a bottom margin (for standalone labels above textareas). */
  block?: boolean;
  style?: CSSProperties;
}

/**
 * The single form-field label used across every input in the app. Pass
 * `required` to append the red asterisk that marks a field as mandatory.
 */
export function FieldLabel({ children, required = false, block = false, style }: FieldLabelProps) {
  return (
    <label
      style={{
        font: "var(--text-label)",
        color: "var(--text-secondary)",
        ...(block ? { display: "block", marginBottom: 6 } : null),
        ...style,
      }}
    >
      {children}
      {required && (
        <span aria-label="required" style={{ color: "var(--danger)", marginLeft: 2 }}>
          *
        </span>
      )}
    </label>
  );
}
