import { Card } from "@/components/ds";
import type { Application } from "@/lib/types";

const sectionHeaderStyle = {
  font: "700 15px var(--font-display)",
  color: "var(--text-primary)",
  marginBottom: 12,
} as const;

interface CountBarProps {
  label: string;
  count: number;
  total: number;
  color?: string;
}

function CountBar({ label, count, total, color = "var(--blue-400)" }: CountBarProps) {
  const pct = total > 0 ? (count / total) * 100 : 0;
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
      <div style={{ width: 160, flexShrink: 0, font: "var(--text-body-s)", color: "var(--text-primary)" }}>{label}</div>
      <div
        style={{
          flex: 1,
          height: 8,
          borderRadius: "var(--radius-pill)",
          background: "var(--ink-100)",
          overflow: "hidden",
        }}
      >
        <div style={{ width: `${pct}%`, height: "100%", background: color }} />
      </div>
      <span style={{ font: "var(--text-body-s)", color: "var(--text-secondary)", width: 24, textAlign: "right" }}>
        {count}
      </span>
    </div>
  );
}

interface InterviewStatsViewProps {
  apps: Application[];
}

export function InterviewStatsView({ apps }: InterviewStatsViewProps) {
  const interviews = apps.flatMap((a) => a.interviews);

  const categoryCounts = new Map<string, number>();
  for (const iv of interviews) {
    for (const c of iv.categories ?? []) {
      categoryCounts.set(c, (categoryCounts.get(c) ?? 0) + 1);
    }
  }
  const rankedCategories = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]);
  const maxCategoryCount = Math.max(1, ...rankedCategories.map(([, c]) => c));

  const styleCounts = new Map<string, number>();
  let notSpecifiedCount = 0;
  for (const iv of interviews) {
    if (iv.style) styleCounts.set(iv.style, (styleCounts.get(iv.style) ?? 0) + 1);
    else notSpecifiedCount++;
  }
  const styleOrder = ["LeetCode", "Whiteboarding", "Mixture", "Other"];
  const styleRows = [
    ...styleOrder.filter((s) => styleCounts.has(s)).map((s) => [s, styleCounts.get(s)!] as const),
    ...(notSpecifiedCount > 0 ? [["Not specified", notSpecifiedCount] as const] : []),
  ];
  const maxStyleCount = Math.max(1, ...styleRows.map(([, c]) => c));

  return (
    <div style={{ padding: "24px 32px 32px", overflow: "auto", flex: 1, display: "flex", flexDirection: "column", gap: 24 }}>
      <div>
        <div style={sectionHeaderStyle}>Question category frequency</div>
        <Card padding="md">
          {rankedCategories.length === 0 ? (
            <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>
              No categories logged yet. Tag interviews with categories (e.g. DSA/Leetcode, System Design, Behavioral) to
              see what you&rsquo;re asked most.
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {rankedCategories.map(([category, count]) => (
                <CountBar key={category} label={category} count={count} total={maxCategoryCount} />
              ))}
            </div>
          )}
        </Card>
      </div>
      <div>
        <div style={sectionHeaderStyle}>Technical interview style</div>
        <Card padding="md">
          {styleRows.length === 0 ? (
            <div style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)" }}>No interviews logged yet.</div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {styleRows.map(([style, count]) => (
                <CountBar
                  key={style}
                  label={style}
                  count={count}
                  total={maxStyleCount}
                  color={style === "Not specified" ? "var(--ink-300)" : "var(--blue-400)"}
                />
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
