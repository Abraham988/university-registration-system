import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { publicProcedure, router } from "./_core/trpc";
import { coursesRouter } from "./routers/courses";
import { enrollmentsRouter } from "./routers/enrollments";
import { gradesRouter } from "./routers/grades";
import { notificationsRouter } from "./routers/notifications";
import { reportsRouter } from "./routers/reports";
import { semestersRouter } from "./routers/semesters";
import { usersRouter } from "./routers/users";
import * as db from "./db";
import { SignJWT } from "jose";
import { z } from "zod";

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
});

const registerSchema = z.object({
  name: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
  role: z.enum(["student", "lecturer", "admin"]),
});

async function createSessionToken(openId: string, role: string, name: string) {
  const secret = new TextEncoder().encode(
    process.env.JWT_SECRET || "local-secret-1234"
  );
  const token = await new SignJWT({ openId, role, name })
    .setProtectedHeader({ alg: "HS256" })
    .setExpirationTime("7d")
    .setIssuedAt()
    .sign(secret);
  return token;
}

export const appRouter = router({
  system: systemRouter,

  auth: router({
    me: publicProcedure.query(opts => opts.ctx.user),

    login: publicProcedure
      .input(loginSchema)
      .mutation(async ({ input, ctx }) => {
        const user = await db.getUserByEmail(input.email);
        if (!user || user.password !== input.password) {
          throw new Error("Invalid email or password");
        }

        const token = await createSessionToken(
          user.openId,
          user.role,
          user.name || ""
        );

        const cookieOptions = getSessionCookieOptions(ctx.req);
        ctx.res.cookie(COOKIE_NAME, token, cookieOptions);

        return { success: true, role: user.role };
      }),

    register: publicProcedure
      .input(registerSchema)
      .mutation(async ({ input }) => {
        const existing = await db.getUserByEmail(input.email);
        if (existing) {
          throw new Error("Email already registered");
        }

        const openId = `local-${input.email}`;
        await db.upsertUser({
          openId,
          name: input.name,
          email: input.email,
          password: input.password,
          role: input.role,
          loginMethod: "local",
          lastSignedIn: new Date().toISOString(),
        });

        return { success: true };
      }),

    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  // Feature routers
  semesters: semestersRouter,
  courses: coursesRouter,
  enrollments: enrollmentsRouter,
  grades: gradesRouter,
  users: usersRouter,
  notifications: notificationsRouter,
  reports: reportsRouter,
});

export type AppRouter = typeof appRouter;
