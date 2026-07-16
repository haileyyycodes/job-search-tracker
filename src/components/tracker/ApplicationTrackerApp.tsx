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
import { ContactsListView } from "./ContactsListView";
import { ContactDetailView } from "./ContactDetailView";
import { AddContactDialog } from "./AddContactDialog";
import { ConfirmDeleteContactDialog } from "./ConfirmDeleteContactDialog";
import { NetworkingListView } from "./NetworkingListView";
import { LogNetworkingEventDialog } from "./LogNetworkingEventDialog";
import {
  applications,
  initialTasks,
  initialGoals,
  contacts as initialContacts,
  networkingEvents as initialNetworkingEvents,
} from "@/lib/data";
import { usePersistedState } from "@/lib/usePersistedState";
import type {
  Application,
  ApplicationStatus,
  Contact,
  Feedback,
  FollowUp,
  Goals,
  Interview,
  NetworkingEvent,
  ReminderRule,
  Task,
  TrackerView,
} from "@/lib/types";

const titles: Record<TrackerView, string> = {
  dashboard: "Dashboard",
  applications: "Applications",
  interviews: "Interviews",
  followups: "Follow-Ups",
  tasks: "Tasks",
  contacts: "Contacts",
  networking: "Networking",
  detail: "",
  "contact-detail": "",
};

export function ApplicationTrackerApp() {
  const [view, setView] = useState<TrackerView>("dashboard");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [selectedContactId, setSelectedContactId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addContactOpen, setAddContactOpen] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Application | null>(null);
  const [deleteContactTarget, setDeleteContactTarget] = useState<Contact | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);
  const [networkingDialogContactId, setNetworkingDialogContactId] = useState<string | null>(null);
  const [networkingDialogOpen, setNetworkingDialogOpen] = useState(false);
  const [apps, setApps] = usePersistedState<Application[]>("harbor:applications", applications);
  const [tasks, setTasks] = usePersistedState<Task[]>("harbor:tasks", initialTasks);
  const [goals, setGoals] = usePersistedState<Goals>("harbor:goals", initialGoals);
  const [contacts, setContacts] = usePersistedState<Contact[]>("harbor:contacts", initialContacts);
  const [networkingEvents, setNetworkingEvents] = usePersistedState<NetworkingEvent[]>(
    "harbor:networkingEvents",
    initialNetworkingEvents
  );

  const selectedApp = apps.find((a) => a.id === selectedId) ?? null;
  const selectedContact = contacts.find((c) => c.id === selectedContactId) ?? null;

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

  const saveFeedback = (appId: string, feedback: Feedback) =>
    setApps((prev) => prev.map((a) => (a.id === appId ? { ...a, feedback } : a)));

  const deleteInterview = (appId: string, interviewId: string) =>
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, interviews: a.interviews.filter((iv) => iv.id !== interviewId) } : a))
    );

  const deleteFollowUp = (appId: string, followUpId: string) =>
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, followUps: a.followUps.filter((f) => f.id !== followUpId) } : a))
    );

  const deleteTask = (id: string) => setTasks((prev) => prev.filter((t) => t.id !== id));

  const createContact = (contact: Contact) => setContacts((prev) => [...prev, contact]);

  const editContact = (updated: Contact) =>
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  const confirmDeleteContact = () => {
    if (!deleteContactTarget) return;
    const contactId = deleteContactTarget.id;
    setContacts((prev) => prev.filter((c) => c.id !== contactId));
    if (selectedContactId === contactId) {
      setView("contacts");
      setSelectedContactId(null);
    }
    setDeleteContactTarget(null);
  };

  const addNetworkingEvent = (event: Omit<NetworkingEvent, "id">) =>
    setNetworkingEvents((prev) => [{ id: crypto.randomUUID(), ...event }, ...prev]);

  const deleteNetworkingEvent = (id: string) => setNetworkingEvents((prev) => prev.filter((e) => e.id !== id));

  const openLogNetworkingEvent = (initialContactId?: string) => {
    setNetworkingDialogContactId(initialContactId ?? null);
    setNetworkingDialogOpen(true);
  };

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
    setGoals(initialGoals);
    setContacts(initialContacts);
    setNetworkingEvents(initialNetworkingEvents);
    setView("dashboard");
    setSelectedId(null);
    setSelectedContactId(null);
    setResetConfirmOpen(false);
  };

  const selectApp = (a: Application) => {
    setSelectedId(a.id);
    setView("detail");
  };

  const selectContact = (c: Contact) => {
    setSelectedContactId(c.id);
    setView("contact-detail");
  };

  const backFromDetail = () => {
    setView("applications");
    setSelectedId(null);
  };

  const backFromContactDetail = () => {
    setView("contacts");
    setSelectedContactId(null);
  };

  const changeView = (v: TrackerView) => {
    setView(v);
    setSelectedId(null);
    setSelectedContactId(null);
  };

  return (
    <div style={{ display: "flex", height: "100%" }}>
      <Sidebar
        view={view === "detail" ? "applications" : view === "contact-detail" ? "contacts" : view}
        setView={changeView}
        onRequestReset={() => setResetConfirmOpen(true)}
      />
      <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0 }}>
        {view !== "detail" && view !== "contact-detail" && (
          <TopBar title={titles[view]} subtitle={view === "dashboard" ? `${apps.length} total applications` : undefined}>
            {(view === "dashboard" || view === "applications") && (
              <Button size="sm" onClick={() => setAddOpen(true)}>
                + Log application
              </Button>
            )}
            {view === "contacts" && (
              <Button size="sm" onClick={() => setAddContactOpen(true)}>
                + Add contact
              </Button>
            )}
            {view === "networking" && (
              <Button size="sm" onClick={() => openLogNetworkingEvent()}>
                + Log networking event
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
          <ApplicationsListView apps={apps} goals={goals} onSelect={selectApp} onRequestDelete={setDeleteTarget} />
        )}
        {view === "detail" && (
          <ApplicationDetailView
            app={selectedApp}
            tasks={tasks}
            contacts={contacts}
            goals={goals}
            onCreateContact={createContact}
            onSelectContact={selectContact}
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
            onSaveFeedback={saveFeedback}
          />
        )}
        {view === "interviews" && <InterviewsListView apps={apps} onSelectApp={selectApp} />}
        {view === "followups" && (
          <FollowUpsListView apps={apps} contacts={contacts} onSelectApp={selectApp} onSelectContact={selectContact} />
        )}
        {view === "tasks" && (
          <TasksView
            apps={apps}
            tasks={tasks}
            onDismissTask={dismissTask}
            onDeleteTask={deleteTask}
            onSelectApp={selectApp}
          />
        )}
        {view === "contacts" && (
          <ContactsListView contacts={contacts} onSelect={selectContact} onRequestDelete={setDeleteContactTarget} />
        )}
        {view === "contact-detail" && (
          <ContactDetailView
            contact={selectedContact}
            apps={apps}
            contacts={contacts}
            networkingEvents={networkingEvents}
            onBack={backFromContactDetail}
            onEditContact={editContact}
            onRequestDelete={setDeleteContactTarget}
            onSelectApp={selectApp}
            onSelectContact={selectContact}
            onDeleteNetworkingEvent={deleteNetworkingEvent}
            onOpenLogNetworkingEvent={openLogNetworkingEvent}
          />
        )}
        {view === "networking" && (
          <NetworkingListView
            events={networkingEvents}
            contacts={contacts}
            apps={apps}
            onSelectApp={selectApp}
            onDelete={deleteNetworkingEvent}
            onSelectContact={selectContact}
          />
        )}
      </div>
      <AddApplicationDialog
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdd={addApplication}
        contacts={contacts}
        onCreateContact={createContact}
      />
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
      <AddContactDialog open={addContactOpen} onClose={() => setAddContactOpen(false)} onAdd={createContact} />
      {deleteContactTarget && (
        <ConfirmDeleteContactDialog
          contact={deleteContactTarget}
          apps={apps}
          networkingEvents={networkingEvents}
          onClose={() => setDeleteContactTarget(null)}
          onConfirm={confirmDeleteContact}
        />
      )}
      {networkingDialogOpen && (
        <LogNetworkingEventDialog
          contacts={contacts}
          apps={apps}
          initialContactId={networkingDialogContactId ?? undefined}
          onCreateContact={createContact}
          onClose={() => setNetworkingDialogOpen(false)}
          onSave={(event) => {
            addNetworkingEvent(event);
            setNetworkingDialogOpen(false);
          }}
        />
      )}
    </div>
  );
}
