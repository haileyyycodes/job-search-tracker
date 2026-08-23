export interface TabDef<T extends string> {
  id: T;
  label: string;
}

interface TabsProps<T extends string> {
  tabs: TabDef<T>[];
  active: T;
  onChange: (tab: T) => void;
}

export function Tabs<T extends string>({ tabs, active, onChange }: TabsProps<T>) {
  return (
    <div style={{ display: "flex", gap: 4, borderBottom: "1px solid var(--border-default)", padding: "0 32px" }}>
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          style={{
            background: "none",
            border: "none",
            borderBottom: `2px solid ${active === t.id ? "var(--accent-primary)" : "transparent"}`,
            padding: "12px 4px",
            marginRight: 20,
            font: "700 13px var(--font-body)",
            color: active === t.id ? "var(--text-primary)" : "var(--text-tertiary)",
            cursor: "pointer",
          }}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
