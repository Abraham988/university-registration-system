import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Loader2, GraduationCap, TrendingUp } from "lucide-react";
import { getGradeColor, getGradeBadgeVariant } from "../../../../shared/gpa";

export default function StudentGrades() {
  const { data, isLoading } = trpc.grades.myGrades.useQuery();
  const records = data?.records ?? [];
  const gpa = data?.cumulativeGPA ?? 0;

  // Group by semester
  const bySemester = records.reduce<Record<string, typeof records>>((acc, r) => {
    const key = r.semester.name;
    if (!acc[key]) acc[key] = [];
    acc[key].push(r);
    return acc;
  }, {});

  const getGPAStatus = (gpa: number) => {
    if (gpa >= 3.7) return { label: "Dean's List", color: "text-emerald-600 bg-emerald-50" };
    if (gpa >= 3.0) return { label: "Good Standing", color: "text-blue-600 bg-blue-50" };
    if (gpa >= 2.0) return { label: "Satisfactory", color: "text-yellow-600 bg-yellow-50" };
    if (gpa > 0) return { label: "Academic Probation", color: "text-red-600 bg-red-50" };
    return { label: "No Grades", color: "text-muted-foreground bg-muted" };
  };

  const status = getGPAStatus(gpa);

  return (
    <UniversityLayout title="Grades & GPA">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Grades & GPA</h1>
        <p className="text-muted-foreground mt-1">Your academic performance record</p>
      </div>

      {/* GPA Summary */}
      <div className="grid sm:grid-cols-3 gap-4 mb-8">
        <Card className="sm:col-span-1">
          <CardContent className="pt-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
              <span className="text-2xl font-bold text-primary">{gpa.toFixed(2)}</span>
            </div>
            <p className="font-semibold text-foreground">Cumulative GPA</p>
            <span className={`text-xs px-2 py-0.5 rounded-full font-medium mt-1 inline-block ${status.color}`}>
              {status.label}
            </span>
          </CardContent>
        </Card>

        <Card className="sm:col-span-2">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm">GPA Scale Reference</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-2">
              {[
                { range: "90–100", grade: "A/A+", points: "4.0" },
                { range: "80–89", grade: "A-/B+", points: "3.3–3.7" },
                { range: "70–79", grade: "B/B-", points: "2.7–3.0" },
                { range: "60–69", grade: "C/C+", points: "1.7–2.3" },
                { range: "50–59", grade: "D/D+", points: "0.7–1.3" },
                { range: "< 50", grade: "F", points: "0.0" },
              ].map((row) => (
                <div key={row.grade} className="flex items-center justify-between text-xs p-1.5 rounded bg-muted/50">
                  <span className="text-muted-foreground">{row.range}</span>
                  <span className={`font-semibold ${getGradeColor(row.grade.split("/")[0])}`}>{row.grade}</span>
                  <span className="text-muted-foreground">{row.points}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : records.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No grades recorded yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(bySemester).map(([semesterName, semRecords]) => {
            const semGrades = semRecords.filter((r) => r.grade);
            const semGPA =
              semGrades.length > 0
                ? semGrades.reduce((sum, r) => sum + Number(r.grade?.gradePoints ?? 0) * r.course.credits, 0) /
                  semGrades.reduce((sum, r) => sum + r.course.credits, 0)
                : null;

            return (
              <Card key={semesterName}>
                <CardHeader className="pb-2">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-base">{semesterName}</CardTitle>
                    {semGPA !== null && (
                      <div className="flex items-center gap-1.5">
                        <TrendingUp className="h-4 w-4 text-muted-foreground" />
                        <span className="text-sm font-semibold">Semester GPA: {semGPA.toFixed(2)}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b border-border text-xs text-muted-foreground">
                          <th className="text-left py-2 font-medium">Course</th>
                          <th className="text-center py-2 font-medium">Credits</th>
                          <th className="text-center py-2 font-medium">Assignment</th>
                          <th className="text-center py-2 font-medium">Midterm</th>
                          <th className="text-center py-2 font-medium">Final</th>
                          <th className="text-center py-2 font-medium">Total</th>
                          <th className="text-center py-2 font-medium">Grade</th>
                          <th className="text-center py-2 font-medium">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        {semRecords.map((r) => (
                          <tr key={r.enrollment.id} className="border-b border-border/50 hover:bg-muted/30">
                            <td className="py-2.5">
                              <p className="font-medium">{r.course.name}</p>
                              <p className="text-xs text-muted-foreground">{r.course.code}</p>
                            </td>
                            <td className="text-center py-2.5 text-muted-foreground">{r.course.credits}</td>
                            <td className="text-center py-2.5">{r.grade?.assignmentScore ?? "—"}</td>
                            <td className="text-center py-2.5">{r.grade?.midtermScore ?? "—"}</td>
                            <td className="text-center py-2.5">{r.grade?.finalScore ?? "—"}</td>
                            <td className="text-center py-2.5 font-medium">{r.grade?.totalScore ?? "—"}</td>
                            <td className="text-center py-2.5">
                              {r.grade?.letterGrade ? (
                                <Badge variant={getGradeBadgeVariant(r.grade.letterGrade)} className="text-xs">
                                  {r.grade.letterGrade}
                                </Badge>
                              ) : (
                                <span className="text-muted-foreground text-xs">Pending</span>
                              )}
                            </td>
                            <td className="text-center py-2.5">
                              <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                                r.enrollment.status === "enrolled" ? "bg-green-100 text-green-700" :
                                r.enrollment.status === "completed" ? "bg-blue-100 text-blue-700" :
                                "bg-red-100 text-red-700"
                              }`}>
                                {r.enrollment.status}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </UniversityLayout>
  );
}
