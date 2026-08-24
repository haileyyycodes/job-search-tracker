"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Tabs } from "@/components/ds";
import { TopBar } from "@/components/tracker/TopBar";
import { InterviewsListView } from "@/components/tracker/InterviewsListView";
import { InterviewStatsView } from "@/components/tracker/InterviewStatsView";
import { useTrackerData } from "@/lib/useTrackerData";

type InterviewsTab = "list" | "stats";

export default function InterviewsPage() {
  const data = useTrackerData();
  const router = useRouter();
  const [activeTab, setActiveTab] = useState<InterviewsTab>("list");

  return (
    <>
      <TopBar title="Interviews" />
      <Tabs
        tabs={[
          { id: "list", label: "List" },
          { id: "stats", label: "Stats" },
        ]}
        active={activeTab}
        onChange={setActiveTab}
      />
      {activeTab === "stats" ? (
        <InterviewStatsView apps={data.apps} />
      ) : (
        <InterviewsListView
          apps={data.apps}
          companies={data.companies}
          onSelectApp={(a) => router.push(`/applications?id=${a.id}`)}
        />
      )}
    </>
  );
}
