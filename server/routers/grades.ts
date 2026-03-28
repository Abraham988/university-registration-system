import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createNotification,
  getCourseById,
  getCourseRoster,
  getEnrollmentById,
  getGradeByEnrollmentId,
  getStudentGrades,
  upsertGrade,
} from "../db";
import { calculateCumulativeGPA, calculateLetterGrade, calculateTotalScore } from "../../shared/gpa";

const lecturerOrAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "lecturer")
    throw new TRPCError({ code: "FORBIDDEN", message: "Lecturer or admin access required" });
  return next({ ctx });
});

export const gradesRouter = router({
  // Lecturer/Admin: upload/update grades for a student
  upsert: lecturerOrAdminProcedure
    .input(
      z.object({
        enrollmentId: z.number(),
        assignmentScore: z.number().min(0).max(100).optional(),
        midtermScore: z.number().min(0).max(100).optional(),
        finalScore: z.number().min(0).max(100).optional(),
        remarks: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const enrollment = await getEnrollmentById(input.enrollmentId);
      if (!enrollment) throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });

      const total = calculateTotalScore(
        input.assignmentScore ?? null,
        input.midtermScore ?? null,
        input.finalScore ?? null
      );
      const { letterGrade, gradePoints } = calculateLetterGrade(total);

      await upsertGrade({
        enrollmentId: input.enrollmentId,
        assignmentScore: input.assignmentScore?.toString(),
        midtermScore: input.midtermScore?.toString(),
        finalScore: input.finalScore?.toString(),
        totalScore: total.toString(),
        letterGrade,
        gradePoints: gradePoints.toString(),
        remarks: input.remarks,
        gradedBy: ctx.user.id,
        gradedAt: new Date(),
      });

      // Notify student
      const course = await getCourseById(enrollment.courseId);
      await createNotification({
        userId: enrollment.studentId,
        title: "Grades Updated",
        message: `Your grades for ${course?.name ?? "a course"} have been updated. Total: ${total.toFixed(1)} — ${letterGrade}`,
        type: "info",
        link: "/student/grades",
      });

      return { success: true, total, letterGrade, gradePoints };
    }),

  // Lecturer/Admin: get all grades for a course
  byCourse: lecturerOrAdminProcedure
    .input(z.object({ courseId: z.number() }))
    .query(async ({ input }) => {
      return getCourseRoster(input.courseId);
    }),

  // Student: get my grades
  myGrades: protectedProcedure.query(async ({ ctx }) => {
    const records = await getStudentGrades(ctx.user.id);
    const gpaEntries = records.map((r) => ({
      credits: r.course.credits,
      gradePoints: r.grade?.gradePoints ?? null,
      letterGrade: r.grade?.letterGrade ?? null,
      status: r.enrollment.status,
    }));
    const cumulativeGPA = calculateCumulativeGPA(gpaEntries);
    return { records, cumulativeGPA };
  }),

  // Student: get grade for a specific enrollment
  byEnrollment: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const enrollment = await getEnrollmentById(input.enrollmentId);
      if (!enrollment) throw new TRPCError({ code: "NOT_FOUND" });
      if (enrollment.studentId !== ctx.user.id && ctx.user.role === "student") {
        throw new TRPCError({ code: "FORBIDDEN" });
      }
      return getGradeByEnrollmentId(input.enrollmentId);
    }),
});
