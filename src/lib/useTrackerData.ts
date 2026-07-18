"use client";

import {
  applications,
  companies as initialCompanies,
  defaultInterviewCategories,
  initialTasks,
  initialGoals,
  contacts as initialContacts,
  networkingEvents as initialNetworkingEvents,
} from "@/lib/data";
import { usePersistedState } from "@/lib/usePersistedState";
import {
  applicationSchema,
  companySchema,
  contactSchema,
  goalsSchema,
  interviewCategorySchema,
  networkingEventSchema,
  salvageArray,
  salvageObject,
  taskSchema,
} from "@/lib/schemas";
import type {
  Application,
  ApplicationStatus,
  Company,
  Contact,
  Feedback,
  FollowUp,
  Goals,
  Interview,
  NetworkingEvent,
  ReminderRule,
  Task,
} from "@/lib/types";

// Module-level so usePersistedState receives stable references across renders.
const sanitizeApplications = salvageArray(applicationSchema, applications);
const sanitizeTasks = salvageArray(taskSchema, initialTasks);
const sanitizeGoals = salvageObject(goalsSchema, initialGoals);
const sanitizeContacts = salvageArray(contactSchema, initialContacts);
const sanitizeNetworkingEvents = salvageArray(networkingEventSchema, initialNetworkingEvents);
const sanitizeCompanies = salvageArray(companySchema, initialCompanies);
const sanitizeInterviewCategories = salvageArray(interviewCategorySchema, defaultInterviewCategories);

/**
 * Bundles every piece of persisted tracker data plus the pure data-mutation handlers.
 * Backed by usePersistedState, which synchronizes all call sites for the same
 * localStorage key via a module-level listener registry — so calling this hook
 * independently from multiple pages stays consistent with no Context required.
 */
export function useTrackerData() {
  const [apps, setApps] = usePersistedState<Application[]>("harbor:applications", applications, sanitizeApplications);
  const [tasks, setTasks] = usePersistedState<Task[]>("harbor:tasks", initialTasks, sanitizeTasks);
  const [goals, setGoals] = usePersistedState<Goals>("harbor:goals", initialGoals, sanitizeGoals);
  const [contacts, setContacts] = usePersistedState<Contact[]>("harbor:contacts", initialContacts, sanitizeContacts);
  const [networkingEvents, setNetworkingEvents] = usePersistedState<NetworkingEvent[]>(
    "harbor:networkingEvents",
    initialNetworkingEvents,
    sanitizeNetworkingEvents
  );
  const [companies, setCompanies] = usePersistedState<Company[]>(
    "harbor:companies",
    initialCompanies,
    sanitizeCompanies
  );
  const [interviewCategories, setInterviewCategories] = usePersistedState<string[]>(
    "harbor:interviewCategories",
    defaultInterviewCategories,
    sanitizeInterviewCategories
  );

  const addInterviewCategory = (category: string) =>
    setInterviewCategories((prev) => (prev.includes(category) ? prev : [...prev, category]));

  /** Merges any not-yet-seen category tags into the persisted pool so they show up as options next time. */
  const registerInterviewCategories = (cats: string[] | undefined) => {
    if (!cats || cats.length === 0) return;
    setInterviewCategories((prev) => {
      const missing = cats.filter((c) => !prev.includes(c));
      return missing.length ? [...prev, ...missing] : prev;
    });
  };

  const dismissTask = (id: string) =>
    setTasks((ts) => ts.map((t) => (t.id === id ? { ...t, status: "dismissed" } : t)));

  /** The first time an application actually gets applied to (not just queued), advance its company past researching/watching. */
  const advanceCompanyStatusIfApplied = (companyId: string, status: ApplicationStatus) => {
    if (status === "todo") return;
    setCompanies((prev) =>
      prev.map((c) =>
        c.id === companyId && (c.status === "researching" || c.status === "watching")
          ? { ...c, status: "applied" }
          : c
      )
    );
  };

  const addApplication = (app: Application) => {
    setApps((prev) => [app, ...prev]);
    advanceCompanyStatusIfApplied(app.companyId, app.status);
  };

  const changeApplicationStatus = (appId: string, status: ApplicationStatus, at: string) => {
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, status, statusHistory: [...a.statusHistory, { status, at }] } : a))
    );
    const app = apps.find((a) => a.id === appId);
    if (app) advanceCompanyStatusIfApplied(app.companyId, status);
  };

  const logInterview = (appId: string, interview: Omit<Interview, "id">) => {
    registerInterviewCategories(interview.categories);
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
  };

  const editInterview = (appId: string, interviewId: string, updates: Omit<Interview, "id">) => {
    registerInterviewCategories(updates.categories);
    setApps((prev) =>
      prev.map((a) =>
        a.id === appId
          ? { ...a, interviews: a.interviews.map((iv) => (iv.id === interviewId ? { id: iv.id, ...updates } : iv)) }
          : a
      )
    );
  };

  const logFollowUp = (appId: string, followUp: Omit<FollowUp, "id">) =>
    setApps((prev) =>
      prev.map((a) => (a.id === appId ? { ...a, followUps: [...a.followUps, { id: crypto.randomUUID(), ...followUp }] } : a))
    );

  const addTask = (applicationId: string, note: string, dueDate: string, reminderRule: ReminderRule) =>
    setTasks((prev) => [
      ...prev,
      { id: crypto.randomUUID(), applicationId, dueDate, note, status: "active", reminderRule },
    ]);

  const editApplication = (updated: Application) => {
    setApps((prev) => prev.map((a) => (a.id === updated.id ? updated : a)));
    advanceCompanyStatusIfApplied(updated.companyId, updated.status);
  };

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

  const createCompany = (company: Company) => setCompanies((prev) => [...prev, company]);

  const editCompany = (updated: Company) =>
    setCompanies((prev) => prev.map((c) => (c.id === updated.id ? updated : c)));

  const deleteCompany = (companyId: string) => setCompanies((prev) => prev.filter((c) => c.id !== companyId));

  const toggleTarget = (companyId: string) =>
    setCompanies((prev) => prev.map((c) => (c.id === companyId ? { ...c, isTarget: !c.isTarget } : c)));

  const resetDemoData = () => {
    setApps(applications);
    setTasks(initialTasks);
    setGoals(initialGoals);
    setContacts(initialContacts);
    setNetworkingEvents(initialNetworkingEvents);
    setCompanies(initialCompanies);
    setInterviewCategories(defaultInterviewCategories);
  };

  const clearAllData = () => {
    setApps([]);
    setTasks([]);
    setGoals({});
    setContacts([]);
    setNetworkingEvents([]);
    setCompanies([]);
    setInterviewCategories(defaultInterviewCategories);
  };

  return {
    apps,
    tasks,
    goals,
    contacts,
    networkingEvents,
    companies,
    interviewCategories,
    addInterviewCategory,
    setGoals,
    dismissTask,
    addApplication,
    changeApplicationStatus,
    logInterview,
    editInterview,
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
    createCompany,
    editCompany,
    deleteCompany,
    toggleTarget,
    resetDemoData,
    clearAllData,
  };
}
