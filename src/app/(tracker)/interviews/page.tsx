"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/tracker/TopBar";
import { InterviewsListView } from "@/components/tracker/InterviewsListView";
import { useTrackerData } from "@/lib/useTrackerData";

export default function InterviewsPage() {
  const data = useTrackerData();
  const router = useRouter();

  return (
    <>
      <TopBar title="Interviews" />
      <InterviewsListView apps={data.apps} onSelectApp={(a) => router.push(`/applications/${a.id}`)} />
    </>
  );
}
