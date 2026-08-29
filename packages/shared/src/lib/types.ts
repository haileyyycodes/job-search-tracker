export type ApplicationStatus =
  | "todo"
  | "applied"
  | "interviewing"
  | "offer_extended"
  | "offer_accepted"
  | "offer_declined"
  | "rejected_no_interview"
  | "rejected_after_interview"
  | "withdrawn";

export interface StatusHistoryEntry {
  status: ApplicationStatus;
  at: string;
}

export type InterviewType =
  | "Recruiter Screen"
  | "Technical Screen"
  | "Technical Interview"
  | "Behavioral"
  | "Hiring Manager"
  | "Panel"
  | "Other";

export type InterviewStyle = "LeetCode" | "Whiteboarding" | "Mixture" | "Other";

export interface Interview {
  id: number;
  type: InterviewType;
  date: string;
  style?: InterviewStyle;
  categories?: string[];
  questionsAsked?: string;
  notes: string;
}

export interface FollowUp {
  id: number;
  date: string;
  contactId: number;
  notes: string;
}

export interface Feedback {
  text: string;
  date: string;
}

export type WorkArrangement = "onsite" | "remote" | "hybrid";

export type ResumeType = "untailored" | "tailored";

export type CompanyStatus = "researching" | "watching" | "applied" | "not_pursuing";

export interface CompanyLocation {
  city: string;
  state: string;
}

export interface Company {
  id: number;
  name: string;
  isTarget: boolean;
  status: CompanyStatus;
  industry?: string;
  website?: string;
  locations: CompanyLocation[];
  notes: string;
}

export interface Application {
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
  interviews: Interview[];
  followUps: FollowUp[];
  feedback?: Feedback;
  salaryMin?: number;
  salaryMax?: number;
  workArrangement?: WorkArrangement;
  city?: string;
  state?: string;
}

export interface Contact {
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

export interface NetworkingEvent {
  id: number;
  contactIds: number[];
  type: string;
  date: string;
  applicationId?: number;
  notes: string;
}

export interface Goals {
  salaryMin?: number;
  salaryMax?: number;
  applicationsPerWeekTarget?: number;
  targetOfferDate?: string;
}

export interface UserProfile {
  name: string;
}

export interface InterviewPrepQuestion {
  id: number;
  category: string;
  section?: string;
  question: string;
  answer: string;
  starred: boolean;
}

/**
 * One tailored draft of your elevator pitch (e.g. "Career fair" vs. "Recruiter
 * call"). Every field below maps to one step of the pitch builder wizard;
 * `themes` and `sourceQuestionId` are the only non-scalar/optional ones.
 */
export interface ElevatorPitchVersion {
  id: number;
  name: string;
  setting: string;
  who: string;
  personName: string;
  role: string;
  identity: string;
  situation: string;
  action: string;
  result: string;
  themes: string[];
  synthesis: string;
  seeking: string;
  closingQuestion: string;
  /** InterviewPrepQuestion this version's proof point was pulled from, if any. */
  sourceQuestionId?: number;
}
