import initSqlJs, { type BindParams, type Database } from "sql.js";
import type { ApplicationStatus, Feedback, ReminderRule } from "@/lib/types";
import { SCHEMA_SQL } from "./schema";
import { defaultSeed, type Seed } from "./seed";
import {
  RestrictedDeleteError,
  type DataSource,
  type DsApplication,
  type DsCompany,
  type DsContact,
  type DsFollowUp,
  type DsGoals,
  type DsInterview,
  type DsInterviewPrepQuestion,
  type DsNetworkingEvent,
  type DsTask,
  type DsUserProfile,
  type NewApplication,
  type NewCompany,
  type NewContact,
  type NewFollowUp,
  type NewInterview,
  type NewInterviewPrepQuestion,
  type NewNetworkingEvent,
  type NewTask,
} from "./types";

function isForeignKeyError(err: unknown): boolean {
  return err instanceof Error && /FOREIGN KEY constraint failed/i.test(err.message);
}

function all<T>(db: Database, sql: string, params: BindParams = []): T[] {
  const stmt = db.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) rows.push(stmt.getAsObject() as T);
  stmt.free();
  return rows;
}

function one<T>(db: Database, sql: string, params: BindParams = []): T | undefined {
  return all<T>(db, sql, params)[0];
}

function lastInsertId(db: Database): number {
  return one<{ id: number }>(db, "SELECT last_insert_rowid() as id")!.id;
}

function bool(v: boolean): number {
  return v ? 1 : 0;
}

// ---- row shapes (snake_case, SQLite-native types) ----

interface CompanyRow {
  id: number;
  name: string;
  is_target: number;
  status: string;
  industry: string | null;
  website: string | null;
  notes: string;
}
interface LocationRow {
  id: number;
  company_id: number;
  city: string;
  state: string;
}
interface ContactRow {
  id: number;
  name: string;
  email: string | null;
  phone: string | null;
  linked_in_url: string | null;
  website: string | null;
  company_id: number | null;
  role: string | null;
  notes: string;
}
interface ApplicationRow {
  id: number;
  company_id: number;
  role: string;
  date_applied: string;
  link: string;
  job_description: string;
  referral: number;
  referred_by_contact_id: number | null;
  resume_type: string;
  cover_letter_submitted: number;
  notes: string;
  status: string;
  logo: string;
  salary_min: number | null;
  salary_max: number | null;
  work_arrangement: string | null;
  city: string | null;
  state: string | null;
  feedback_text: string | null;
  feedback_date: string | null;
}
interface InterviewRow {
  id: number;
  application_id: number;
  type: string;
  date: string;
  style: string | null;
  categories: string | null;
  questions_asked: string | null;
  notes: string;
}
interface FollowUpRow {
  id: number;
  application_id: number;
  date: string;
  contact_id: number;
  notes: string;
}
interface StatusHistoryRow {
  id: number;
  application_id: number;
  status: string;
  at: string;
}
interface TaskRow {
  id: number;
  application_id: number;
  due_date: string;
  note: string;
  status: string;
  reminder_rule_type: string | null;
  reminder_rule_days: number | null;
}
interface NetworkingEventRow {
  id: number;
  type: string;
  date: string;
  application_id: number | null;
  notes: string;
}
interface GoalsRow {
  salary_min: number | null;
  salary_max: number | null;
  applications_per_week_target: number | null;
  target_offer_date: string | null;
}
interface UserProfileRow {
  name: string;
}
interface InterviewPrepQuestionRow {
  id: number;
  category: string;
  section: string | null;
  question: string;
  answer: string;
}

// ---- row -> Ds* mappers ----

function mapCompany(row: CompanyRow, locations: LocationRow[]): DsCompany {
  return {
    id: row.id,
    name: row.name,
    isTarget: !!row.is_target,
    status: row.status as DsCompany["status"],
    industry: row.industry ?? undefined,
    website: row.website ?? undefined,
    locations: locations.map((l) => ({ city: l.city, state: l.state })),
    notes: row.notes,
  };
}

function mapContact(row: ContactRow): DsContact {
  return {
    id: row.id,
    name: row.name,
    email: row.email ?? undefined,
    phone: row.phone ?? undefined,
    linkedInUrl: row.linked_in_url ?? undefined,
    website: row.website ?? undefined,
    companyId: row.company_id ?? undefined,
    role: row.role ?? undefined,
    notes: row.notes,
  };
}

function mapInterview(row: InterviewRow): DsInterview {
  return {
    id: row.id,
    type: row.type as DsInterview["type"],
    date: row.date,
    style: (row.style as DsInterview["style"]) ?? undefined,
    categories: row.categories ? (JSON.parse(row.categories) as string[]) : undefined,
    questionsAsked: row.questions_asked ?? undefined,
    notes: row.notes,
  };
}

function mapFollowUp(row: FollowUpRow): DsFollowUp {
  return { id: row.id, date: row.date, contactId: row.contact_id, notes: row.notes };
}

function mapInterviewPrepQuestion(row: InterviewPrepQuestionRow): DsInterviewPrepQuestion {
  return {
    id: row.id,
    category: row.category,
    section: row.section ?? undefined,
    question: row.question,
    answer: row.answer,
  };
}

function mapTask(row: TaskRow): DsTask {
  const reminderRule: ReminderRule | undefined =
    row.reminder_rule_type === "days_after_applied"
      ? { type: "days_after_applied", days: row.reminder_rule_days! }
      : row.reminder_rule_type === "manual"
        ? { type: "manual" }
        : undefined;
  return {
    id: row.id,
    applicationId: row.application_id,
    dueDate: row.due_date,
    note: row.note,
    status: row.status as DsTask["status"],
    reminderRule,
  };
}

function mapApplication(
  row: ApplicationRow,
  interviews: InterviewRow[],
  followUps: FollowUpRow[],
  statusHistory: StatusHistoryRow[]
): DsApplication {
  return {
    id: row.id,
    companyId: row.company_id,
    role: row.role,
    dateApplied: row.date_applied,
    link: row.link,
    jobDescription: row.job_description,
    referral: !!row.referral,
    referredByContactId: row.referred_by_contact_id ?? undefined,
    resumeType: row.resume_type as DsApplication["resumeType"],
    coverLetterSubmitted: !!row.cover_letter_submitted,
    notes: row.notes,
    status: row.status as ApplicationStatus,
    logo: row.logo,
    salaryMin: row.salary_min ?? undefined,
    salaryMax: row.salary_max ?? undefined,
    workArrangement: (row.work_arrangement as DsApplication["workArrangement"]) ?? undefined,
    city: row.city ?? undefined,
    state: row.state ?? undefined,
    feedback: row.feedback_text != null && row.feedback_date != null ? { text: row.feedback_text, date: row.feedback_date } : undefined,
    statusHistory: statusHistory.map((s) => ({ status: s.status as ApplicationStatus, at: s.at })),
    interviews: interviews.map(mapInterview),
    followUps: followUps.map(mapFollowUp),
  };
}

/**
 * SQLite compiled to WebAssembly (sql.js), running entirely in the browser
 * tab — real SQL, real foreign-key enforcement (PRAGMA foreign_keys = ON),
 * in-memory only. Used for the portfolio demo: seeded on construction,
 * nothing persisted, a refresh starts over.
 */
export class WasmDataSource implements DataSource {
  private ready: Promise<Database>;

  /**
   * `locateFile` defaults to the browser path (served from the checked-in
   * public/sql-wasm-browser.wasm — sql.js's browser build asks for that
   * filename specifically, not sql-wasm.wasm). Tests
   * override it with a filesystem path, since sql.js resolves it via
   * `fs.readFileSync` under Node instead of `fetch`.
   */
  constructor(seed: Seed = defaultSeed, locateFile: (file: string) => string = (file) => `/${file}`) {
    this.ready = this.init(seed, locateFile);
  }

  private async init(seed: Seed, locateFile: (file: string) => string): Promise<Database> {
    const SQL = await initSqlJs({ locateFile });
    const db = new SQL.Database();
    db.run("PRAGMA foreign_keys = ON;");
    db.run(SCHEMA_SQL);
    this.loadSeed(db, seed);
    return db;
  }

  private loadSeed(db: Database, seed: Seed): void {
    const companyIdMap = new Map<string, number>();
    for (const c of seed.companies) {
      db.run("INSERT INTO companies (name, is_target, status, industry, website, notes) VALUES (?, ?, ?, ?, ?, ?)", [
        c.name,
        bool(c.isTarget),
        c.status,
        c.industry ?? null,
        c.website ?? null,
        c.notes,
      ]);
      const id = lastInsertId(db);
      companyIdMap.set(c.id, id);
      for (const loc of c.locations) {
        db.run("INSERT INTO company_locations (company_id, city, state) VALUES (?, ?, ?)", [id, loc.city, loc.state]);
      }
    }

    const contactIdMap = new Map<string, number>();
    for (const c of seed.contacts) {
      db.run(
        "INSERT INTO contacts (name, email, phone, linked_in_url, website, company_id, role, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
        [
          c.name,
          c.email ?? null,
          c.phone ?? null,
          c.linkedInUrl ?? null,
          c.website ?? null,
          c.companyId !== undefined ? companyIdMap.get(c.companyId)! : null,
          c.role ?? null,
          c.notes,
        ]
      );
      contactIdMap.set(c.id, lastInsertId(db));
    }

    const applicationIdMap = new Map<string, number>();
    for (const a of seed.applications) {
      db.run(
        `INSERT INTO applications
          (company_id, role, date_applied, link, job_description, referral, referred_by_contact_id, resume_type,
           cover_letter_submitted, notes, status, logo, salary_min, salary_max, work_arrangement, city, state,
           feedback_text, feedback_date)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          companyIdMap.get(a.companyId)!,
          a.role,
          a.dateApplied,
          a.link,
          a.jobDescription,
          bool(a.referral),
          a.referredByContactId !== undefined ? contactIdMap.get(a.referredByContactId)! : null,
          a.resumeType,
          bool(a.coverLetterSubmitted),
          a.notes,
          a.status,
          a.logo,
          a.salaryMin ?? null,
          a.salaryMax ?? null,
          a.workArrangement ?? null,
          a.city ?? null,
          a.state ?? null,
          a.feedback?.text ?? null,
          a.feedback?.date ?? null,
        ]
      );
      const appId = lastInsertId(db);
      applicationIdMap.set(a.id, appId);
      for (const s of a.statusHistory) {
        db.run("INSERT INTO status_history (application_id, status, at) VALUES (?, ?, ?)", [appId, s.status, s.at]);
      }
      for (const iv of a.interviews) {
        db.run(
          "INSERT INTO interviews (application_id, type, date, style, categories, questions_asked, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
          [
            appId,
            iv.type,
            iv.date,
            iv.style ?? null,
            iv.categories ? JSON.stringify(iv.categories) : null,
            iv.questionsAsked ?? null,
            iv.notes,
          ]
        );
      }
      for (const fu of a.followUps) {
        db.run("INSERT INTO follow_ups (application_id, date, contact_id, notes) VALUES (?, ?, ?, ?)", [
          appId,
          fu.date,
          contactIdMap.get(fu.contactId)!,
          fu.notes,
        ]);
      }
    }

    for (const t of seed.tasks) {
      db.run(
        "INSERT INTO tasks (application_id, due_date, note, status, reminder_rule_type, reminder_rule_days) VALUES (?, ?, ?, ?, ?, ?)",
        [
          applicationIdMap.get(t.applicationId)!,
          t.dueDate,
          t.note,
          t.status,
          t.reminderRule?.type ?? null,
          t.reminderRule?.type === "days_after_applied" ? t.reminderRule.days : null,
        ]
      );
    }

    for (const e of seed.networkingEvents) {
      db.run("INSERT INTO networking_events (type, date, application_id, notes) VALUES (?, ?, ?, ?)", [
        e.type,
        e.date,
        e.applicationId !== undefined ? applicationIdMap.get(e.applicationId)! : null,
        e.notes,
      ]);
      const eventId = lastInsertId(db);
      for (const contactId of e.contactIds) {
        db.run("INSERT INTO networking_event_contacts (event_id, contact_id) VALUES (?, ?)", [
          eventId,
          contactIdMap.get(contactId)!,
        ]);
      }
    }

    if (seed.goals.salaryMin !== undefined || seed.goals.salaryMax !== undefined || seed.goals.applicationsPerWeekTarget !== undefined || seed.goals.targetOfferDate !== undefined) {
      db.run(
        "UPDATE goals SET salary_min = ?, salary_max = ?, applications_per_week_target = ?, target_offer_date = ? WHERE id = 1",
        [
          seed.goals.salaryMin ?? null,
          seed.goals.salaryMax ?? null,
          seed.goals.applicationsPerWeekTarget ?? null,
          seed.goals.targetOfferDate ?? null,
        ]
      );
    }

    for (const category of seed.interviewCategories) {
      db.run("INSERT INTO interview_categories (name) VALUES (?)", [category]);
    }

    db.run("UPDATE user_profile SET name = ? WHERE id = 1", [seed.userProfile.name]);

    for (const q of seed.interviewPrepQuestions) {
      db.run("INSERT INTO interview_prep_questions (category, section, question, answer) VALUES (?, ?, ?, ?)", [
        q.category,
        q.section ?? null,
        q.question,
        q.answer,
      ]);
    }
  }

  // ---- composition helpers ----

  private composeApplication(db: Database, row: ApplicationRow): DsApplication {
    const interviews = all<InterviewRow>(db, "SELECT * FROM interviews WHERE application_id = ? ORDER BY id", [row.id]);
    const followUps = all<FollowUpRow>(db, "SELECT * FROM follow_ups WHERE application_id = ? ORDER BY id", [row.id]);
    const statusHistory = all<StatusHistoryRow>(db, "SELECT * FROM status_history WHERE application_id = ? ORDER BY id", [
      row.id,
    ]);
    return mapApplication(row, interviews, followUps, statusHistory);
  }

  private composeCompany(db: Database, row: CompanyRow): DsCompany {
    const locations = all<LocationRow>(db, "SELECT * FROM company_locations WHERE company_id = ? ORDER BY id", [row.id]);
    return mapCompany(row, locations);
  }

  private composeNetworkingEvent(db: Database, row: NetworkingEventRow): DsNetworkingEvent {
    const links = all<{ contact_id: number }>(
      db,
      "SELECT contact_id FROM networking_event_contacts WHERE event_id = ? ORDER BY id",
      [row.id]
    );
    return {
      id: row.id,
      type: row.type,
      date: row.date,
      applicationId: row.application_id ?? undefined,
      notes: row.notes,
      contactIds: links.map((l) => l.contact_id),
    };
  }

  private requireRow<T>(db: Database, sql: string, id: number, label: string): T {
    const row = one<T>(db, sql, [id]);
    if (!row) throw new Error(`${label} ${id} not found`);
    return row;
  }

  // ---- applications ----

  async getApplications(): Promise<DsApplication[]> {
    const db = await this.ready;
    return all<ApplicationRow>(db, "SELECT * FROM applications ORDER BY id").map((row) => this.composeApplication(db, row));
  }

  async createApplication(app: NewApplication): Promise<DsApplication> {
    const db = await this.ready;
    db.run(
      `INSERT INTO applications
        (company_id, role, date_applied, link, job_description, referral, referred_by_contact_id, resume_type,
         cover_letter_submitted, notes, status, logo, salary_min, salary_max, work_arrangement, city, state)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        app.companyId,
        app.role,
        app.dateApplied,
        app.link,
        app.jobDescription,
        bool(app.referral),
        app.referredByContactId ?? null,
        app.resumeType,
        bool(app.coverLetterSubmitted),
        app.notes,
        app.status,
        app.logo,
        app.salaryMin ?? null,
        app.salaryMax ?? null,
        app.workArrangement ?? null,
        app.city ?? null,
        app.state ?? null,
      ]
    );
    const id = lastInsertId(db);
    for (const entry of app.statusHistory) {
      db.run("INSERT INTO status_history (application_id, status, at) VALUES (?, ?, ?)", [id, entry.status, entry.at]);
    }
    const row = this.requireRow<ApplicationRow>(db, "SELECT * FROM applications WHERE id = ?", id, "Application");
    return this.composeApplication(db, row);
  }

  async editApplication(app: DsApplication): Promise<void> {
    const db = await this.ready;
    db.run(
      `UPDATE applications SET company_id = ?, role = ?, date_applied = ?, link = ?, job_description = ?, referral = ?,
        referred_by_contact_id = ?, resume_type = ?, cover_letter_submitted = ?, notes = ?, status = ?, logo = ?,
        salary_min = ?, salary_max = ?, work_arrangement = ?, city = ?, state = ?, feedback_text = ?, feedback_date = ?
       WHERE id = ?`,
      [
        app.companyId,
        app.role,
        app.dateApplied,
        app.link,
        app.jobDescription,
        bool(app.referral),
        app.referredByContactId ?? null,
        app.resumeType,
        bool(app.coverLetterSubmitted),
        app.notes,
        app.status,
        app.logo,
        app.salaryMin ?? null,
        app.salaryMax ?? null,
        app.workArrangement ?? null,
        app.city ?? null,
        app.state ?? null,
        app.feedback?.text ?? null,
        app.feedback?.date ?? null,
        app.id,
      ]
    );
  }

  async updateApplicationStatus(id: number, status: ApplicationStatus, at: string): Promise<void> {
    const db = await this.ready;
    db.run("UPDATE applications SET status = ? WHERE id = ?", [status, id]);
    db.run("INSERT INTO status_history (application_id, status, at) VALUES (?, ?, ?)", [id, status, at]);
  }

  async deleteApplication(id: number): Promise<void> {
    const db = await this.ready;
    db.run("DELETE FROM applications WHERE id = ?", [id]);
  }

  async saveFeedback(appId: number, feedback: Feedback): Promise<void> {
    const db = await this.ready;
    db.run("UPDATE applications SET feedback_text = ?, feedback_date = ? WHERE id = ?", [feedback.text, feedback.date, appId]);
  }

  // ---- interviews ----

  async logInterview(appId: number, interview: NewInterview): Promise<DsInterview> {
    const db = await this.ready;
    db.run(
      "INSERT INTO interviews (application_id, type, date, style, categories, questions_asked, notes) VALUES (?, ?, ?, ?, ?, ?, ?)",
      [
        appId,
        interview.type,
        interview.date,
        interview.style ?? null,
        interview.categories ? JSON.stringify(interview.categories) : null,
        interview.questionsAsked ?? null,
        interview.notes,
      ]
    );
    const id = lastInsertId(db);
    return mapInterview(this.requireRow<InterviewRow>(db, "SELECT * FROM interviews WHERE id = ?", id, "Interview"));
  }

  async editInterview(appId: number, interviewId: number, updates: NewInterview): Promise<void> {
    const db = await this.ready;
    db.run(
      "UPDATE interviews SET type = ?, date = ?, style = ?, categories = ?, questions_asked = ?, notes = ? WHERE id = ? AND application_id = ?",
      [
        updates.type,
        updates.date,
        updates.style ?? null,
        updates.categories ? JSON.stringify(updates.categories) : null,
        updates.questionsAsked ?? null,
        updates.notes,
        interviewId,
        appId,
      ]
    );
  }

  async deleteInterview(appId: number, interviewId: number): Promise<void> {
    const db = await this.ready;
    db.run("DELETE FROM interviews WHERE id = ? AND application_id = ?", [interviewId, appId]);
  }

  // ---- follow-ups ----

  async logFollowUp(appId: number, followUp: NewFollowUp): Promise<DsFollowUp> {
    const db = await this.ready;
    try {
      db.run("INSERT INTO follow_ups (application_id, date, contact_id, notes) VALUES (?, ?, ?, ?)", [
        appId,
        followUp.date,
        followUp.contactId,
        followUp.notes,
      ]);
    } catch (err) {
      if (isForeignKeyError(err)) throw new Error(`Contact ${followUp.contactId} not found`);
      throw err;
    }
    const id = lastInsertId(db);
    return mapFollowUp(this.requireRow<FollowUpRow>(db, "SELECT * FROM follow_ups WHERE id = ?", id, "FollowUp"));
  }

  async deleteFollowUp(appId: number, followUpId: number): Promise<void> {
    const db = await this.ready;
    db.run("DELETE FROM follow_ups WHERE id = ? AND application_id = ?", [followUpId, appId]);
  }

  // ---- tasks ----

  async getTasks(): Promise<DsTask[]> {
    const db = await this.ready;
    return all<TaskRow>(db, "SELECT * FROM tasks ORDER BY id").map(mapTask);
  }

  async addTask(task: NewTask): Promise<DsTask> {
    const db = await this.ready;
    db.run("INSERT INTO tasks (application_id, due_date, note, status, reminder_rule_type, reminder_rule_days) VALUES (?, ?, ?, 'active', ?, ?)", [
      task.applicationId,
      task.dueDate,
      task.note,
      task.reminderRule?.type ?? null,
      task.reminderRule?.type === "days_after_applied" ? task.reminderRule.days : null,
    ]);
    const id = lastInsertId(db);
    return mapTask(this.requireRow<TaskRow>(db, "SELECT * FROM tasks WHERE id = ?", id, "Task"));
  }

  async dismissTask(id: number): Promise<void> {
    const db = await this.ready;
    db.run("UPDATE tasks SET status = 'dismissed' WHERE id = ?", [id]);
  }

  async deleteTask(id: number): Promise<void> {
    const db = await this.ready;
    db.run("DELETE FROM tasks WHERE id = ?", [id]);
  }

  // ---- companies ----

  async getCompanies(): Promise<DsCompany[]> {
    const db = await this.ready;
    return all<CompanyRow>(db, "SELECT * FROM companies ORDER BY id").map((row) => this.composeCompany(db, row));
  }

  async createCompany(company: NewCompany): Promise<DsCompany> {
    const db = await this.ready;
    db.run("INSERT INTO companies (name, is_target, status, industry, website, notes) VALUES (?, ?, ?, ?, ?, ?)", [
      company.name,
      bool(company.isTarget),
      company.status,
      company.industry ?? null,
      company.website ?? null,
      company.notes,
    ]);
    const id = lastInsertId(db);
    for (const loc of company.locations ?? []) {
      db.run("INSERT INTO company_locations (company_id, city, state) VALUES (?, ?, ?)", [id, loc.city, loc.state]);
    }
    const row = this.requireRow<CompanyRow>(db, "SELECT * FROM companies WHERE id = ?", id, "Company");
    return this.composeCompany(db, row);
  }

  async editCompany(company: DsCompany): Promise<void> {
    const db = await this.ready;
    db.run("UPDATE companies SET name = ?, is_target = ?, status = ?, industry = ?, website = ?, notes = ? WHERE id = ?", [
      company.name,
      bool(company.isTarget),
      company.status,
      company.industry ?? null,
      company.website ?? null,
      company.notes,
      company.id,
    ]);
    db.run("DELETE FROM company_locations WHERE company_id = ?", [company.id]);
    for (const loc of company.locations) {
      db.run("INSERT INTO company_locations (company_id, city, state) VALUES (?, ?, ?)", [company.id, loc.city, loc.state]);
    }
  }

  async deleteCompany(id: number): Promise<void> {
    const db = await this.ready;
    try {
      db.run("DELETE FROM companies WHERE id = ?", [id]);
    } catch (err) {
      if (isForeignKeyError(err)) {
        const count = one<{ n: number }>(db, "SELECT COUNT(*) as n FROM applications WHERE company_id = ?", [id])!.n;
        throw new RestrictedDeleteError(`Cannot delete company ${id}: ${count} application(s) still reference it.`);
      }
      throw err;
    }
  }

  async toggleTarget(id: number): Promise<void> {
    const db = await this.ready;
    db.run("UPDATE companies SET is_target = NOT is_target WHERE id = ?", [id]);
  }

  // ---- contacts ----

  async getContacts(): Promise<DsContact[]> {
    const db = await this.ready;
    return all<ContactRow>(db, "SELECT * FROM contacts ORDER BY id").map(mapContact);
  }

  async createContact(contact: NewContact): Promise<DsContact> {
    const db = await this.ready;
    db.run(
      "INSERT INTO contacts (name, email, phone, linked_in_url, website, company_id, role, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        contact.name,
        contact.email ?? null,
        contact.phone ?? null,
        contact.linkedInUrl ?? null,
        contact.website ?? null,
        contact.companyId ?? null,
        contact.role ?? null,
        contact.notes,
      ]
    );
    const id = lastInsertId(db);
    return mapContact(this.requireRow<ContactRow>(db, "SELECT * FROM contacts WHERE id = ?", id, "Contact"));
  }

  async editContact(contact: DsContact): Promise<void> {
    const db = await this.ready;
    db.run(
      "UPDATE contacts SET name = ?, email = ?, phone = ?, linked_in_url = ?, website = ?, company_id = ?, role = ?, notes = ? WHERE id = ?",
      [
        contact.name,
        contact.email ?? null,
        contact.phone ?? null,
        contact.linkedInUrl ?? null,
        contact.website ?? null,
        contact.companyId ?? null,
        contact.role ?? null,
        contact.notes,
        contact.id,
      ]
    );
  }

  async deleteContact(id: number): Promise<void> {
    const db = await this.ready;
    try {
      db.run("DELETE FROM contacts WHERE id = ?", [id]);
    } catch (err) {
      if (isForeignKeyError(err)) {
        const count = one<{ n: number }>(db, "SELECT COUNT(*) as n FROM follow_ups WHERE contact_id = ?", [id])!.n;
        throw new RestrictedDeleteError(`Cannot delete contact ${id}: ${count} follow-up(s) still reference it.`);
      }
      throw err;
    }
  }

  // ---- networking events ----

  async getNetworkingEvents(): Promise<DsNetworkingEvent[]> {
    const db = await this.ready;
    return all<NetworkingEventRow>(db, "SELECT * FROM networking_events ORDER BY id").map((row) =>
      this.composeNetworkingEvent(db, row)
    );
  }

  async addNetworkingEvent(event: NewNetworkingEvent): Promise<DsNetworkingEvent> {
    const db = await this.ready;
    db.run("INSERT INTO networking_events (type, date, application_id, notes) VALUES (?, ?, ?, ?)", [
      event.type,
      event.date,
      event.applicationId ?? null,
      event.notes,
    ]);
    const id = lastInsertId(db);
    try {
      for (const contactId of event.contactIds) {
        db.run("INSERT INTO networking_event_contacts (event_id, contact_id) VALUES (?, ?)", [id, contactId]);
      }
    } catch (err) {
      db.run("DELETE FROM networking_events WHERE id = ?", [id]);
      throw err;
    }
    const row = this.requireRow<NetworkingEventRow>(db, "SELECT * FROM networking_events WHERE id = ?", id, "NetworkingEvent");
    return this.composeNetworkingEvent(db, row);
  }

  async deleteNetworkingEvent(id: number): Promise<void> {
    const db = await this.ready;
    db.run("DELETE FROM networking_events WHERE id = ?", [id]);
  }

  // ---- goals ----

  async getGoals(): Promise<DsGoals> {
    const db = await this.ready;
    const row = one<GoalsRow>(db, "SELECT salary_min, salary_max, applications_per_week_target, target_offer_date FROM goals WHERE id = 1")!;
    return {
      salaryMin: row.salary_min ?? undefined,
      salaryMax: row.salary_max ?? undefined,
      applicationsPerWeekTarget: row.applications_per_week_target ?? undefined,
      targetOfferDate: row.target_offer_date ?? undefined,
    };
  }

  async updateGoals(goals: DsGoals): Promise<void> {
    const db = await this.ready;
    db.run(
      "UPDATE goals SET salary_min = ?, salary_max = ?, applications_per_week_target = ?, target_offer_date = ? WHERE id = 1",
      [goals.salaryMin ?? null, goals.salaryMax ?? null, goals.applicationsPerWeekTarget ?? null, goals.targetOfferDate ?? null]
    );
  }

  // ---- user profile ----

  async getUserProfile(): Promise<DsUserProfile> {
    const db = await this.ready;
    const row = one<UserProfileRow>(db, "SELECT name FROM user_profile WHERE id = 1")!;
    return { name: row.name };
  }

  async updateUserProfile(profile: DsUserProfile): Promise<void> {
    const db = await this.ready;
    db.run("UPDATE user_profile SET name = ? WHERE id = 1", [profile.name]);
  }

  // ---- interview categories ----

  async getInterviewCategories(): Promise<string[]> {
    const db = await this.ready;
    return all<{ name: string }>(db, "SELECT name FROM interview_categories ORDER BY id").map((r) => r.name);
  }

  async addInterviewCategory(category: string): Promise<void> {
    const db = await this.ready;
    db.run("INSERT OR IGNORE INTO interview_categories (name) VALUES (?)", [category]);
  }

  // ---- interview prep questions ----

  async getInterviewPrepQuestions(): Promise<DsInterviewPrepQuestion[]> {
    const db = await this.ready;
    return all<InterviewPrepQuestionRow>(db, "SELECT * FROM interview_prep_questions ORDER BY id").map(
      mapInterviewPrepQuestion
    );
  }

  async addInterviewPrepQuestion(question: NewInterviewPrepQuestion): Promise<DsInterviewPrepQuestion> {
    const db = await this.ready;
    db.run("INSERT INTO interview_prep_questions (category, section, question, answer) VALUES (?, ?, ?, ?)", [
      question.category,
      question.section ?? null,
      question.question,
      question.answer,
    ]);
    const id = lastInsertId(db);
    return mapInterviewPrepQuestion(
      this.requireRow<InterviewPrepQuestionRow>(db, "SELECT * FROM interview_prep_questions WHERE id = ?", id, "InterviewPrepQuestion")
    );
  }

  async editInterviewPrepQuestion(question: DsInterviewPrepQuestion): Promise<void> {
    const db = await this.ready;
    db.run("UPDATE interview_prep_questions SET category = ?, section = ?, question = ?, answer = ? WHERE id = ?", [
      question.category,
      question.section ?? null,
      question.question,
      question.answer,
      question.id,
    ]);
  }

  async deleteInterviewPrepQuestion(id: number): Promise<void> {
    const db = await this.ready;
    db.run("DELETE FROM interview_prep_questions WHERE id = ?", [id]);
  }
}
