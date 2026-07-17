"use client";

import { useRouter } from "next/navigation";
import { Button } from "@/components/ds";
import { TopBar } from "@/components/tracker/TopBar";
import { NetworkingListView } from "@/components/tracker/NetworkingListView";
import { useTrackerData } from "@/lib/useTrackerData";
import { useTrackerUI } from "@/lib/TrackerUIContext";

export default function NetworkingPage() {
  const data = useTrackerData();
  const ui = useTrackerUI();
  const router = useRouter();

  return (
    <>
      <TopBar title="Networking">
        <Button size="sm" onClick={() => ui.openLogNetworkingEvent()}>
          + Log networking event
        </Button>
      </TopBar>
      <NetworkingListView
        events={data.networkingEvents}
        contacts={data.contacts}
        apps={data.apps}
        companies={data.companies}
        onSelectApp={(a) => router.push(`/applications/${a.id}`)}
        onDelete={data.deleteNetworkingEvent}
        onSelectContact={(c) => router.push(`/contacts/${c.id}`)}
      />
    </>
  );
}
