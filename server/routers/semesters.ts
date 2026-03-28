import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createSemester,
  deleteSemester,
  getActiveSemester,
  getAllSemesters,
  getSemesterById,
  setActiveSemester,
  updateSemester,
} from "../db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

export const semestersRouter = router({
  list: protectedProcedure.query(() => getAllSemesters()),

  getActive: protectedProcedure.query(async () => {
    const result = await getActiveSemester();
    return result ?? null;
  }),

  getById: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(({ input }) => getSemesterById(input.id)),

  create: adminProcedure
    .input(
      z.object({
        name: z.string().min(1),
        academicYear: z.string().min(1),
        term: z.enum(["Fall", "Spring", "Summer"]),
        startDate: z.string(),
        endDate: z.string(),
        enrollmentDeadline: z.string().optional(),
        dropDeadline: z.string().optional(),
        isActive: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ input }) => {
      const semData = {
        ...input,
        startDate: new Date(input.startDate),
        endDate: new Date(input.endDate),
        enrollmentDeadline: input.enrollmentDeadline ? new Date(input.enrollmentDeadline) : undefined,
        dropDeadline: input.dropDeadline ? new Date(input.dropDeadline) : undefined,
      };
      await createSemester(semData as unknown as Parameters<typeof createSemester>[0]);
      return { success: true };
    }),

  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        academicYear: z.string().optional(),
        term: z.enum(["Fall", "Spring", "Summer"]).optional(),
        startDate: z.string().optional(),
        endDate: z.string().optional(),
        enrollmentDeadline: z.string().optional(),
        dropDeadline: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateSemester(id, data as Parameters<typeof updateSemester>[1]);
      return { success: true };
    }),

  setActive: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await setActiveSemester(input.id);
      return { success: true };
    }),

  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteSemester(input.id);
      return { success: true };
    }),
});
