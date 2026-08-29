import type {
  ApplicationStatus,
  CompanyStatus,
  Feedback,
  Goals,
  InterviewStyle,
  InterviewType,
  RelationshipTier,
  ResumeType,
  StatusHistoryEntry,
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
    relationshipTier?: RelationshipTier;
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
    starred: boolean;
  }>;
  elevatorPitchVersions: Array<{
    id: string;
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
    sourceQuestionId?: string;
  }>;
}

/** Empty seed, used by contract tests that want to start from a blank slate. */
export const emptySeed: Seed = {
  companies: [],
  contacts: [],
  applications: [],
  networkingEvents: [],
  goals: {},
  userProfile: { name: "" },
  interviewCategories: [],
  interviewPrepQuestions: [],
  elevatorPitchVersions: [],
};

// ─────────────────────────────────────────────────────────────────────────────
// defaultSeed data — a broad, deterministic dataset for local dev and demos.
//
// buildSeedRecords() generates ~50 applications with full coverage of every
// application status, company status, work arrangement, resume type, interview
// type and style, plus contacts, follow-ups, feedback, and networking events.
// A hand-written literal that large is unreviewable; this keeps the intended
// distribution explicit (STATUS_PLAN) and stays deterministic — no Math.random,
// so a refresh always reproduces the same data. seed.test.ts asserts coverage.
// ─────────────────────────────────────────────────────────────────────────────

type SeedRecords = Pick<Seed, "companies" | "contacts" | "applications" | "networkingEvents" | "elevatorPitchVersions">;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SEED_EPOCH = new Date(2026, 1, 1); // Feb 1, 2026 — day 0 for every generated date

/** Day `n` after SEED_EPOCH as a display date, e.g. `seedDate(160)` -> "Jul 11, 2026". */
function seedDate(n: number): string {
  const d = new Date(SEED_EPOCH);
  d.setDate(d.getDate() + n);
  return `${MONTHS[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
}

const COMPANY_NAMES = [
  "Northwind Co.", "Beacon Analytics", "Cedar Grove Health", "Fathom Robotics", "Lumen Studio",
  "Anchor Systems", "Harborlight Media", "Solstice Financial", "Ironwood Labs", "Meridian Foods",
  "Quill & Co.", "Tidewater Logistics", "Brightloom", "Copperfield Games", "Vantage Health",
  "Northgate Security", "Pinewood Robotics", "Kestrel Aerospace", "Marigold Bank", "Slate & Cedar",
  "Overland Freight", "Lantern Health", "Basalt Compute", "Verdant Ag", "Halcyon Media",
  "Foundry Works", "Riverstone Capital", "Auric Payments", "Willowmind AI", "Cobalt Grid",
  "Sable Retail", "Thornfield Legal", "Driftwood Travel", "Emberline Energy", "Junable",
  "Larkspur Bio", "Oakhaven Realty", "Stormline Data", "Wexford Games", "Yarrow Health",
  "Cloudbank", "Petal & Co.", "Granite Peak", "Sundial Labs", "Meadowlark Media",
  "Ridgeline Robotics", "Bluecrest Bank", "Tinderbox Games",
];
const INDUSTRIES = [
  "Product design / SaaS", "Data & analytics", "Healthcare", "Robotics", "Creative tools",
  "Infrastructure", "Media", "Fintech", "Developer tools", "Consumer / food",
];
const ROLES = [
  "Product Designer", "Senior Frontend Engineer", "Design Engineer", "Full-Stack Engineer", "UX Researcher",
  "Product Manager", "Staff Engineer", "Frontend Platform Engineer", "Design Systems Engineer", "Software Engineer II",
  "Senior Product Designer", "UI Engineer", "Web Engineer", "Applied AI Engineer", "Growth Engineer",
  "Backend Engineer", "Engineering Manager", "Prototyper", "Creative Technologist", "Interaction Designer",
];
const SEED_LOCATIONS: [string, string][] = [
  ["Detroit", "MI"], ["San Francisco", "CA"], ["New York", "NY"], ["Austin", "TX"], ["Seattle", "WA"],
  ["Boston", "MA"], ["Denver", "CO"], ["Chicago", "IL"], ["Atlanta", "GA"], ["Durham", "NC"],
  ["Portland", "OR"], ["Philadelphia", "PA"], ["Ann Arbor", "MI"], ["Brooklyn", "NY"], ["Oakland", "CA"],
];
const SALARY_BANDS: [number, number][] = [
  [95000, 110000], [110000, 130000], [120000, 145000], [130000, 160000], [140000, 170000], [150000, 185000],
];
const APP_NOTES = [
  "", "Referral from a former teammate.", "Found via job board.", "Reached out to a recruiter on LinkedIn.",
  "Dream role — design systems adjacent.", "Comp is a stretch but worth a shot.", "",
  "Warm intro through a meetup contact.", "Applied cold; tailored the portfolio.", "",
];
const IV_TYPES: InterviewType[] = [
  "Recruiter Screen", "Technical Screen", "Technical Interview", "Behavioral", "Hiring Manager", "Panel", "Other",
];
const IV_STYLES: InterviewStyle[] = ["LeetCode", "Whiteboarding", "Mixture", "Other"];
const IV_CATEGORIES: (string[] | undefined)[] = [
  ["DSA/Leetcode"], ["System Design"], ["Behavioral"], ["Take-home/Practical"], ["AI/ML"], undefined,
];
const IV_NOTES = [
  "30 min with the recruiter — role and comp overview.", "Pair-programming round; went well.",
  "Systems discussion with a whiteboard sketch of the architecture.", "Values and behavioral round with two ICs.",
  "Hiring manager chat — team roadmap and expectations.", "Full panel: four back-to-back sessions.",
  "Portfolio deep-dive and live critique.",
];
const WORK_ARRANGEMENTS: (WorkArrangement | undefined)[] = ["remote", "hybrid", "onsite", undefined];

const SEED_CONTACTS: Seed["contacts"] = [
  { id: "c1", name: "Alex Chen", companyId: "co1", role: "Product Design Lead", email: "alex@northwind.example", linkedInUrl: "https://linkedin.com/in/alexchen", relationshipTier: "core", notes: "Referred me to the Product Designer role." },
  { id: "c2", name: "Priya Nair", companyId: "co4", role: "Engineering Manager", email: "priya@fathom.example", phone: "+1 313 555 0142", relationshipTier: "core", notes: "Met at a robotics meetup; hiring for her team." },
  { id: "c3", name: "Jordan Blake", companyId: "co7", role: "Design Director", email: "jordan@harborlight.example", website: "https://jordanblake.example", relationshipTier: "extended", notes: "Former colleague; offered to refer." },
  { id: "c4", name: "Sam Ortiz", companyId: "co9", role: "Staff Engineer", linkedInUrl: "https://linkedin.com/in/samortiz", relationshipTier: "extended", notes: "Answered questions about the interview loop." },
  { id: "c5", name: "Riley Okafor", companyId: "co13", role: "Recruiter", email: "riley@brightloom.example", phone: "+1 415 555 0198", relationshipTier: "extended", notes: "In-house recruiter; very responsive." },
  { id: "c6", name: "Dana Whitfield", companyId: "co17", role: "Head of Design", email: "dana@pinewood.example", relationshipTier: "dormant", notes: "Spoke on a panel I attended." },
  { id: "c7", name: "Chris Lindqvist", companyId: "co23", role: "Principal Engineer", email: "chris@basalt.example", linkedInUrl: "https://linkedin.com/in/clindqvist", relationshipTier: "dormant", notes: "" },
  { id: "c8", name: "Morgan Reyes", role: "Career coach", email: "morgan@example.com", relationshipTier: "core", notes: "Not tied to a company — reviews my materials." },
  { id: "c9", name: "Taylor Fenn", companyId: "co29", role: "Founder", email: "taylor@willowmind.example", website: "https://willowmind.example", relationshipTier: "core", notes: "Early-stage; moves fast." },
  { id: "c10", name: "Jamie Sokolov", companyId: "co2", role: "Senior Recruiter", phone: "+1 206 555 0110", relationshipTier: "extended", notes: "Coordinated the Beacon loop." },
  { id: "c11", name: "Noor Haddad", companyId: "co3", role: "Design Manager", email: "noor@cedargrove.example", relationshipTier: "extended", notes: "Grabbed coffee before applying." },
  { id: "c12", name: "Devon Pratt", companyId: "co11", role: "Frontend Lead", email: "devon@quill.example", linkedInUrl: "https://linkedin.com/in/devonpratt", relationshipTier: "core", notes: "Reviewed my portfolio informally." },
  { id: "c13", name: "Ana Ruiz", companyId: "co19", role: "Recruiting Coordinator", email: "ana@marigold.example", phone: "+1 312 555 0173", relationshipTier: "dormant", notes: "Scheduled the onsite." },
  { id: "c14", name: "Ken Abara", companyId: "co25", role: "Engineering Director", email: "ken@halcyon.example", relationshipTier: "dormant", notes: "Met at a conference dinner." },
  { id: "c15", name: "Wes Delgado", companyId: "co5", role: "Design Lead", email: "wes@lumen.example", relationshipTier: "extended", notes: "Offered to put in a good word." },
  { id: "c16", name: "Imani Osei", companyId: "co8", role: "Talent Partner", email: "imani@solstice.example", phone: "+1 617 555 0155", relationshipTier: "core", notes: "Sourced me for the role." },
  { id: "c17", name: "Owen Marsh", companyId: "co15", role: "Frontend Manager", email: "owen@vantage.example", notes: "Referred me internally." },
];

/** Per-status counts (sum = 50, ≥5 each) plus the status-history trail each app carries. */
const STATUS_PLAN: { status: ApplicationStatus; count: number; history: ApplicationStatus[]; interviews: number }[] = [
  { status: "todo", count: 8, history: ["todo"], interviews: 0 },
  { status: "applied", count: 6, history: ["applied"], interviews: 0 },
  { status: "interviewing", count: 6, history: ["applied", "interviewing"], interviews: 2 },
  { status: "offer_extended", count: 5, history: ["applied", "interviewing", "offer_extended"], interviews: 3 },
  { status: "offer_accepted", count: 5, history: ["applied", "interviewing", "offer_extended", "offer_accepted"], interviews: 3 },
  { status: "offer_declined", count: 5, history: ["applied", "interviewing", "offer_extended", "offer_declined"], interviews: 3 },
  { status: "rejected_no_interview", count: 5, history: ["applied", "rejected_no_interview"], interviews: 0 },
  { status: "rejected_after_interview", count: 5, history: ["applied", "interviewing", "rejected_after_interview"], interviews: 3 },
  { status: "withdrawn", count: 5, history: ["applied", "interviewing", "withdrawn"], interviews: 1 },
];
const FEEDBACK_STATUSES = new Set<ApplicationStatus>(["offer_declined", "rejected_after_interview"]);
const FEEDBACK_TEXT = [
  "Strong portfolio, but they wanted deeper hands-on design-systems ownership.",
  "Close call — they went with someone who had more fintech domain experience.",
  "Positive on the craft; the system-design round was the weak spot.",
  "Great culture fit; the timing didn't line up with their headcount.",
  "Loved the prototyping work; they paused the req after the final round.",
];

/** co1..co30 host applied+ applications; co31..co38 host saved-only ("todo") ones; the rest stay pure pipeline. */
const NON_TODO_COMPANY_COUNT = 30;
const TODO_COMPANY_START_INDEX = 30;
const NO_APP_COMPANY_STATUS: CompanyStatus[] = [
  "researching", "watching", "not_pursuing", "watching", "researching", "not_pursuing", "researching", "watching",
];

function buildSeedRecords(): SeedRecords {
  const contactByCompany = new Map<string, string>();
  for (const c of SEED_CONTACTS) if (c.companyId) contactByCompany.set(c.companyId, c.id);

  const plan = STATUS_PLAN.flatMap((p) => Array.from({ length: p.count }, () => p));

  let interviewId = 0;
  let followUpId = 0;
  let rotatingInterview = 0; // drives type/style rotation across all non-screen rounds
  let feedbackCount = 0;
  let todoIndex = -1;
  let appliedIndex = -1;

  const applications: Seed["applications"] = plan.map((p, i) => {
    const isTodo = p.status === "todo";
    let companyIdx: number;
    if (isTodo) {
      todoIndex += 1;
      companyIdx = TODO_COMPANY_START_INDEX + todoIndex;
    } else {
      appliedIndex += 1;
      companyIdx = appliedIndex % NON_TODO_COMPANY_COUNT;
    }
    const companyId = `co${companyIdx + 1}`;
    const contactId = contactByCompany.get(companyId);

    const work = WORK_ARRANGEMENTS[i % WORK_ARRANGEMENTS.length];
    const onSite = work === "onsite" || work === "hybrid";
    const [city, state] = SEED_LOCATIONS[i % SEED_LOCATIONS.length];
    const band = i % 3 === 0 ? undefined : SALARY_BANDS[i % SALARY_BANDS.length];
    const referral = i % 3 === 1;
    const appliedDay = 12 + (isTodo ? 150 + todoIndex * 5 : appliedIndex * 4);

    const statusHistory: StatusHistoryEntry[] = [];
    if (isTodo) {
      statusHistory.push({ status: "todo", at: seedDate(150 + todoIndex * 6) });
    } else {
      let day = appliedDay;
      p.history.forEach((status, hi) => {
        statusHistory.push({ status, at: seedDate(day) });
        day += 9 + ((i + hi) % 6);
      });
    }

    const interviews: Seed["applications"][number]["interviews"] = [];
    for (let round = 0; round < p.interviews; round += 1) {
      interviewId += 1;
      const isScreen = round === 0;
      let type: InterviewType = "Recruiter Screen";
      let style: InterviewStyle | undefined;
      let categories: string[] | undefined;
      if (!isScreen) {
        rotatingInterview += 1;
        type = IV_TYPES[1 + (rotatingInterview % 6)];
        style = IV_STYLES[rotatingInterview % IV_STYLES.length];
        categories = IV_CATEGORIES[rotatingInterview % IV_CATEGORIES.length];
      }
      interviews.push({
        id: `iv${interviewId}`,
        type,
        date: seedDate(appliedDay + 12 + round * 8),
        ...(style ? { style } : {}),
        ...(categories ? { categories } : {}),
        ...(!isScreen && rotatingInterview % 2 === 0
          ? { questionsAsked: "Array and string manipulation; a system-design sketch; a few behavioral prompts." }
          : {}),
        notes: IV_NOTES[(interviewId + round) % IV_NOTES.length],
      });
    }

    const followUps: Seed["applications"][number]["followUps"] = [];
    const pastApplied = statusHistory.some((s) => s.status !== "applied" && s.status !== "todo");
    if (contactId && pastApplied) {
      followUpId += 1;
      followUps.push({ id: `fu${followUpId}`, date: seedDate(appliedDay + 18), contactId, notes: "Thanked them for the time and asked about next steps." });
      if (i % 3 === 0) {
        followUpId += 1;
        followUps.push({ id: `fu${followUpId}`, date: seedDate(appliedDay + 34), contactId, notes: "Quick nudge — still very interested." });
      }
    }

    const app: Seed["applications"][number] = {
      id: `a${i + 1}`,
      companyId,
      role: ROLES[i % ROLES.length],
      dateApplied: isTodo ? "" : seedDate(appliedDay),
      link: i % 2 === 0 ? `https://example.com/jobs/a${i + 1}` : "",
      jobDescription: i % 5 === 0 ? "Own the design-system and front-end platform work end to end; partner closely with design." : "",
      referral,
      ...(referral && contactId ? { referredByContactId: contactId } : {}),
      resumeType: i % 5 < 2 ? "tailored" : "untailored",
      coverLetterSubmitted: i % 2 === 0,
      notes: APP_NOTES[i % APP_NOTES.length],
      status: p.status,
      logo: (COMPANY_NAMES[companyIdx] ?? "?").charAt(0).toUpperCase(),
      ...(band ? { salaryMin: band[0], salaryMax: band[1] } : {}),
      ...(work ? { workArrangement: work } : {}),
      ...(onSite ? { city, state } : {}),
      statusHistory,
      interviews,
      followUps,
    };
    if (FEEDBACK_STATUSES.has(p.status) && feedbackCount < 9) {
      feedbackCount += 1;
      app.feedback = { text: FEEDBACK_TEXT[i % FEEDBACK_TEXT.length], date: statusHistory[statusHistory.length - 1].at };
    }
    return app;
  });

  const appsByCompany = new Map<string, Seed["applications"]>();
  for (const a of applications) {
    const list = appsByCompany.get(a.companyId) ?? [];
    list.push(a);
    appsByCompany.set(a.companyId, list);
  }

  const closedStatuses = new Set<ApplicationStatus>(["withdrawn", "rejected_no_interview", "rejected_after_interview"]);
  const companies: Seed["companies"] = COMPANY_NAMES.map((name, idx) => {
    const id = `co${idx + 1}`;
    const mine = appsByCompany.get(id) ?? [];
    let status: CompanyStatus;
    if (mine.length === 0) status = NO_APP_COMPANY_STATUS[idx % NO_APP_COMPANY_STATUS.length];
    else if (mine.every((a) => a.status === "todo")) status = idx % 2 === 0 ? "researching" : "watching";
    else if (mine.every((a) => closedStatuses.has(a.status))) status = "not_pursuing";
    else status = "applied";
    const [city, state] = SEED_LOCATIONS[idx % SEED_LOCATIONS.length];
    return {
      id,
      name,
      isTarget: idx % 4 === 0,
      status,
      ...(idx % 2 === 0 ? { industry: INDUSTRIES[idx % INDUSTRIES.length] } : {}),
      ...(idx % 3 === 0 ? { website: `https://${name.toLowerCase().replace(/[^a-z]+/g, "")}.example` } : {}),
      locations: idx % 3 === 0 ? [{ city, state }] : [],
      notes: idx % 5 === 0 ? "Strong design culture; friends have had good experiences here." : "",
    };
  });

  const networkingEvents: Seed["networkingEvents"] = [
    { id: "ne1", contactIds: ["c1"], type: "Coffee chat", date: seedDate(26), applicationId: "a1", notes: "Caught up on the design team and the open role." },
    { id: "ne2", contactIds: ["c2", "c4"], type: "In-person meetup", date: seedDate(44), notes: "Robotics meetup; met two engineers who are hiring." },
    { id: "ne3", contactIds: ["c3"], type: "Video call", date: seedDate(70), applicationId: "a7", notes: "Portfolio walkthrough before formally applying." },
    { id: "ne4", contactIds: ["c5"], type: "Phone call", date: seedDate(96), applicationId: "a13", notes: "Recruiter intro call about the platform team." },
    { id: "ne5", contactIds: ["c6", "c7"], type: "Conference/event", date: seedDate(112), notes: "Design-systems conference — hallway conversations." },
    { id: "ne6", contactIds: ["c8"], type: "Video call", date: seedDate(122), notes: "Materials review with my career coach." },
    { id: "ne7", contactIds: ["c9"], type: "Coffee chat", date: seedDate(140), applicationId: "a41", notes: "Founder chat; early-stage but compelling." },
    { id: "ne8", contactIds: ["c10", "c12"], type: "Other", date: seedDate(154), notes: "Community AMA with a few hiring teams." },
  ];

  const elevatorPitchVersions: Seed["elevatorPitchVersions"] = [
    {
      id: "ep1", name: "Career fair", setting: "Career fair booth, ~60 seconds, recruiter is standing",
      who: "University / industry recruiter", personName: "", role: "Recruiter",
      identity: "a design engineer who builds polished, accessible product UI end to end",
      situation: "At my last role the design system was drifting and slowing every team down",
      action: "I rebuilt it as a tokenized component library and moved teams onto it",
      result: "UI bug reports dropped about 40% and features shipped noticeably faster",
      themes: ["design systems", "accessibility", "developer experience"],
      synthesis: "I care about the seam between design and engineering and I like owning it",
      seeking: "a design-engineering or front-end platform role on a product team",
      closingQuestion: "What does design–engineering collaboration look like on your teams?",
      sourceQuestionId: "ipq35",
    },
    {
      id: "ep2", name: "Recruiter phone screen", setting: "Scheduled 30-minute intro call",
      who: "In-house recruiter", personName: "Riley", role: "Recruiter",
      identity: "a full-stack product engineer with a design background",
      situation: "Our onboarding flow had a 30% drop-off and nobody owned it",
      action: "I took ownership, redesigned it, and instrumented every step",
      result: "drop-off fell to 18% and it became the template for other flows",
      themes: ["product sense", "ownership", "measurement"],
      synthesis: "I like ambiguous, user-facing problems where I can both design and build the fix",
      seeking: "a senior product engineering role with real design latitude",
      closingQuestion: "How much say do engineers have in product and UX decisions here?",
      sourceQuestionId: "ipq45",
    },
    {
      id: "ep3", name: "Warm intro over coffee", setting: "Coffee with a friend-of-a-friend who works there",
      who: "Engineer at a target company", personName: "Sam", role: "Staff Engineer",
      identity: "someone who moves fluidly between Figma and the codebase",
      situation: "A launch was blocked on a gnarly perf regression in our editor",
      action: "I profiled it, found a re-render storm, and reworked the state model",
      result: "interaction latency went from 400ms to under 60ms and we shipped on time",
      themes: ["performance", "prototyping", "calm under pressure"],
      synthesis: "I'm at my best turning a vague, high-stakes problem into a shipped fix",
      seeking: "a design-engineering role where craft and performance both matter",
      closingQuestion: "What's the hardest technical problem your team is chewing on right now?",
      sourceQuestionId: "ipq15",
    },
    {
      id: "ep4", name: "Conference hallway", setting: "Standing chat after a talk, ~90 seconds",
      who: "Speaker / senior IC", personName: "Dana", role: "Head of Design",
      identity: "a design engineer who ships the last 10% that makes UI feel finished",
      situation: "Our component library looked fine but failed real accessibility audits",
      action: "I led a focused sprint on focus management, ARIA, and keyboard paths",
      result: "we went from about 20 audit failures to zero and kept it there with CI checks",
      themes: ["accessibility", "attention to detail", "tooling"],
      synthesis: "I think polish and accessibility are the same discipline, not extras",
      seeking: "a team that treats front-end craft as a first-class engineering concern",
      closingQuestion: "How does your org keep quality from eroding as it scales?",
      sourceQuestionId: "ipq8",
    },
    {
      id: "ep5", name: "LinkedIn message", setting: "Cold-ish DM to a hiring manager; written, three short lines",
      who: "Hiring manager", personName: "Priya", role: "Engineering Manager",
      identity: "a full-stack engineer who prototypes in code and cares about the user",
      situation: "I saw your team is rebuilding the dashboard experience",
      action: "I did exactly that at my current company — design, build, and measure",
      result: "engagement on the new dashboard is up 25% quarter over quarter",
      themes: ["initiative", "product engineering", "data"],
      synthesis: "I'd rather build the thing and learn from real usage than debate it",
      seeking: "a conversation about the dashboard role on your team",
      closingQuestion: "Would you be open to a short call this week or next?",
      sourceQuestionId: "ipq19",
    },
  ];

  return { companies, contacts: SEED_CONTACTS, applications, networkingEvents, elevatorPitchVersions };
}

const INTERVIEW_PREP_QUESTIONS: Seed["interviewPrepQuestions"] = [
    // Ownership & Ambiguity
    { id: "ipq1", category: "behavioral", section: "Ownership & Ambiguity", question: "Tell me about a time you owned a project end-to-end with minimal direction.", answer: "", starred: false },
    { id: "ipq2", category: "behavioral", section: "Ownership & Ambiguity", question: "Describe a situation where the requirements were unclear or kept changing. How did you handle it?", answer: "", starred: false },
    { id: "ipq3", category: "behavioral", section: "Ownership & Ambiguity", question: "Tell me about a time you identified a problem nobody had asked you to solve.", answer: "", starred: false },
    { id: "ipq4", category: "behavioral", section: "Ownership & Ambiguity", question: "Describe a project where you had to make a call without full information.", answer: "", starred: false },
    // Product & Design Sensibility
    { id: "ipq5", category: "behavioral", section: "Product & Design Sensibility", question: "Tell me about a time you pushed back on a design or product decision for technical or UX reasons.", answer: "", starred: false },
    { id: "ipq6", category: "behavioral", section: "Product & Design Sensibility", question: "Describe a time you noticed a UX problem during implementation that design/PM had missed.", answer: "", starred: false },
    { id: "ipq7", category: "behavioral", section: "Product & Design Sensibility", question: "Tell me about a feature you shipped where you had strong opinions about the user experience, not just the code.", answer: "", starred: false },
    { id: "ipq8", category: "behavioral", section: "Product & Design Sensibility", question: "Walk me through a time you had to balance pixel-perfect design fidelity against engineering constraints or timelines.", answer: "", starred: false },
    { id: "ipq9", category: "behavioral", section: "Product & Design Sensibility", question: "Tell me about a time you advocated for the user in a room full of stakeholders focused on business metrics.", answer: "", starred: false },
    // Cross-Functional Collaboration
    { id: "ipq10", category: "behavioral", section: "Cross-Functional Collaboration", question: "Tell me about a time you disagreed with a designer or PM. How did you resolve it?", answer: "", starred: false },
    { id: "ipq11", category: "behavioral", section: "Cross-Functional Collaboration", question: "Describe your working relationship with design — how do you collaborate day to day?", answer: "", starred: false },
    { id: "ipq12", category: "behavioral", section: "Cross-Functional Collaboration", question: "Tell me about a time you had to translate a vague product ask into a concrete technical plan.", answer: "", starred: false },
    { id: "ipq13", category: "behavioral", section: "Cross-Functional Collaboration", question: "Describe a time you had to say no to a stakeholder's request.", answer: "", starred: false },
    { id: "ipq14", category: "behavioral", section: "Cross-Functional Collaboration", question: "Tell me about a time you built trust with a non-technical partner (PM, designer, exec).", answer: "", starred: false },
    // Technical Decision-Making & Tradeoffs
    { id: "ipq15", category: "behavioral", section: "Technical Decision-Making & Tradeoffs", question: "Tell me about a significant architectural decision you made. What tradeoffs did you weigh?", answer: "", starred: false },
    { id: "ipq16", category: "behavioral", section: "Technical Decision-Making & Tradeoffs", question: "Describe a time you chose a simpler solution over a more \"correct\" one (or vice versa) — why?", answer: "", starred: false },
    { id: "ipq17", category: "behavioral", section: "Technical Decision-Making & Tradeoffs", question: "Tell me about a time you had to make a build-vs-buy or adopt-a-new-tool decision.", answer: "", starred: false },
    { id: "ipq18", category: "behavioral", section: "Technical Decision-Making & Tradeoffs", question: "Describe a time your technical decision was later proven wrong. What did you do?", answer: "", starred: false },
    { id: "ipq19", category: "behavioral", section: "Technical Decision-Making & Tradeoffs", question: "Tell me about a time you introduced a new tool, pattern, or process (e.g., AI-assisted workflow) to your team.", answer: "", starred: false },
    // Conflict & Disagreement
    { id: "ipq20", category: "behavioral", section: "Conflict & Disagreement", question: "Tell me about a time you disagreed with your manager or tech lead.", answer: "", starred: false },
    { id: "ipq21", category: "behavioral", section: "Conflict & Disagreement", question: "Describe a conflict with a peer engineer and how it was resolved.", answer: "", starred: false },
    { id: "ipq22", category: "behavioral", section: "Conflict & Disagreement", question: "Tell me about a time you had to give difficult feedback to someone.", answer: "", starred: false },
    { id: "ipq23", category: "behavioral", section: "Conflict & Disagreement", question: "Describe a time you were on the losing side of a technical debate. How did you handle it?", answer: "", starred: false },
    // Failure & Mistakes
    { id: "ipq24", category: "behavioral", section: "Failure & Mistakes", question: "Tell me about a time you shipped a bug that impacted users or the business.", answer: "", starred: false },
    { id: "ipq25", category: "behavioral", section: "Failure & Mistakes", question: "Describe your biggest professional failure and what you learned.", answer: "", starred: false },
    { id: "ipq26", category: "behavioral", section: "Failure & Mistakes", question: "Tell me about a time you missed a deadline. What happened?", answer: "", starred: false },
    { id: "ipq27", category: "behavioral", section: "Failure & Mistakes", question: "Describe a time you had to admit you were wrong publicly (to your team or leadership).", answer: "", starred: false },
    // Leadership & Influence (without authority)
    { id: "ipq28", category: "behavioral", section: "Leadership & Influence (without authority)", question: "Tell me about a time you led a project without formal authority over the people involved.", answer: "", starred: false },
    { id: "ipq29", category: "behavioral", section: "Leadership & Influence (without authority)", question: "Describe how you've mentored a junior engineer.", answer: "", starred: false },
    { id: "ipq30", category: "behavioral", section: "Leadership & Influence (without authority)", question: "Tell me about a time you drove alignment across a team that initially disagreed with your approach.", answer: "", starred: false },
    { id: "ipq31", category: "behavioral", section: "Leadership & Influence (without authority)", question: "Describe a time you had to influence a decision above your level.", answer: "", starred: false },
    // Prioritization & Scope
    { id: "ipq32", category: "behavioral", section: "Prioritization & Scope", question: "Tell me about a time you had to cut scope under a deadline. How did you decide what to cut?", answer: "", starred: false },
    { id: "ipq33", category: "behavioral", section: "Prioritization & Scope", question: "Describe how you prioritize when everything feels urgent.", answer: "", starred: false },
    { id: "ipq34", category: "behavioral", section: "Prioritization & Scope", question: "Tell me about a time you said no to a \"quick\" request that wasn't actually quick.", answer: "", starred: false },
    // Growth & Motivation
    { id: "ipq35", category: "behavioral", section: "Growth & Motivation", question: "Why are you interested in design engineering / full-stack product engineering specifically?", answer: "", starred: false },
    { id: "ipq36", category: "behavioral", section: "Growth & Motivation", question: "Tell me about a time you taught yourself a new skill or technology to solve a problem.", answer: "", starred: false },
    { id: "ipq37", category: "behavioral", section: "Growth & Motivation", question: "Describe how your role or skill set has evolved over the last few years.", answer: "", starred: false },
    { id: "ipq38", category: "behavioral", section: "Growth & Motivation", question: "What's a piece of feedback that changed how you work?", answer: "", starred: false },
    // Curveballs Common at Senior Level
    { id: "ipq39", category: "behavioral", section: "Curveballs Common at Senior Level", question: "Tell me about a time you had to say \"I don't know\" to a stakeholder.", answer: "", starred: false },
    { id: "ipq40", category: "behavioral", section: "Curveballs Common at Senior Level", question: "Describe a time you scaled yourself out of a task by delegating or documenting.", answer: "", starred: false },
    { id: "ipq41", category: "behavioral", section: "Curveballs Common at Senior Level", question: "Tell me about a time you challenged the status quo on your team's process or tooling.", answer: "", starred: false },
    { id: "ipq42", category: "behavioral", section: "Curveballs Common at Senior Level", question: "Describe a time your work was misunderstood or undervalued. How did you handle it?", answer: "", starred: false },

    // Background & Motivation
    { id: "ipq43", category: "recruiter_screening", section: "Background & Motivation", question: "Walk me through your resume.", answer: "", starred: false },
    { id: "ipq44", category: "recruiter_screening", section: "Background & Motivation", question: "Why are you looking to leave your current role?", answer: "", starred: false },
    { id: "ipq45", category: "recruiter_screening", section: "Background & Motivation", question: "Why are you interested in this role and company specifically?", answer: "", starred: false },
    { id: "ipq46", category: "recruiter_screening", section: "Background & Motivation", question: "What are you looking for in your next role that you're not getting now?", answer: "", starred: false },
    // Logistics & Availability
    { id: "ipq47", category: "recruiter_screening", section: "Logistics & Availability", question: "What's your notice period, or how soon could you start?", answer: "", starred: false },
    { id: "ipq48", category: "recruiter_screening", section: "Logistics & Availability", question: "Are you authorized to work in this country without visa sponsorship, now or in the future?", answer: "", starred: false },
    { id: "ipq49", category: "recruiter_screening", section: "Logistics & Availability", question: "What's your preference on remote, hybrid, or onsite work?", answer: "", starred: false },
    // Compensation & Process
    { id: "ipq50", category: "recruiter_screening", section: "Compensation & Process", question: "What compensation range are you targeting for this role?", answer: "", starred: false },
    { id: "ipq51", category: "recruiter_screening", section: "Compensation & Process", question: "Are you interviewing elsewhere, and what's your timeline?", answer: "", starred: false },
    { id: "ipq52", category: "recruiter_screening", section: "Compensation & Process", question: "Do you have any questions for me about the role or company?", answer: "", starred: false },
];

/**
 * Structurally complete seed with broad coverage — every application status and
 * company status appears at least five times, alongside a full spread of
 * interview types/styles, work arrangements, resume types, referrals, follow-ups,
 * feedback, networking events, and elevator-pitch versions.
 */
export const defaultSeed: Seed = {
  ...buildSeedRecords(),
  goals: {
    salaryMin: 120000,
    salaryMax: 150000,
    applicationsPerWeekTarget: 5,
    targetOfferDate: "Aug 15, 2026",
  },
  userProfile: { name: "haileyyycodes" },
  interviewCategories: ["Behavioral", "DSA/Leetcode", "System Design", "AI/ML", "Take-home/Practical", "Other"],
  interviewPrepQuestions: INTERVIEW_PREP_QUESTIONS,
};
