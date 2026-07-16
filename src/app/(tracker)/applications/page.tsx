"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ds";
import { TopBar } from "@/components/tracker/TopBar";
import { ApplicationsListView } from "@/components/tracker/ApplicationsListView";
import { useTrackerData } from "@/lib/useTrackerData";
import { useTrackerUI } from "@/lib/TrackerUIContext";

export default function ApplicationsPage() {
  const data = useTrackerData();
  const ui = useTrackerUI();
  const router = useRouter();

  return (
    <>
      <TopBar title="Applications">
        <Button size="sm" onClick={ui.openAddApplication}>
          + Log application
        </Button>
      </TopBar>
      <ApplicationsListView
        apps={data.apps}
        goals={data.goals}
        onSelect={(a) => router.push(`/applications/${a.id}`)}
        onRequestDelete={ui.requestDeleteApplication}
      />
    </>
  );
}
