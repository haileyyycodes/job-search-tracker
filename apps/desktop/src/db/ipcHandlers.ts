import { ipcMain } from "electron";
import type Database from "better-sqlite3";
import type { ApplicationStatus, Feedback } from "../../../../packages/shared/src/lib/types";
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
} from "../../../../packages/shared/src/lib/dataSource/types";

/**
 * SQLite enforces FK actions (including RESTRICT) via internal triggers when
 * `PRAGMA foreign_keys = ON`, so violations surface as SQLITE_CONSTRAINT_TRIGGER
 * (not the seemingly-obvious SQLITE_CONSTRAINT_FOREIGNKEY) — confirmed empirically,
 * not from docs. Matching on the message is more reliable than the code here.
 */
function isForeignKeyError(err: unknown): boolean {
  return err instanceof Error && /FOREIGN KEY constraint failed/i.test(err.message);
}

function bool(v: boolean): 0 | 1 {
  return v ? 1 : 0;
}

// ---- row shapes (snake_case, SQLite-native types) — same as WasmDataSource's ----

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
  starred: number;
}
interface ElevatorPitchVersionRow {
  id: number;
  name: string;
  setting: string;
  who: string;
  person_name: string;
  role: string;
  identity: string;
  situation: string;
  action: string;
  result: string;
  themes: string;
  synthesis: string;
  seeking: string;
  closing_question: string;
  source_question_id: number | null;
}

// ---- row -> Ds* mappers (identical to WasmDataSource's — same normalized shape) ----

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
    starred: !!row.starred,
  };
}

function mapElevatorPitchVersion(row: ElevatorPitchVersionRow): DsElevatorPitchVersion {
  return {
    id: row.id,
    name: row.name,
    setting: row.setting,
    who: row.who,
    personName: row.person_name,
    role: row.role,
    identity: row.identity,
    situation: row.situation,
    action: row.action,
    result: row.result,
    themes: row.themes ? (JSON.parse(row.themes) as string[]) : [],
    synthesis: row.synthesis,
    seeking: row.seeking,
    closingQuestion: row.closing_question,
    sourceQuestionId: row.source_question_id ?? undefined,
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
    feedback:
      row.feedback_text != null && row.feedback_date != null
        ? { text: row.feedback_text, date: row.feedback_date }
        : undefined,
    statusHistory: statusHistory.map((s) => ({ status: s.status as ApplicationStatus, at: s.at })),
    interviews: interviews.map(mapInterview),
    followUps: followUps.map(mapFollowUp),
  };
}

/**
 * Real SQLite via better-sqlite3 — synchronous under the hood (wrapped in
 * `async` only to satisfy the DataSource interface), foreign keys enforced
 * natively (PRAGMA foreign_keys = ON, set by openDatabase). Starts empty on
 * first run: this is your real data, not a demo.
 */
export function createSqliteDataSource(db: Database.Database): DataSource {
  function composeApplication(row: ApplicationRow): DsApplication {
    const interviews = db
      .prepare<[number], InterviewRow>("SELECT * FROM interviews WHERE application_id = ? ORDER BY id")
      .all(row.id);
    const followUps = db
      .prepare<[number], FollowUpRow>("SELECT * FROM follow_ups WHERE application_id = ? ORDER BY id")
      .all(row.id);
    const statusHistory = db
      .prepare<[number], StatusHistoryRow>("SELECT * FROM status_history WHERE application_id = ? ORDER BY id")
      .all(row.id);
    return mapApplication(row, interviews, followUps, statusHistory);
  }

  function composeCompany(row: CompanyRow): DsCompany {
    const locations = db
      .prepare<[number], LocationRow>("SELECT * FROM company_locations WHERE company_id = ? ORDER BY id")
      .all(row.id);
    return mapCompany(row, locations);
  }

  function composeNetworkingEvent(row: NetworkingEventRow): DsNetworkingEvent {
    const links = db
      .prepare<[number], { contact_id: number }>(
        "SELECT contact_id FROM networking_event_contacts WHERE event_id = ? ORDER BY id"
      )
      .all(row.id);
    return {
      id: row.id,
      type: row.type,
      date: row.date,
      applicationId: row.application_id ?? undefined,
      notes: row.notes,
      contactIds: links.map((l) => l.contact_id),
    };
  }

  function requireRow<T>(sql: string, id: number, label: string): T {
    const row = db.prepare(sql).get(id) as T | undefined;
    if (!row) throw new Error(`${label} ${id} not found`);
    return row;
  }

  return {
    // ---- applications ----

    async getApplications() {
      return db.prepare<[], ApplicationRow>("SELECT * FROM applications ORDER BY id").all().map(composeApplication);
    },

    async createApplication(app: NewApplication) {
      const { lastInsertRowid } = db
        .prepare(
          `INSERT INTO applications
            (company_id, role, date_applied, link, job_description, referral, referred_by_contact_id, resume_type,
             cover_letter_submitted, notes, status, logo, salary_min, salary_max, work_arrangement, city, state)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
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
          app.state ?? null
        );
      const id = Number(lastInsertRowid);
      const insertStatus = db.prepare("INSERT INTO status_history (application_id, status, at) VALUES (?, ?, ?)");
      for (const entry of app.statusHistory) insertStatus.run(id, entry.status, entry.at);
      return composeApplication(requireRow<ApplicationRow>("SELECT * FROM applications WHERE id = ?", id, "Application"));
    },

    async editApplication(app: DsApplication) {
      db.prepare(
        `UPDATE applications SET company_id = ?, role = ?, date_applied = ?, link = ?, job_description = ?, referral = ?,
          referred_by_contact_id = ?, resume_type = ?, cover_letter_submitted = ?, notes = ?, status = ?, logo = ?,
          salary_min = ?, salary_max = ?, work_arrangement = ?, city = ?, state = ?, feedback_text = ?, feedback_date = ?
         WHERE id = ?`
      ).run(
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
        app.id
      );
    },

    async updateApplicationStatus(id: number, status: ApplicationStatus, at: string) {
      db.prepare("UPDATE applications SET status = ? WHERE id = ?").run(status, id);
      db.prepare("INSERT INTO status_history (application_id, status, at) VALUES (?, ?, ?)").run(id, status, at);
    },

    async deleteApplication(id: number) {
      db.prepare("DELETE FROM applications WHERE id = ?").run(id);
    },

    async saveFeedback(appId: number, feedback: Feedback) {
      db.prepare("UPDATE applications SET feedback_text = ?, feedback_date = ? WHERE id = ?").run(
        feedback.text,
        feedback.date,
        appId
      );
    },

    // ---- interviews ----

    async logInterview(appId: number, interview: NewInterview) {
      const { lastInsertRowid } = db
        .prepare(
          "INSERT INTO interviews (application_id, type, date, style, categories, questions_asked, notes) VALUES (?, ?, ?, ?, ?, ?, ?)"
        )
        .run(
          appId,
          interview.type,
          interview.date,
          interview.style ?? null,
          interview.categories ? JSON.stringify(interview.categories) : null,
          interview.questionsAsked ?? null,
          interview.notes
        );
      return mapInterview(
        requireRow<InterviewRow>("SELECT * FROM interviews WHERE id = ?", Number(lastInsertRowid), "Interview")
      );
    },

    async editInterview(appId: number, interviewId: number, updates: NewInterview) {
      db.prepare(
        "UPDATE interviews SET type = ?, date = ?, style = ?, categories = ?, questions_asked = ?, notes = ? WHERE id = ? AND application_id = ?"
      ).run(
        updates.type,
        updates.date,
        updates.style ?? null,
        updates.categories ? JSON.stringify(updates.categories) : null,
        updates.questionsAsked ?? null,
        updates.notes,
        interviewId,
        appId
      );
    },

    async deleteInterview(appId: number, interviewId: number) {
      db.prepare("DELETE FROM interviews WHERE id = ? AND application_id = ?").run(interviewId, appId);
    },

    // ---- follow-ups ----

    async logFollowUp(appId: number, followUp: NewFollowUp) {
      let lastInsertRowid: number | bigint;
      try {
        ({ lastInsertRowid } = db
          .prepare("INSERT INTO follow_ups (application_id, date, contact_id, notes) VALUES (?, ?, ?, ?)")
          .run(appId, followUp.date, followUp.contactId, followUp.notes));
      } catch (err) {
        if (isForeignKeyError(err)) throw new Error(`Contact ${followUp.contactId} not found`);
        throw err;
      }
      return mapFollowUp(
        requireRow<FollowUpRow>("SELECT * FROM follow_ups WHERE id = ?", Number(lastInsertRowid), "FollowUp")
      );
    },

    async deleteFollowUp(appId: number, followUpId: number) {
      db.prepare("DELETE FROM follow_ups WHERE id = ? AND application_id = ?").run(followUpId, appId);
    },

    // ---- companies ----

    async getCompanies() {
      return db.prepare<[], CompanyRow>("SELECT * FROM companies ORDER BY id").all().map(composeCompany);
    },

    async createCompany(company: NewCompany) {
      const { lastInsertRowid } = db
        .prepare("INSERT INTO companies (name, is_target, status, industry, website, notes) VALUES (?, ?, ?, ?, ?, ?)")
        .run(company.name, bool(company.isTarget), company.status, company.industry ?? null, company.website ?? null, company.notes);
      const id = Number(lastInsertRowid);
      const insertLoc = db.prepare("INSERT INTO company_locations (company_id, city, state) VALUES (?, ?, ?)");
      for (const loc of company.locations ?? []) insertLoc.run(id, loc.city, loc.state);
      return composeCompany(requireRow<CompanyRow>("SELECT * FROM companies WHERE id = ?", id, "Company"));
    },

    async editCompany(company: DsCompany) {
      db.prepare("UPDATE companies SET name = ?, is_target = ?, status = ?, industry = ?, website = ?, notes = ? WHERE id = ?").run(
        company.name,
        bool(company.isTarget),
        company.status,
        company.industry ?? null,
        company.website ?? null,
        company.notes,
        company.id
      );
      db.prepare("DELETE FROM company_locations WHERE company_id = ?").run(company.id);
      const insertLoc = db.prepare("INSERT INTO company_locations (company_id, city, state) VALUES (?, ?, ?)");
      for (const loc of company.locations) insertLoc.run(company.id, loc.city, loc.state);
    },

    async deleteCompany(id: number) {
      try {
        db.prepare("DELETE FROM companies WHERE id = ?").run(id);
      } catch (err) {
        if (isForeignKeyError(err)) {
          const { n } = db.prepare("SELECT COUNT(*) as n FROM applications WHERE company_id = ?").get(id) as { n: number };
          throw new RestrictedDeleteError(`Cannot delete company ${id}: ${n} application(s) still reference it.`);
        }
        throw err;
      }
    },

    async toggleTarget(id: number) {
      db.prepare("UPDATE companies SET is_target = NOT is_target WHERE id = ?").run(id);
    },

    // ---- contacts ----

    async getContacts() {
      return db.prepare<[], ContactRow>("SELECT * FROM contacts ORDER BY id").all().map(mapContact);
    },

    async createContact(contact: NewContact) {
      const { lastInsertRowid } = db
        .prepare(
          "INSERT INTO contacts (name, email, phone, linked_in_url, website, company_id, role, notes) VALUES (?, ?, ?, ?, ?, ?, ?, ?)"
        )
        .run(
          contact.name,
          contact.email ?? null,
          contact.phone ?? null,
          contact.linkedInUrl ?? null,
          contact.website ?? null,
          contact.companyId ?? null,
          contact.role ?? null,
          contact.notes
        );
      return mapContact(requireRow<ContactRow>("SELECT * FROM contacts WHERE id = ?", Number(lastInsertRowid), "Contact"));
    },

    async editContact(contact: DsContact) {
      db.prepare(
        "UPDATE contacts SET name = ?, email = ?, phone = ?, linked_in_url = ?, website = ?, company_id = ?, role = ?, notes = ? WHERE id = ?"
      ).run(
        contact.name,
        contact.email ?? null,
        contact.phone ?? null,
        contact.linkedInUrl ?? null,
        contact.website ?? null,
        contact.companyId ?? null,
        contact.role ?? null,
        contact.notes,
        contact.id
      );
    },

    async deleteContact(id: number) {
      try {
        db.prepare("DELETE FROM contacts WHERE id = ?").run(id);
      } catch (err) {
        if (isForeignKeyError(err)) {
          const { n } = db.prepare("SELECT COUNT(*) as n FROM follow_ups WHERE contact_id = ?").get(id) as { n: number };
          throw new RestrictedDeleteError(`Cannot delete contact ${id}: ${n} follow-up(s) still reference it.`);
        }
        throw err;
      }
    },

    // ---- networking events ----

    async getNetworkingEvents() {
      return db
        .prepare<[], NetworkingEventRow>("SELECT * FROM networking_events ORDER BY id")
        .all()
        .map(composeNetworkingEvent);
    },

    async addNetworkingEvent(event: NewNetworkingEvent) {
      const { lastInsertRowid } = db
        .prepare("INSERT INTO networking_events (type, date, application_id, notes) VALUES (?, ?, ?, ?)")
        .run(event.type, event.date, event.applicationId ?? null, event.notes);
      const id = Number(lastInsertRowid);
      const insertLink = db.prepare("INSERT INTO networking_event_contacts (event_id, contact_id) VALUES (?, ?)");
      try {
        for (const contactId of event.contactIds) insertLink.run(id, contactId);
      } catch (err) {
        db.prepare("DELETE FROM networking_events WHERE id = ?").run(id);
        throw err;
      }
      return composeNetworkingEvent(
        requireRow<NetworkingEventRow>("SELECT * FROM networking_events WHERE id = ?", id, "NetworkingEvent")
      );
    },

    async deleteNetworkingEvent(id: number) {
      db.prepare("DELETE FROM networking_events WHERE id = ?").run(id);
    },

    // ---- goals ----

    async getGoals() {
      const row = db
        .prepare<[], GoalsRow>(
          "SELECT salary_min, salary_max, applications_per_week_target, target_offer_date FROM goals WHERE id = 1"
        )
        .get()!;
      return {
        salaryMin: row.salary_min ?? undefined,
        salaryMax: row.salary_max ?? undefined,
        applicationsPerWeekTarget: row.applications_per_week_target ?? undefined,
        targetOfferDate: row.target_offer_date ?? undefined,
      };
    },

    async updateGoals(goals: DsGoals) {
      db.prepare(
        "UPDATE goals SET salary_min = ?, salary_max = ?, applications_per_week_target = ?, target_offer_date = ? WHERE id = 1"
      ).run(goals.salaryMin ?? null, goals.salaryMax ?? null, goals.applicationsPerWeekTarget ?? null, goals.targetOfferDate ?? null);
    },

    // ---- user profile ----

    async getUserProfile() {
      const row = db.prepare<[], UserProfileRow>("SELECT name FROM user_profile WHERE id = 1").get()!;
      return { name: row.name };
    },

    async updateUserProfile(profile: DsUserProfile) {
      db.prepare("UPDATE user_profile SET name = ? WHERE id = 1").run(profile.name);
    },

    // ---- interview categories ----

    async getInterviewCategories() {
      return db.prepare<[], { name: string }>("SELECT name FROM interview_categories ORDER BY id").all().map((r) => r.name);
    },

    async addInterviewCategory(category: string) {
      db.prepare("INSERT OR IGNORE INTO interview_categories (name) VALUES (?)").run(category);
    },

    // ---- interview prep questions ----

    async getInterviewPrepQuestions() {
      return db
        .prepare<[], InterviewPrepQuestionRow>("SELECT * FROM interview_prep_questions ORDER BY id")
        .all()
        .map(mapInterviewPrepQuestion);
    },

    async addInterviewPrepQuestion(question: NewInterviewPrepQuestion) {
      const { lastInsertRowid } = db
        .prepare("INSERT INTO interview_prep_questions (category, section, question, answer, starred) VALUES (?, ?, ?, ?, ?)")
        .run(question.category, question.section ?? null, question.question, question.answer, bool(question.starred));
      return mapInterviewPrepQuestion(
        requireRow<InterviewPrepQuestionRow>(
          "SELECT * FROM interview_prep_questions WHERE id = ?",
          Number(lastInsertRowid),
          "InterviewPrepQuestion"
        )
      );
    },

    async editInterviewPrepQuestion(question: DsInterviewPrepQuestion) {
      db.prepare(
        "UPDATE interview_prep_questions SET category = ?, section = ?, question = ?, answer = ?, starred = ? WHERE id = ?"
      ).run(question.category, question.section ?? null, question.question, question.answer, bool(question.starred), question.id);
    },

    async deleteInterviewPrepQuestion(id: number) {
      db.prepare("DELETE FROM interview_prep_questions WHERE id = ?").run(id);
    },

    // ---- elevator pitch versions ----

    async getElevatorPitchVersions() {
      return db
        .prepare<[], ElevatorPitchVersionRow>("SELECT * FROM elevator_pitch_versions ORDER BY id")
        .all()
        .map(mapElevatorPitchVersion);
    },

    async addElevatorPitchVersion(version: NewElevatorPitchVersion) {
      const { lastInsertRowid } = db
        .prepare(
          `INSERT INTO elevator_pitch_versions
            (name, setting, who, person_name, role, identity, situation, action, result, themes, synthesis, seeking, closing_question, source_question_id)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
        )
        .run(
          version.name,
          version.setting,
          version.who,
          version.personName,
          version.role,
          version.identity,
          version.situation,
          version.action,
          version.result,
          JSON.stringify(version.themes),
          version.synthesis,
          version.seeking,
          version.closingQuestion,
          version.sourceQuestionId ?? null
        );
      return mapElevatorPitchVersion(
        requireRow<ElevatorPitchVersionRow>(
          "SELECT * FROM elevator_pitch_versions WHERE id = ?",
          Number(lastInsertRowid),
          "ElevatorPitchVersion"
        )
      );
    },

    async editElevatorPitchVersion(version: DsElevatorPitchVersion) {
      db.prepare(
        `UPDATE elevator_pitch_versions SET name = ?, setting = ?, who = ?, person_name = ?, role = ?, identity = ?,
          situation = ?, action = ?, result = ?, themes = ?, synthesis = ?, seeking = ?, closing_question = ?, source_question_id = ?
         WHERE id = ?`
      ).run(
        version.name,
        version.setting,
        version.who,
        version.personName,
        version.role,
        version.identity,
        version.situation,
        version.action,
        version.result,
        JSON.stringify(version.themes),
        version.synthesis,
        version.seeking,
        version.closingQuestion,
        version.sourceQuestionId ?? null,
        version.id
      );
    },

    async deleteElevatorPitchVersion(id: number) {
      db.prepare("DELETE FROM elevator_pitch_versions WHERE id = ?").run(id);
    },
  };
}

/**
 * Registers one ipcMain.handle per DataSource method, namespaced e.g.
 * "applications:list". RestrictedDeleteError doesn't survive the IPC
 * boundary as a distinguishable type (Electron serializes thrown errors down
 * to message + generic Error), so it's marked here and reconstructed in
 * packages/shared's ElectronDataSource on the renderer side.
 */
export function registerIpcHandlers(db: Database.Database): void {
  const ds = createSqliteDataSource(db);

  const channels: Record<string, (...args: unknown[]) => Promise<unknown>> = {
    "applications:list": () => ds.getApplications(),
    "applications:create": (app) => ds.createApplication(app as NewApplication),
    "applications:edit": (app) => ds.editApplication(app as DsApplication),
    "applications:updateStatus": (id, status, at) => ds.updateApplicationStatus(id as number, status as ApplicationStatus, at as string),
    "applications:delete": (id) => ds.deleteApplication(id as number),
    "applications:saveFeedback": (appId, feedback) => ds.saveFeedback(appId as number, feedback as Feedback),

    "interviews:log": (appId, interview) => ds.logInterview(appId as number, interview as NewInterview),
    "interviews:edit": (appId, interviewId, updates) =>
      ds.editInterview(appId as number, interviewId as number, updates as NewInterview),
    "interviews:delete": (appId, interviewId) => ds.deleteInterview(appId as number, interviewId as number),

    "followUps:log": (appId, followUp) => ds.logFollowUp(appId as number, followUp as NewFollowUp),
    "followUps:delete": (appId, followUpId) => ds.deleteFollowUp(appId as number, followUpId as number),

    "companies:list": () => ds.getCompanies(),
    "companies:create": (company) => ds.createCompany(company as NewCompany),
    "companies:edit": (company) => ds.editCompany(company as DsCompany),
    "companies:delete": (id) => ds.deleteCompany(id as number),
    "companies:toggleTarget": (id) => ds.toggleTarget(id as number),

    "contacts:list": () => ds.getContacts(),
    "contacts:create": (contact) => ds.createContact(contact as NewContact),
    "contacts:edit": (contact) => ds.editContact(contact as DsContact),
    "contacts:delete": (id) => ds.deleteContact(id as number),

    "networkingEvents:list": () => ds.getNetworkingEvents(),
    "networkingEvents:add": (event) => ds.addNetworkingEvent(event as NewNetworkingEvent),
    "networkingEvents:delete": (id) => ds.deleteNetworkingEvent(id as number),

    "goals:get": () => ds.getGoals(),
    "goals:update": (goals) => ds.updateGoals(goals as DsGoals),

    "userProfile:get": () => ds.getUserProfile(),
    "userProfile:update": (profile) => ds.updateUserProfile(profile as DsUserProfile),

    "interviewCategories:list": () => ds.getInterviewCategories(),
    "interviewCategories:add": (category) => ds.addInterviewCategory(category as string),

    "interviewPrep:list": () => ds.getInterviewPrepQuestions(),
    "interviewPrep:add": (question) => ds.addInterviewPrepQuestion(question as NewInterviewPrepQuestion),
    "interviewPrep:edit": (question) => ds.editInterviewPrepQuestion(question as DsInterviewPrepQuestion),
    "interviewPrep:delete": (id) => ds.deleteInterviewPrepQuestion(id as number),

    "elevatorPitch:list": () => ds.getElevatorPitchVersions(),
    "elevatorPitch:add": (version) => ds.addElevatorPitchVersion(version as NewElevatorPitchVersion),
    "elevatorPitch:edit": (version) => ds.editElevatorPitchVersion(version as DsElevatorPitchVersion),
    "elevatorPitch:delete": (id) => ds.deleteElevatorPitchVersion(id as number),
  };

  for (const [channel, handler] of Object.entries(channels)) {
    ipcMain.handle(channel, async (_event, ...args: unknown[]) => {
      try {
        return await handler(...args);
      } catch (err) {
        if (err instanceof RestrictedDeleteError) throw new Error(`RESTRICTED_DELETE:${err.message}`);
        throw err;
      }
    });
  }
}
