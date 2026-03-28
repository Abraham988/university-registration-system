import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getUserNotifications,
  getUnreadNotificationCount,
  markAllNotificationsRead,
  markNotificationRead,
} from "../db";

export const notificationsRouter = router({
  list: protectedProcedure.query(({ ctx }) => getUserNotifications(ctx.user.id)),

  unreadCount: protectedProcedure.query(({ ctx }) => getUnreadNotificationCount(ctx.user.id)),

  markRead: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => markNotificationRead(input.id, ctx.user.id)),

  markAllRead: protectedProcedure.mutation(({ ctx }) => markAllNotificationsRead(ctx.user.id)),
});
