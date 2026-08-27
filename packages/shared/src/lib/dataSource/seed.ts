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
  userProfile: UserProfile;
  interviewCategories: string[];
  interviewPrepQuestions: Array<{
    id: string;
    category: string;
    section?: string;
    question: string;
    answer: string;
  }>;
}

/** Empty seed, used by contract tests that want to start from a blank slate. */
export const emptySeed: Seed = {
  companies: [],
  contacts: [],
  applications: [],
  tasks: [],
  networkingEvents: [],
  goals: {},
  userProfile: { name: "" },
  interviewCategories: [],
  interviewPrepQuestions: [],
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
    {
      id: "co3",
      name: "Cedar Grove Health",
      isTarget: false,
      status: "applied",
      locations: [],
      notes: "",
    },
    {
      id: "co4",
      name: "Fathom Robotics",
      isTarget: true,
      status: "applied",
      industry: "Robotics",
      locations: [{ city: "Ann Arbor", state: "MI" }],
      notes: "",
    },
    {
      id: "co5",
      name: "Lumen Studio",
      isTarget: false,
      status: "applied",
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
      resumeType: "untailored",
      coverLetterSubmitted: false,
      notes: "",
      status: "applied",
      logo: "B",
      workArrangement: "remote",
      statusHistory: [{ status: "applied", at: "Jul 10, 2026" }],
      interviews: [],
      followUps: [],
    },
    {
      id: "a3",
      companyId: "co3",
      role: "Product Manager",
      dateApplied: "May 15, 2026",
      link: "",
      jobDescription: "",
      referral: false,
      resumeType: "untailored",
      coverLetterSubmitted: false,
      notes: "",
      status: "applied",
      logo: "C",
      workArrangement: "remote",
      statusHistory: [{ status: "applied", at: "May 15, 2026" }],
      interviews: [],
      followUps: [],
    },
    {
      id: "a4",
      companyId: "co4",
      role: "UX Researcher",
      dateApplied: "Jun 1, 2026",
      link: "",
      jobDescription: "",
      referral: false,
      resumeType: "tailored",
      coverLetterSubmitted: true,
      notes: "",
      status: "interviewing",
      logo: "F",
      workArrangement: "hybrid",
      city: "Ann Arbor",
      state: "MI",
      statusHistory: [
        { status: "applied", at: "Jun 1, 2026" },
        { status: "interviewing", at: "Jun 20, 2026" },
      ],
      interviews: [{ id: "iv2", type: "Technical Screen", date: "Jun 20, 2026", notes: "First-round screen." }],
      followUps: [],
    },
    {
      id: "a5",
      companyId: "co5",
      role: "Backend Engineer",
      dateApplied: "Aug 1, 2026",
      link: "",
      jobDescription: "",
      referral: false,
      resumeType: "untailored",
      coverLetterSubmitted: false,
      notes: "",
      status: "applied",
      logo: "L",
      workArrangement: "remote",
      statusHistory: [{ status: "applied", at: "Aug 1, 2026" }],
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
  userProfile: { name: "haileyyycodes" },
  interviewCategories: ["Behavioral", "DSA/Leetcode", "System Design", "AI/ML", "Take-home/Practical", "Other"],
  interviewPrepQuestions: [
    // Ownership & Ambiguity
    { id: "ipq1", category: "behavioral", section: "Ownership & Ambiguity", question: "Tell me about a time you owned a project end-to-end with minimal direction.", answer: "" },
    { id: "ipq2", category: "behavioral", section: "Ownership & Ambiguity", question: "Describe a situation where the requirements were unclear or kept changing. How did you handle it?", answer: "" },
    { id: "ipq3", category: "behavioral", section: "Ownership & Ambiguity", question: "Tell me about a time you identified a problem nobody had asked you to solve.", answer: "" },
    { id: "ipq4", category: "behavioral", section: "Ownership & Ambiguity", question: "Describe a project where you had to make a call without full information.", answer: "" },
    // Product & Design Sensibility
    { id: "ipq5", category: "behavioral", section: "Product & Design Sensibility", question: "Tell me about a time you pushed back on a design or product decision for technical or UX reasons.", answer: "" },
    { id: "ipq6", category: "behavioral", section: "Product & Design Sensibility", question: "Describe a time you noticed a UX problem during implementation that design/PM had missed.", answer: "" },
    { id: "ipq7", category: "behavioral", section: "Product & Design Sensibility", question: "Tell me about a feature you shipped where you had strong opinions about the user experience, not just the code.", answer: "" },
    { id: "ipq8", category: "behavioral", section: "Product & Design Sensibility", question: "Walk me through a time you had to balance pixel-perfect design fidelity against engineering constraints or timelines.", answer: "" },
    { id: "ipq9", category: "behavioral", section: "Product & Design Sensibility", question: "Tell me about a time you advocated for the user in a room full of stakeholders focused on business metrics.", answer: "" },
    // Cross-Functional Collaboration
    { id: "ipq10", category: "behavioral", section: "Cross-Functional Collaboration", question: "Tell me about a time you disagreed with a designer or PM. How did you resolve it?", answer: "" },
    { id: "ipq11", category: "behavioral", section: "Cross-Functional Collaboration", question: "Describe your working relationship with design — how do you collaborate day to day?", answer: "" },
    { id: "ipq12", category: "behavioral", section: "Cross-Functional Collaboration", question: "Tell me about a time you had to translate a vague product ask into a concrete technical plan.", answer: "" },
    { id: "ipq13", category: "behavioral", section: "Cross-Functional Collaboration", question: "Describe a time you had to say no to a stakeholder's request.", answer: "" },
    { id: "ipq14", category: "behavioral", section: "Cross-Functional Collaboration", question: "Tell me about a time you built trust with a non-technical partner (PM, designer, exec).", answer: "" },
    // Technical Decision-Making & Tradeoffs
    { id: "ipq15", category: "behavioral", section: "Technical Decision-Making & Tradeoffs", question: "Tell me about a significant architectural decision you made. What tradeoffs did you weigh?", answer: "" },
    { id: "ipq16", category: "behavioral", section: "Technical Decision-Making & Tradeoffs", question: "Describe a time you chose a simpler solution over a more \"correct\" one (or vice versa) — why?", answer: "" },
    { id: "ipq17", category: "behavioral", section: "Technical Decision-Making & Tradeoffs", question: "Tell me about a time you had to make a build-vs-buy or adopt-a-new-tool decision.", answer: "" },
    { id: "ipq18", category: "behavioral", section: "Technical Decision-Making & Tradeoffs", question: "Describe a time your technical decision was later proven wrong. What did you do?", answer: "" },
    { id: "ipq19", category: "behavioral", section: "Technical Decision-Making & Tradeoffs", question: "Tell me about a time you introduced a new tool, pattern, or process (e.g., AI-assisted workflow) to your team.", answer: "" },
    // Conflict & Disagreement
    { id: "ipq20", category: "behavioral", section: "Conflict & Disagreement", question: "Tell me about a time you disagreed with your manager or tech lead.", answer: "" },
    { id: "ipq21", category: "behavioral", section: "Conflict & Disagreement", question: "Describe a conflict with a peer engineer and how it was resolved.", answer: "" },
    { id: "ipq22", category: "behavioral", section: "Conflict & Disagreement", question: "Tell me about a time you had to give difficult feedback to someone.", answer: "" },
    { id: "ipq23", category: "behavioral", section: "Conflict & Disagreement", question: "Describe a time you were on the losing side of a technical debate. How did you handle it?", answer: "" },
    // Failure & Mistakes
    { id: "ipq24", category: "behavioral", section: "Failure & Mistakes", question: "Tell me about a time you shipped a bug that impacted users or the business.", answer: "" },
    { id: "ipq25", category: "behavioral", section: "Failure & Mistakes", question: "Describe your biggest professional failure and what you learned.", answer: "" },
    { id: "ipq26", category: "behavioral", section: "Failure & Mistakes", question: "Tell me about a time you missed a deadline. What happened?", answer: "" },
    { id: "ipq27", category: "behavioral", section: "Failure & Mistakes", question: "Describe a time you had to admit you were wrong publicly (to your team or leadership).", answer: "" },
    // Leadership & Influence (without authority)
    { id: "ipq28", category: "behavioral", section: "Leadership & Influence (without authority)", question: "Tell me about a time you led a project without formal authority over the people involved.", answer: "" },
    { id: "ipq29", category: "behavioral", section: "Leadership & Influence (without authority)", question: "Describe how you've mentored a junior engineer.", answer: "" },
    { id: "ipq30", category: "behavioral", section: "Leadership & Influence (without authority)", question: "Tell me about a time you drove alignment across a team that initially disagreed with your approach.", answer: "" },
    { id: "ipq31", category: "behavioral", section: "Leadership & Influence (without authority)", question: "Describe a time you had to influence a decision above your level.", answer: "" },
    // Prioritization & Scope
    { id: "ipq32", category: "behavioral", section: "Prioritization & Scope", question: "Tell me about a time you had to cut scope under a deadline. How did you decide what to cut?", answer: "" },
    { id: "ipq33", category: "behavioral", section: "Prioritization & Scope", question: "Describe how you prioritize when everything feels urgent.", answer: "" },
    { id: "ipq34", category: "behavioral", section: "Prioritization & Scope", question: "Tell me about a time you said no to a \"quick\" request that wasn't actually quick.", answer: "" },
    // Growth & Motivation
    { id: "ipq35", category: "behavioral", section: "Growth & Motivation", question: "Why are you interested in design engineering / full-stack product engineering specifically?", answer: "" },
    { id: "ipq36", category: "behavioral", section: "Growth & Motivation", question: "Tell me about a time you taught yourself a new skill or technology to solve a problem.", answer: "" },
    { id: "ipq37", category: "behavioral", section: "Growth & Motivation", question: "Describe how your role or skill set has evolved over the last few years.", answer: "" },
    { id: "ipq38", category: "behavioral", section: "Growth & Motivation", question: "What's a piece of feedback that changed how you work?", answer: "" },
    // Curveballs Common at Senior Level
    { id: "ipq39", category: "behavioral", section: "Curveballs Common at Senior Level", question: "Tell me about a time you had to say \"I don't know\" to a stakeholder.", answer: "" },
    { id: "ipq40", category: "behavioral", section: "Curveballs Common at Senior Level", question: "Describe a time you scaled yourself out of a task by delegating or documenting.", answer: "" },
    { id: "ipq41", category: "behavioral", section: "Curveballs Common at Senior Level", question: "Tell me about a time you challenged the status quo on your team's process or tooling.", answer: "" },
    { id: "ipq42", category: "behavioral", section: "Curveballs Common at Senior Level", question: "Describe a time your work was misunderstood or undervalued. How did you handle it?", answer: "" },
  ],
};
