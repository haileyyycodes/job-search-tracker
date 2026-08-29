import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { MemoryDataSource } from "./dataSource/memoryDataSource";
import { emptySeed } from "./dataSource/seed";
import type { NewApplication, NewCompany } from "./dataSource/types";
import { __resetTrackerDataForTests, useTrackerData } from "./useTrackerData";

function makeApplication(overrides: Partial<NewApplication> = {}): NewApplication {
  return {
    companyId: 1,
    role: "Software Engineer",
    dateApplied: "Jul 1, 2026",
    link: "",
    jobDescription: "",
    referral: false,
    resumeType: "tailored",
    coverLetterSubmitted: false,
    notes: "",
    status: "todo",
    logo: "",
    statusHistory: [{ status: "todo", at: "Jul 1, 2026" }],
    ...overrides,
  };
}

function makeCompany(overrides: Partial<NewCompany> = {}): NewCompany {
  return {
    name: "Acme Corp",
    isTarget: true,
    status: "researching",
    locations: [],
    notes: "",
    ...overrides,
  };
}

beforeEach(async () => {
  await __resetTrackerDataForTests(new MemoryDataSource(emptySeed));
});

afterEach(() => {
  cleanup();
});

describe("addApplication", () => {
  it("prepends the new application to the list", async () => {
    const { result } = renderHook(() => useTrackerData());
    const company = await act(() => result.current.createCompany(makeCompany()));
    await act(() => result.current.addApplication(makeApplication({ companyId: company.id, role: "New role" })));
    expect(result.current.apps[0].role).toBe("New role");
  });

  it("advances a researching/watching company to applied once a real application is logged", async () => {
    const { result } = renderHook(() => useTrackerData());
    const company = await act(() => result.current.createCompany(makeCompany({ status: "watching" })));
    await act(() => result.current.addApplication(makeApplication({ companyId: company.id, status: "applied" })));
    expect(result.current.companies.find((c) => c.id === company.id)?.status).toBe("applied");
  });

  it("leaves the company status alone when the application is only queued ('todo')", async () => {
    const { result } = renderHook(() => useTrackerData());
    const company = await act(() => result.current.createCompany(makeCompany({ status: "watching" })));
    await act(() => result.current.addApplication(makeApplication({ companyId: company.id, status: "todo" })));
    expect(result.current.companies.find((c) => c.id === company.id)?.status).toBe("watching");
  });

  it("doesn't regress a company that's past the applied stage", async () => {
    const { result } = renderHook(() => useTrackerData());
    const company = await act(() => result.current.createCompany(makeCompany({ status: "not_pursuing" })));
    await act(() => result.current.addApplication(makeApplication({ companyId: company.id, status: "applied" })));
    expect(result.current.companies.find((c) => c.id === company.id)?.status).toBe("not_pursuing");
  });
});

describe("changeApplicationStatus", () => {
  it("updates the status and appends a status history entry", async () => {
    const { result } = renderHook(() => useTrackerData());
    const company = await act(() => result.current.createCompany(makeCompany()));
    const app = await act(() => result.current.addApplication(makeApplication({ companyId: company.id, status: "applied" })));
    await act(() => result.current.changeApplicationStatus(app.id, "interviewing", "Jul 10, 2026"));
    const updated = result.current.apps.find((a) => a.id === app.id);
    expect(updated?.status).toBe("interviewing");
    expect(updated?.statusHistory.at(-1)).toEqual({ status: "interviewing", at: "Jul 10, 2026" });
  });

  it("advances the company status alongside the application", async () => {
    const { result } = renderHook(() => useTrackerData());
    const company = await act(() => result.current.createCompany(makeCompany({ status: "researching" })));
    const app = await act(() => result.current.addApplication(makeApplication({ companyId: company.id, status: "todo" })));
    await act(() => result.current.changeApplicationStatus(app.id, "applied", "Jul 5, 2026"));
    expect(result.current.companies.find((c) => c.id === company.id)?.status).toBe("applied");
  });
});

describe("logInterview", () => {
  it("auto-transitions an 'applied' application to 'interviewing'", async () => {
    const { result } = renderHook(() => useTrackerData());
    const company = await act(() => result.current.createCompany(makeCompany()));
    const app = await act(() => result.current.addApplication(makeApplication({ companyId: company.id, status: "applied" })));
    await act(() => result.current.logInterview(app.id, { type: "Recruiter Screen", date: "Jul 8, 2026", notes: "" }));
    const updated = result.current.apps.find((a) => a.id === app.id);
    expect(updated?.status).toBe("interviewing");
    expect(updated?.statusHistory.at(-1)).toEqual({ status: "interviewing", at: "Jul 8, 2026" });
    expect(updated?.interviews).toHaveLength(1);
  });

  it("doesn't touch the status when the application is already past 'applied'", async () => {
    const { result } = renderHook(() => useTrackerData());
    const company = await act(() => result.current.createCompany(makeCompany()));
    const app = await act(() =>
      result.current.addApplication(makeApplication({ companyId: company.id, status: "interviewing" }))
    );
    await act(() => result.current.logInterview(app.id, { type: "Technical Screen", date: "Jul 9, 2026", notes: "" }));
    const updated = result.current.apps.find((a) => a.id === app.id);
    expect(updated?.status).toBe("interviewing");
    expect(updated?.statusHistory).toHaveLength(1);
    expect(updated?.interviews).toHaveLength(1);
  });

  it("registers unseen interview categories so they're available as options later", async () => {
    const { result } = renderHook(() => useTrackerData());
    const company = await act(() => result.current.createCompany(makeCompany()));
    const app = await act(() => result.current.addApplication(makeApplication({ companyId: company.id, status: "applied" })));
    await act(() =>
      result.current.logInterview(app.id, {
        type: "Technical Interview",
        date: "Jul 9, 2026",
        notes: "",
        categories: ["System Design", "SQL"],
      })
    );
    expect(result.current.interviewCategories).toEqual(expect.arrayContaining(["System Design", "SQL"]));
  });
});

describe("editInterview", () => {
  it("replaces the fields of an existing interview by id", async () => {
    const { result } = renderHook(() => useTrackerData());
    const company = await act(() => result.current.createCompany(makeCompany()));
    const app = await act(() => result.current.addApplication(makeApplication({ companyId: company.id, status: "applied" })));
    const interview = await act(() =>
      result.current.logInterview(app.id, { type: "Recruiter Screen", date: "Jul 8, 2026", notes: "first" })
    );
    await act(() =>
      result.current.editInterview(app.id, interview.id, {
        type: "Technical Screen",
        date: "Jul 9, 2026",
        notes: "updated",
      })
    );
    const updated = result.current.apps.find((a) => a.id === app.id)!.interviews[0];
    expect(updated).toEqual({ id: interview.id, type: "Technical Screen", date: "Jul 9, 2026", notes: "updated" });
  });
});

describe("deleteApplication", () => {
  it("removes the application", async () => {
    const { result } = renderHook(() => useTrackerData());
    const company = await act(() => result.current.createCompany(makeCompany()));
    const app = await act(() => result.current.addApplication(makeApplication({ companyId: company.id })));

    await act(() => result.current.deleteApplication(app.id));
    expect(result.current.apps.find((a) => a.id === app.id)).toBeUndefined();
  });
});

describe("toggleTarget", () => {
  it("flips a company's isTarget flag", async () => {
    const { result } = renderHook(() => useTrackerData());
    const company = await act(() => result.current.createCompany(makeCompany({ isTarget: false })));
    await act(() => result.current.toggleTarget(company.id));
    expect(result.current.companies.find((c) => c.id === company.id)?.isTarget).toBe(true);
  });
});

describe("create-then-immediately-select", () => {
  it("createContact resolves to a real, usable record synchronously awaitable in the same handler", async () => {
    const { result } = renderHook(() => useTrackerData());
    const contact = await act(() => result.current.createContact({ name: "Sam", notes: "" }));
    expect(contact.id).toBeTypeOf("number");
    expect(result.current.contacts.find((c) => c.id === contact.id)?.name).toBe("Sam");
  });
});
