export type ApplicationStatus =
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

export interface Interview {
  type: string;
  date: string;
  notes: string;
}

export interface FollowUp {
  date: string;
  contact: string;
  info: string;
  notes: string;
}

export interface Application {
  id: string;
  company: string;
  role: string;
  dateApplied: string;
  link: string;
  referral: boolean;
  referredBy?: string;
  notes: string;
  status: ApplicationStatus;
  logo: string;
  statusHistory: StatusHistoryEntry[];
  interviews: Interview[];
  followUps: FollowUp[];
}

export type TaskStatus = "active" | "dismissed";

export interface Task {
  id: string;
  applicationId: string;
  dueDate: string;
  note: string;
  status: TaskStatus;
}

export type TrackerView = "dashboard" | "applications" | "detail" | "interviews" | "followups" | "tasks";
