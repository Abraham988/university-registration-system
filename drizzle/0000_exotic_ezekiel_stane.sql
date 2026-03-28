CREATE TABLE `course_assignments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`courseId` integer NOT NULL,
	`lecturerId` integer NOT NULL,
	`assignedAt` text DEFAULT '2026-03-28T12:41:08.565Z'
);
--> statement-breakpoint
CREATE TABLE `courses` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`code` text NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`credits` integer DEFAULT 3 NOT NULL,
	`capacity` integer DEFAULT 30 NOT NULL,
	`department` text,
	`level` text DEFAULT '100',
	`semesterId` integer NOT NULL,
	`scheduleDay` text,
	`scheduleTime` text,
	`room` text,
	`prerequisites` text,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT '2026-03-28T12:41:08.564Z',
	`updatedAt` text DEFAULT '2026-03-28T12:41:08.565Z'
);
--> statement-breakpoint
CREATE TABLE `enrollments` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`studentId` integer NOT NULL,
	`courseId` integer NOT NULL,
	`semesterId` integer NOT NULL,
	`status` text DEFAULT 'enrolled' NOT NULL,
	`enrolledAt` text DEFAULT '2026-03-28T12:41:08.565Z',
	`droppedAt` text,
	`updatedAt` text DEFAULT '2026-03-28T12:41:08.565Z'
);
--> statement-breakpoint
CREATE TABLE `grades` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`enrollmentId` integer NOT NULL,
	`assignmentScore` real,
	`midtermScore` real,
	`finalScore` real,
	`totalScore` real,
	`letterGrade` text,
	`gradePoints` real,
	`remarks` text,
	`gradedBy` integer,
	`gradedAt` text,
	`createdAt` text DEFAULT '2026-03-28T12:41:08.565Z',
	`updatedAt` text DEFAULT '2026-03-28T12:41:08.565Z'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `grades_enrollmentId_unique` ON `grades` (`enrollmentId`);--> statement-breakpoint
CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`userId` integer NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`type` text DEFAULT 'info' NOT NULL,
	`isRead` integer DEFAULT false NOT NULL,
	`link` text,
	`createdAt` text DEFAULT '2026-03-28T12:41:08.566Z'
);
--> statement-breakpoint
CREATE TABLE `semesters` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`academicYear` text NOT NULL,
	`term` text NOT NULL,
	`startDate` text NOT NULL,
	`endDate` text NOT NULL,
	`enrollmentDeadline` text,
	`dropDeadline` text,
	`isActive` integer DEFAULT false NOT NULL,
	`createdAt` text DEFAULT '2026-03-28T12:41:08.564Z',
	`updatedAt` text DEFAULT '2026-03-28T12:41:08.564Z'
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`openId` text NOT NULL,
	`name` text,
	`email` text,
	`loginMethod` text,
	`role` text DEFAULT 'student' NOT NULL,
	`studentId` text,
	`employeeId` text,
	`department` text,
	`phone` text,
	`address` text,
	`dateOfBirth` text,
	`profilePicture` text,
	`bio` text,
	`isActive` integer DEFAULT true NOT NULL,
	`createdAt` text DEFAULT '2026-03-28T12:41:08.554Z',
	`updatedAt` text DEFAULT '2026-03-28T12:41:08.562Z',
	`lastSignedIn` text DEFAULT '2026-03-28T12:41:08.562Z'
);
--> statement-breakpoint
CREATE UNIQUE INDEX `users_openId_unique` ON `users` (`openId`);