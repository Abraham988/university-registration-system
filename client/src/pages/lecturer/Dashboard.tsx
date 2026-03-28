import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Users, Clock, MapPin, ArrowRight, Loader2, GraduationCap } from "lucide-react";
import { Link } from "wouter";

export default function LecturerDashboard() {
  const { user } = useAuth();
  const { data: assignments = [], isLoading } = trpc.courses.myAssignedCourses.useQuery();

  const totalStudents = 0; // Would need a separate query per course

  return (
    <UniversityLayout title="Lecturer Dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">
          Welcome, {user?.name?.split(" ")[0] ?? "Lecturer"}!
        </h1>
        <p className="text-muted-foreground mt-1">Manage your courses and student grades</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <BookOpen className="h-5 w-5 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">{isLoading ? "—" : assignments.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Assigned Courses</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <GraduationCap className="h-5 w-5 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{user?.department ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Department</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <div className="flex items-center justify-between mb-2">
              <Users className="h-5 w-5 text-emerald-500" />
            </div>
            <p className="text-2xl font-bold">{user?.employeeId ?? "—"}</p>
            <p className="text-xs text-muted-foreground mt-1">Employee ID</p>
          </CardContent>
        </Card>
      </div>

      {/* Assigned Courses */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base">My Assigned Courses</CardTitle>
          <Button variant="ghost" size="sm" asChild>
            <Link href="/lecturer/courses" className="flex items-center gap-1 text-xs">View all <ArrowRight className="h-3 w-3" /></Link>
          </Button>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </div>
          ) : assignments.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No courses assigned yet.</p>
              <p className="text-xs text-muted-foreground mt-1">Contact your administrator to get courses assigned.</p>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-4">
              {assignments.map((a) => (
                <div key={a.assignment.id} className="p-4 rounded-xl border border-border hover:shadow-sm transition-shadow">
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <div>
                      <p className="text-xs font-mono text-primary font-semibold">{a.course.code}</p>
                      <p className="font-medium text-sm mt-0.5">{a.course.name}</p>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">{a.course.level}-lvl</Badge>
                  </div>
                  <div className="space-y-1 mb-3">
                    {a.course.scheduleDay && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {a.course.scheduleDay} {a.course.scheduleTime}
                      </div>
                    )}
                    {a.course.room && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {a.course.room}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />
                      {a.course.credits} credits · {a.course.department}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
                      <Link href={`/lecturer/roster/${a.course.id}`}><Users className="h-3 w-3 mr-1" />Roster</Link>
                    </Button>
                    <Button size="sm" className="flex-1 text-xs" asChild>
                      <Link href={`/lecturer/grades/${a.course.id}`}><GraduationCap className="h-3 w-3 mr-1" />Grades</Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </UniversityLayout>
  );
}
