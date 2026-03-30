import { TRPCError } from "@trpc/server";
import { z } from "zod";
import {
  adminProcedure,
  protectedProcedure,
  publicProcedure,
  router,
} from "../_core/trpc";
import {
  enrollStudentInProgram,
  getAllPrograms,
  getProgramById,
  getProgramCourses,
  getStudentProgram,
} from "../db";

export const programsRouter = router({
  // Public: list all programs (for registration page)
  list: publicProcedure.query(() => getAllPrograms()),

  // Get single program
  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const program = await getProgramById(input.id);
      if (!program)
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      return program;
    }),

  // Get program courses (for curriculum view)
  curriculum: protectedProcedure
    .input(z.object({ programId: z.number() }))
    .query(async ({ input }) => {
      const courses = await getProgramCourses(input.programId);
      return courses;
    }),

  // Student: enroll in a program (called after registration or from profile)
  enroll: protectedProcedure
    .input(
      z.object({
        programId: z.number(),
        yearOfStudy: z.number().min(1).max(8).default(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "student") {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: "Only students can enroll in programs",
        });
      }

      // Check if already enrolled
      const existing = await getStudentProgram(ctx.user.id);
      if (existing) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "Already enrolled in a program",
        });
      }

      const program = await getProgramById(input.programId);
      if (!program) {
        throw new TRPCError({
          code: "NOT_FOUND",
          message: "Program not found",
        });
      }

      // Enroll in program
      await enrollStudentInProgram({
        studentId: ctx.user.id,
        programId: input.programId,
        yearOfStudy: input.yearOfStudy,
        isActive: true,
      });

      // Auto-enroll in courses for this year and current semester
      const {
        getProgramCourses,
        getActiveSemester,
        enrollStudent,
        getCourseById,
      } = await import("../db");
      const programCourses = await getProgramCourses(input.programId);
      const activeSemester = await getActiveSemester();

      if (activeSemester) {
        const yearCourses = programCourses.filter(
          pc =>
            pc.programCourse.year === input.yearOfStudy &&
            pc.programCourse.semester === 1
        );
        for (const pc of yearCourses) {
          await enrollStudent({
            studentId: ctx.user.id,
            courseId: pc.course.id,
            semesterId: activeSemester.id,
            status: "enrolled",
          });
        }
      }

      return { success: true, program };
    }),

  // Student: get my program
  myProgram: protectedProcedure.query(async ({ ctx }) => {
    if (ctx.user.role !== "student") return null;
    return getStudentProgram(ctx.user.id);
  }),

  // Admin: create program
  create: adminProcedure
    .input(
      z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        faculty: z.string().min(1),
        department: z.string().min(1),
        durationYears: z.number().min(1).max(8).default(4),
        description: z.string().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { createProgram } = await import("../db");
      await createProgram(input as any);
      return { success: true };
    }),

  // Admin: list all programs (including inactive)
  all: adminProcedure.query(() => getAllPrograms()),
});
