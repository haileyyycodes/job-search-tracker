"use client";

import { useRouter } from "next/navigation";
import { StoriesView } from "@/components/tracker/StoriesView";
import { useTrackerData } from "@/lib/useTrackerData";

export default function StoriesPage() {
  const data = useTrackerData();
  const router = useRouter();

  return (
    <StoriesView
      stories={data.stories}
      onBack={() => router.push("/interview-prep")}
      onAddStory={data.addStory}
      onEditStory={data.editStory}
      onDeleteStory={data.deleteStory}
    />
  );
}
