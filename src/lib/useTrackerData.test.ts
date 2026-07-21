import { act, cleanup, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { applications, companies as initialCompanies } from "./data";
import { useTrackerData } from "./useTrackerData";
import type { Application, Company } from "./types";

function makeApplication(overrides: Partial<Application> = {}): Application {
  return {
    id: "app-1",
    companyId: "company-1",
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
    interviews: [],
    followUps: [],
    ...overrides,
  };
}

function makeCompany(overrides: Partial<Company> = {}): Company {
  return {
    id: "company-1",
    name: "Acme Corp",
    isTarget: true,
    status: "researching",
    locations: [],
    notes: "",
    ...overrides,
  };
}

beforeEach(() => {
  window.localStorage.clear();
});

afterEach(() => {
  cleanup();
});

describe("addApplication", () => {
  it("prepends the new application to the list", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.createCompany(makeCompany());
    });
    act(() => {
      result.current.addApplication(makeApplication({ id: "new-app" }));
    });
    expect(result.current.apps[0].id).toBe("new-app");
  });

  it("advances a researching/watching company to applied once a real application is logged", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.createCompany(makeCompany({ id: "c1", status: "watching" }));
    });
    act(() => {
      result.current.addApplication(makeApplication({ companyId: "c1", status: "applied" }));
    });
    expect(result.current.companies.find((c) => c.id === "c1")?.status).toBe("applied");
  });

  it("leaves the company status alone when the application is only queued ('todo')", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.createCompany(makeCompany({ id: "c1", status: "watching" }));
    });
    act(() => {
      result.current.addApplication(makeApplication({ companyId: "c1", status: "todo" }));
    });
    expect(result.current.companies.find((c) => c.id === "c1")?.status).toBe("watching");
  });

  it("doesn't regress a company that's past the applied stage", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.createCompany(makeCompany({ id: "c1", status: "not_pursuing" }));
    });
    act(() => {
      result.current.addApplication(makeApplication({ companyId: "c1", status: "applied" }));
    });
    expect(result.current.companies.find((c) => c.id === "c1")?.status).toBe("not_pursuing");
  });
});

describe("changeApplicationStatus", () => {
  it("updates the status and appends a status history entry", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.addApplication(makeApplication({ id: "a1", status: "applied" }));
    });
    act(() => {
      result.current.changeApplicationStatus("a1", "interviewing", "Jul 10, 2026");
    });
    const app = result.current.apps.find((a) => a.id === "a1");
    expect(app?.status).toBe("interviewing");
    expect(app?.statusHistory.at(-1)).toEqual({ status: "interviewing", at: "Jul 10, 2026" });
  });

  it("advances the company status alongside the application", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.createCompany(makeCompany({ id: "c1", status: "researching" }));
    });
    act(() => {
      result.current.addApplication(makeApplication({ id: "a1", companyId: "c1", status: "todo" }));
    });
    act(() => {
      result.current.changeApplicationStatus("a1", "applied", "Jul 5, 2026");
    });
    expect(result.current.companies.find((c) => c.id === "c1")?.status).toBe("applied");
  });
});

describe("logInterview", () => {
  it("auto-transitions an 'applied' application to 'interviewing'", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.addApplication(makeApplication({ id: "a1", status: "applied" }));
    });
    act(() => {
      result.current.logInterview("a1", {
        type: "Recruiter Screen",
        date: "Jul 8, 2026",
        notes: "",
      });
    });
    const app = result.current.apps.find((a) => a.id === "a1");
    expect(app?.status).toBe("interviewing");
    expect(app?.statusHistory.at(-1)).toEqual({ status: "interviewing", at: "Jul 8, 2026" });
    expect(app?.interviews).toHaveLength(1);
  });

  it("doesn't touch the status when the application is already past 'applied'", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.addApplication(makeApplication({ id: "a1", status: "interviewing" }));
    });
    act(() => {
      result.current.logInterview("a1", {
        type: "Technical Screen",
        date: "Jul 9, 2026",
        notes: "",
      });
    });
    const app = result.current.apps.find((a) => a.id === "a1");
    expect(app?.status).toBe("interviewing");
    expect(app?.statusHistory).toHaveLength(1);
    expect(app?.interviews).toHaveLength(1);
  });

  it("registers unseen interview categories so they're available as options later", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.addApplication(makeApplication({ id: "a1", status: "applied" }));
    });
    act(() => {
      result.current.logInterview("a1", {
        type: "Technical Interview",
        date: "Jul 9, 2026",
        notes: "",
        categories: ["System Design", "SQL"],
      });
    });
    expect(result.current.interviewCategories).toEqual(expect.arrayContaining(["System Design", "SQL"]));
  });
});

describe("editInterview", () => {
  it("replaces the fields of an existing interview by id", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.addApplication(makeApplication({ id: "a1", status: "applied" }));
    });
    act(() => {
      result.current.logInterview("a1", { type: "Recruiter Screen", date: "Jul 8, 2026", notes: "first" });
    });
    const interviewId = result.current.apps.find((a) => a.id === "a1")!.interviews[0].id;
    act(() => {
      result.current.editInterview("a1", interviewId, {
        type: "Technical Screen",
        date: "Jul 9, 2026",
        notes: "updated",
      });
    });
    const interview = result.current.apps.find((a) => a.id === "a1")!.interviews[0];
    expect(interview).toEqual({ id: interviewId, type: "Technical Screen", date: "Jul 9, 2026", notes: "updated" });
  });
});

describe("deleteApplication", () => {
  it("removes the application and any tasks referencing it", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.clearAllData();
    });
    act(() => {
      result.current.addApplication(makeApplication({ id: "a1" }));
    });
    act(() => {
      result.current.addTask("a1", "Follow up", "Jul 15, 2026", { type: "manual" });
    });
    expect(result.current.tasks).toHaveLength(1);

    act(() => {
      result.current.deleteApplication("a1");
    });
    expect(result.current.apps.find((a) => a.id === "a1")).toBeUndefined();
    expect(result.current.tasks).toHaveLength(0);
  });
});

describe("dismissTask", () => {
  it("marks the task dismissed without removing it", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.clearAllData();
    });
    act(() => {
      result.current.addApplication(makeApplication({ id: "a1" }));
    });
    act(() => {
      result.current.addTask("a1", "Follow up", "Jul 15, 2026", { type: "manual" });
    });
    const taskId = result.current.tasks[0].id;
    act(() => {
      result.current.dismissTask(taskId);
    });
    expect(result.current.tasks.find((t) => t.id === taskId)?.status).toBe("dismissed");
  });
});

describe("toggleTarget", () => {
  it("flips a company's isTarget flag", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.createCompany(makeCompany({ id: "c1", isTarget: false }));
    });
    act(() => {
      result.current.toggleTarget("c1");
    });
    expect(result.current.companies.find((c) => c.id === "c1")?.isTarget).toBe(true);
  });
});

describe("clearAllData / resetDemoData", () => {
  it("clearAllData empties every collection", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.addApplication(makeApplication({ id: "a1" }));
      result.current.createCompany(makeCompany({ id: "c1" }));
    });
    act(() => {
      result.current.clearAllData();
    });
    expect(result.current.apps).toEqual([]);
    expect(result.current.companies).toEqual([]);
    expect(result.current.tasks).toEqual([]);
    expect(result.current.goals).toEqual({});
  });

  it("resetDemoData restores the seeded demo dataset", () => {
    const { result } = renderHook(() => useTrackerData());
    act(() => {
      result.current.clearAllData();
    });
    act(() => {
      result.current.resetDemoData();
    });
    expect(result.current.apps).toEqual(applications);
    expect(result.current.companies).toEqual(initialCompanies);
  });
});
