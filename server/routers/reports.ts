import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getDepartmentStats,
  getEnrollmentStats,
  getGradeDistribution,
  getSystemStats,
  getAllUsers,
  getAllEnrollments,
  getStudentGrades,
} from "../db";
import { calculateCumulativeGPA } from "../../shared/gpa";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

export const reportsRouter = router({
  systemStats: adminProcedure.query(() => getSystemStats()),

  enrollmentStats: adminProcedure
    .input(z.object({ semesterId: z.number().optional() }).optional())
    .query(({ input }) => getEnrollmentStats(input?.semesterId)),

  gradeDistribution: adminProcedure
    .input(z.object({ semesterId: z.number().optional() }).optional())
    .query(({ input }) => getGradeDistribution(input?.semesterId)),

  departmentStats: adminProcedure.query(() => getDepartmentStats()),

  // Export enrollment data as structured JSON (client can convert to CSV)
  exportEnrollments: adminProcedure
    .input(z.object({ semesterId: z.number().optional() }).optional())
    .query(async ({ input }) => {
      const enrollments = await getAllEnrollments(
        input?.semesterId ? { semesterId: input.semesterId } : undefined
      );
      return enrollments.map((e) => ({
        studentName: e.student.name,
        studentEmail: e.student.email,
        studentId: e.student.studentId,
        courseName: e.course.name,
        courseCode: e.course.code,
        department: e.course.department,
        credits: e.course.credits,
        status: e.enrollment.status,
        enrolledAt: e.enrollment.enrolledAt,
      }));
    }),

  // Export student performance data
  exportPerformance: adminProcedure.query(async () => {
    const students = await getAllUsers("student");
    const results = [];
    for (const student of students.slice(0, 100)) {
      const gradeRecords = await getStudentGrades(student.id);
      const gpaEntries = gradeRecords.map((r) => ({
        credits: r.course.credits,
        gradePoints: r.grade?.gradePoints ?? null,
        letterGrade: r.grade?.letterGrade ?? null,
        status: r.enrollment.status,
      }));
      const gpa = calculateCumulativeGPA(gpaEntries);
      results.push({
        studentName: student.name,
        studentEmail: student.email,
        studentId: student.studentId,
        department: student.department,
        gpa,
        totalCourses: gradeRecords.length,
      });
    }
    return results;
  }),
});
