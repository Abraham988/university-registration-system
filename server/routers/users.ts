import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { deleteUser, getAllUsers, getUserById, updateUser } from "../db";

const adminProcedure = protectedProcedure.use(({ ctx, next }) => {
  if (ctx.user.role !== "admin") throw new TRPCError({ code: "FORBIDDEN", message: "Admin access required" });
  return next({ ctx });
});

export const usersRouter = router({
  // Admin: list all users with optional filters
  list: adminProcedure
    .input(
      z.object({
        role: z.enum(["student", "lecturer", "admin"]).optional(),
        search: z.string().optional(),
      }).optional()
    )
    .query(({ input }) => getAllUsers(input?.role, input?.search)),

  // Admin: get single user
  getById: adminProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ input }) => {
      const user = await getUserById(input.id);
      if (!user) throw new TRPCError({ code: "NOT_FOUND", message: "User not found" });
      return user;
    }),

  // Admin: update user role or profile
  update: adminProcedure
    .input(
      z.object({
        id: z.number(),
        role: z.enum(["student", "lecturer", "admin"]).optional(),
        name: z.string().optional(),
        email: z.string().email().optional(),
        department: z.string().optional(),
        studentId: z.string().optional(),
        employeeId: z.string().optional(),
        phone: z.string().optional(),
        isActive: z.boolean().optional(),
      })
    )
    .mutation(async ({ input }) => {
      const { id, ...data } = input;
      await updateUser(id, data as Parameters<typeof updateUser>[1]);
      return { success: true };
    }),

  // Admin: delete user
  delete: adminProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ input }) => {
      await deleteUser(input.id);
      return { success: true };
    }),

  // Any authenticated user: update own profile
  updateProfile: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional(),
        email: z.string().email().optional(),
        department: z.string().optional(),
        phone: z.string().optional(),
        address: z.string().optional(),
        bio: z.string().optional(),
        dateOfBirth: z.string().optional(),
        profilePicture: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await updateUser(ctx.user.id, input as Parameters<typeof updateUser>[1]);
      return { success: true };
    }),

  // Get lecturers list (for assignment dropdowns)
  lecturers: protectedProcedure.query(() => getAllUsers("lecturer")),

  // Get students list (admin/lecturer)
  students: protectedProcedure.use(({ ctx, next }) => {
    if (ctx.user.role === "student") throw new TRPCError({ code: "FORBIDDEN" });
    return next({ ctx });
  }).query(() => getAllUsers("student")),
});
