"use client";

import { TopBar } from "@/components/tracker/TopBar";
import { SettingsView } from "@/components/tracker/SettingsView";
import { useTrackerData } from "@/lib/useTrackerData";
import { useTrackerUI } from "@/lib/TrackerUIContext";

export default function SettingsPage() {
  const data = useTrackerData();
  const ui = useTrackerUI();

  return (
    <>
      <TopBar title="Settings" />
      <SettingsView userProfile={data.userProfile} onSaveProfile={data.updateUserProfile} onOpenGoals={ui.openGoalsDialog} />
    </>
  );
}
