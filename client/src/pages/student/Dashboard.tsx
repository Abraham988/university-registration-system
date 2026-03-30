import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BookOpen,
  GraduationCap,
  Calendar,
  TrendingUp,
  ArrowRight,
  Clock,
  MapPin,
  Loader2,
  School,
} from "lucide-react";
import { Link } from "wouter";
import { calculateCumulativeGPA, getGradeColor } from "../../../../shared/gpa";

export default function StudentDashboard() {
  const { user } = useAuth();
  const { data: gradesData, isLoading: gradesLoading } =
    trpc.grades.myGrades.useQuery();
  const { data: activeSemester } = trpc.semesters.getActive.useQuery();
  const { data: enrollments, isLoading: enrollLoading } =
    trpc.enrollments.myCourses.useQuery(
      activeSemester ? { semesterId: activeSemester.id } : undefined
    );
  const { data: myProgram } = trpc.programs.myProgram.useQuery();

  const activeEnrollments =
    enrollments?.filter(e => e.enrollment.status === "enrolled") ?? [];
  const gpa = gradesData?.cumulativeGPA ?? 0;

  const getGPALabel = (gpa: number) => {
    if (gpa >= 3.7) return { label: "Excellent", color: "text-emerald-600" };
    if (gpa >= 3.0) return { label: "Good", color: "text-blue-600" };
    if (gpa >= 2.0) return { label: "Satisfactory", color: "text-yellow-600" };
    if (gpa > 0)
      return { label: "Needs Improvement", color: "text-orange-600" };
    return { label: "No grades yet", color: "text-muted-foreground" };
  };

  const gpaInfo = getGPALabel(gpa);

  return (
    <UniversityLayout title="Student Dashboard">
      {/* Welcome */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-foreground">
          Welcome back, {user?.name?.split(" ")[0] ?? "Student"}!
        </h1>
        <p className="text-muted-foreground mt-1">
          {activeSemester
            ? `Current semester: ${activeSemester.name}`
            : "No active semester"}
        </p>
      </div>

      {/* Program Info */}
      {myProgram && (
        <Card className="mb-6 bg-primary/5 border-primary/20">
          <CardContent className="pt-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                <School className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold">{myProgram.program.name}</p>
                <p className="text-sm text-muted-foreground">
                  Year {myProgram.studentProgram.yearOfStudy} •{" "}
                  {myProgram.program.faculty}
                </p>
              </div>
              <Badge variant="outline" className="ml-auto">
                {myProgram.program.code}
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-5 w-5 text-blue-500" />
              <Badge variant="secondary" className="text-xs">
                This semester
              </Badge>
            </div>
            <p className="text-2xl font-bold">
              {enrollLoading ? "—" : activeEnrollments.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Enrolled Courses
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="h-5 w-5 text-purple-500" />
              <span className={`text-xs font-medium ${gpaInfo.color}`}>
                {gpaInfo.label}
              </span>
            </div>
            <p className="text-2xl font-bold">
              {gradesLoading ? "—" : gpa.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Cumulative GPA</p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold">
              {gradesLoading ? "—" : (gradesData?.records.length ?? 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Total Courses Taken
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <Calendar className="h-5 w-5 text-orange-500" />
            </div>
            <p className="text-2xl font-bold">
              {activeEnrollments.reduce((sum, e) => sum + e.course.credits, 0)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Credit Hours</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Current Courses */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Current Courses</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link
                href="/student/courses"
                className="flex items-center gap-1 text-xs"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {enrollLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : activeEnrollments.length === 0 ? (
              <div className="text-center py-6">
                <BookOpen className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No enrolled courses
                </p>
                <Button size="sm" className="mt-3" asChild>
                  <Link href="/student/catalog">Browse Catalog</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEnrollments.slice(0, 5).map(e => (
                  <div
                    key={e.enrollment.id}
                    className="flex items-start justify-between gap-2 p-3 rounded-lg bg-muted/50"
                  >
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">
                        {e.course.name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {e.course.code} · {e.course.credits} credits
                      </p>
                      {e.course.scheduleDay && (
                        <div className="flex items-center gap-1 mt-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span className="text-xs text-muted-foreground">
                            {e.course.scheduleDay} {e.course.scheduleTime}
                          </span>
                        </div>
                      )}
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {e.course.department ?? "General"}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Recent Grades */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base">Recent Grades</CardTitle>
            <Button variant="ghost" size="sm" asChild>
              <Link
                href="/student/grades"
                className="flex items-center gap-1 text-xs"
              >
                View all <ArrowRight className="h-3 w-3" />
              </Link>
            </Button>
          </CardHeader>
          <CardContent>
            {gradesLoading ? (
              <div className="flex justify-center py-6">
                <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
              </div>
            ) : (gradesData?.records ?? []).filter(r => r.grade).length ===
              0 ? (
              <div className="text-center py-6">
                <GraduationCap className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground">
                  No grades recorded yet
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {(gradesData?.records ?? [])
                  .filter(r => r.grade)
                  .slice(0, 5)
                  .map(r => (
                    <div
                      key={r.enrollment.id}
                      className="flex items-center justify-between gap-2 p-3 rounded-lg bg-muted/50"
                    >
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">
                          {r.course.name}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.semester.name}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p
                          className={`text-lg font-bold ${getGradeColor(r.grade?.letterGrade ?? null)}`}
                        >
                          {r.grade?.letterGrade ?? "—"}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {r.grade?.totalScore ?? "—"}
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick actions */}
      <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          {
            label: "Browse Courses",
            href: "/student/catalog",
            icon: BookOpen,
            color: "bg-blue-50 text-blue-700 hover:bg-blue-100",
          },
          {
            label: "My Timetable",
            href: "/student/timetable",
            icon: Calendar,
            color: "bg-purple-50 text-purple-700 hover:bg-purple-100",
          },
          {
            label: "View Grades",
            href: "/student/grades",
            icon: GraduationCap,
            color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100",
          },
          {
            label: "My Profile",
            href: "/student/profile",
            icon: TrendingUp,
            color: "bg-orange-50 text-orange-700 hover:bg-orange-100",
          },
        ].map(action => (
          <Link
            key={action.href}
            href={action.href}
            className={`flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-colors ${action.color}`}
          >
            <action.icon className="h-5 w-5" />
            {action.label}
          </Link>
        ))}
      </div>
    </UniversityLayout>
  );
}
