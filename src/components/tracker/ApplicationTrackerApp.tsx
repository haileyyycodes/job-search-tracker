"use client";

import { useState } from "react";
import { Button } from "@/components/ds";
import { Sidebar } from "./Sidebar";
import { TopBar } from "./TopBar";
import { DashboardView } from "./DashboardView";
import { ApplicationsListView } from "./ApplicationsListView";
import { ApplicationDetailView } from "./ApplicationDetailView";
import { InterviewsListView } from "./InterviewsListView";
import { FollowUpsListView } from "./FollowUpsListView";
import { TasksView } from "./TasksView";
import { AddApplicationDialog } from "./AddApplicationDialog";
import { applications, initialTasks } from "@/lib/data";
import { usePersistedState } from "@/lib/usePersistedState";
import type { Application, Task, TrackerView } from "@/lib/types";

const titles: Record<TrackerView, string> = {
  dashboard: "Dashboard",
  applications: "Applications",
  interviews: "Interviews",
  followups: "Follow-Ups",
  tasks: "Tasks",
  detail: "",
};

export function ApplicationTrackerApp() {
  const [view, setView] = useState<TrackerView>("dashboard");
  const [selected, setSelected] = useState<Application | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [apps, setApps] = usePersistedState<Application[]>("harbor:applications", applications);
  const [tasks, setTasks] = usePersistedState<Task[]>("harbor:tasks", initialTasks);

  const dismissTask = (id: string) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: "dismissed" } : t)));

  const addApplication = (app: Application) => setApps((prev) => [app, ...prev]);

  const selectApp = (a: Application) => {
    setSelected(a);
    setView("detail");
  };

  const backFromDetail = () => {
    setView("applications");
    setSelected(null);
  };

  const changeView = (v: TrackerView) => {
    setView(v);
    setSelected(null);
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <Sidebar view={view === "detail" ? "applications" : view} setView={changeView} />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {view !== "detail" && (
          <TopBar title={titles[view]} subtitle={view === "dashboard" ? `${apps.length} total applications` : undefined}>
            {(view === "dashboard" || view === "applications") && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                + Log application
              </Button>
            )}
          </TopBar>
        )}
        {view === "dashboard" && (
          <DashboardView apps={apps} tasks={tasks} onDismissTask={dismissTask} onSelectApp={selectApp} />
        )}
        {view === "applications" && <ApplicationsListView apps={apps} onSelect={selectApp} />}
        {view === "detail" && (
          <ApplicationDetailView app={selected} tasks={tasks} onBack={backFromDetail} onDismissTask={dismissTask} />
        )}
        {view === "interviews" && <InterviewsListView apps={apps} />}
        {view === "followups" && <FollowUpsListView apps={apps} />}
        {view === "tasks" && <TasksView apps={apps} tasks={tasks} onDismissTask={dismissTask} />}
      </div>
      <AddApplicationDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={addApplication} />
    </div>
  );
}
