import { describe, expect, it } from "vitest";
import { RestrictedDeleteError, type DataSource } from "./types";

/**
 * Implementation-agnostic behavior contract for DataSource. Every
 * implementation (Memory, Wasm, Electron) runs this against itself so the
 * cascade/restrict/compose behavior stays identical everywhere, not just in
 * whichever implementation happened to get hand-written tests first.
 */
export function runDataSourceContractTests(makeDataSource: () => DataSource) {
  describe("applications", () => {
    it("creates an application and returns it with empty interviews/followUps", async () => {
      const ds = makeDataSource();
      const company = await ds.createCompany({ name: "Acme", isTarget: false, status: "researching", notes: "" });
      const app = await ds.createApplication({
        companyId: company.id,
        role: "Engineer",
        dateApplied: "Jan 1, 2026",
        link: "",
        jobDescription: "",
        referral: false,
        resumeType: "tailored",
        coverLetterSubmitted: false,
        notes: "",
        status: "applied",
        logo: "A",
        statusHistory: [{ status: "applied", at: "Jan 1, 2026" }],
      });
      expect(app.id).toBeTypeOf("number");
      expect(app.interviews).toEqual([]);
      expect(app.followUps).toEqual([]);
      expect(app.statusHistory).toEqual([{ status: "applied", at: "Jan 1, 2026" }]);

      const all = await ds.getApplications();
      expect(all).toHaveLength(1);
      expect(all[0]).toEqual(app);
    });

    it("rejects creating an application against a company that doesn't exist", async () => {
      const ds = makeDataSource();
      await expect(
        ds.createApplication({
          companyId: 9999,
          role: "Engineer",
          dateApplied: "",
          link: "",
          jobDescription: "",
          referral: false,
          resumeType: "tailored",
          coverLetterSubmitted: false,
          notes: "",
          status: "todo",
          logo: "A",
          statusHistory: [],
        })
      ).rejects.toThrow();
    });

    it("updateApplicationStatus appends to statusHistory and updates status", async () => {
      const ds = makeDataSource();
      const company = await ds.createCompany({ name: "Acme", isTarget: false, status: "researching", notes: "" });
      const app = await ds.createApplication({
        companyId: company.id,
        role: "Engineer",
        dateApplied: "Jan 1, 2026",
        link: "",
        jobDescription: "",
        referral: false,
        resumeType: "tailored",
        coverLetterSubmitted: false,
        notes: "",
        status: "applied",
        logo: "A",
        statusHistory: [{ status: "applied", at: "Jan 1, 2026" }],
      });
      await ds.updateApplicationStatus(app.id, "interviewing", "Jan 5, 2026");
      const [updated] = await ds.getApplications();
      expect(updated.status).toBe("interviewing");
      expect(updated.statusHistory).toEqual([
        { status: "applied", at: "Jan 1, 2026" },
        { status: "interviewing", at: "Jan 5, 2026" },
      ]);
    });

    it("deleteApplication cascades to its interviews, followUps, and statusHistory", async () => {
      const ds = makeDataSource();
      const company = await ds.createCompany({ name: "Acme", isTarget: false, status: "researching", notes: "" });
      const contact = await ds.createContact({ name: "Sam", companyId: company.id, notes: "" });
      const app = await ds.createApplication({
        companyId: company.id,
        role: "Engineer",
        dateApplied: "Jan 1, 2026",
        link: "",
        jobDescription: "",
        referral: false,
        resumeType: "tailored",
        coverLetterSubmitted: false,
        notes: "",
        status: "applied",
        logo: "A",
        statusHistory: [{ status: "applied", at: "Jan 1, 2026" }],
      });
      await ds.logInterview(app.id, { type: "Recruiter Screen", date: "Jan 2, 2026", notes: "" });
      await ds.logFollowUp(app.id, { date: "Jan 3, 2026", contactId: contact.id, notes: "" });

      await ds.deleteApplication(app.id);

      expect(await ds.getApplications()).toEqual([]);
    });

    it("deleteApplication sets NetworkingEvent.applicationId to undefined instead of deleting the event", async () => {
      const ds = makeDataSource();
      const company = await ds.createCompany({ name: "Acme", isTarget: false, status: "researching", notes: "" });
      const contact = await ds.createContact({ name: "Sam", companyId: company.id, notes: "" });
      const app = await ds.createApplication({
        companyId: company.id,
        role: "Engineer",
        dateApplied: "Jan 1, 2026",
        link: "",
        jobDescription: "",
        referral: false,
        resumeType: "tailored",
        coverLetterSubmitted: false,
        notes: "",
        status: "applied",
        logo: "A",
        statusHistory: [],
      });
      const event = await ds.addNetworkingEvent({
        contactIds: [contact.id],
        type: "Coffee chat",
        date: "Jan 2, 2026",
        applicationId: app.id,
        notes: "",
      });

      await ds.deleteApplication(app.id);

      const [remaining] = await ds.getNetworkingEvents();
      expect(remaining.id).toBe(event.id);
      expect(remaining.applicationId).toBeUndefined();
    });
  });

  describe("companies", () => {
    it("createCompany persists its locations and getCompanies returns them", async () => {
      const ds = makeDataSource();
      const company = await ds.createCompany({
        name: "Acme",
        isTarget: true,
        status: "watching",
        notes: "",
        locations: [{ city: "Austin", state: "TX" }],
      });
      expect(company.locations).toEqual([{ city: "Austin", state: "TX" }]);
      const [fetched] = await ds.getCompanies();
      expect(fetched.locations).toEqual([{ city: "Austin", state: "TX" }]);
    });

    it("editCompany replaces the location set", async () => {
      const ds = makeDataSource();
      const company = await ds.createCompany({
        name: "Acme",
        isTarget: false,
        status: "researching",
        notes: "",
        locations: [{ city: "Austin", state: "TX" }],
      });
      await ds.editCompany({ ...company, locations: [{ city: "Denver", state: "CO" }] });
      const [fetched] = await ds.getCompanies();
      expect(fetched.locations).toEqual([{ city: "Denver", state: "CO" }]);
    });

    it("toggleTarget flips isTarget", async () => {
      const ds = makeDataSource();
      const company = await ds.createCompany({ name: "Acme", isTarget: false, status: "researching", notes: "" });
      await ds.toggleTarget(company.id);
      const [fetched] = await ds.getCompanies();
      expect(fetched.isTarget).toBe(true);
    });

    it("blocks deleting a company that still has applications pointing at it", async () => {
      const ds = makeDataSource();
      const company = await ds.createCompany({ name: "Acme", isTarget: false, status: "researching", notes: "" });
      await ds.createApplication({
        companyId: company.id,
        role: "Engineer",
        dateApplied: "",
        link: "",
        jobDescription: "",
        referral: false,
        resumeType: "tailored",
        coverLetterSubmitted: false,
        notes: "",
        status: "todo",
        logo: "A",
        statusHistory: [],
      });
      await expect(ds.deleteCompany(company.id)).rejects.toBeInstanceOf(RestrictedDeleteError);
      expect(await ds.getCompanies()).toHaveLength(1);
    });

    it("deleting a company with no referencing applications sets Contact.companyId to undefined", async () => {
      const ds = makeDataSource();
      const company = await ds.createCompany({ name: "Acme", isTarget: false, status: "researching", notes: "" });
      const contact = await ds.createContact({ name: "Sam", companyId: company.id, notes: "" });
      await ds.deleteCompany(company.id);
      const [fetched] = await ds.getContacts();
      expect(fetched.id).toBe(contact.id);
      expect(fetched.companyId).toBeUndefined();
    });
  });

  describe("contacts", () => {
    it("round-trips relationshipTier through create and edit, and can clear it", async () => {
      const ds = makeDataSource();
      const created = await ds.createContact({ name: "Sam", notes: "", relationshipTier: "core" });
      expect(created.relationshipTier).toBe("core");
      expect((await ds.getContacts())[0].relationshipTier).toBe("core");

      await ds.editContact({ ...created, relationshipTier: "dormant" });
      expect((await ds.getContacts())[0].relationshipTier).toBe("dormant");

      await ds.editContact({ ...created, relationshipTier: undefined });
      expect((await ds.getContacts())[0].relationshipTier).toBeUndefined();
    });

    it("defaults relationshipTier to undefined when omitted", async () => {
      const ds = makeDataSource();
      const created = await ds.createContact({ name: "Dana", notes: "" });
      expect(created.relationshipTier).toBeUndefined();
    });

    it("blocks deleting a contact that a followUp still references", async () => {
      const ds = makeDataSource();
      const company = await ds.createCompany({ name: "Acme", isTarget: false, status: "researching", notes: "" });
      const contact = await ds.createContact({ name: "Sam", companyId: company.id, notes: "" });
      const app = await ds.createApplication({
        companyId: company.id,
        role: "Engineer",
        dateApplied: "",
        link: "",
        jobDescription: "",
        referral: false,
        resumeType: "tailored",
        coverLetterSubmitted: false,
        notes: "",
        status: "todo",
        logo: "A",
        statusHistory: [],
      });
      await ds.logFollowUp(app.id, { date: "Jan 1, 2026", contactId: contact.id, notes: "" });
      await expect(ds.deleteContact(contact.id)).rejects.toBeInstanceOf(RestrictedDeleteError);
    });

    it("deleting an unreferenced contact removes it from any NetworkingEvent.contactIds", async () => {
      const ds = makeDataSource();
      const company = await ds.createCompany({ name: "Acme", isTarget: false, status: "researching", notes: "" });
      const contact = await ds.createContact({ name: "Sam", companyId: company.id, notes: "" });
      const event = await ds.addNetworkingEvent({ contactIds: [contact.id], type: "Coffee chat", date: "", notes: "" });
      await ds.deleteContact(contact.id);
      const [fetched] = await ds.getNetworkingEvents();
      expect(fetched.id).toBe(event.id);
      expect(fetched.contactIds).toEqual([]);
    });

    it("deleting a contact clears Application.referredByContactId instead of blocking", async () => {
      const ds = makeDataSource();
      const company = await ds.createCompany({ name: "Acme", isTarget: false, status: "researching", notes: "" });
      const contact = await ds.createContact({ name: "Sam", companyId: company.id, notes: "" });
      const app = await ds.createApplication({
        companyId: company.id,
        role: "Engineer",
        dateApplied: "",
        link: "",
        jobDescription: "",
        referral: true,
        referredByContactId: contact.id,
        resumeType: "tailored",
        coverLetterSubmitted: false,
        notes: "",
        status: "todo",
        logo: "A",
        statusHistory: [],
      });
      await ds.deleteContact(contact.id);
      const [fetched] = await ds.getApplications();
      expect(fetched.id).toBe(app.id);
      expect(fetched.referredByContactId).toBeUndefined();
    });
  });

  describe("networking events", () => {
    it("addNetworkingEvent rejects a contactId that doesn't exist", async () => {
      const ds = makeDataSource();
      await expect(
        ds.addNetworkingEvent({ contactIds: [9999], type: "Coffee chat", date: "", notes: "" })
      ).rejects.toThrow();
    });

    it("editNetworkingEvent replaces scalars and the contact set", async () => {
      const ds = makeDataSource();
      const sam = await ds.createContact({ name: "Sam", notes: "" });
      const dana = await ds.createContact({ name: "Dana", notes: "" });
      const event = await ds.addNetworkingEvent({
        contactIds: [sam.id],
        type: "Coffee chat",
        date: "Jan 2, 2026",
        notes: "first pass",
      });

      await ds.editNetworkingEvent({
        ...event,
        contactIds: [dana.id],
        type: "Video call",
        date: "Jan 9, 2026",
        notes: "updated",
      });

      const [fetched] = await ds.getNetworkingEvents();
      expect(fetched).toEqual({
        id: event.id,
        contactIds: [dana.id],
        type: "Video call",
        date: "Jan 9, 2026",
        applicationId: undefined,
        notes: "updated",
      });
    });

    it("editNetworkingEvent rejects a contactId that doesn't exist", async () => {
      const ds = makeDataSource();
      const sam = await ds.createContact({ name: "Sam", notes: "" });
      const event = await ds.addNetworkingEvent({ contactIds: [sam.id], type: "Coffee chat", date: "", notes: "" });
      await expect(ds.editNetworkingEvent({ ...event, contactIds: [9999] })).rejects.toThrow();
    });
  });

  describe("goals", () => {
    it("getGoals starts empty and updateGoals fully replaces it", async () => {
      const ds = makeDataSource();
      expect(await ds.getGoals()).toEqual({});
      await ds.updateGoals({ salaryMin: 100000 });
      expect(await ds.getGoals()).toEqual({ salaryMin: 100000 });
      await ds.updateGoals({ salaryMax: 150000 });
      expect(await ds.getGoals()).toEqual({ salaryMax: 150000 });
    });
  });

  describe("user profile", () => {
    it("getUserProfile starts with an empty name and updateUserProfile replaces it", async () => {
      const ds = makeDataSource();
      expect(await ds.getUserProfile()).toEqual({ name: "" });
      await ds.updateUserProfile({ name: "Sam" });
      expect(await ds.getUserProfile()).toEqual({ name: "Sam" });
    });
  });

  describe("interview categories", () => {
    it("addInterviewCategory is idempotent for an existing category", async () => {
      const ds = makeDataSource();
      await ds.addInterviewCategory("System Design");
      await ds.addInterviewCategory("System Design");
      expect(await ds.getInterviewCategories()).toEqual(["System Design"]);
    });
  });

  describe("interview prep questions", () => {
    it("starts empty, addInterviewPrepQuestion persists it, and getInterviewPrepQuestions returns it", async () => {
      const ds = makeDataSource();
      expect(await ds.getInterviewPrepQuestions()).toEqual([]);
      const created = await ds.addInterviewPrepQuestion({
        category: "behavioral",
        section: "Ownership & Ambiguity",
        question: "Tell me about a time you owned a project end-to-end.",
        answer: "",
        starred: false,
      });
      expect(created.id).toBeTypeOf("number");
      expect(await ds.getInterviewPrepQuestions()).toEqual([created]);
    });

    it("editInterviewPrepQuestion updates the answer (and other fields) in place", async () => {
      const ds = makeDataSource();
      const created = await ds.addInterviewPrepQuestion({
        category: "recruiter_screening",
        question: "Why are you looking for a new role?",
        answer: "",
        starred: false,
      });
      await ds.editInterviewPrepQuestion({ ...created, answer: "Looking for more ownership." });
      const [fetched] = await ds.getInterviewPrepQuestions();
      expect(fetched.answer).toBe("Looking for more ownership.");
    });

    it("editInterviewPrepQuestion toggles starred", async () => {
      const ds = makeDataSource();
      const created = await ds.addInterviewPrepQuestion({ category: "behavioral", question: "Q?", answer: "", starred: false });
      await ds.editInterviewPrepQuestion({ ...created, starred: true });
      const [fetched] = await ds.getInterviewPrepQuestions();
      expect(fetched.starred).toBe(true);
    });

    it("deleteInterviewPrepQuestion removes it", async () => {
      const ds = makeDataSource();
      const created = await ds.addInterviewPrepQuestion({ category: "behavioral", question: "Q?", answer: "", starred: false });
      await ds.deleteInterviewPrepQuestion(created.id);
      expect(await ds.getInterviewPrepQuestions()).toEqual([]);
    });
  });

  describe("elevator pitch versions", () => {
    function blankVersion() {
      return {
        name: "Career fair",
        setting: "",
        who: "",
        personName: "",
        role: "",
        identity: "",
        situation: "",
        action: "",
        result: "",
        themes: [] as string[],
        synthesis: "",
        seeking: "",
        closingQuestion: "",
      };
    }

    it("starts empty, addElevatorPitchVersion persists it, and getElevatorPitchVersions returns it", async () => {
      const ds = makeDataSource();
      expect(await ds.getElevatorPitchVersions()).toEqual([]);
      const created = await ds.addElevatorPitchVersion(blankVersion());
      expect(created.id).toBeTypeOf("number");
      expect(await ds.getElevatorPitchVersions()).toEqual([created]);
    });

    it("editElevatorPitchVersion updates fields (including the themes array) in place", async () => {
      const ds = makeDataSource();
      const created = await ds.addElevatorPitchVersion(blankVersion());
      await ds.editElevatorPitchVersion({ ...created, identity: "A builder who ships.", themes: ["Fast learner", "Collaborator"] });
      const [fetched] = await ds.getElevatorPitchVersions();
      expect(fetched.identity).toBe("A builder who ships.");
      expect(fetched.themes).toEqual(["Fast learner", "Collaborator"]);
    });

    it("deleteElevatorPitchVersion removes it", async () => {
      const ds = makeDataSource();
      const created = await ds.addElevatorPitchVersion(blankVersion());
      await ds.deleteElevatorPitchVersion(created.id);
      expect(await ds.getElevatorPitchVersions()).toEqual([]);
    });

    it("persists a link to its source prep question and clears it (not the version) when that question is deleted", async () => {
      const ds = makeDataSource();
      const question = await ds.addInterviewPrepQuestion({ category: "behavioral", question: "Q?", answer: "", starred: false });
      const created = await ds.addElevatorPitchVersion({ ...blankVersion(), sourceQuestionId: question.id });
      expect(created.sourceQuestionId).toBe(question.id);

      await ds.deleteInterviewPrepQuestion(question.id);

      const [fetched] = await ds.getElevatorPitchVersions();
      expect(fetched.id).toBe(created.id);
      expect(fetched.sourceQuestionId).toBeUndefined();
    });
  });
}
