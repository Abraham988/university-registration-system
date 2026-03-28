# University Registration System — TODO

## Phase 1: Database Schema & Migrations
- [x] Extend users table with role enum (student, lecturer, admin), studentId, department, phone
- [x] Create semesters table (id, name, academicYear, term, startDate, endDate, isActive)
- [x] Create courses table (id, code, name, description, credits, capacity, semesterId, scheduleDay, scheduleTime, room)
- [x] Create course_assignments table (id, courseId, lecturerId)
- [x] Create enrollments table (id, studentId, courseId, semesterId, status, enrolledAt)
- [x] Create grades table (id, enrollmentId, midterm, final, assignment, total, letterGrade, gradePoints, gradedAt)
- [x] Create notifications table (id, userId, title, message, isRead, createdAt)
- [x] Run migrations via webdev_execute_sql
- [x] Seed demo data: 3 semesters, 10 courses (Spring 2026)

## Phase 2: Backend tRPC Routers
- [x] Auth router: me, logout
- [x] Courses router: list, getById, create, update, delete, assignLecturer, search/filter
- [x] Enrollments router: enroll, drop, myCourses, adminList, adminRemove
- [x] Grades router: upload (lecturer), myGrades, classGrades, GPA calculation
- [x] Semesters router: list, getActive, create, update, delete, setActive
- [x] Users router: me, updateProfile, list (admin), adminUpdate, lecturers
- [x] Reports router: systemStats, enrollmentStats, gradeDistribution, departmentStats, exportEnrollments, exportPerformance
- [x] Notifications router: list, unreadCount, markRead, markAllRead
- [x] Shared GPA utility (shared/gpa.ts): calculateCumulativeGPA, calculateLetterGrade, calculateTotalScore

## Phase 3: Frontend Layout & Routing
- [x] University-themed design system (blue sidebar, clean card layout, Inter font)
- [x] UniversityLayout component with role-based sidebar navigation
- [x] Role-based routing guard (student/lecturer/admin routes)
- [x] App.tsx routes for all pages
- [x] Landing/login page with role-based redirect

## Phase 4: Student Module
- [x] Student dashboard (enrolled courses, GPA, notifications, quick stats)
- [x] Course catalog (search, filter by dept/level, enroll/drop)
- [x] My Courses page (enrolled courses list, drop functionality)
- [x] Timetable page (weekly schedule view)
- [x] Grades & GPA page (per-course grades, cumulative GPA)
- [x] Profile page (edit personal info, studentId, department, phone)

## Phase 5: Lecturer Module
- [x] Lecturer dashboard (assigned courses overview, class count)
- [x] My Courses page (list of assigned courses with enrollment counts)
- [x] Class Roster page (students enrolled per course)
- [x] Grade Upload page (assignment/midterm/final scores, auto letter grade)
- [x] Profile page

## Phase 6: Admin Module
- [x] Admin dashboard (system stats: users, courses, enrollments)
- [x] User management (list, search, change role, deactivate)
- [x] Course management (CRUD, assign lecturers, filter/search)
- [x] Semester management (create, update, activate, delete)
- [x] Enrollment oversight (view all enrollments, remove)

## Phase 7: Admin Reports
- [x] Enrollment statistics bar chart (top 10 courses)
- [x] Grade distribution pie chart
- [x] Department enrollment bar chart
- [x] Top performing students table
- [x] CSV export for all report types

## Phase 8: Testing & Polish
- [x] Vitest tests: auth, RBAC, GPA calculation, notifications (22 tests passing)
- [x] In-app notifications (bell icon, unread count badge, mark as read)
- [x] Search and filter across all list pages
- [x] Responsive mobile layout (sidebar collapses on mobile)
- [x] Error handling and input validation (Zod schemas on all procedures)
- [x] Final checkpoint
