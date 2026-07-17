"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/tracker/TopBar";
import { FollowUpsListView } from "@/components/tracker/FollowUpsListView";
import { useTrackerData } from "@/lib/useTrackerData";

export default function FollowUpsPage() {
  const data = useTrackerData();
  const router = useRouter();

  return (
    <>
      <TopBar title="Follow-Ups" />
      <FollowUpsListView
        apps={data.apps}
        contacts={data.contacts}
        companies={data.companies}
        onSelectApp={(a) => router.push(`/applications/${a.id}`)}
        onSelectContact={(c) => router.push(`/contacts/${c.id}`)}
      />
    </>
  );
}
