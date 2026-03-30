CREATE TABLE `program_courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`programId` integer NOT NULL,
	`courseId` integer NOT NULL,
	`year` integer NOT NULL,
	`semester` integer NOT NULL,
	`isCore` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT '2026-03-29T19:51:19.193Z'
);
--> statement-breakpoint
CREATE TABLE `programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`faculty` text NOT NULL,
	`department` text NOT NULL,
	`durationYears` integer DEFAULT 4 NOT NULL,
	`description` text,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT '2026-03-29T19:51:19.193Z'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `programs_code_unique` ON `programs` (`code`);--> statement-breakpoint
CREATE TABLE `student_programs` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`studentId` integer NOT NULL,
	`programId` integer NOT NULL,
	`yearOfStudy` integer DEFAULT 1 NOT NULL,
	`enrollmentDate` text DEFAULT '2026-03-29T19:51:19.194Z',
	`isActive` integer DEFAULT true NOT NULL
);
--> statement-breakpoint
DROP INDEX "grades_enrollmentId_unique";--> statement-breakpoint
DROP INDEX "programs_code_unique";--> statement-breakpoint
DROP INDEX "users_openId_unique";--> statement-breakpoint
ALTER TABLE `course_assignments` ALTER COLUMN "assignedAt" TO "assignedAt" text DEFAULT '2026-03-29T19:51:19.194Z';--> statement-breakpoint
CREATE UNIQUE INDEX `grades_enrollmentId_unique` ON `grades` (`enrollmentId`);--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);--> statement-breakpoint
ALTER TABLE `courses` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-29T19:51:19.194Z';--> statement-breakpoint
ALTER TABLE `courses` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-29T19:51:19.194Z';--> statement-breakpoint
ALTER TABLE `enrollments` ALTER COLUMN "enrolledAt" TO "enrolledAt" text DEFAULT '2026-03-29T19:51:19.194Z';--> statement-breakpoint
ALTER TABLE `enrollments` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-29T19:51:19.194Z';--> statement-breakpoint
ALTER TABLE `grades` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-29T19:51:19.194Z';--> statement-breakpoint
ALTER TABLE `grades` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-29T19:51:19.194Z';--> statement-breakpoint
ALTER TABLE `notifications` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-29T19:51:19.195Z';--> statement-breakpoint
ALTER TABLE `semesters` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-29T19:51:19.193Z';--> statement-breakpoint
ALTER TABLE `semesters` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-29T19:51:19.193Z';--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "createdAt" TO "createdAt" text DEFAULT '2026-03-29T19:51:19.191Z';--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "updatedAt" TO "updatedAt" text DEFAULT '2026-03-29T19:51:19.191Z';--> statement-breakpoint
ALTER TABLE `users` ALTER COLUMN "lastSignedIn" TO "lastSignedIn" text DEFAULT '2026-03-29T19:51:19.191Z';