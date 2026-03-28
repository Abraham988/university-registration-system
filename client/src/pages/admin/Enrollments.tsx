import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { UserCheck, Search, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const statusColors: Record<string, string> = {
  enrolled: "bg-green-100 text-green-700",
  waitlisted: "bg-yellow-100 text-yellow-700",
  dropped: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
};

export default function AdminEnrollments() {
  const [search, setSearch] = useState("");
  const [semesterId, setSemesterId] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");

  const { data: semesters = [] } = trpc.semesters.list.useQuery();
  const { data: activeSemester } = trpc.semesters.getActive.useQuery();

  const selectedSemId =
    semesterId === "all"
      ? undefined
      : semesterId
        ? parseInt(semesterId)
        : activeSemester?.id;

  const {
    data: allEnrollments = [],
    isLoading,
    refetch,
  } = trpc.enrollments.all.useQuery({
    semesterId: selectedSemId,
    status: (statusFilter === "all" ? undefined : statusFilter) as any,
  });
  const enrollments = search
    ? allEnrollments.filter(
        e =>
          e.student.name?.toLowerCase().includes(search.toLowerCase()) ||
          e.student.email?.toLowerCase().includes(search.toLowerCase()) ||
          e.course.name?.toLowerCase().includes(search.toLowerCase()) ||
          e.course.code?.toLowerCase().includes(search.toLowerCase())
      )
    : allEnrollments;

  const remove = trpc.enrollments.remove.useMutation({
    onSuccess: () => {
      toast.success("Enrollment removed");
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });

  return (
    <UniversityLayout title="Enrollment Management">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Enrollment Management</h1>
        <p className="text-muted-foreground mt-1">
          View and manage all student enrollments
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by student or course..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={semesterId} onValueChange={setSemesterId}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue
              placeholder={activeSemester?.name ?? "Select semester"}
            />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Semesters</SelectItem>
            {semesters.map(s => (
              <SelectItem key={s.id} value={String(s.id)}>
                {s.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="enrolled">Enrolled</SelectItem>
            <SelectItem value="waitlisted">Waitlisted</SelectItem>
            <SelectItem value="dropped">Dropped</SelectItem>
            <SelectItem value="completed">Completed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <UserCheck className="h-4 w-4" />
            {isLoading ? "Loading..." : `${enrollments.length} Enrollments`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : enrollments.length === 0 ? (
            <div className="text-center py-8">
              <UserCheck className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No enrollments found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left py-2 font-medium">Student</th>
                    <th className="text-left py-2 font-medium">Course</th>
                    <th className="text-left py-2 font-medium hidden md:table-cell">
                      Semester
                    </th>
                    <th className="text-center py-2 font-medium">Status</th>
                    <th className="text-center py-2 font-medium hidden lg:table-cell">
                      Enrolled On
                    </th>
                    <th className="text-center py-2 font-medium">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {enrollments.map(e => (
                    <tr
                      key={e.enrollment.id}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="py-2.5">
                        <p className="font-medium">{e.student.name ?? "—"}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.student.email}
                        </p>
                      </td>
                      <td className="py-2.5">
                        <p className="font-medium">{e.course.name}</p>
                        <p className="text-xs text-muted-foreground">
                          {e.course.code}
                        </p>
                      </td>
                      <td className="py-2.5 text-muted-foreground hidden md:table-cell">
                        —
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColors[e.enrollment.status] ?? ""}`}
                        >
                          {e.enrollment.status}
                        </span>
                      </td>
                      <td className="py-2.5 text-center text-xs text-muted-foreground hidden lg:table-cell">
                        {new Date(e.enrollment.enrolledAt).toLocaleDateString()}
                      </td>
                      <td className="py-2.5 text-center">
                        <Button
                          size="sm"
                          variant="ghost"
                          className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                          onClick={() => {
                            if (confirm("Remove this enrollment?"))
                              remove.mutate({ id: e.enrollment.id });
                          }}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
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
