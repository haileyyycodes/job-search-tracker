"use client";

import { useState } from "react";
import { Card, Input, Button } from "@/components/ds";
import type { UserProfile } from "@/lib/types";

interface SettingsViewProps {
  userProfile: UserProfile;
  onSaveProfile: (profile: UserProfile) => void;
  onOpenGoals: () => void;
}

export function SettingsView({ userProfile, onSaveProfile, onOpenGoals }: SettingsViewProps) {
  const [name, setName] = useState(userProfile.name);
  const trimmedName = name.trim();
  const dirty = trimmedName !== userProfile.name;

  return (
    <div
      style={{
        padding: "24px 32px 32px",
        overflow: "auto",
        flex: 1,
        display: "flex",
        flexDirection: "column",
        gap: 16,
        maxWidth: 560,
      }}
    >
      <Card padding="lg">
        <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)", marginBottom: 4 }}>
          Profile
        </div>
        <p style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)", margin: "0 0 16px" }}>
          Shown in the sidebar.
        </p>
        <div style={{ display: "flex", gap: 12, alignItems: "flex-end" }}>
          <div style={{ flex: 1 }}>
            <Input label="Your name" placeholder="e.g. Jamie Rivera" value={name} onChange={setName} />
          </div>
          <Button size="md" disabled={!dirty} onClick={() => onSaveProfile({ name: trimmedName })}>
            Save
          </Button>
        </div>
      </Card>

      <Card padding="lg">
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", gap: 16 }}>
          <div>
            <div style={{ font: "700 15px var(--font-display)", color: "var(--text-primary)" }}>Goals</div>
            <p style={{ font: "var(--text-body-s)", color: "var(--text-tertiary)", margin: "4px 0 0" }}>
              Salary range, weekly application target, and offer date.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={onOpenGoals}>
            Edit goals
          </Button>
        </div>
      </Card>
    </div>
  );
}
