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
  WorkArrangement,
} from "@/lib/types";

/**
 * Seed shape mirrors src/lib/data.ts but with string placeholder ids that
 * loadSeed() remaps to real DataSource-assigned numeric ids on insert, so
 * seed entries can reference each other (companyId, contactId, ...) by a
 * stable label instead of a number decided ahead of time.
 */
export interface Seed {
  companies: Array<{
    id: string;
    name: string;
    isTarget: boolean;
    status: CompanyStatus;
    industry?: string;
    website?: string;
    locations: { city: string; state: string }[];
    notes: string;
  }>;
  contacts: Array<{
    id: string;
    name: string;
    email?: string;
    phone?: string;
    linkedInUrl?: string;
    website?: string;
    companyId?: string;
    role?: string;
    notes: string;
  }>;
  applications: Array<{
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
    interviews: Array<{
      id: string;
      type: InterviewType;
      date: string;
      style?: InterviewStyle;
      categories?: string[];
      questionsAsked?: string;
      notes: string;
    }>;
    followUps: Array<{ id: string; date: string; contactId: string; notes: string }>;
    feedback?: Feedback;
    salaryMin?: number;
    salaryMax?: number;
    workArrangement?: WorkArrangement;
    city?: string;
    state?: string;
  }>;
  tasks: Array<{
    id: string;
    applicationId: string;
    dueDate: string;
    note: string;
    status: TaskStatus;
    reminderRule?: ReminderRule;
  }>;
  networkingEvents: Array<{
    id: string;
    contactIds: string[];
    type: string;
    date: string;
    applicationId?: string;
    notes: string;
  }>;
  goals: Goals;
  interviewCategories: string[];
}

/** Empty seed, used by contract tests that want to start from a blank slate. */
export const emptySeed: Seed = {
  companies: [],
  contacts: [],
  applications: [],
  tasks: [],
  networkingEvents: [],
  goals: {},
  interviewCategories: [],
};

/**
 * Small but structurally complete seed: exercises every entity and every
 * foreign key (including the optional ones) so contract tests and manual
 * dev-mode poking around have something real to look at.
 */
export const defaultSeed: Seed = {
  companies: [
    {
      id: "co1",
      name: "Northwind Co.",
      isTarget: true,
      status: "applied",
      industry: "Product design / SaaS",
      website: "https://example.com",
      locations: [{ city: "Detroit", state: "MI" }],
      notes: "Collaborative design team culture.",
    },
    {
      id: "co2",
      name: "Beacon Analytics",
      isTarget: false,
      status: "researching",
      locations: [],
      notes: "",
    },
  ],
  contacts: [
    {
      id: "c1",
      name: "Alex Chen",
      email: "alex@northwind.co",
      companyId: "co1",
      role: "Product Design",
      notes: "Referred me to the Product Designer role.",
    },
  ],
  applications: [
    {
      id: "a1",
      companyId: "co1",
      role: "Product Designer",
      dateApplied: "Jun 10, 2026",
      link: "",
      jobDescription: "",
      referral: true,
      referredByContactId: "c1",
      resumeType: "tailored",
      coverLetterSubmitted: true,
      notes: "Referral from Alex.",
      status: "interviewing",
      logo: "N",
      salaryMin: 115000,
      salaryMax: 140000,
      workArrangement: "hybrid",
      city: "Detroit",
      state: "MI",
      statusHistory: [
        { status: "applied", at: "Jun 10, 2026" },
        { status: "interviewing", at: "Jun 18, 2026" },
      ],
      interviews: [
        { id: "iv1", type: "Recruiter Screen", date: "Jun 18, 2026", notes: "30 min with recruiter." },
      ],
      followUps: [{ id: "fu1", date: "Jun 25, 2026", contactId: "c1", notes: "Checked in on timeline." }],
    },
    {
      id: "a2",
      companyId: "co2",
      role: "Senior Frontend Engineer",
      dateApplied: "Jul 10, 2026",
      link: "",
      jobDescription: "",
      referral: false,
      resumeType: "spray_and_pray",
      coverLetterSubmitted: false,
      notes: "",
      status: "applied",
      logo: "B",
      workArrangement: "remote",
      statusHistory: [{ status: "applied", at: "Jul 10, 2026" }],
      interviews: [],
      followUps: [],
    },
  ],
  tasks: [
    {
      id: "t1",
      applicationId: "a2",
      dueDate: "Jul 17, 2026",
      note: "Follow up 7 days after applying",
      status: "active",
      reminderRule: { type: "days_after_applied", days: 7 },
    },
  ],
  networkingEvents: [
    {
      id: "ne1",
      contactIds: ["c1"],
      type: "Coffee chat",
      date: "Jun 20, 2026",
      applicationId: "a1",
      notes: "Caught up on how the interview loop is going.",
    },
  ],
  goals: {
    salaryMin: 120000,
    salaryMax: 150000,
    applicationsPerWeekTarget: 5,
    targetOfferDate: "Aug 15, 2026",
  },
  interviewCategories: ["Behavioral", "DSA/Leetcode", "System Design", "AI/ML", "Take-home/Practical", "Other"],
};
