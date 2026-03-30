import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  assignLecturerToCourse,
  createCourse,
  deleteCourse,
  getAllCourseAssignments,
  getAllCourses,
  getCourseAssignment,
  getCourseById,
  getCourseEnrollmentCount,
  getLecturerCourses,
  removeCourseAssignment,
  updateCourse,
} from "../db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin")
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Admin access required",
    });
  return next({ ctx });
});

const lecturerOrAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "lecturer")
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Lecturer or admin access required",
    });
  return next({ ctx });
});

export const coursesRouter = router({
  list: protectedProcedure
    .input(
      z
        .object({
          semesterId: z.number().optional(),
          department: z.string().optional(),
          level: z.string().optional(),
          search: z.string().optional(),
          isActive: z.boolean().optional(),
        })
        .optional()
    )
    .query(async ({ input }) => {
      const coursesList = await getAllCourses(input);
      // Get assignments for all courses
      const coursesWithAssignments = await Promise.all(
        coursesList.map(async course => {
          const assignment = await getCourseAssignment(course.id);
          const enrollmentCount = await getCourseEnrollmentCount(course.id);
          return { ...course, assignment, enrollmentCount };
        })
      );
      return coursesWithAssignments;
    }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const course = await getCourseById(input.id);
      if (!course)
        throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      const enrollmentCount = await getCourseEnrollmentCount(input.id);
      const assignment = await getCourseAssignment(input.id);
      return { ...course, enrollmentCount, assignment };
    }),

  getEnrollmentCount: protectedProcedure
    .input(z.object({ courseId: z.number() }))
    .query(({ input }) => getCourseEnrollmentCount(input.courseId)),

  create: adminProcedure
    .input(
      z.object({
        code: z.string().min(1),
        name: z.string().min(1),
        description: z.string().optional(),
        credits: z.number().min(1).max(6).default(3),
        capacity: z.number().min(1).default(30),
        department: z.string().optional(),
        level: z.enum(["100", "200", "300", "400", "500", "600"]).optional(),
        semesterId: z.number(),
        scheduleDay: z.string().optional(),
        scheduleTime: z.string().optional(),
        room: z.string().optional(),
        prerequisites: z.string().optional(),
        isActive: z.boolean().optional().default(true),
      })
    )
    .mutation(async ({ input }) => {
      await createCourse(input as Parameters<typeof createCourse>[0]);
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        code: z.string().min(1).optional(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        credits: z.number().min(1).max(6).optional(),
        capacity: z.number().min(1).optional(),
        department: z.string().optional(),
        level: z.enum(["100", "200", "300", "400", "500", "600"]).optional(),
        semesterId: z.number().optional(),
        scheduleDay: z.string().optional(),
        scheduleTime: z.string().optional(),
        room: z.string().optional(),
        prerequisites: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateCourse(id, data as Parameters<typeof updateCourse>[1]);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteCourse(input.id);
      return { success: true };
    }),

  // Lecturer assignment
  assignLecturer: adminProcedure
    .input(z.object({ courseId: z.number(), lecturerId: z.number() }))
    .mutation(async ({ input }) => {
      await assignLecturerToCourse(input);
      return { success: true };
    }),

  removeAssignment: adminProcedure
    .input(z.object({ courseId: z.number() }))
    .mutation(async ({ input }) => {
      await removeCourseAssignment(input.courseId);
      return { success: true };
    }),

  getAllAssignments: adminProcedure.query(() => getAllCourseAssignments()),

  // Lecturer: get my assigned courses
  myAssignedCourses: lecturerOrAdminProcedure.query(({ ctx }) =>
    getLecturerCourses(ctx.user.id)
  ),
});
