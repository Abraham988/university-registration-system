import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, BookOpen, UserCheck, GraduationCap, ArrowRight, Loader2, BarChart3, Calendar } from "lucide-react";
import { Link } from "wouter";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["#3b82f6", "#8b5cf6", "#10b981", "#f59e0b", "#ef4444", "#06b6d4"];

export default function AdminDashboard() {
  const { data: stats, isLoading: statsLoading } = trpc.reports.systemStats.useQuery();
  const { data: enrollmentStats = [], isLoading: enrollLoading } = trpc.reports.enrollmentStats.useQuery();
  const { data: gradeDistribution = [] } = trpc.reports.gradeDistribution.useQuery();
  const { data: deptStats = [] } = trpc.reports.departmentStats.useQuery();

  const topCourses = enrollmentStats.slice(0, 6).map((s) => ({
    name: s.courseCode,
    enrolled: Number(s.enrolled),
    dropped: Number(s.dropped),
  }));

  const gradeData = gradeDistribution.map((g) => ({
    name: g.letterGrade ?? "?",
    value: Number(g.count),
  }));

  return (
    <UniversityLayout title="Admin Dashboard">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Admin Dashboard</h1>
        <p className="text-muted-foreground mt-1">System overview and quick management</p>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {[
          { label: "Total Students", value: stats?.students, icon: GraduationCap, color: "text-blue-500 bg-blue-50", href: "/admin/users" },
          { label: "Lecturers", value: stats?.lecturers, icon: Users, color: "text-purple-500 bg-purple-50", href: "/admin/users" },
          { label: "Active Courses", value: stats?.courses, icon: BookOpen, color: "text-emerald-500 bg-emerald-50", href: "/admin/courses" },
          { label: "Enrollments", value: stats?.enrollments, icon: UserCheck, color: "text-orange-500 bg-orange-50", href: "/admin/enrollments" },
        ].map((stat) => (
          <Card key={stat.label} className="hover:shadow-md transition-shadow">
            <CardContent className="pt-5">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center mb-3`}>
                <stat.icon className="h-5 w-5" />
              </div>
              <p className="text-2xl font-bold">
                {statsLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : (stat.value ?? 0)}
              </p>
              <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Charts */}
      <div className="grid lg:grid-cols-2 gap-6 mb-6">
        {/* Enrollment by course */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Top Course Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            {topCourses.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No enrollment data yet
              </div>
            ) : (
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={topCourses} margin={{ top: 5, right: 5, bottom: 5, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip />
                  <Bar dataKey="enrolled" fill="#3b82f6" radius={[3, 3, 0, 0]} name="Enrolled" />
                  <Bar dataKey="dropped" fill="#ef4444" radius={[3, 3, 0, 0]} name="Dropped" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Grade distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Grade Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {gradeData.length === 0 ? (
              <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
                No grade data yet
              </div>
            ) : (
              <div className="flex items-center gap-4">
                <ResponsiveContainer width="60%" height={180}>
                  <PieChart>
                    <Pie data={gradeData} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value">
                      {gradeData.map((_, index) => (
                        <Cell key={index} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="flex-1 space-y-1">
                  {gradeData.slice(0, 6).map((g, i) => (
                    <div key={g.name} className="flex items-center gap-2 text-xs">
                      <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="font-medium w-8">{g.name}</span>
                      <span className="text-muted-foreground">{g.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {[
          { label: "Manage Users", href: "/admin/users", icon: Users, color: "bg-blue-50 text-blue-700 hover:bg-blue-100" },
          { label: "Manage Courses", href: "/admin/courses", icon: BookOpen, color: "bg-purple-50 text-purple-700 hover:bg-purple-100" },
          { label: "Semesters", href: "/admin/semesters", icon: Calendar, color: "bg-emerald-50 text-emerald-700 hover:bg-emerald-100" },
          { label: "Enrollments", href: "/admin/enrollments", icon: UserCheck, color: "bg-orange-50 text-orange-700 hover:bg-orange-100" },
          { label: "Reports", href: "/admin/reports", icon: BarChart3, color: "bg-red-50 text-red-700 hover:bg-red-100" },
        ].map((action) => (
          <Link key={action.href} href={action.href}>
            <a className={`flex flex-col items-center gap-2 p-4 rounded-xl text-sm font-medium transition-colors ${action.color}`}>
              <action.icon className="h-5 w-5" />
              {action.label}
            </a>
          </Link>
        ))}
      </div>
    </UniversityLayout>
  );
}
