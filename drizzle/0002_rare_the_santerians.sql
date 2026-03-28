DROP INDEX "grades_enrollmentId_unique";--> statement-breakpoint
DROP INDEX "users_openId_unique";--> statement-breakpoint
ALTER TABLE `course_assignments` ALTER COLUMN "assignedAt" TO "assignedAt" text DEFAULT '2026-03-28T13:35:32.439Z';--> statement-breakpoint
CREATE UNIQUE INDEX `grades_enrollmentId_unique` ON `grades` (`enrollmentId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
ALTER TABLE `courses` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-28T13:35:32.439Z';--> statement-breakpoint
ALTER TABLE `courses` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-28T13:35:32.439Z';--> statement-breakpoint
ALTER TABLE `enrollments` ALTER COLUMN "enrolledAt" TO "enrolledAt" text DEFAULT '2026-03-28T13:35:32.440Z';--> statement-breakpoint
ALTER TABLE `enrollments` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-28T13:35:32.440Z';--> statement-breakpoint
ALTER TABLE `grades` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-28T13:35:32.440Z';--> statement-breakpoint
ALTER TABLE `grades` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-28T13:35:32.440Z';--> statement-breakpoint
ALTER TABLE `notifications` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-28T13:35:32.440Z';--> statement-breakpoint
ALTER TABLE `semesters` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-28T13:35:32.438Z';--> statement-breakpoint
ALTER TABLE `semesters` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-28T13:35:32.438Z';--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-28T13:35:32.433Z';--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-28T13:35:32.435Z';--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "lastSignedIn" TO "lastSignedIn" text DEFAULT '2026-03-28T13:35:32.435Z';