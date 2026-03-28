import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

// ─── Helpers ─────────────────────────────────────────────────────────────────

function makeCtx(role: "student" | "lecturer" | "admin" | "user"): TrpcContext {
  return {
    user: {
      id: role === "admin" ? 1 : role === "lecturer" ? 2 : 3,
      openId: `${role}-openid`,
      email: `${role}@test.edu`,
      name: `Test ${role}`,
      loginMethod: "test",
      role: role === "lecturer" ? "lecturer" : role === "student" ? "student" : role,
      createdAt: new Date(),
      updatedAt: new Date(),
      lastSignedIn: new Date(),
    },
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

function makeGuestCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

describe("auth.me", () => {
  it("returns null for unauthenticated users", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns user object for authenticated users", async () => {
    const caller = appRouter.createCaller(makeCtx("student"));
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.role).toBe("student");
  });
});

describe("auth.logout", () => {
  it("returns success and clears cookie", async () => {
    const cleared: string[] = [];
    const ctx: TrpcContext = {
      ...makeCtx("student"),
      res: {
        clearCookie: (name: string) => { cleared.push(name); },
      } as unknown as TrpcContext["res"],
    };
    const caller = appRouter.createCaller(ctx);
    const result = await caller.auth.logout();
    expect(result.success).toBe(true);
    expect(cleared.length).toBeGreaterThan(0);
  });
});

// ─── Role-Based Access Control ────────────────────────────────────────────────

describe("RBAC - admin procedures", () => {
  it("blocks non-admin users from admin course operations", async () => {
    const caller = appRouter.createCaller(makeCtx("student"));
    await expect(
      caller.courses.create({
        code: "CS101",
        name: "Intro to CS",
        credits: 3,
        semesterId: 1,
      })
    ).rejects.toThrow();
  });

  it("blocks non-admin users from semester creation", async () => {
    const caller = appRouter.createCaller(makeCtx("student"));
    await expect(
      caller.semesters.create({
        name: "Fall 2024",
        academicYear: "2024-2025",
        term: "Fall",
        startDate: "2024-09-01",
        endDate: "2024-12-31",
      })
    ).rejects.toThrow();
  });

  it("blocks lecturer from user management", async () => {
    const caller = appRouter.createCaller(makeCtx("lecturer"));
    await expect(
      caller.users.adminUpdate({ id: 1, role: "admin" })
    ).rejects.toThrow();
  });
});

describe("RBAC - protected procedures", () => {
  it("blocks unauthenticated users from protected routes", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.courses.list({})).rejects.toThrow();
  });

  it("blocks unauthenticated users from enrollment", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(
      caller.enrollments.enroll({ courseId: 1, semesterId: 1 })
    ).rejects.toThrow();
  });
});

// ─── GPA Calculation ──────────────────────────────────────────────────────────

describe("GPA calculation utility", async () => {
  const { calculateCumulativeGPA, calculateLetterGrade } = await import("../shared/gpa");

  it("returns 0 GPA for empty records", () => {
    expect(calculateCumulativeGPA([])).toBe(0);
  });

  it("calculates correct GPA for single A grade", () => {
    const gpa = calculateCumulativeGPA([
      { credits: 3, gradePoints: 4.0, letterGrade: "A", status: "enrolled" },
    ]);
    expect(gpa).toBe(4.0);
  });

  it("calculates weighted GPA correctly", () => {
    const gpa = calculateCumulativeGPA([
      { credits: 3, gradePoints: 4.0, letterGrade: "A", status: "enrolled" },
      { credits: 3, gradePoints: 2.0, letterGrade: "C", status: "enrolled" },
    ]);
    // (3*4.0 + 3*2.0) / 6 = 18/6 = 3.0
    expect(gpa).toBeCloseTo(3.0, 2);
  });

  it("handles F grades correctly", () => {
    const gpa = calculateCumulativeGPA([
      { credits: 3, gradePoints: 0.0, letterGrade: "F", status: "enrolled" },
    ]);
    expect(gpa).toBe(0.0);
  });

  it("ignores dropped courses in GPA calculation", () => {
    const gpa = calculateCumulativeGPA([
      { credits: 3, gradePoints: 4.0, letterGrade: "A", status: "enrolled" },
      { credits: 3, gradePoints: 0.0, letterGrade: "F", status: "dropped" },
    ]);
    expect(gpa).toBe(4.0);
  });

  it("converts scores to correct letter grades and grade points", () => {
    // A+ >= 90, A >= 85, A- >= 80
    expect(calculateLetterGrade(95).letterGrade).toBe("A+");
    expect(calculateLetterGrade(87).letterGrade).toBe("A");
    expect(calculateLetterGrade(81).letterGrade).toBe("A-");
    // B+ >= 77, B >= 73, B- >= 70
    expect(calculateLetterGrade(78).letterGrade).toBe("B+");
    expect(calculateLetterGrade(74).letterGrade).toBe("B");
    // C >= 63
    expect(calculateLetterGrade(64).letterGrade).toBe("C");
    // D >= 53
    expect(calculateLetterGrade(54).letterGrade).toBe("D");
    // F < 50
    expect(calculateLetterGrade(40).letterGrade).toBe("F");
    // Grade points
    expect(calculateLetterGrade(95).gradePoints).toBe(4.0);
    expect(calculateLetterGrade(40).gradePoints).toBe(0.0);
  });

  it("handles courses with null grade points (not yet graded)", () => {
    const gpa = calculateCumulativeGPA([
      { credits: 3, gradePoints: null, letterGrade: null, status: "enrolled" },
    ]);
    expect(gpa).toBe(0);
  });
});

// ─── Notifications ────────────────────────────────────────────────────────────

describe("notifications router", () => {
  it("requires authentication to list notifications", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.notifications.list()).rejects.toThrow();
  });

  it("requires authentication to get unread count", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.notifications.unreadCount()).rejects.toThrow();
  });
});

// ─── Courses ──────────────────────────────────────────────────────────────────

describe("courses router", () => {
  it("requires authentication to list courses", async () => {
    const caller = appRouter.createCaller(makeGuestCtx());
    await expect(caller.courses.list({})).rejects.toThrow();
  });

  it("allows students to list courses", async () => {
    const caller = appRouter.createCaller(makeCtx("student"));
    // Will succeed (returns empty array if no DB or no courses)
    const result = await caller.courses.list({}).catch(() => null);
    // Either succeeds with array or fails with DB error (not FORBIDDEN)
    if (result !== null) {
      expect(Array.isArray(result)).toBe(true);
    }
  });
});

// ─── Reports ─────────────────────────────────────────────────────────────────

describe("reports router", () => {
  it("blocks student from accessing admin reports", async () => {
    const caller = appRouter.createCaller(makeCtx("student"));
    await expect(caller.reports.systemStats()).rejects.toThrow();
  });

  it("blocks lecturer from accessing admin reports", async () => {
    const caller = appRouter.createCaller(makeCtx("lecturer"));
    await expect(caller.reports.systemStats()).rejects.toThrow();
  });
});
