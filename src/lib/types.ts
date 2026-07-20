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
  id: string;
  type: InterviewType;
  date: string;
  style?: InterviewStyle;
  categories?: string[];
  questionsAsked?: string;
  notes: string;
}

export interface FollowUp {
  id: string;
  date: string;
  contactId: string;
  notes: string;
}

export interface Feedback {
  text: string;
  date: string;
}

export type WorkArrangement = "onsite" | "remote" | "hybrid";

export type ResumeType = "spray_and_pray" | "tailored";

export type CompanyStatus = "researching" | "watching" | "applied" | "not_pursuing";

export interface CompanyLocation {
  city: string;
  state: string;
}

export interface Company {
  id: string;
  name: string;
  isTarget: boolean;
  status: CompanyStatus;
  industry?: string;
  website?: string;
  locations: CompanyLocation[];
  notes: string;
}

export interface Application {
  id: string;
  companyId: string;
  role: string;
  dateApplied: string;
  link: string;
  jobDescription: string;
  referral: boolean;
  referredByContactId?: string;
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
  id: string;
  name: string;
  email?: string;
  phone?: string;
  linkedInUrl?: string;
  website?: string;
  companyId?: string;
  role?: string;
  notes: string;
}

export interface NetworkingEvent {
  id: string;
  contactIds: string[];
  type: string;
  date: string;
  applicationId?: string;
  notes: string;
}

export type TaskStatus = "active" | "dismissed";

export type ReminderRule = { type: "manual" } | { type: "days_after_applied"; days: number };

export interface Task {
  id: string;
  applicationId: string;
  dueDate: string;
  note: string;
  status: TaskStatus;
  reminderRule?: ReminderRule;
}

export interface Goals {
  salaryMin?: number;
  salaryMax?: number;
  applicationsPerWeekTarget?: number;
  targetOfferDate?: string;
}
