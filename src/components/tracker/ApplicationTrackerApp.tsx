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
import type { Application, ApplicationStatus, FollowUp, Interview, ReminderRule, Task, TrackerView } from "@/lib/types";

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [apps, setApps] = usePersistedState<Application[]>("harbor:applications", applications);
  const [tasks, setTasks] = usePersistedState<Task[]>("harbor:tasks", initialTasks);

  const selectedApp = apps.find((a) => a.id === selectedId) ?? null;

  const dismissTask = (id: string) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: "dismissed" } : t)));

  const addApplication = (app: Application) => setApps((prev) => [app, ...prev]);

  const changeApplicationStatus = (appId: string, status: ApplicationStatus, at: string) =>
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status, statusHistory: [...a.statusHistory, { status, at }] } : a))
    );

  const logInterview = (appId: string, interview: Omit<Interview, "id">) =>
    setApps((prev) =>
      prev.map((a) => {
        if (a.id !== appId) return a;
        const interviews = [...a.interviews, { id: crypto.randomUUID(), ...interview }];
        if (a.status === "applied") {
          return {
            ...a,
            interviews,
            status: "interviewing",
            statusHistory: [...a.statusHistory, { status: "interviewing", at: interview.date }],
          };
        }
        return { ...a, interviews };
      })
    );

  const logFollowUp = (appId: string, followUp: Omit<FollowUp, "id">) =>
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, followUps: [...a.followUps, { id: crypto.randomUUID(), ...followUp }] } : a))
    );

  const addTask = (applicationId: string, note: string, dueDate: string, reminderRule: ReminderRule) =>
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), applicationId, dueDate, note, status: "active", reminderRule },
    ]);

  const editApplication = (updated: Application) =>
    setApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));

  const selectApp = (a: Application) => {
    setSelectedId(a.id);
    setView("detail");
  };

  const backFromDetail = () => {
    setView("applications");
    setSelectedId(null);
  };

  const changeView = (v: TrackerView) => {
    setView(v);
    setSelectedId(null);
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
          <ApplicationDetailView
            app={selectedApp}
            tasks={tasks}
            onBack={backFromDetail}
            onDismissTask={dismissTask}
            onChangeStatus={changeApplicationStatus}
            onLogInterview={logInterview}
            onLogFollowUp={logFollowUp}
            onAddTask={addTask}
            onEditApplication={editApplication}
          />
        )}
        {view === "interviews" && <InterviewsListView apps={apps} />}
        {view === "followups" && <FollowUpsListView apps={apps} />}
        {view === "tasks" && <TasksView apps={apps} tasks={tasks} onDismissTask={dismissTask} />}
      </div>
      <AddApplicationDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={addApplication} />
    </div>
  );
}
