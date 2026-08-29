import { describe, expect, it } from "vitest";
import { defaultSeed } from "./seed";
import type { ApplicationStatus, CompanyStatus, InterviewStyle, InterviewType, WorkArrangement } from "@/lib/types";

const APPLICATION_STATUSES: ApplicationStatus[] = [
  "todo", "applied", "interviewing", "offer_extended", "offer_accepted",
  "offer_declined", "rejected_no_interview", "rejected_after_interview", "withdrawn",
];
const COMPANY_STATUSES: CompanyStatus[] = ["researching", "watching", "applied", "not_pursuing"];
const WORK_ARRANGEMENTS: WorkArrangement[] = ["onsite", "remote", "hybrid"];
const INTERVIEW_TYPES: InterviewType[] = [
  "Recruiter Screen", "Technical Screen", "Technical Interview", "Behavioral", "Hiring Manager", "Panel", "Other",
];
const INTERVIEW_STYLES: InterviewStyle[] = ["LeetCode", "Whiteboarding", "Mixture", "Other"];

const countBy = <T>(items: T[], key: (item: T) => string) =>
  items.reduce<Record<string, number>>((acc, item) => {
    const k = key(item);
    acc[k] = (acc[k] ?? 0) + 1;
    return acc;
  }, {});

describe("defaultSeed coverage", () => {
  const { applications, companies, contacts, networkingEvents, elevatorPitchVersions } = defaultSeed;
  const interviews = applications.flatMap((a) => a.interviews);

  it("has 50 applications", () => {
    expect(applications).toHaveLength(50);
  });

  it("covers every application status at least 5 times", () => {
    const byStatus = countBy(applications, (a) => a.status);
    for (const status of APPLICATION_STATUSES) {
      expect(byStatus[status] ?? 0, `application status "${status}"`).toBeGreaterThanOrEqual(5);
    }
  });

  it("covers every company status at least 5 times", () => {
    const byStatus = countBy(companies, (c) => c.status);
    for (const status of COMPANY_STATUSES) {
      expect(byStatus[status] ?? 0, `company status "${status}"`).toBeGreaterThanOrEqual(5);
    }
  });

  it("covers every work arrangement at least 5 times", () => {
    const byWork = countBy(
      applications.filter((a) => a.workArrangement),
      (a) => a.workArrangement as string
    );
    for (const work of WORK_ARRANGEMENTS) {
      expect(byWork[work] ?? 0, `work arrangement "${work}"`).toBeGreaterThanOrEqual(5);
    }
  });

  it("covers both resume types at least 5 times", () => {
    const byResume = countBy(applications, (a) => a.resumeType);
    expect(byResume.tailored ?? 0).toBeGreaterThanOrEqual(5);
    expect(byResume.untailored ?? 0).toBeGreaterThanOrEqual(5);
  });

  it("covers every interview type at least 5 times", () => {
    const byType = countBy(interviews, (i) => i.type);
    for (const type of INTERVIEW_TYPES) {
      expect(byType[type] ?? 0, `interview type "${type}"`).toBeGreaterThanOrEqual(5);
    }
  });

  it("covers every interview style at least 5 times", () => {
    const byStyle = countBy(
      interviews.filter((i) => i.style),
      (i) => i.style as string
    );
    for (const style of INTERVIEW_STYLES) {
      expect(byStyle[style] ?? 0, `interview style "${style}"`).toBeGreaterThanOrEqual(5);
    }
  });

  it("has at least 5 of each supporting record type", () => {
    expect(companies.length).toBeGreaterThanOrEqual(5);
    expect(contacts.length).toBeGreaterThanOrEqual(5);
    expect(companies.filter((c) => c.locations.length > 0).length).toBeGreaterThanOrEqual(5);
    expect(interviews.length).toBeGreaterThanOrEqual(5);
    expect(applications.flatMap((a) => a.followUps).length).toBeGreaterThanOrEqual(5);
    expect(applications.flatMap((a) => a.statusHistory).length).toBeGreaterThanOrEqual(5);
    expect(applications.filter((a) => a.feedback).length).toBeGreaterThanOrEqual(5);
    expect(applications.filter((a) => a.referral).length).toBeGreaterThanOrEqual(5);
    expect(applications.filter((a) => a.referredByContactId).length).toBeGreaterThanOrEqual(5);
    expect(networkingEvents.length).toBeGreaterThanOrEqual(5);
    expect(elevatorPitchVersions.length).toBeGreaterThanOrEqual(5);
  });

  it("keeps every foreign-key reference resolvable", () => {
    const companyIds = new Set(companies.map((c) => c.id));
    const contactIds = new Set(contacts.map((c) => c.id));
    const appIds = new Set(applications.map((a) => a.id));
    const questionIds = new Set(defaultSeed.interviewPrepQuestions.map((q) => q.id));

    for (const c of contacts) {
      if (c.companyId) expect(companyIds.has(c.companyId), `contact ${c.id} -> ${c.companyId}`).toBe(true);
    }
    for (const a of applications) {
      expect(companyIds.has(a.companyId), `application ${a.id} -> ${a.companyId}`).toBe(true);
      if (a.referredByContactId) {
        expect(contactIds.has(a.referredByContactId), `application ${a.id} -> ${a.referredByContactId}`).toBe(true);
      }
      for (const f of a.followUps) {
        expect(contactIds.has(f.contactId), `follow-up ${f.id} -> ${f.contactId}`).toBe(true);
      }
    }
    for (const e of networkingEvents) {
      for (const cid of e.contactIds) expect(contactIds.has(cid), `event ${e.id} -> ${cid}`).toBe(true);
      if (e.applicationId) expect(appIds.has(e.applicationId), `event ${e.id} -> ${e.applicationId}`).toBe(true);
    }
    for (const v of elevatorPitchVersions) {
      if (v.sourceQuestionId) {
        expect(questionIds.has(v.sourceQuestionId), `pitch ${v.id} -> ${v.sourceQuestionId}`).toBe(true);
      }
    }
  });

  it("has unique ids within each collection", () => {
    const unique = (xs: string[]) => new Set(xs).size === xs.length;
    expect(unique(companies.map((c) => c.id))).toBe(true);
    expect(unique(contacts.map((c) => c.id))).toBe(true);
    expect(unique(applications.map((a) => a.id))).toBe(true);
    expect(unique(applications.flatMap((a) => a.interviews).map((i) => i.id))).toBe(true);
    expect(unique(applications.flatMap((a) => a.followUps).map((f) => f.id))).toBe(true);
    expect(unique(networkingEvents.map((e) => e.id))).toBe(true);
  });
});
