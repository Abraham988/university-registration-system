import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Download, BarChart3, Users, BookOpen, TrendingUp, GraduationCap } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend,
} from "recharts";
import { toast } from "sonner";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4", "#ec4899"];

const gradeColorMap: Record<string, string> = {
  "A+": "#10b981", A: "#22c55e", "A-": "#4ade80",
  "B+": "#3b82f6", B: "#60a5fa", "B-": "#93c5fd",
  "C+": "#f59e0b", C: "#fbbf24", "C-": "#fcd34d",
  "D+": "#f97316", D: "#fb923c",
  F: "#ef4444",
};

export default function AdminReports() {
  const { data: stats } = trpc.reports.systemStats.useQuery();
  const { data: enrollmentStats = [], isLoading: enrollLoading } = trpc.reports.enrollmentStats.useQuery();
  const { data: gradeDistribution = [] } = trpc.reports.gradeDistribution.useQuery();
  const { data: deptStats = [] } = trpc.reports.departmentStats.useQuery();
  const { data: topStudents = [] } = trpc.reports.exportPerformance.useQuery();

  const enrollData = enrollmentStats.slice(0, 10).map((s) => ({
    course: s.courseCode,
    enrolled: Number(s.enrolled),
    dropped: Number(s.dropped),
    total: Number(s.total),
  }));

  const gradeData = gradeDistribution.map((g) => ({
    name: g.letterGrade ?? "N/A",
    value: Number(g.count),
    fill: gradeColorMap[g.letterGrade ?? ""] ?? "#94a3b8",
  }));

  const deptData = deptStats.map((d) => ({
    dept: d.department ?? "Unknown",
    courses: Number(d.totalCourses),
    enrollments: Number(d.totalEnrollments),
  }));

  const exportCSV = (data: any[], filename: string) => {
    if (!data.length) { toast.error("No data to export"); return; }
    const headers = Object.keys(data[0]).join(",");
    const rows = data.map((row) => Object.values(row).join(",")).join("\n");
    const csv = `${headers}\n${rows}`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${filename}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${filename}.csv`);
  };

  return (
    <UniversityLayout title="Reports & Analytics">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">System-wide performance and enrollment analytics</p>
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Students", value: stats?.students, icon: GraduationCap, color: "text-blue-500 bg-blue-50" },
          { label: "Active Courses", value: stats?.courses, icon: BookOpen, color: "text-purple-500 bg-purple-50" },
          { label: "Total Enrollments", value: stats?.enrollments, icon: Users, color: "text-emerald-500 bg-emerald-50" },
          { label: "Grades Recorded", value: stats?.enrollments, icon: TrendingUp, color: "text-orange-500 bg-orange-50" },
        ].map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="pt-5">
              <div className={`w-10 h-10 rounded-xl ${kpi.color} flex items-center justify-center mb-3`}>
                <kpi.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">{kpi.value ?? 0}</p>
              <p className="text-xs text-muted-foreground mt-1">{kpi.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Enrollment by Course */}
      <Card className="mb-6">
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Enrollment by Course (Top 10)</CardTitle>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => exportCSV(enrollmentStats, "enrollment-report")}>
            <Download className="h-3.5 w-3.5 mr-1.5" />Export CSV
          </Button>
        </CardHeader>
        <CardContent>
          {enrollLoading ? (
            <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          ) : enrollData.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No enrollment data available.</div>
          ) : (
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={enrollData} margin={{ top: 5, right: 10, bottom: 20, left: -15 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="course" tick={{ fontSize: 11 }} angle={-30} textAnchor="end" />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Bar dataKey="enrolled" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Enrolled" />
                <Bar dataKey="dropped" fill="#ef4444" radius={[3, 3, 0, 0]} name="Dropped" />
                <Bar dataKey="total" fill="#e2e8f0" radius={[3, 3, 0, 0]} name="Total" />
              </BarChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Grade Distribution */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Grade Distribution</CardTitle>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => exportCSV(gradeDistribution, "grade-distribution")}>
              <Download className="h-3.5 w-3.5 mr-1.5" />Export
            </Button>
          </CardHeader>
          <CardContent>
            {gradeData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No grade data available.</div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="55%" height={200}>
                  <PieChart>
                    <Pie data={gradeData} cx="50%" cy="50%" innerRadius={45} outerRadius={75} dataKey="value">
                      {gradeData.map((entry, index) => (
                        <Cell key={index} fill={entry.fill} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(val: any) => [`${val} students`, "Count"]} />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1.5 max-h-48 overflow-y-auto">
                  {gradeData.map((g) => (
                    <div key={g.name} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: g.fill }} />
                        <span className="font-medium">{g.name}</span>
                      </div>
                      <span className="text-muted-foreground">{g.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Department Stats */}
        <Card>
          <CardHeader className="pb-2 flex flex-row items-center justify-between">
            <CardTitle className="text-base">Enrollments by Department</CardTitle>
            <Button size="sm" variant="outline" className="text-xs" onClick={() => exportCSV(deptStats, "department-stats")}>
              <Download className="h-3.5 w-3.5 mr-1.5" />Export
            </Button>
          </CardHeader>
          <CardContent>
            {deptData.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground text-sm">No department data available.</div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={deptData} layout="vertical" margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis dataKey="dept" type="category" tick={{ fontSize: 10 }} width={80} />
                  <Tooltip />
                  <Bar dataKey="enrollments" fill="#8b5cf6" radius={[0, 3, 3, 0]} name="Enrollments" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Top Students */}
      <Card>
        <CardHeader className="pb-2 flex flex-row items-center justify-between">
          <CardTitle className="text-base">Top Performing Students</CardTitle>
          <Button size="sm" variant="outline" className="text-xs" onClick={() => exportCSV(topStudents, "top-students")}>
            <Download className="h-3.5 w-3.5 mr-1.5" />Export
          </Button>
        </CardHeader>
        <CardContent>
          {topStudents.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground text-sm">No student performance data available.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left py-2 font-medium">Rank</th>
                    <th className="text-left py-2 font-medium">Student</th>
                    <th className="text-center py-2 font-medium">Courses</th>
                    <th className="text-center py-2 font-medium">Avg Score</th>
                    <th className="text-center py-2 font-medium">GPA</th>
                  </tr>
                </thead>
                <tbody>
                  {topStudents.slice(0, 10).map((s: any, i: number) => (
                    <tr key={s.studentId} className="border-b border-border/50 hover:bg-muted/30">
                      <td className="py-2.5">
                        <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${
                          i === 0 ? "bg-yellow-100 text-yellow-700" :
                          i === 1 ? "bg-gray-100 text-gray-600" :
                          i === 2 ? "bg-orange-100 text-orange-700" :
                          "text-muted-foreground"
                        }`}>
                          #{i + 1}
                        </span>
                      </td>
                      <td className="py-2.5">
                        <p className="font-medium">{s.studentName ?? "Unknown"}</p>
                        <p className="text-xs text-muted-foreground">{s.studentEmail}</p>
                      </td>
                      <td className="py-2.5 text-center">{s.totalCourses}</td>
                      <td className="py-2.5 text-center">
                        {s.department ?? "—"}
                      </td>
                      <td className="py-2.5 text-center">
                        <span className={`font-bold ${
                          Number(s.gpa) >= 3.5 ? "text-emerald-600" :
                          Number(s.gpa) >= 2.5 ? "text-blue-600" :
                          Number(s.gpa) >= 1.5 ? "text-yellow-600" :
                          "text-red-600"
                        }`}>
                          {s.gpa ? Number(s.gpa).toFixed(2) : "—"}
                        </span>
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
