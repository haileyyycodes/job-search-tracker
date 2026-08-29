"use client";

import { useSyncExternalStore } from "react";
import { MemoryDataSource } from "./dataSource/memoryDataSource";
import { selectDataSource } from "./dataSource/select";
import { emptySeed } from "./dataSource/seed";
import type {
  DataSource,
  NewApplication,
  NewCompany,
  NewContact,
  NewElevatorPitchVersion,
  NewFollowUp,
  NewInterview,
  NewInterviewPrepQuestion,
  NewNetworkingEvent,
} from "./dataSource/types";
import type {
  Application,
  ApplicationStatus,
  Company,
  Contact,
  ElevatorPitchVersion,
  Feedback,
  FollowUp,
  Goals,
  Interview,
  InterviewPrepQuestion,
  NetworkingEvent,
  UserProfile,
} from "./types";

interface TrackerState {
  apps: Application[];
  goals: Goals;
  userProfile: UserProfile;
  contacts: Contact[];
  networkingEvents: NetworkingEvent[];
  companies: Company[];
  interviewCategories: string[];
  interviewPrepQuestions: InterviewPrepQuestion[];
  elevatorPitchVersions: ElevatorPitchVersion[];
}

const emptyState: TrackerState = {
  apps: [],
  goals: {},
  userProfile: { name: "" },
  contacts: [],
  networkingEvents: [],
  companies: [],
  interviewCategories: [],
  interviewPrepQuestions: [],
  elevatorPitchVersions: [],
};

// Placeholder until real boot-time selection (below) resolves and swaps this out.
let dataSource: DataSource = new MemoryDataSource(emptySeed);

let state: TrackerState = emptyState;
let loadPromise: Promise<void> | null = null;
let nextTempId = -1;
const listeners = new Set<() => void>();

function notify() {
  listeners.forEach((listener) => listener());
}

function setState(next: TrackerState | ((prev: TrackerState) => TrackerState)) {
  state = typeof next === "function" ? (next as (prev: TrackerState) => TrackerState)(state) : next;
  notify();
}

function subscribe(onStoreChange: () => void) {
  listeners.add(onStoreChange);
  return () => listeners.delete(onStoreChange);
}

function getSnapshot() {
  return state;
}

/**
 * Deliberately NOT `getSnapshot` — must stay pinned to the frozen, never-mutated
 * `emptyState` reference. React calls this (not `getSnapshot`) for the first
 * client render during hydration, specifically so that render matches whatever
 * the server rendered. The server only ever renders `emptyState` (DataSource
 * loading is gated behind `typeof window !== "undefined"` below), but real data
 * can finish loading and mutate the live `state` variable before hydration
 * actually runs on the client — if this returned `state` too, that first client
 * render would pick up the real data while the server HTML still shows empty,
 * producing a hydration mismatch. Returning the frozen `emptyState` here keeps
 * that first render provably identical to the server's regardless of timing;
 * `subscribe` then drives the (allowed, post-hydration) re-render into real data.
 */
function getServerSnapshot() {
  return emptyState;
}

/** Negative ids never collide with real DataSource-assigned (positive) ids. */
function allocTempId(): number {
  return nextTempId--;
}

async function loadAll(): Promise<void> {
  const [
    apps,
    goals,
    userProfile,
    contacts,
    networkingEvents,
    companies,
    interviewCategories,
    interviewPrepQuestions,
    elevatorPitchVersions,
  ] = await Promise.all([
    dataSource.getApplications(),
    dataSource.getGoals(),
    dataSource.getUserProfile(),
    dataSource.getContacts(),
    dataSource.getNetworkingEvents(),
    dataSource.getCompanies(),
    dataSource.getInterviewCategories(),
    dataSource.getInterviewPrepQuestions(),
    dataSource.getElevatorPitchVersions(),
  ]);
  setState({
    apps,
    goals,
    userProfile,
    contacts,
    networkingEvents,
    companies,
    interviewCategories,
    interviewPrepQuestions,
    elevatorPitchVersions,
  });
}

function ensureLoaded(): Promise<void> {
  if (!loadPromise) loadPromise = loadAll();
  return loadPromise;
}

// Real boot-time selection (WasmDataSource in the browser today; ElectronDataSource once
// Phase 5 exists). Only runs in an actual browser: Next.js's server-side prerender pass
// evaluates this module in Node too (even though every consumer is "use client"), and
// under Vitest __resetTrackerDataForTests drives DataSource selection explicitly instead —
// both would otherwise hit WasmDataSource's browser-style wasm path, which fails under Node.
if (typeof window !== "undefined" && !(typeof process !== "undefined" && process.env.VITEST === "true")) {
  void selectDataSource()
    .then((ds) => {
      dataSource = ds;
      return ensureLoaded();
    })
    .catch((err) => {
      // Don't let this reject silently — a failure here (e.g. the sql.js WASM
      // module blocked by CSP) leaves every consumer stuck on emptyState with
      // no visible clue why.
      console.error("Tracker data source failed to initialize; the app will show no data.", err);
    });
}

/**
 * Test-only: swap in a fresh DataSource and wait for it to load, so each
 * test starts from a known, isolated state instead of sharing the module's
 * singleton across the whole file. Not used outside tests.
 */
export async function __resetTrackerDataForTests(ds: DataSource = new MemoryDataSource(emptySeed)): Promise<void> {
  dataSource = ds;
  loadPromise = null;
  state = emptyState;
  nextTempId = -1;
  await ensureLoaded();
}

/**
 * Applies `optimistic` immediately (so the UI feels instant, same as the old
 * localStorage-backed version), then runs the real DataSource call. On
 * failure, rolls the whole snapshot back to what it was right before this
 * mutation started. Concurrent in-flight mutations that both fail can, in
 * theory, roll back over each other — acceptable for a single-user local
 * tool, not worth an operational-transform-style merge here.
 */
async function withRollback<T>(run: () => Promise<T>): Promise<T> {
  const before = state;
  try {
    return await run();
  } catch (err) {
    setState(before);
    throw err;
  }
}

/**
 * The first time an application actually gets applied to (not just queued), advance its company
 * past researching/watching. Applies the optimistic change immediately and returns a thunk that
 * persists it, or null if there's nothing to advance.
 */
function maybeAdvanceCompany(companyId: number, status: ApplicationStatus): (() => Promise<void>) | null {
  if (status === "todo") return null;
  const company = state.companies.find((c) => c.id === companyId);
  if (!company || (company.status !== "researching" && company.status !== "watching")) return null;
  const updated: Company = { ...company, status: "applied" };
  setState((prev) => ({ ...prev, companies: prev.companies.map((c) => (c.id === companyId ? updated : c)) }));
  return () => dataSource.editCompany(updated);
}

/** Merges any not-yet-seen category tags into the persisted pool so they show up as options next time. */
function registerInterviewCategories(cats: string[] | undefined): void {
  if (!cats || cats.length === 0) return;
  const missing = cats.filter((c) => !state.interviewCategories.includes(c));
  if (missing.length === 0) return;
  setState((prev) => ({ ...prev, interviewCategories: [...prev.interviewCategories, ...missing] }));
  for (const category of missing) {
    dataSource.addInterviewCategory(category).catch((err) => console.error("Failed to persist interview category", err));
  }
}

const addInterviewCategory = (category: string): Promise<void> => {
  const missing = !state.interviewCategories.includes(category);
  if (missing) setState((prev) => ({ ...prev, interviewCategories: [...prev.interviewCategories, category] }));
  return withRollback(() => dataSource.addInterviewCategory(category));
};

const updateGoals = (goals: Goals): Promise<void> => {
  setState((prev) => ({ ...prev, goals }));
  return withRollback(() => dataSource.updateGoals(goals));
};

const updateUserProfile = (userProfile: UserProfile): Promise<void> => {
  setState((prev) => ({ ...prev, userProfile }));
  return withRollback(() => dataSource.updateUserProfile(userProfile));
};

const addApplication = (app: NewApplication): Promise<Application> => {
  const tempId = allocTempId();
  const optimisticApp: Application = { ...app, id: tempId, interviews: [], followUps: [] };
  setState((prev) => ({ ...prev, apps: [optimisticApp, ...prev.apps] }));
  const persistCompanyAdvance = maybeAdvanceCompany(app.companyId, app.status);
  return withRollback(async () => {
    const created = await dataSource.createApplication(app);
    setState((prev) => ({ ...prev, apps: prev.apps.map((a) => (a.id === tempId ? created : a)) }));
    if (persistCompanyAdvance) await persistCompanyAdvance();
    return created;
  });
};

const changeApplicationStatus = (appId: number, status: ApplicationStatus, at: string): Promise<void> => {
  setState((prev) => ({
    ...prev,
    apps: prev.apps.map((a) => (a.id === appId ? { ...a, status, statusHistory: [...a.statusHistory, { status, at }] } : a)),
  }));
  const app = state.apps.find((a) => a.id === appId);
  const persistCompanyAdvance = app ? maybeAdvanceCompany(app.companyId, status) : null;
  return withRollback(async () => {
    await dataSource.updateApplicationStatus(appId, status, at);
    if (persistCompanyAdvance) await persistCompanyAdvance();
  });
};

const logInterview = (appId: number, interview: NewInterview): Promise<Interview> => {
  registerInterviewCategories(interview.categories);
  const tempId = allocTempId();
  const optimisticInterview: Interview = { ...interview, id: tempId };
  const app = state.apps.find((a) => a.id === appId);
  const shouldTransition = app?.status === "applied";
  setState((prev) => ({
    ...prev,
    apps: prev.apps.map((a) => {
      if (a.id !== appId) return a;
      const interviews = [...a.interviews, optimisticInterview];
      if (shouldTransition) {
        return {
          ...a,
          interviews,
          status: "interviewing",
          statusHistory: [...a.statusHistory, { status: "interviewing" as const, at: interview.date }],
        };
      }
      return { ...a, interviews };
    }),
  }));
  return withRollback(async () => {
    const created = await dataSource.logInterview(appId, interview);
    setState((prev) => ({
      ...prev,
      apps: prev.apps.map((a) =>
        a.id === appId ? { ...a, interviews: a.interviews.map((iv) => (iv.id === tempId ? created : iv)) } : a
      ),
    }));
    if (shouldTransition) await dataSource.updateApplicationStatus(appId, "interviewing", interview.date);
    return created;
  });
};

const editInterview = (appId: number, interviewId: number, updates: NewInterview): Promise<void> => {
  registerInterviewCategories(updates.categories);
  setState((prev) => ({
    ...prev,
    apps: prev.apps.map((a) =>
      a.id === appId
        ? { ...a, interviews: a.interviews.map((iv) => (iv.id === interviewId ? { id: iv.id, ...updates } : iv)) }
        : a
    ),
  }));
  return withRollback(() => dataSource.editInterview(appId, interviewId, updates));
};

const logFollowUp = (appId: number, followUp: NewFollowUp): Promise<FollowUp> => {
  const tempId = allocTempId();
  const optimisticFollowUp: FollowUp = { ...followUp, id: tempId };
  setState((prev) => ({
    ...prev,
    apps: prev.apps.map((a) => (a.id === appId ? { ...a, followUps: [...a.followUps, optimisticFollowUp] } : a)),
  }));
  return withRollback(async () => {
    const created = await dataSource.logFollowUp(appId, followUp);
    setState((prev) => ({
      ...prev,
      apps: prev.apps.map((a) =>
        a.id === appId ? { ...a, followUps: a.followUps.map((f) => (f.id === tempId ? created : f)) } : a
      ),
    }));
    return created;
  });
};

const editApplication = (updated: Application): Promise<void> => {
  setState((prev) => ({ ...prev, apps: prev.apps.map((a) => (a.id === updated.id ? updated : a)) }));
  const persistCompanyAdvance = maybeAdvanceCompany(updated.companyId, updated.status);
  return withRollback(async () => {
    await dataSource.editApplication(updated);
    if (persistCompanyAdvance) await persistCompanyAdvance();
  });
};

const saveFeedback = (appId: number, feedback: Feedback): Promise<void> => {
  setState((prev) => ({ ...prev, apps: prev.apps.map((a) => (a.id === appId ? { ...a, feedback } : a)) }));
  return withRollback(() => dataSource.saveFeedback(appId, feedback));
};

const deleteInterview = (appId: number, interviewId: number): Promise<void> => {
  setState((prev) => ({
    ...prev,
    apps: prev.apps.map((a) => (a.id === appId ? { ...a, interviews: a.interviews.filter((iv) => iv.id !== interviewId) } : a)),
  }));
  return withRollback(() => dataSource.deleteInterview(appId, interviewId));
};

const deleteFollowUp = (appId: number, followUpId: number): Promise<void> => {
  setState((prev) => ({
    ...prev,
    apps: prev.apps.map((a) => (a.id === appId ? { ...a, followUps: a.followUps.filter((f) => f.id !== followUpId) } : a)),
  }));
  return withRollback(() => dataSource.deleteFollowUp(appId, followUpId));
};

const deleteApplication = (appId: number): Promise<void> => {
  setState((prev) => ({
    ...prev,
    apps: prev.apps.filter((a) => a.id !== appId),
    networkingEvents: prev.networkingEvents.map((e) => (e.applicationId === appId ? { ...e, applicationId: undefined } : e)),
  }));
  return withRollback(() => dataSource.deleteApplication(appId));
};

const createContact = (contact: NewContact): Promise<Contact> => {
  const tempId = allocTempId();
  const optimisticContact: Contact = { ...contact, id: tempId };
  setState((prev) => ({ ...prev, contacts: [...prev.contacts, optimisticContact] }));
  return withRollback(async () => {
    const created = await dataSource.createContact(contact);
    setState((prev) => ({ ...prev, contacts: prev.contacts.map((c) => (c.id === tempId ? created : c)) }));
    return created;
  });
};

const editContact = (updated: Contact): Promise<void> => {
  setState((prev) => ({ ...prev, contacts: prev.contacts.map((c) => (c.id === updated.id ? updated : c)) }));
  return withRollback(() => dataSource.editContact(updated));
};

const deleteContact = (contactId: number): Promise<void> => {
  setState((prev) => ({ ...prev, contacts: prev.contacts.filter((c) => c.id !== contactId) }));
  return withRollback(() => dataSource.deleteContact(contactId));
};

const addNetworkingEvent = (event: NewNetworkingEvent): Promise<NetworkingEvent> => {
  const tempId = allocTempId();
  const optimisticEvent: NetworkingEvent = { ...event, id: tempId };
  setState((prev) => ({ ...prev, networkingEvents: [optimisticEvent, ...prev.networkingEvents] }));
  return withRollback(async () => {
    const created = await dataSource.addNetworkingEvent(event);
    setState((prev) => ({
      ...prev,
      networkingEvents: prev.networkingEvents.map((e) => (e.id === tempId ? created : e)),
    }));
    return created;
  });
};

const deleteNetworkingEvent = (id: number): Promise<void> => {
  setState((prev) => ({ ...prev, networkingEvents: prev.networkingEvents.filter((e) => e.id !== id) }));
  return withRollback(() => dataSource.deleteNetworkingEvent(id));
};

const createCompany = (company: NewCompany): Promise<Company> => {
  const tempId = allocTempId();
  const optimisticCompany: Company = { ...company, id: tempId, locations: company.locations ?? [] };
  setState((prev) => ({ ...prev, companies: [...prev.companies, optimisticCompany] }));
  return withRollback(async () => {
    const created = await dataSource.createCompany(company);
    setState((prev) => ({ ...prev, companies: prev.companies.map((c) => (c.id === tempId ? created : c)) }));
    return created;
  });
};

const editCompany = (updated: Company): Promise<void> => {
  setState((prev) => ({ ...prev, companies: prev.companies.map((c) => (c.id === updated.id ? updated : c)) }));
  return withRollback(() => dataSource.editCompany(updated));
};

const deleteCompany = (companyId: number): Promise<void> => {
  setState((prev) => ({ ...prev, companies: prev.companies.filter((c) => c.id !== companyId) }));
  return withRollback(() => dataSource.deleteCompany(companyId));
};

const toggleTarget = (companyId: number): Promise<void> => {
  const company = state.companies.find((c) => c.id === companyId);
  if (!company) return Promise.resolve();
  setState((prev) => ({
    ...prev,
    companies: prev.companies.map((c) => (c.id === companyId ? { ...c, isTarget: !c.isTarget } : c)),
  }));
  return withRollback(() => dataSource.toggleTarget(companyId));
};

const addInterviewPrepQuestion = (question: NewInterviewPrepQuestion): Promise<InterviewPrepQuestion> => {
  const tempId = allocTempId();
  const optimistic: InterviewPrepQuestion = { ...question, id: tempId };
  setState((prev) => ({ ...prev, interviewPrepQuestions: [...prev.interviewPrepQuestions, optimistic] }));
  return withRollback(async () => {
    const created = await dataSource.addInterviewPrepQuestion(question);
    setState((prev) => ({
      ...prev,
      interviewPrepQuestions: prev.interviewPrepQuestions.map((q) => (q.id === tempId ? created : q)),
    }));
    return created;
  });
};

const editInterviewPrepQuestion = (updated: InterviewPrepQuestion): Promise<void> => {
  setState((prev) => ({
    ...prev,
    interviewPrepQuestions: prev.interviewPrepQuestions.map((q) => (q.id === updated.id ? updated : q)),
  }));
  return withRollback(() => dataSource.editInterviewPrepQuestion(updated));
};

const deleteInterviewPrepQuestion = (id: number): Promise<void> => {
  setState((prev) => ({
    ...prev,
    interviewPrepQuestions: prev.interviewPrepQuestions.filter((q) => q.id !== id),
    // Mirrors the DataSource's ON DELETE SET NULL: a pitch version referencing this
    // question survives, it just loses the link.
    elevatorPitchVersions: prev.elevatorPitchVersions.map((v) =>
      v.sourceQuestionId === id ? { ...v, sourceQuestionId: undefined } : v
    ),
  }));
  return withRollback(() => dataSource.deleteInterviewPrepQuestion(id));
};

const addElevatorPitchVersion = (version: NewElevatorPitchVersion): Promise<ElevatorPitchVersion> => {
  const tempId = allocTempId();
  const optimistic: ElevatorPitchVersion = { ...version, id: tempId };
  setState((prev) => ({ ...prev, elevatorPitchVersions: [...prev.elevatorPitchVersions, optimistic] }));
  return withRollback(async () => {
    const created = await dataSource.addElevatorPitchVersion(version);
    setState((prev) => ({
      ...prev,
      elevatorPitchVersions: prev.elevatorPitchVersions.map((v) => (v.id === tempId ? created : v)),
    }));
    return created;
  });
};

const editElevatorPitchVersion = (updated: ElevatorPitchVersion): Promise<void> => {
  setState((prev) => ({
    ...prev,
    elevatorPitchVersions: prev.elevatorPitchVersions.map((v) => (v.id === updated.id ? updated : v)),
  }));
  return withRollback(() => dataSource.editElevatorPitchVersion(updated));
};

const deleteElevatorPitchVersion = (id: number): Promise<void> => {
  setState((prev) => ({
    ...prev,
    elevatorPitchVersions: prev.elevatorPitchVersions.filter((v) => v.id !== id),
  }));
  return withRollback(() => dataSource.deleteElevatorPitchVersion(id));
};

const actions = {
  addInterviewCategory,
  addInterviewPrepQuestion,
  editInterviewPrepQuestion,
  deleteInterviewPrepQuestion,
  addElevatorPitchVersion,
  editElevatorPitchVersion,
  deleteElevatorPitchVersion,
  updateGoals,
  updateUserProfile,
  addApplication,
  changeApplicationStatus,
  logInterview,
  editInterview,
  logFollowUp,
  editApplication,
  saveFeedback,
  deleteInterview,
  deleteFollowUp,
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
};

/**
 * Bundles every piece of tracker data plus the pure data-mutation handlers.
 * Backed by a module-level external store (mirrors the old usePersistedState
 * design) so every call site sharing this hook stays in sync with no Context
 * required. Mutations apply optimistically and reconcile with the DataSource
 * in the background; see withRollback above.
 */
export function useTrackerData() {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  return { ...snapshot, ...actions };
}
