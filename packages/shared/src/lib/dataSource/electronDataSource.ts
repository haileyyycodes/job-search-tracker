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
  type ResumeFile,
} from "./types";

/** The typed surface preload.ts exposes via contextBridge — one method per IPC channel. */
export interface ElectronApi {
  invoke(channel: string, ...args: unknown[]): Promise<unknown>;
}

declare global {
  interface Window {
    electronAPI?: ElectronApi;
  }
}

/** Marker prefix ipcHandlers.ts uses so RestrictedDeleteError survives the IPC boundary
 * (Electron serializes thrown errors down to message + generic Error, losing the type). */
const RESTRICTED_DELETE_PREFIX = "RESTRICTED_DELETE:";

/**
 * Thin ipcRenderer.invoke wrapper (via the preload-exposed window.electronAPI) implementing
 * DataSource — never imports better-sqlite3 directly, so the native module never leaks into
 * the renderer bundle. All the real logic lives in apps/desktop's main-process ipcHandlers.ts.
 */
export class ElectronDataSource implements DataSource {
  private api(): ElectronApi {
    if (!window.electronAPI) throw new Error("window.electronAPI is not available (not running inside Electron)");
    return window.electronAPI;
  }

  private async invoke<T>(channel: string, ...args: unknown[]): Promise<T> {
    try {
      return (await this.api().invoke(channel, ...args)) as T;
    } catch (err) {
      if (err instanceof Error && err.message.includes(RESTRICTED_DELETE_PREFIX)) {
        const message = err.message.slice(err.message.indexOf(RESTRICTED_DELETE_PREFIX) + RESTRICTED_DELETE_PREFIX.length);
        throw new RestrictedDeleteError(message);
      }
      throw err;
    }
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
  getResumeFile(applicationId: number) {
    return this.invoke<ResumeFile | null>("resumeFiles:get", applicationId);
  }
  setResumeFile(applicationId: number, file: ResumeFile | null) {
    return this.invoke<void>("resumeFiles:set", applicationId, file);
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
