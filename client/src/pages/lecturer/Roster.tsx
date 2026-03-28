import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Users, Search, GraduationCap, Loader2, ArrowLeft } from "lucide-react";
import { useState } from "react";
import { Link, useParams } from "wouter";
import { getGradeColor } from "../../../../shared/gpa";

export default function LecturerRoster() {
  const params = useParams<{ courseId: string }>();
  const courseId = parseInt(params.courseId ?? "0");
  const [search, setSearch] = useState("");

  const { data: course } = trpc.courses.getById.useQuery({ id: courseId }, { enabled: !!courseId });
  const { data: roster = [], isLoading } = trpc.enrollments.roster.useQuery(
    { courseId },
    { enabled: !!courseId }
  );

  const filtered = roster.filter(
    (r) =>
      !search ||
      r.student.name?.toLowerCase().includes(search.toLowerCase()) ||
      r.student.email?.toLowerCase().includes(search.toLowerCase()) ||
      r.student.studentId?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <UniversityLayout title="Class Roster">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/lecturer/courses"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{course?.name ?? "Class Roster"}</h1>
          <p className="text-muted-foreground text-sm">{course?.code} · {roster.length} students enrolled</p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Enrolled Students</CardTitle>
            <div className="relative w-full sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search students..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">
                {search ? "No students match your search." : "No students enrolled in this course."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left py-2 font-medium">#</th>
                    <th className="text-left py-2 font-medium">Student</th>
                    <th className="text-left py-2 font-medium">Student ID</th>
                    <th className="text-left py-2 font-medium">Department</th>
                    <th className="text-center py-2 font-medium">Grade</th>
                    <th className="text-center py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((r, idx) => (
                    <tr key={r.enrollment.id} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2.5 text-muted-foreground">{idx + 1}</td>
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {r.student.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="font-medium">{r.student.name}</p>
                            <p className="text-xs text-muted-foreground">{r.student.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5 text-muted-foreground">{r.student.studentId ?? "—"}</td>
                      <td className="py-2.5 text-muted-foreground">{r.student.department ?? "—"}</td>
                      <td className="py-2.5 text-center">
                        {r.grade?.letterGrade ? (
                          <span className={`font-bold ${getGradeColor(r.grade.letterGrade)}`}>
                            {r.grade.letterGrade}
                          </span>
                        ) : (
                          <span className="text-muted-foreground text-xs">No grade</span>
                        )}
                      </td>
                      <td className="py-2.5 text-center">
                        <Button size="sm" variant="outline" className="text-xs h-7" asChild>
                          <Link href={`/lecturer/grades/${courseId}`}><GraduationCap className="h-3 w-3 mr-1" />Grade</Link>
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </UniversityLayout>
  );
}
