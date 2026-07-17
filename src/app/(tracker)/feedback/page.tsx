"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/tracker/TopBar";
import { FeedbackListView } from "@/components/tracker/FeedbackListView";
import { useTrackerData } from "@/lib/useTrackerData";

export default function FeedbackPage() {
  const data = useTrackerData();
  const router = useRouter();

  return (
    <>
      <TopBar title="Feedback" />
      <FeedbackListView
        apps={data.apps}
        companies={data.companies}
        onSelectApp={(a) => router.push(`/applications/${a.id}`)}
      />
    </>
  );
}
