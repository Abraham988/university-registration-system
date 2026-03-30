import {
  integer,
  primaryKey,
  real,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

// ─── Users ────────────────────────────────────────────────────────────────────
export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  openId: text("openId").notNull().unique(),
  name: text("name"),
  email: text("email"),
  password: text("password"),
  loginMethod: text("loginMethod"),
  role: text("role", { enum: ["student", "lecturer", "admin"] })
    .default("student")
    .notNull(),
  studentId: text("studentId"),
  employeeId: text("employeeId"),
  department: text("department"),
  phone: text("phone"),
  address: text("address"),
  dateOfBirth: text("dateOfBirth"),
  profilePicture: text("profilePicture"),
  bio: text("bio"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("createdAt").default(new Date().toISOString()),
  updatedAt: text("updatedAt").default(new Date().toISOString()),
  lastSignedIn: text("lastSignedIn").default(new Date().toISOString()),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Semesters ────────────────────────────────────────────────────────────────
export const semesters = sqliteTable("semesters", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  academicYear: text("academicYear").notNull(),
  term: text("term", { enum: ["Fall", "Spring", "Summer"] }).notNull(),
  startDate: text("startDate").notNull(),
  endDate: text("endDate").notNull(),
  enrollmentDeadline: text("enrollmentDeadline"),
  dropDeadline: text("dropDeadline"),
  isActive: integer("isActive", { mode: "boolean" }).default(false).notNull(),
  createdAt: text("createdAt").default(new Date().toISOString()),
  updatedAt: text("updatedAt").default(new Date().toISOString()),
});

export type Semester = typeof semesters.$inferSelect;
export type InsertSemester = typeof semesters.$inferInsert;

// ─── Programs (e.g., BSc Computer Science) ─────────────────────────────────
export const programs = sqliteTable("programs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull().unique(),
  name: text("name").notNull(),
  faculty: text("faculty").notNull(), // e.g., Faculty of Science
  department: text("department").notNull(), // e.g., Computer Science
  durationYears: integer("durationYears").notNull().default(4),
  description: text("description"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("createdAt").default(new Date().toISOString()),
});

export type Program = typeof programs.$inferSelect;
export type InsertProgram = typeof programs.$inferInsert;

// ─── Program Courses (courses required for each program/year) ────────────────
export const programCourses = sqliteTable("program_courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  programId: integer("programId").notNull(),
  courseId: integer("courseId").notNull(),
  year: integer("year").notNull(), // Year 1, 2, 3, 4
  semester: integer("semester").notNull(), // Semester 1 or 2
  isCore: integer("isCore", { mode: "boolean" }).default(true).notNull(), // Core or elective
  createdAt: text("createdAt").default(new Date().toISOString()),
});

export type ProgramCourse = typeof programCourses.$inferSelect;
export type InsertProgramCourse = typeof programCourses.$inferInsert;

// ─── Student Programs (what program a student is enrolled in) ────────────────
export const studentPrograms = sqliteTable("student_programs", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("studentId").notNull(),
  programId: integer("programId").notNull(),
  yearOfStudy: integer("yearOfStudy").notNull().default(1),
  enrollmentDate: text("enrollmentDate").default(new Date().toISOString()),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
});

export type StudentProgram = typeof studentPrograms.$inferSelect;
export type InsertStudentProgram = typeof studentPrograms.$inferInsert;

// ─── Courses ──────────────────────────────────────────────────────────────────
export const courses = sqliteTable("courses", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  code: text("code").notNull(),
  name: text("name").notNull(),
  description: text("description"),
  credits: integer("credits").notNull().default(3),
  capacity: integer("capacity").notNull().default(30),
  department: text("department"),
  level: text("level", {
    enum: ["100", "200", "300", "400", "500", "600"],
  }).default("100"),
  semesterId: integer("semesterId").notNull(),
  scheduleDay: text("scheduleDay"),
  scheduleTime: text("scheduleTime"),
  room: text("room"),
  prerequisites: text("prerequisites"),
  isActive: integer("isActive", { mode: "boolean" }).default(true).notNull(),
  createdAt: text("createdAt").default(new Date().toISOString()),
  updatedAt: text("updatedAt").default(new Date().toISOString()),
});

export type Course = typeof courses.$inferSelect;
export type InsertCourse = typeof courses.$inferInsert;

// ─── Course Assignments (Lecturer → Course) ───────────────────────────────────
export const courseAssignments = sqliteTable("course_assignments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  courseId: integer("courseId").notNull(),
  lecturerId: integer("lecturerId").notNull(),
  assignedAt: text("assignedAt").default(new Date().toISOString()),
});

export type CourseAssignment = typeof courseAssignments.$inferSelect;
export type InsertCourseAssignment = typeof courseAssignments.$inferInsert;

// ─── Enrollments (Student → Course) ──────────────────────────────────────────
export const enrollments = sqliteTable("enrollments", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  studentId: integer("studentId").notNull(),
  courseId: integer("courseId").notNull(),
  semesterId: integer("semesterId").notNull(),
  status: text("status", {
    enum: ["enrolled", "dropped", "completed", "waitlisted"],
  })
    .default("enrolled")
    .notNull(),
  enrolledAt: text("enrolledAt").default(new Date().toISOString()),
  droppedAt: text("droppedAt"),
  updatedAt: text("updatedAt").default(new Date().toISOString()),
});

export type Enrollment = typeof enrollments.$inferSelect;
export type InsertEnrollment = typeof enrollments.$inferInsert;

// ─── Grades ───────────────────────────────────────────────────────────────────
export const grades = sqliteTable("grades", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  enrollmentId: integer("enrollmentId").notNull().unique(),
  assignmentScore: real("assignmentScore"),
  midtermScore: real("midtermScore"),
  finalScore: real("finalScore"),
  totalScore: real("totalScore"),
  letterGrade: text("letterGrade"),
  gradePoints: real("gradePoints"),
  remarks: text("remarks"),
  gradedBy: integer("gradedBy"),
  gradedAt: text("gradedAt"),
  createdAt: text("createdAt").default(new Date().toISOString()),
  updatedAt: text("updatedAt").default(new Date().toISOString()),
});

export type Grade = typeof grades.$inferSelect;
export type InsertGrade = typeof grades.$inferInsert;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = sqliteTable("notifications", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  userId: integer("userId").notNull(),
  title: text("title").notNull(),
  message: text("message").notNull(),
  type: text("type", { enum: ["info", "success", "warning", "error"] })
    .default("info")
    .notNull(),
  isRead: integer("isRead", { mode: "boolean" }).default(false).notNull(),
  link: text("link"),
  createdAt: text("createdAt").default(new Date().toISOString()),
});

export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
