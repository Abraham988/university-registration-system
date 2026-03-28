import { and, desc, eq, like, or, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/libsql";
import { createClient } from "@libsql/client";
import path from "path";
import {
  CourseAssignment,
  Enrollment,
  Grade,
  InsertCourse,
  InsertCourseAssignment,
  InsertEnrollment,
  InsertGrade,
  InsertNotification,
  InsertSemester,
  InsertUser,
  Notification,
  Semester,
  courseAssignments,
  courses,
  enrollments,
  grades,
  notifications,
  semesters,
  users,
} from "../drizzle/schema";

const DB_PATH = path.resolve(process.cwd(), "dev.db");

let _db: ReturnType<typeof drizzle> | null = null;

function getClient() {
  return createClient({
    url: `file:${DB_PATH}`,
  });
}

export async function getDb() {
  if (!_db) {
    _db = drizzle(getClient());
  }
  return _db;
}

// ─── User Helpers ─────────────────────────────────────────────────────────────

export async function upsertUser(user: InsertUser): Promise<void> {
  const db = await getDb();
  if (!db) return;

  const values: Partial<InsertUser> = { openId: user.openId };
  const fields = [
    "name",
    "email",
    "password",
    "loginMethod",
    "role",
    "studentId",
    "employeeId",
    "department",
    "phone",
    "address",
    "dateOfBirth",
    "profilePicture",
    "bio",
    "isActive",
  ] as const;

  for (const f of fields) {
    if (user[f] !== undefined) {
      (values as any)[f] = user[f] ?? null;
    }
  }

  values.lastSignedIn = user.lastSignedIn ?? new Date().toISOString();

  await db
    .insert(users)
    .values(values as any)
    .onConflictDoUpdate({ target: users.openId, set: values });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.openId, openId))
    .limit(1);
  return result[0];
}

export async function getUserById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.id, id)).limit(1);
  return result[0];
}

export async function getUserByEmail(email: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return result[0];
}

export async function getAllUsers(role?: string, search?: string) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (role)
    conditions.push(eq(users.role, role as "student" | "lecturer" | "admin"));
  if (search) {
    conditions.push(
      or(
        like(users.name, `%${search}%`),
        like(users.email, `%${search}%`),
        like(users.studentId, `%${search}%`),
        like(users.employeeId, `%${search}%`)
      )
    );
  }
  return conditions.length > 0
    ? db
        .select()
        .from(users)
        .where(and(...conditions))
        .orderBy(desc(users.createdAt))
    : db.select().from(users).orderBy(desc(users.createdAt));
}

export async function updateUser(id: number, data: Partial<InsertUser>) {
  const db = await getDb();
  if (!db) return;
  await db.update(users).set(data).where(eq(users.id, id));
}

export async function deleteUser(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(users).where(eq(users.id, id));
}

// ─── Semester Helpers ─────────────────────────────────────────────────────────

export async function getAllSemesters() {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(semesters).orderBy(desc(semesters.createdAt));
}

export async function getActiveSemester() {
  const db = await getDb();
  if (!db) return null;
  const result = await db
    .select()
    .from(semesters)
    .where(eq(semesters.isActive, true))
    .limit(1);
  return result[0] ?? null;
}

export async function getSemesterById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(semesters)
    .where(eq(semesters.id, id))
    .limit(1);
  return result[0];
}

export async function createSemester(data: InsertSemester) {
  const db = await getDb();
  if (!db) return;
  await db.insert(semesters).values(data);
}

export async function updateSemester(
  id: number,
  data: Partial<InsertSemester>
) {
  const db = await getDb();
  if (!db) return;
  await db.update(semesters).set(data).where(eq(semesters.id, id));
}

export async function setActiveSemester(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.update(semesters).set({ isActive: false });
  await db
    .update(semesters)
    .set({ isActive: true })
    .where(eq(semesters.id, id));
}

export async function deleteSemester(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(semesters).where(eq(semesters.id, id));
}

// ─── Course Helpers ───────────────────────────────────────────────────────────

export async function getAllCourses(filters?: {
  semesterId?: number;
  department?: string;
  level?: string;
  search?: string;
  isActive?: boolean;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.semesterId)
    conditions.push(eq(courses.semesterId, filters.semesterId));
  if (filters?.department)
    conditions.push(eq(courses.department, filters.department));
  if (filters?.level)
    conditions.push(
      eq(
        courses.level,
        filters.level as "100" | "200" | "300" | "400" | "500" | "600"
      )
    );
  if (filters?.isActive !== undefined)
    conditions.push(eq(courses.isActive, filters.isActive));
  if (filters?.search) {
    conditions.push(
      or(
        like(courses.name, `%${filters.search}%`),
        like(courses.code, `%${filters.search}%`),
        like(courses.description, `%${filters.search}%`)
      )
    );
  }
  return conditions.length > 0
    ? db
        .select()
        .from(courses)
        .where(and(...conditions))
        .orderBy(courses.code)
    : db.select().from(courses).orderBy(courses.code);
}

export async function getCourseById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(courses)
    .where(eq(courses.id, id))
    .limit(1);
  return result[0];
}

export async function createCourse(data: InsertCourse) {
  const db = await getDb();
  if (!db) return;
  const result = await db.insert(courses).values(data);
  return result;
}

export async function updateCourse(id: number, data: Partial<InsertCourse>) {
  const db = await getDb();
  if (!db) return;
  await db.update(courses).set(data).where(eq(courses.id, id));
}

export async function deleteCourse(id: number) {
  const db = await getDb();
  if (!db) return;
  await db.delete(courses).where(eq(courses.id, id));
}

export async function getCourseEnrollmentCount(courseId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .where(
      and(
        eq(enrollments.courseId, courseId),
        eq(enrollments.status, "enrolled")
      )
    );
  return Number(result[0]?.count ?? 0);
}

// ─── Course Assignment Helpers ────────────────────────────────────────────────

export async function assignLecturerToCourse(data: InsertCourseAssignment) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(courseAssignments)
    .where(eq(courseAssignments.courseId, data.courseId));
  await db.insert(courseAssignments).values(data);
}

export async function getCourseAssignment(courseId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(courseAssignments)
    .where(eq(courseAssignments.courseId, courseId))
    .limit(1);
  return result[0];
}

export async function getLecturerCourses(lecturerId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      assignment: courseAssignments,
      course: courses,
    })
    .from(courseAssignments)
    .innerJoin(courses, eq(courseAssignments.courseId, courses.id))
    .where(eq(courseAssignments.lecturerId, lecturerId))
    .orderBy(courses.code);
}

export async function getAllCourseAssignments() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      assignment: courseAssignments,
      course: courses,
      lecturer: users,
    })
    .from(courseAssignments)
    .innerJoin(courses, eq(courseAssignments.courseId, courses.id))
    .innerJoin(users, eq(courseAssignments.lecturerId, users.id));
}

export async function removeCourseAssignment(courseId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .delete(courseAssignments)
    .where(eq(courseAssignments.courseId, courseId));
}

// ─── Enrollment Helpers ───────────────────────────────────────────────────────

export async function enrollStudent(data: InsertEnrollment) {
  const db = await getDb();
  if (!db) return;
  await db.insert(enrollments).values(data);
}

export async function dropEnrollment(enrollmentId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(enrollments)
    .set({ status: "dropped", droppedAt: new Date().toISOString() })
    .where(eq(enrollments.id, enrollmentId));
}

export async function getEnrollmentById(id: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(enrollments)
    .where(eq(enrollments.id, id))
    .limit(1);
  return result[0];
}

export async function getStudentEnrollments(
  studentId: number,
  semesterId?: number
) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [eq(enrollments.studentId, studentId)];
  if (semesterId) conditions.push(eq(enrollments.semesterId, semesterId));
  return db
    .select({
      enrollment: enrollments,
      course: courses,
      semester: semesters,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(semesters, eq(enrollments.semesterId, semesters.id))
    .where(and(...conditions))
    .orderBy(desc(enrollments.enrolledAt));
}

export async function getCourseRoster(courseId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      enrollment: enrollments,
      student: users,
      grade: grades,
    })
    .from(enrollments)
    .innerJoin(users, eq(enrollments.studentId, users.id))
    .leftJoin(grades, eq(grades.enrollmentId, enrollments.id))
    .where(
      and(
        eq(enrollments.courseId, courseId),
        eq(enrollments.status, "enrolled")
      )
    )
    .orderBy(users.name);
}

export async function checkExistingEnrollment(
  studentId: number,
  courseId: number
) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(enrollments)
    .where(
      and(
        eq(enrollments.studentId, studentId),
        eq(enrollments.courseId, courseId)
      )
    )
    .limit(1);
  return result[0];
}

export async function getAllEnrollments(filters?: {
  semesterId?: number;
  status?: string;
}) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [];
  if (filters?.semesterId)
    conditions.push(eq(enrollments.semesterId, filters.semesterId));
  if (filters?.status)
    conditions.push(
      eq(
        enrollments.status,
        filters.status as "enrolled" | "dropped" | "completed" | "waitlisted"
      )
    );
  return conditions.length > 0
    ? db
        .select({ enrollment: enrollments, student: users, course: courses })
        .from(enrollments)
        .innerJoin(users, eq(enrollments.studentId, users.id))
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .where(and(...conditions))
        .orderBy(desc(enrollments.enrolledAt))
    : db
        .select({ enrollment: enrollments, student: users, course: courses })
        .from(enrollments)
        .innerJoin(users, eq(enrollments.studentId, users.id))
        .innerJoin(courses, eq(enrollments.courseId, courses.id))
        .orderBy(desc(enrollments.enrolledAt));
}

// ─── Grade Helpers ───────────────────────────────────────────────────────────

export async function upsertGrade(data: InsertGrade) {
  const db = await getDb();
  if (!db) return;
  const updateSet: Partial<InsertGrade> = { ...data };
  delete (updateSet as Record<string, unknown>).enrollmentId;
  await db
    .insert(grades)
    .values(data)
    .onConflictDoUpdate({ target: grades.enrollmentId, set: updateSet as any });
}

export async function getGradeByEnrollmentId(enrollmentId: number) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db
    .select()
    .from(grades)
    .where(eq(grades.enrollmentId, enrollmentId))
    .limit(1);
  return result[0];
}

export async function getStudentGrades(studentId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      enrollment: enrollments,
      course: courses,
      semester: semesters,
      grade: grades,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .innerJoin(semesters, eq(enrollments.semesterId, semesters.id))
    .leftJoin(grades, eq(grades.enrollmentId, enrollments.id))
    .where(eq(enrollments.studentId, studentId))
    .orderBy(desc(semesters.startDate));
}

// ─── Notification Helpers ─────────────────────────────────────────────────────

export async function createNotification(data: InsertNotification) {
  const db = await getDb();
  if (!db) return;
  await db.insert(notifications).values(data);
}

export async function getUserNotifications(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(notifications)
    .where(eq(notifications.userId, userId))
    .orderBy(desc(notifications.createdAt))
    .limit(50);
}

export async function markNotificationRead(id: number, userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(and(eq(notifications.id, id), eq(notifications.userId, userId)));
}

export async function markAllNotificationsRead(userId: number) {
  const db = await getDb();
  if (!db) return;
  await db
    .update(notifications)
    .set({ isRead: true })
    .where(eq(notifications.userId, userId));
}

export async function getUnreadNotificationCount(userId: number) {
  const db = await getDb();
  if (!db) return 0;
  const result = await db
    .select({ count: sql<number>`count(*)` })
    .from(notifications)
    .where(
      and(eq(notifications.userId, userId), eq(notifications.isRead, false))
    );
  return Number(result[0]?.count ?? 0);
}

// ─── Report Helpers ─────────────────────────────────────────────────────────

export async function getEnrollmentStats(semesterId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = semesterId ? [eq(enrollments.semesterId, semesterId)] : [];
  return db
    .select({
      courseId: enrollments.courseId,
      courseName: courses.name,
      courseCode: courses.code,
      department: courses.department,
      total: sql<number>`count(*)`,
      enrolled: sql<number>`sum(case when ${enrollments.status} = 'enrolled' then 1 else 0 end)`,
      dropped: sql<number>`sum(case when ${enrollments.status} = 'dropped' then 1 else 0 end)`,
      completed: sql<number>`sum(case when ${enrollments.status} = 'completed' then 1 else 0 end)`,
    })
    .from(enrollments)
    .innerJoin(courses, eq(enrollments.courseId, courses.id))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .groupBy(
      enrollments.courseId,
      courses.name,
      courses.code,
      courses.department
    )
    .orderBy(desc(sql`count(*)`));
}

export async function getGradeDistribution(semesterId?: number) {
  const db = await getDb();
  if (!db) return [];
  const conditions = [sql`${grades.letterGrade} is not null`];
  if (semesterId) conditions.push(eq(enrollments.semesterId, semesterId));
  return db
    .select({
      letterGrade: grades.letterGrade,
      count: sql<number>`count(*)`,
    })
    .from(grades)
    .innerJoin(enrollments, eq(grades.enrollmentId, enrollments.id))
    .where(and(...conditions))
    .groupBy(grades.letterGrade)
    .orderBy(grades.letterGrade);
}

export async function getDepartmentStats() {
  const db = await getDb();
  if (!db) return [];
  return db
    .select({
      department: courses.department,
      totalCourses: sql<number>`count(distinct ${courses.id})`,
      totalEnrollments: sql<number>`count(${enrollments.id})`,
    })
    .from(courses)
    .leftJoin(
      enrollments,
      and(
        eq(enrollments.courseId, courses.id),
        eq(enrollments.status, "enrolled")
      )
    )
    .groupBy(courses.department)
    .orderBy(desc(sql`count(${enrollments.id})`));
}

export async function getSystemStats() {
  const db = await getDb();
  if (!db) return { students: 0, lecturers: 0, courses: 0, enrollments: 0 };
  const [studentCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.role, "student"));
  const [lecturerCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(users)
    .where(eq(users.role, "lecturer"));
  const [courseCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(courses)
    .where(eq(courses.isActive, true));
  const [enrollmentCount] = await db
    .select({ count: sql<number>`count(*)` })
    .from(enrollments)
    .where(eq(enrollments.status, "enrolled"));
  return {
    students: Number(studentCount?.count ?? 0),
    lecturers: Number(lecturerCount?.count ?? 0),
    courses: Number(courseCount?.count ?? 0),
    enrollments: Number(enrollmentCount?.count ?? 0),
  };
}
