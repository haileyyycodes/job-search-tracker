"use client";

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
} from "@/lib/types";

/**
 * Bundles every piece of persisted tracker data plus the pure data-mutation handlers.
 * Backed by usePersistedState, which synchronizes all call sites for the same
 * localStorage key via a module-level listener registry — so calling this hook
 * independently from multiple pages stays consistent with no Context required.
 */
export function useTrackerData() {
  const [apps, setApps] = usePersistedState<Application[]>("harbor:applications", applications);
  const [tasks, setTasks] = usePersistedState<Task[]>("harbor:tasks", initialTasks);
  const [goals, setGoals] = usePersistedState<Goals>("harbor:goals", initialGoals);
  const [contacts, setContacts] = usePersistedState<Contact[]>("harbor:contacts", initialContacts);
  const [networkingEvents, setNetworkingEvents] = usePersistedState<NetworkingEvent[]>(
    "harbor:networkingEvents",
    initialNetworkingEvents
  );

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

  const deleteApplication = (appId: string) => {
    setApps((prev) => prev.filter((a) => a.id !== appId));
    setTasks((prev) => prev.filter((t) => t.applicationId !== appId));
  };

  const createContact = (contact: Contact) => setContacts((prev) => [...prev, contact]);

  const editContact = (updated: Contact) =>
    setContacts((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  const deleteContact = (contactId: string) => setContacts((prev) => prev.filter((c) => c.id !== contactId));

  const addNetworkingEvent = (event: Omit<NetworkingEvent, "id">) =>
    setNetworkingEvents((prev) => [{ id: crypto.randomUUID(), ...event }, ...prev]);

  const deleteNetworkingEvent = (id: string) => setNetworkingEvents((prev) => prev.filter((e) => e.id !== id));

  const resetDemoData = () => {
    setApps(applications);
    setTasks(initialTasks);
    setGoals(initialGoals);
    setContacts(initialContacts);
    setNetworkingEvents(initialNetworkingEvents);
  };

  return {
    apps,
    tasks,
    goals,
    contacts,
    networkingEvents,
    setGoals,
    dismissTask,
    addApplication,
    changeApplicationStatus,
    logInterview,
    logFollowUp,
    addTask,
    editApplication,
    saveFeedback,
    deleteInterview,
    deleteFollowUp,
    deleteTask,
    deleteApplication,
    createContact,
    editContact,
    deleteContact,
    addNetworkingEvent,
    deleteNetworkingEvent,
    resetDemoData,
  };
}
