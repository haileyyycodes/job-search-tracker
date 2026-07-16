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
import { ConfirmDeleteApplicationDialog } from "./ConfirmDeleteApplicationDialog";
import { ConfirmResetDemoDataDialog } from "./ConfirmResetDemoDataDialog";
import { applications, initialTasks } from "@/lib/data";
import { usePersistedState } from "@/lib/usePersistedState";
import type { Application, ApplicationStatus, FollowUp, Goals, Interview, ReminderRule, Task, TrackerView } from "@/lib/types";

const defaultGoals: Goals = {};

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
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [apps, setApps] = usePersistedState<Application[]>("harbor:applications", applications);
  const [tasks, setTasks] = usePersistedState<Task[]>("harbor:tasks", initialTasks);
  const [goals, setGoals] = usePersistedState<Goals>("harbor:goals", defaultGoals);

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

  const deleteInterview = (appId: string, interviewId: string) =>
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, interviews: a.interviews.filter((iv) => iv.id !== interviewId) } : a))
    );

  const deleteFollowUp = (appId: string, followUpId: string) =>
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, followUps: a.followUps.filter((f) => f.id !== followUpId) } : a))
    );

  const deleteTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const confirmDeleteApplication = () => {
    if (!deleteTarget) return;
    const appId = deleteTarget.id;
    setApps((prev) => prev.filter((a) => a.id !== appId));
    setTasks((prev) => prev.filter((t) => t.applicationId !== appId));
    if (selectedId === appId) {
      setView("applications");
      setSelectedId(null);
    }
    setDeleteTarget(null);
  };

  const resetDemoData = () => {
    setApps(applications);
    setTasks(initialTasks);
    setGoals(defaultGoals);
    setView("dashboard");
    setSelectedId(null);
    setResetConfirmOpen(false);
  };

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
      <Sidebar view={view === "detail" ? "applications" : view} setView={changeView} onRequestReset={() => setResetConfirmOpen(true)} />
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
          <DashboardView
            apps={apps}
            tasks={tasks}
            goals={goals}
            onDismissTask={dismissTask}
            onSelectApp={selectApp}
            onSaveGoals={setGoals}
          />
        )}
        {view === "applications" && (
          <ApplicationsListView apps={apps} onSelect={selectApp} onRequestDelete={setDeleteTarget} />
        )}
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
            onRequestDelete={setDeleteTarget}
            onDeleteInterview={deleteInterview}
            onDeleteFollowUp={deleteFollowUp}
          />
        )}
        {view === "interviews" && <InterviewsListView apps={apps} />}
        {view === "followups" && <FollowUpsListView apps={apps} />}
        {view === "tasks" && (
          <TasksView apps={apps} tasks={tasks} onDismissTask={dismissTask} onDeleteTask={deleteTask} />
        )}
      </div>
      <AddApplicationDialog open={addOpen} onClose={() => setAddOpen(false)} onAdd={addApplication} />
      {deleteTarget && (
        <ConfirmDeleteApplicationDialog
          app={deleteTarget}
          tasks={tasks}
          onClose={() => setDeleteTarget(null)}
          onConfirm={confirmDeleteApplication}
        />
      )}
      {resetConfirmOpen && (
        <ConfirmResetDemoDataDialog onClose={() => setResetConfirmOpen(false)} onConfirm={resetDemoData} />
      )}
    </div>
  );
}
