import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  checkExistingEnrollment,
  createNotification,
  dropEnrollment,
  enrollStudent,
  getAllEnrollments,
  getCourseById,
  getCourseEnrollmentCount,
  getCourseRoster,
  getEnrollmentById,
  getStudentEnrollments,
} from "../db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

const lecturerOrAdminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin" && ctx.user.role !== "lecturer")
    throw new TRPCError({ code: "FORBIDDEN", message: "Lecturer or admin access required" });
  return next({ ctx });
});

export const enrollmentsRouter = router({
  // Student: enroll in a course
  enroll: protectedProcedure
    .input(z.object({ courseId: z.number(), semesterId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      if (ctx.user.role !== "student") throw new TRPCError({ code: "FORBIDDEN", message: "Only students can enroll" });

      const course = await getCourseById(input.courseId);
      if (!course) throw new TRPCError({ code: "NOT_FOUND", message: "Course not found" });
      if (!course.isActive) throw new TRPCError({ code: "BAD_REQUEST", message: "Course is not active" });

      // Check for existing enrollment
      const existing = await checkExistingEnrollment(ctx.user.id, input.courseId);
      if (existing && existing.status === "enrolled") {
        throw new TRPCError({ code: "CONFLICT", message: "Already enrolled in this course" });
      }
      if (existing && existing.status === "waitlisted") {
        throw new TRPCError({ code: "CONFLICT", message: "Already on waitlist for this course" });
      }

      // Check capacity
      const enrolledCount = await getCourseEnrollmentCount(input.courseId);
      const status = enrolledCount >= course.capacity ? "waitlisted" : "enrolled";

      if (existing && existing.status === "dropped") {
        // Re-enroll by inserting fresh
      }

      await enrollStudent({
        studentId: ctx.user.id,
        courseId: input.courseId,
        semesterId: input.semesterId,
        status,
      });

      // Notification
      await createNotification({
        userId: ctx.user.id,
        title: status === "enrolled" ? "Enrollment Confirmed" : "Added to Waitlist",
        message:
          status === "enrolled"
            ? `You have successfully enrolled in ${course.name} (${course.code}).`
            : `You have been added to the waitlist for ${course.name} (${course.code}).`,
        type: status === "enrolled" ? "success" : "info",
        link: "/student/courses",
      });

      return { success: true, status };
    }),

  // Student: drop a course
  drop: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const enrollment = await getEnrollmentById(input.enrollmentId);
      if (!enrollment) throw new TRPCError({ code: "NOT_FOUND", message: "Enrollment not found" });
      if (enrollment.studentId !== ctx.user.id && ctx.user.role !== "admin") {
        throw new TRPCError({ code: "FORBIDDEN", message: "Cannot drop another student's enrollment" });
      }
      if (enrollment.status === "dropped") {
        throw new TRPCError({ code: "BAD_REQUEST", message: "Already dropped" });
      }

      await dropEnrollment(input.enrollmentId);

      const course = await getCourseById(enrollment.courseId);
      await createNotification({
        userId: ctx.user.id,
        title: "Course Dropped",
        message: `You have dropped ${course?.name ?? "the course"} (${course?.code ?? ""}).`,
        type: "warning",
        link: "/student/courses",
      });

      return { success: true };
    }),

  // Student: get my enrollments
  myCourses: protectedProcedure
    .input(z.object({ semesterId: z.number().optional() }).optional())
    .query(({ ctx, input }) => getStudentEnrollments(ctx.user.id, input?.semesterId)),

  // Lecturer/Admin: get class roster for a course
  roster: lecturerOrAdminProcedure
    .input(z.object({ courseId: z.number() }))
    .query(({ input }) => getCourseRoster(input.courseId)),

  // Admin: get all enrollments
  all: adminProcedure
    .input(
      z.object({
        semesterId: z.number().optional(),
        status: z.string().optional(),
      }).optional()
    )
    .query(({ input }) => getAllEnrollments(input)),
  // Admin: remove an enrollment
  remove: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await dropEnrollment(input.id);
      return { success: true };
    }),
});
