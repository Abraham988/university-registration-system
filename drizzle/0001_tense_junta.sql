DROP INDEX "grades_enrollmentId_unique";--> statement-breakpoint
DROP INDEX "users_openId_unique";--> statement-breakpoint
ALTER TABLE `course_assignments` ALTER COLUMN "assignedAt" TO "assignedAt" text DEFAULT '2026-03-28T13:24:14.590Z';--> statement-breakpoint
CREATE UNIQUE INDEX `grades_enrollmentId_unique` ON `grades` (`enrollmentId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
ALTER TABLE `courses` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-28T13:24:14.588Z';--> statement-breakpoint
ALTER TABLE `courses` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-28T13:24:14.589Z';--> statement-breakpoint
ALTER TABLE `enrollments` ALTER COLUMN "enrolledAt" TO "enrolledAt" text DEFAULT '2026-03-28T13:24:14.590Z';--> statement-breakpoint
ALTER TABLE `enrollments` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-28T13:24:14.590Z';--> statement-breakpoint
ALTER TABLE `grades` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-28T13:24:14.592Z';--> statement-breakpoint
ALTER TABLE `grades` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-28T13:24:14.592Z';--> statement-breakpoint
ALTER TABLE `notifications` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-28T13:24:14.594Z';--> statement-breakpoint
ALTER TABLE `semesters` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-28T13:24:14.586Z';--> statement-breakpoint
ALTER TABLE `semesters` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-28T13:24:14.587Z';--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-28T13:24:14.578Z';--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-28T13:24:14.583Z';--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "lastSignedIn" TO "lastSignedIn" text DEFAULT '2026-03-28T13:24:14.583Z';--> statement-breakpoint
ALTER TABLE `users` ADD `password` text;