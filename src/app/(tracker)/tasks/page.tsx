"use client";

import { useRouter } from "next/navigation";
import { TopBar } from "@/components/tracker/TopBar";
import { TasksView } from "@/components/tracker/TasksView";
import { useTrackerData } from "@/lib/useTrackerData";

export default function TasksPage() {
  const data = useTrackerData();
  const router = useRouter();

  return (
    <>
      <TopBar title="Tasks" />
      <TasksView
        apps={data.apps}
        tasks={data.tasks}
        onDismissTask={data.dismissTask}
        onDeleteTask={data.deleteTask}
        onSelectApp={(a) => router.push(`/applications/${a.id}`)}
      />
    </>
  );
}
