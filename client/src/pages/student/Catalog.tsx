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
import {
  BookOpen,
  Search,
  Clock,
  MapPin,
  Users,
  Loader2,
  CheckCircle,
  PlusCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function StudentCatalog() {
  const [search, setSearch] = useState("");
  const [department, setDepartment] = useState<string>("all");
  const [level, setLevel] = useState<string>("all");

  const { data: activeSemester } = trpc.semesters.getActive.useQuery();
  const { data: courses = [], isLoading } = trpc.courses.list.useQuery(
    {
      semesterId: activeSemester?.id,
      search: search || undefined,
      department: department === "all" ? undefined : department,
      level: level === "all" ? undefined : level,
      isActive: true,
    },
    { enabled: !!activeSemester }
  );

  const { data: myEnrollments = [] } = trpc.enrollments.myCourses.useQuery(
    activeSemester ? { semesterId: activeSemester.id } : undefined,
    { enabled: !!activeSemester }
  );

  const utils = trpc.useUtils();
  const enroll = trpc.enrollments.enroll.useMutation({
    onSuccess: data => {
      toast.success(
        data.status === "enrolled"
          ? "Successfully enrolled!"
          : "Added to waitlist"
      );
      utils.enrollments.myCourses.invalidate();
    },
    onError: err => toast.error(err.message),
  });

  const enrolledCourseIds = new Set(
    myEnrollments
      .filter(
        e =>
          e.enrollment.status === "enrolled" ||
          e.enrollment.status === "waitlisted"
      )
      .map(e => e.course.id)
  );

  const departments = Array.from(
    new Set(courses.map(c => c.department).filter(Boolean))
  );

  return (
    <UniversityLayout title="Course Catalog">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Course Catalog</h1>
        <p className="text-muted-foreground mt-1">
          {activeSemester
            ? `Browse courses for ${activeSemester.name}`
            : "No active semester"}
        </p>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, code, or description..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={department} onValueChange={setDepartment}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="Department" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Departments</SelectItem>
            {departments.map(d => (
              <SelectItem key={d} value={d!}>
                {d}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={level} onValueChange={setLevel}>
          <SelectTrigger className="w-full sm:w-36">
            <SelectValue placeholder="Level" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Levels</SelectItem>
            {["100", "200", "300", "400", "500", "600"].map(l => (
              <SelectItem key={l} value={l}>
                {l}-level
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {!activeSemester ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No active semester. Please check back later.
            </p>
          </CardContent>
        </Card>
      ) : isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : courses.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Search className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">
              No courses found matching your criteria.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {courses.map(course => {
            const isEnrolled = enrolledCourseIds.has(course.id);
            return (
              <Card
                key={course.id}
                className="flex flex-col hover:shadow-md transition-shadow"
              >
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-primary font-semibold">
                        {course.code}
                      </p>
                      <CardTitle className="text-sm mt-0.5 leading-tight">
                        {course.name}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="text-xs shrink-0">
                      {course.level}-lvl
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="flex-1 flex flex-col">
                  {course.description && (
                    <p className="text-xs text-muted-foreground mb-3 line-clamp-2">
                      {course.description}
                    </p>
                  )}
                  <div className="space-y-1.5 mb-4 flex-1">
                    {course.department && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        {course.department}
                      </div>
                    )}
                    {course.scheduleDay && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {course.scheduleDay} {course.scheduleTime}
                      </div>
                    )}
                    {course.room && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {course.room}
                      </div>
                    )}
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Users className="h-3 w-3" />
                      {course.credits} credit{course.credits !== 1 ? "s" : ""}
                    </div>
                  </div>
                  <Button
                    size="sm"
                    variant={isEnrolled ? "secondary" : "default"}
                    disabled={isEnrolled || enroll.isPending}
                    className="w-full"
                    onClick={() => {
                      if (!activeSemester) return;
                      enroll.mutate({
                        courseId: course.id,
                        semesterId: activeSemester.id,
                      });
                    }}
                  >
                    {isEnrolled ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 mr-1.5" /> Enrolled
                      </>
                    ) : (
                      <>
                        <PlusCircle className="h-3.5 w-3.5 mr-1.5" /> Enroll
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </UniversityLayout>
  );
}
