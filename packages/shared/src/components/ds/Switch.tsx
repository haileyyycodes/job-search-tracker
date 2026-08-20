interface SwitchProps {
  checked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  label?: string;
}

export function Switch({ checked = false, onChange, disabled = false, label }: SwitchProps) {
  return (
    <label
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 10,
        cursor: disabled ? "not-allowed" : "pointer",
        opacity: disabled ? 0.5 : 1,
      }}
    >
      <span
        onClick={() => !disabled && onChange?.(!checked)}
        style={{
          width: 38,
          height: 22,
          borderRadius: "var(--radius-pill)",
          background: checked ? "var(--accent-secondary)" : "var(--ink-300)",
          position: "relative",
          transition: "background var(--duration-base) var(--ease-standard)",
          flexShrink: 0,
        }}
      >
        <span
          style={{
            position: "absolute",
            top: 2,
            left: checked ? 18 : 2,
            width: 18,
            height: 18,
            borderRadius: "50%",
            background: "var(--white)",
            boxShadow: "var(--shadow-s)",
            transition: "left var(--duration-base) var(--ease-standard)",
          }}
        />
      </span>
      {label && <span style={{ font: "var(--text-body-m)", color: "var(--text-primary)" }}>{label}</span>}
    </label>
  );
}
