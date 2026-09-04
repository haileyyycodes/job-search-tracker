import type { ApplicationStatus, Feedback } from "@/lib/types";
import {
  RestrictedDeleteError,
  type DataSource,
  type DsApplication,
  type DsCompany,
  type DsContact,
  type DsElevatorPitchVersion,
  type DsFollowUp,
  type DsGoals,
  type DsInterview,
  type DsInterviewPrepQuestion,
  type DsNetworkingEvent,
  type DsUserProfile,
  type NewApplication,
  type NewCompany,
  type NewContact,
  type NewElevatorPitchVersion,
  type NewFollowUp,
  type NewInterview,
  type NewInterviewPrepQuestion,
  type NewNetworkingEvent,
} from "./types";

/** Must match Object.keys(CHANNELS) in apps/web/src/app/api/db/route.ts exactly
 * (enforced by route.test.ts) — the two are independently maintained string
 * lists on either side of an HTTP boundary TypeScript can't check across. */
export const HTTP_DB_CHANNELS = new Set([
  "applications:list",
  "applications:create",
  "applications:edit",
  "applications:updateStatus",
  "applications:delete",
  "applications:saveFeedback",
  "interviews:log",
  "interviews:edit",
  "interviews:delete",
  "followUps:log",
  "followUps:delete",
  "companies:list",
  "companies:create",
  "companies:edit",
  "companies:delete",
  "companies:toggleTarget",
  "contacts:list",
  "contacts:create",
  "contacts:edit",
  "contacts:delete",
  "networkingEvents:list",
  "networkingEvents:add",
  "networkingEvents:edit",
  "networkingEvents:delete",
  "goals:get",
  "goals:update",
  "userProfile:get",
  "userProfile:update",
  "interviewCategories:list",
  "interviewCategories:add",
  "interviewPrep:list",
  "interviewPrep:add",
  "interviewPrep:edit",
  "interviewPrep:delete",
  "elevatorPitch:list",
  "elevatorPitch:add",
  "elevatorPitch:edit",
  "elevatorPitch:delete",
]);

/** Marker prefix the API route uses so RestrictedDeleteError survives the HTTP
 * boundary (a fetch Response only carries a message string, losing the type). */
const RESTRICTED_DELETE_PREFIX = "RESTRICTED_DELETE:";

/**
 * Talks to the local Next.js server's /api/db route, which runs the real
 * SQLite-backed DataSource (apps/web/src/server/sqlite) via better-sqlite3.
 * Used for local, persistent runs — the Vercel-deployed portfolio demo uses
 * WasmDataSource instead (see select.ts).
 */
export class HttpDataSource implements DataSource {
  private async invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
    const response = await fetch("/api/db", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel, args }),
    });
    const body = (await response.json()) as { result?: T; error?: string };
    if (!response.ok) {
      const error = body.error ?? response.statusText;
      if (error.startsWith(RESTRICTED_DELETE_PREFIX)) {
        throw new RestrictedDeleteError(error.slice(RESTRICTED_DELETE_PREFIX.length));
      }
      throw new Error(error);
    }
    return body.result as T;
  }

  getApplications() {
    return this.invoke<DsApplication[]>("applications:list");
  }
  createApplication(app: NewApplication) {
    return this.invoke<DsApplication>("applications:create", app);
  }
  editApplication(app: DsApplication) {
    return this.invoke<void>("applications:edit", app);
  }
  updateApplicationStatus(id: number, status: ApplicationStatus, at: string) {
    return this.invoke<void>("applications:updateStatus", id, status, at);
  }
  deleteApplication(id: number) {
    return this.invoke<void>("applications:delete", id);
  }
  saveFeedback(appId: number, feedback: Feedback) {
    return this.invoke<void>("applications:saveFeedback", appId, feedback);
  }

  logInterview(appId: number, interview: NewInterview) {
    return this.invoke<DsInterview>("interviews:log", appId, interview);
  }
  editInterview(appId: number, interviewId: number, updates: NewInterview) {
    return this.invoke<void>("interviews:edit", appId, interviewId, updates);
  }
  deleteInterview(appId: number, interviewId: number) {
    return this.invoke<void>("interviews:delete", appId, interviewId);
  }

  logFollowUp(appId: number, followUp: NewFollowUp) {
    return this.invoke<DsFollowUp>("followUps:log", appId, followUp);
  }
  deleteFollowUp(appId: number, followUpId: number) {
    return this.invoke<void>("followUps:delete", appId, followUpId);
  }

  getCompanies() {
    return this.invoke<DsCompany[]>("companies:list");
  }
  createCompany(company: NewCompany) {
    return this.invoke<DsCompany>("companies:create", company);
  }
  editCompany(company: DsCompany) {
    return this.invoke<void>("companies:edit", company);
  }
  deleteCompany(id: number) {
    return this.invoke<void>("companies:delete", id);
  }
  toggleTarget(id: number) {
    return this.invoke<void>("companies:toggleTarget", id);
  }

  getContacts() {
    return this.invoke<DsContact[]>("contacts:list");
  }
  createContact(contact: NewContact) {
    return this.invoke<DsContact>("contacts:create", contact);
  }
  editContact(contact: DsContact) {
    return this.invoke<void>("contacts:edit", contact);
  }
  deleteContact(id: number) {
    return this.invoke<void>("contacts:delete", id);
  }

  getNetworkingEvents() {
    return this.invoke<DsNetworkingEvent[]>("networkingEvents:list");
  }
  addNetworkingEvent(event: NewNetworkingEvent) {
    return this.invoke<DsNetworkingEvent>("networkingEvents:add", event);
  }
  editNetworkingEvent(event: DsNetworkingEvent) {
    return this.invoke<void>("networkingEvents:edit", event);
  }
  deleteNetworkingEvent(id: number) {
    return this.invoke<void>("networkingEvents:delete", id);
  }

  getGoals() {
    return this.invoke<DsGoals>("goals:get");
  }
  updateGoals(goals: DsGoals) {
    return this.invoke<void>("goals:update", goals);
  }

  getUserProfile() {
    return this.invoke<DsUserProfile>("userProfile:get");
  }
  updateUserProfile(profile: DsUserProfile) {
    return this.invoke<void>("userProfile:update", profile);
  }

  getInterviewCategories() {
    return this.invoke<string[]>("interviewCategories:list");
  }
  addInterviewCategory(category: string) {
    return this.invoke<void>("interviewCategories:add", category);
  }

  getInterviewPrepQuestions() {
    return this.invoke<DsInterviewPrepQuestion[]>("interviewPrep:list");
  }
  addInterviewPrepQuestion(question: NewInterviewPrepQuestion) {
    return this.invoke<DsInterviewPrepQuestion>("interviewPrep:add", question);
  }
  editInterviewPrepQuestion(question: DsInterviewPrepQuestion) {
    return this.invoke<void>("interviewPrep:edit", question);
  }
  deleteInterviewPrepQuestion(id: number) {
    return this.invoke<void>("interviewPrep:delete", id);
  }

  getElevatorPitchVersions() {
    return this.invoke<DsElevatorPitchVersion[]>("elevatorPitch:list");
  }
  addElevatorPitchVersion(version: NewElevatorPitchVersion) {
    return this.invoke<DsElevatorPitchVersion>("elevatorPitch:add", version);
  }
  editElevatorPitchVersion(version: DsElevatorPitchVersion) {
    return this.invoke<void>("elevatorPitch:edit", version);
  }
  deleteElevatorPitchVersion(id: number) {
    return this.invoke<void>("elevatorPitch:delete", id);
  }
}
