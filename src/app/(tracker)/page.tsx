"use client";

import { Button } from "@/components/ds";
import { TopBar } from "@/components/tracker/TopBar";
import { DashboardView } from "@/components/tracker/DashboardView";
import { useTrackerData } from "@/lib/useTrackerData";
import { useTrackerUI } from "@/lib/TrackerUIContext";

export default function DashboardPage() {
  const data = useTrackerData();
  const ui = useTrackerUI();

  return (
    <>
      <TopBar title="Dashboard" subtitle={`${data.apps.length} total applications`}>
        <Button size="sm" onClick={ui.openAddApplication}>
          + Log application
        </Button>
      </TopBar>
      <DashboardView
        apps={data.apps}
        goals={data.goals}
        networkingEvents={data.networkingEvents}
        onSaveGoals={data.setGoals}
      />
    </>
  );
}
