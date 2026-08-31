import type { ApplicationStatus, Feedback } from "@/lib/types";
import { assertValidResumeBytes, base64ToBytes } from "@/lib/resumeFile";
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
import { defaultSeed, type Seed } from "./seed";

type StoredApplication = Omit<DsApplication, "interviews" | "followUps" | "statusHistory" | "resumeFile">;
type StoredStatusHistoryEntry = { id: number; applicationId: number; status: ApplicationStatus; at: string };
type StoredInterview = DsInterview & { applicationId: number };
type StoredFollowUp = DsFollowUp & { applicationId: number };
type StoredCompany = Omit<DsCompany, "locations">;
type StoredCompanyLocation = { id: number; companyId: number; city: string; state: string };
type StoredContact = DsContact;
type StoredNetworkingEvent = Omit<DsNetworkingEvent, "contactIds">;
type StoredNetworkingEventContact = { id: number; eventId: number; contactId: number };
type StoredInterviewPrepQuestion = DsInterviewPrepQuestion;
type StoredElevatorPitchVersion = DsElevatorPitchVersion;

/** Simple in-memory table: autoincrement id, Map preserves insertion order (mirrors SQLite rowid order). */
class Table<T extends { id: number }> {
  private rows = new Map<number, T>();
  private nextId = 1;

  insert(row: Omit<T, "id">): T {
    const id = this.nextId++;
    const full = { ...row, id } as T;
    this.rows.set(id, full);
    return full;
  }

  get(id: number): T | undefined {
    return this.rows.get(id);
  }

  getOrThrow(id: number, label: string): T {
    const row = this.rows.get(id);
    if (!row) throw new Error(`${label} ${id} not found`);
    return row;
  }

  put(row: T): void {
    this.rows.set(row.id, row);
  }

  update(id: number, updates: Partial<Omit<T, "id">>, label: string): T {
    const row = this.getOrThrow(id, label);
    const next = { ...row, ...updates } as T;
    this.rows.set(id, next);
    return next;
  }

  delete(id: number): void {
    this.rows.delete(id);
  }

  list(): T[] {
    return [...this.rows.values()];
  }

  listWhere(pred: (row: T) => boolean): T[] {
    return this.list().filter(pred);
  }

  clear(): void {
    this.rows.clear();
    this.nextId = 1;
  }
}

function clone<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

function omit<T extends object, K extends keyof T>(obj: T, key: K): Omit<T, K> {
  const copy = { ...obj };
  delete copy[key];
  return copy;
}

/**
 * In-memory DataSource: no persistence, real autoincrement ids, real
 * cascade/restrict delete behavior. Used for tests, and as the temporary
 * boot-time implementation until WasmDataSource/ElectronDataSource exist.
 */
export class MemoryDataSource implements DataSource {
  private applications = new Table<StoredApplication>();
  private statusHistory = new Table<StoredStatusHistoryEntry>();
  private interviews = new Table<StoredInterview>();
  private followUps = new Table<StoredFollowUp>();
  private companies = new Table<StoredCompany>();
  private companyLocations = new Table<StoredCompanyLocation>();
  private contacts = new Table<StoredContact>();
  private networkingEvents = new Table<StoredNetworkingEvent>();
  private networkingEventContacts = new Table<StoredNetworkingEventContact>();
  private goals: DsGoals = {};
  private userProfile: DsUserProfile = { name: "" };
  private interviewCategories: string[] = [];
  private interviewPrepQuestions = new Table<StoredInterviewPrepQuestion>();
  private elevatorPitchVersions = new Table<StoredElevatorPitchVersion>();
  /** application id -> attached resume file (bytes included). */
  private resumeFiles = new Map<number, ResumeFile>();

  constructor(seed: Seed = defaultSeed) {
    this.loadSeed(seed);
  }

  // ---- composition helpers ----

  private composeApplication(row: StoredApplication): DsApplication {
    const resume = this.resumeFiles.get(row.id);
    return {
      ...row,
      resumeFile: resume ? { name: resume.name, mimeType: resume.mimeType, size: resume.size } : undefined,
      statusHistory: this.statusHistory
        .listWhere((s) => s.applicationId === row.id)
        .map((s) => ({ status: s.status, at: s.at })),
      interviews: this.interviews.listWhere((i) => i.applicationId === row.id).map((i) => omit(i, "applicationId")),
      followUps: this.followUps.listWhere((f) => f.applicationId === row.id).map((f) => omit(f, "applicationId")),
    };
  }

  private composeCompany(row: StoredCompany): DsCompany {
    return {
      ...row,
      locations: this.companyLocations
        .listWhere((l) => l.companyId === row.id)
        .map(({ city, state }) => ({ city, state })),
    };
  }

  private composeNetworkingEvent(row: StoredNetworkingEvent): DsNetworkingEvent {
    return {
      ...row,
      contactIds: this.networkingEventContacts.listWhere((c) => c.eventId === row.id).map((c) => c.contactId),
    };
  }

  private requireApplication(id: number): StoredApplication {
    return this.applications.getOrThrow(id, "Application");
  }

  private requireCompany(id: number): StoredCompany {
    return this.companies.getOrThrow(id, "Company");
  }

  private requireContact(id: number): StoredContact {
    return this.contacts.getOrThrow(id, "Contact");
  }

  // ---- applications ----

  async getApplications(): Promise<DsApplication[]> {
    return this.applications.list().map((row) => this.composeApplication(row));
  }

  async createApplication(app: NewApplication): Promise<DsApplication> {
    this.requireCompany(app.companyId);
    if (app.referredByContactId !== undefined) this.requireContact(app.referredByContactId);
    const { statusHistory, ...scalars } = app;
    const row = this.applications.insert(scalars as Omit<StoredApplication, "id">);
    for (const entry of statusHistory) {
      this.statusHistory.insert({ applicationId: row.id, status: entry.status, at: entry.at });
    }
    return this.composeApplication(row);
  }

  async editApplication(app: DsApplication): Promise<void> {
    this.requireApplication(app.id);
    this.requireCompany(app.companyId);
    if (app.referredByContactId !== undefined) this.requireContact(app.referredByContactId);
    const scalars = omit(omit(omit(omit(app, "statusHistory"), "interviews"), "followUps"), "resumeFile");
    this.applications.put(scalars as StoredApplication);
  }

  async updateApplicationStatus(id: number, status: ApplicationStatus, at: string): Promise<void> {
    const row = this.requireApplication(id);
    this.applications.update(id, { status }, "Application");
    this.statusHistory.insert({ applicationId: row.id, status, at });
  }

  async deleteApplication(id: number): Promise<void> {
    this.requireApplication(id);
    for (const iv of this.interviews.listWhere((i) => i.applicationId === id)) this.interviews.delete(iv.id);
    for (const fu of this.followUps.listWhere((f) => f.applicationId === id)) this.followUps.delete(fu.id);
    for (const sh of this.statusHistory.listWhere((s) => s.applicationId === id)) this.statusHistory.delete(sh.id);
    for (const ev of this.networkingEvents.listWhere((e) => e.applicationId === id)) {
      this.networkingEvents.update(ev.id, { applicationId: undefined }, "NetworkingEvent");
    }
    this.resumeFiles.delete(id);
    this.applications.delete(id);
  }

  async saveFeedback(appId: number, feedback: Feedback): Promise<void> {
    this.requireApplication(appId);
    this.applications.update(appId, { feedback }, "Application");
  }

  async getResumeFile(applicationId: number): Promise<ResumeFile | null> {
    this.requireApplication(applicationId);
    const file = this.resumeFiles.get(applicationId);
    return file ? { ...file } : null;
  }

  async setResumeFile(applicationId: number, file: ResumeFile | null): Promise<void> {
    this.requireApplication(applicationId);
    if (file === null) {
      this.resumeFiles.delete(applicationId);
      return;
    }
    // Revalidate the bytes rather than trusting the caller's metadata.
    const bytes = base64ToBytes(file.data);
    assertValidResumeBytes(bytes);
    this.resumeFiles.set(applicationId, { ...file, size: bytes.length });
  }

  // ---- interviews ----

  async logInterview(appId: number, interview: NewInterview): Promise<DsInterview> {
    this.requireApplication(appId);
    const row = this.interviews.insert({ ...interview, applicationId: appId });
    return omit(row, "applicationId");
  }

  async editInterview(appId: number, interviewId: number, updates: NewInterview): Promise<void> {
    const row = this.interviews.getOrThrow(interviewId, "Interview");
    if (row.applicationId !== appId) throw new Error(`Interview ${interviewId} does not belong to application ${appId}`);
    this.interviews.update(interviewId, { ...updates, applicationId: appId }, "Interview");
  }

  async deleteInterview(appId: number, interviewId: number): Promise<void> {
    const row = this.interviews.getOrThrow(interviewId, "Interview");
    if (row.applicationId !== appId) throw new Error(`Interview ${interviewId} does not belong to application ${appId}`);
    this.interviews.delete(interviewId);
  }

  // ---- follow-ups ----

  async logFollowUp(appId: number, followUp: NewFollowUp): Promise<DsFollowUp> {
    this.requireApplication(appId);
    this.requireContact(followUp.contactId);
    const row = this.followUps.insert({ ...followUp, applicationId: appId });
    return omit(row, "applicationId");
  }

  async deleteFollowUp(appId: number, followUpId: number): Promise<void> {
    const row = this.followUps.getOrThrow(followUpId, "FollowUp");
    if (row.applicationId !== appId) throw new Error(`FollowUp ${followUpId} does not belong to application ${appId}`);
    this.followUps.delete(followUpId);
  }

  // ---- companies ----

  async getCompanies(): Promise<DsCompany[]> {
    return this.companies.list().map((row) => this.composeCompany(row));
  }

  async createCompany(company: NewCompany): Promise<DsCompany> {
    const { locations, ...scalars } = company;
    const row = this.companies.insert(scalars as Omit<StoredCompany, "id">);
    for (const loc of locations ?? []) {
      this.companyLocations.insert({ companyId: row.id, city: loc.city, state: loc.state });
    }
    return this.composeCompany(row);
  }

  async editCompany(company: DsCompany): Promise<void> {
    this.requireCompany(company.id);
    const { locations, ...scalars } = company;
    this.companies.put(scalars as StoredCompany);
    for (const existing of this.companyLocations.listWhere((l) => l.companyId === company.id)) {
      this.companyLocations.delete(existing.id);
    }
    for (const loc of locations) {
      this.companyLocations.insert({ companyId: company.id, city: loc.city, state: loc.state });
    }
  }

  async deleteCompany(id: number): Promise<void> {
    this.requireCompany(id);
    const referencing = this.applications.listWhere((a) => a.companyId === id);
    if (referencing.length > 0) {
      throw new RestrictedDeleteError(
        `Cannot delete company ${id}: ${referencing.length} application(s) still reference it.`
      );
    }
    for (const contact of this.contacts.listWhere((c) => c.companyId === id)) {
      this.contacts.update(contact.id, { companyId: undefined }, "Contact");
    }
    for (const loc of this.companyLocations.listWhere((l) => l.companyId === id)) this.companyLocations.delete(loc.id);
    this.companies.delete(id);
  }

  async toggleTarget(id: number): Promise<void> {
    const row = this.requireCompany(id);
    this.companies.update(id, { isTarget: !row.isTarget }, "Company");
  }

  // ---- contacts ----

  async getContacts(): Promise<DsContact[]> {
    return this.contacts.list();
  }

  async createContact(contact: NewContact): Promise<DsContact> {
    if (contact.companyId !== undefined) this.requireCompany(contact.companyId);
    return this.contacts.insert(contact);
  }

  async editContact(contact: DsContact): Promise<void> {
    this.requireContact(contact.id);
    if (contact.companyId !== undefined) this.requireCompany(contact.companyId);
    this.contacts.put(contact);
  }

  async deleteContact(id: number): Promise<void> {
    this.requireContact(id);
    const referencing = this.followUps.listWhere((f) => f.contactId === id);
    if (referencing.length > 0) {
      throw new RestrictedDeleteError(`Cannot delete contact ${id}: ${referencing.length} follow-up(s) still reference it.`);
    }
    for (const app of this.applications.listWhere((a) => a.referredByContactId === id)) {
      this.applications.update(app.id, { referredByContactId: undefined }, "Application");
    }
    for (const link of this.networkingEventContacts.listWhere((c) => c.contactId === id)) {
      this.networkingEventContacts.delete(link.id);
    }
    this.contacts.delete(id);
  }

  // ---- networking events ----

  async getNetworkingEvents(): Promise<DsNetworkingEvent[]> {
    return this.networkingEvents.list().map((row) => this.composeNetworkingEvent(row));
  }

  async addNetworkingEvent(event: NewNetworkingEvent): Promise<DsNetworkingEvent> {
    for (const contactId of event.contactIds) this.requireContact(contactId);
    if (event.applicationId !== undefined) this.requireApplication(event.applicationId);
    const { contactIds, ...scalars } = event;
    const row = this.networkingEvents.insert(scalars as Omit<StoredNetworkingEvent, "id">);
    for (const contactId of contactIds) this.networkingEventContacts.insert({ eventId: row.id, contactId });
    return this.composeNetworkingEvent(row);
  }

  async editNetworkingEvent(event: DsNetworkingEvent): Promise<void> {
    this.networkingEvents.getOrThrow(event.id, "NetworkingEvent");
    for (const contactId of event.contactIds) this.requireContact(contactId);
    if (event.applicationId !== undefined) this.requireApplication(event.applicationId);
    const { contactIds, ...scalars } = event;
    this.networkingEvents.put(scalars as StoredNetworkingEvent);
    for (const link of this.networkingEventContacts.listWhere((c) => c.eventId === event.id)) {
      this.networkingEventContacts.delete(link.id);
    }
    for (const contactId of contactIds) this.networkingEventContacts.insert({ eventId: event.id, contactId });
  }

  async deleteNetworkingEvent(id: number): Promise<void> {
    for (const link of this.networkingEventContacts.listWhere((c) => c.eventId === id)) {
      this.networkingEventContacts.delete(link.id);
    }
    this.networkingEvents.delete(id);
  }

  // ---- goals ----

  async getGoals(): Promise<DsGoals> {
    return { ...this.goals };
  }

  async updateGoals(goals: DsGoals): Promise<void> {
    this.goals = { ...goals };
  }

  // ---- user profile ----

  async getUserProfile(): Promise<DsUserProfile> {
    return { ...this.userProfile };
  }

  async updateUserProfile(profile: DsUserProfile): Promise<void> {
    this.userProfile = { ...profile };
  }

  // ---- interview categories ----

  async getInterviewCategories(): Promise<string[]> {
    return [...this.interviewCategories];
  }

  async addInterviewCategory(category: string): Promise<void> {
    if (!this.interviewCategories.includes(category)) this.interviewCategories.push(category);
  }

  // ---- interview prep questions ----

  async getInterviewPrepQuestions(): Promise<DsInterviewPrepQuestion[]> {
    return this.interviewPrepQuestions.list();
  }

  async addInterviewPrepQuestion(question: NewInterviewPrepQuestion): Promise<DsInterviewPrepQuestion> {
    return this.interviewPrepQuestions.insert(question);
  }

  async editInterviewPrepQuestion(question: DsInterviewPrepQuestion): Promise<void> {
    this.interviewPrepQuestions.getOrThrow(question.id, "InterviewPrepQuestion");
    this.interviewPrepQuestions.put(question);
  }

  async deleteInterviewPrepQuestion(id: number): Promise<void> {
    for (const v of this.elevatorPitchVersions.listWhere((v) => v.sourceQuestionId === id)) {
      this.elevatorPitchVersions.update(v.id, { sourceQuestionId: undefined }, "ElevatorPitchVersion");
    }
    this.interviewPrepQuestions.delete(id);
  }

  // ---- elevator pitch versions ----

  async getElevatorPitchVersions(): Promise<DsElevatorPitchVersion[]> {
    return this.elevatorPitchVersions.list();
  }

  async addElevatorPitchVersion(version: NewElevatorPitchVersion): Promise<DsElevatorPitchVersion> {
    if (version.sourceQuestionId !== undefined) {
      this.interviewPrepQuestions.getOrThrow(version.sourceQuestionId, "InterviewPrepQuestion");
    }
    return this.elevatorPitchVersions.insert(version);
  }

  async editElevatorPitchVersion(version: DsElevatorPitchVersion): Promise<void> {
    this.elevatorPitchVersions.getOrThrow(version.id, "ElevatorPitchVersion");
    if (version.sourceQuestionId !== undefined) {
      this.interviewPrepQuestions.getOrThrow(version.sourceQuestionId, "InterviewPrepQuestion");
    }
    this.elevatorPitchVersions.put(version);
  }

  async deleteElevatorPitchVersion(id: number): Promise<void> {
    this.elevatorPitchVersions.delete(id);
  }

  private loadSeed(seed: Seed): void {
    const companyIdMap = new Map<string, number>();
    for (const company of seed.companies) {
      const { id: seedId, locations, ...scalars } = clone(company);
      const row = this.companies.insert(scalars as Omit<StoredCompany, "id">);
      companyIdMap.set(seedId, row.id);
      for (const loc of locations) this.companyLocations.insert({ companyId: row.id, city: loc.city, state: loc.state });
    }

    const contactIdMap = new Map<string, number>();
    for (const contact of seed.contacts) {
      const { id: seedId, companyId, ...scalars } = clone(contact);
      const row = this.contacts.insert({
        ...scalars,
        companyId: companyId !== undefined ? companyIdMap.get(companyId) : undefined,
      } as Omit<StoredContact, "id">);
      contactIdMap.set(seedId, row.id);
    }

    const applicationIdMap = new Map<string, number>();
    for (const app of seed.applications) {
      const { id: seedId, companyId, referredByContactId, statusHistory, interviews, followUps, ...scalars } = clone(app);
      const row = this.applications.insert({
        ...scalars,
        companyId: companyIdMap.get(companyId)!,
        referredByContactId: referredByContactId !== undefined ? contactIdMap.get(referredByContactId) : undefined,
      } as Omit<StoredApplication, "id">);
      applicationIdMap.set(seedId, row.id);
      for (const entry of statusHistory) this.statusHistory.insert({ applicationId: row.id, ...entry });
      for (const iv of interviews) {
        this.interviews.insert({ ...omit(iv, "id"), applicationId: row.id });
      }
      for (const fu of followUps) {
        const fuRest = omit(fu, "id");
        this.followUps.insert({ ...fuRest, contactId: contactIdMap.get(fuRest.contactId)!, applicationId: row.id });
      }
    }

    for (const event of seed.networkingEvents) {
      const { contactIds, applicationId, ...rest } = omit(clone(event), "id");
      const row = this.networkingEvents.insert({
        ...rest,
        applicationId: applicationId !== undefined ? applicationIdMap.get(applicationId) : undefined,
      } as Omit<StoredNetworkingEvent, "id">);
      for (const contactId of contactIds) {
        this.networkingEventContacts.insert({ eventId: row.id, contactId: contactIdMap.get(contactId)! });
      }
    }

    this.goals = { ...seed.goals };
    this.userProfile = { ...seed.userProfile };
    this.interviewCategories = [...seed.interviewCategories];

    const interviewPrepQuestionIdMap = new Map<string, number>();
    for (const q of seed.interviewPrepQuestions) {
      const { id: seedId, ...rest } = clone(q);
      const row = this.interviewPrepQuestions.insert(rest as Omit<StoredInterviewPrepQuestion, "id">);
      interviewPrepQuestionIdMap.set(seedId, row.id);
    }

    for (const v of seed.elevatorPitchVersions) {
      const { sourceQuestionId, ...rest } = omit(clone(v), "id");
      this.elevatorPitchVersions.insert({
        ...rest,
        sourceQuestionId: sourceQuestionId !== undefined ? interviewPrepQuestionIdMap.get(sourceQuestionId) : undefined,
      } as Omit<StoredElevatorPitchVersion, "id">);
    }
  }
}
