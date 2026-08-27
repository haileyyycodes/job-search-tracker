import type {
  ApplicationStatus,
  CompanyStatus,
  Feedback,
  Goals,
  InterviewStyle,
  InterviewType,
  ReminderRule,
  ResumeType,
  StatusHistoryEntry,
  TaskStatus,
  UserProfile,
  WorkArrangement,
} from "@/lib/types";

/**
 * Numeric-id mirrors of src/lib/types.ts, used only until Phase 2 flips the
 * shared app types from string ids to DataSource-assigned numeric ids.
 * Once that lands, these Ds* types collapse back into the real types.
 */

/** No id: matches src/lib/types.ts's CompanyLocation exactly. Implementations
 * that need a row PK (a real company_locations table) keep it internal. */
export interface DsCompanyLocation {
  city: string;
  state: string;
}

export interface DsCompany {
  id: number;
  name: string;
  isTarget: boolean;
  status: CompanyStatus;
  industry?: string;
  website?: string;
  locations: DsCompanyLocation[];
  notes: string;
}

export interface DsContact {
  id: number;
  name: string;
  email?: string;
  phone?: string;
  linkedInUrl?: string;
  website?: string;
  companyId?: number;
  role?: string;
  notes: string;
}

export interface DsInterview {
  id: number;
  type: InterviewType;
  date: string;
  style?: InterviewStyle;
  categories?: string[];
  questionsAsked?: string;
  notes: string;
}

export interface DsFollowUp {
  id: number;
  date: string;
  contactId: number;
  notes: string;
}

export interface DsTask {
  id: number;
  applicationId: number;
  dueDate: string;
  note: string;
  status: TaskStatus;
  reminderRule?: ReminderRule;
}

export interface DsApplication {
  id: number;
  companyId: number;
  role: string;
  dateApplied: string;
  link: string;
  jobDescription: string;
  referral: boolean;
  referredByContactId?: number;
  resumeType: ResumeType;
  coverLetterSubmitted: boolean;
  notes: string;
  status: ApplicationStatus;
  logo: string;
  statusHistory: StatusHistoryEntry[];
  interviews: DsInterview[];
  followUps: DsFollowUp[];
  feedback?: Feedback;
  salaryMin?: number;
  salaryMax?: number;
  workArrangement?: WorkArrangement;
  city?: string;
  state?: string;
}

export interface DsNetworkingEvent {
  id: number;
  contactIds: number[];
  type: string;
  date: string;
  applicationId?: number;
  notes: string;
}

export interface DsInterviewPrepQuestion {
  id: number;
  category: string;
  section?: string;
  question: string;
  answer: string;
}

export type DsGoals = Goals;
export type DsUserProfile = UserProfile;

export type NewApplication = Omit<DsApplication, "id" | "interviews" | "followUps">;
export type NewInterviewPrepQuestion = Omit<DsInterviewPrepQuestion, "id">;
export type NewCompany = Omit<DsCompany, "id" | "locations"> & { locations?: DsCompanyLocation[] };
export type NewContact = Omit<DsContact, "id">;
export type NewInterview = Omit<DsInterview, "id">;
export type NewFollowUp = Omit<DsFollowUp, "id">;
export type NewTask = Omit<DsTask, "id" | "status">;
export type NewNetworkingEvent = Omit<DsNetworkingEvent, "id">;

/** Thrown when a delete is blocked by a still-referencing row (ON DELETE RESTRICT). */
export class RestrictedDeleteError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "RestrictedDeleteError";
  }
}

/**
 * Persistence boundary for the tracker. Every implementation (Memory, Wasm,
 * Electron) returns the same nested shapes — composition/joins happen inside
 * each implementation so the UI layer never changes when the backing store does.
 */
export interface DataSource {
  getApplications(): Promise<DsApplication[]>;
  createApplication(app: NewApplication): Promise<DsApplication>;
  editApplication(app: DsApplication): Promise<void>;
  updateApplicationStatus(id: number, status: ApplicationStatus, at: string): Promise<void>;
  deleteApplication(id: number): Promise<void>;
  saveFeedback(appId: number, feedback: Feedback): Promise<void>;

  logInterview(appId: number, interview: NewInterview): Promise<DsInterview>;
  editInterview(appId: number, interviewId: number, updates: NewInterview): Promise<void>;
  deleteInterview(appId: number, interviewId: number): Promise<void>;

  logFollowUp(appId: number, followUp: NewFollowUp): Promise<DsFollowUp>;
  deleteFollowUp(appId: number, followUpId: number): Promise<void>;

  getTasks(): Promise<DsTask[]>;
  addTask(task: NewTask): Promise<DsTask>;
  dismissTask(id: number): Promise<void>;
  deleteTask(id: number): Promise<void>;

  getCompanies(): Promise<DsCompany[]>;
  createCompany(company: NewCompany): Promise<DsCompany>;
  editCompany(company: DsCompany): Promise<void>;
  deleteCompany(id: number): Promise<void>;
  toggleTarget(id: number): Promise<void>;

  getContacts(): Promise<DsContact[]>;
  createContact(contact: NewContact): Promise<DsContact>;
  editContact(contact: DsContact): Promise<void>;
  deleteContact(id: number): Promise<void>;

  getNetworkingEvents(): Promise<DsNetworkingEvent[]>;
  addNetworkingEvent(event: NewNetworkingEvent): Promise<DsNetworkingEvent>;
  deleteNetworkingEvent(id: number): Promise<void>;

  getGoals(): Promise<DsGoals>;
  updateGoals(goals: DsGoals): Promise<void>;

  getUserProfile(): Promise<DsUserProfile>;
  updateUserProfile(profile: DsUserProfile): Promise<void>;

  getInterviewCategories(): Promise<string[]>;
  addInterviewCategory(category: string): Promise<void>;

  getInterviewPrepQuestions(): Promise<DsInterviewPrepQuestion[]>;
  addInterviewPrepQuestion(question: NewInterviewPrepQuestion): Promise<DsInterviewPrepQuestion>;
  editInterviewPrepQuestion(question: DsInterviewPrepQuestion): Promise<void>;
  deleteInterviewPrepQuestion(id: number): Promise<void>;
}
