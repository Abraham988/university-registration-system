import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  BookOpen,
  Search,
  Plus,
  Edit,
  Trash2,
  Loader2,
  UserCheck,
} from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  code: "",
  name: "",
  description: "",
  department: "",
  credits: "3",
  level: "100",
  capacity: "30",
  scheduleDay: "",
  scheduleTime: "",
  room: "",
  semesterId: "",
  isActive: true,
};

export default function AdminCourses() {
  const [search, setSearch] = useState("");
  const [deptFilter, setDeptFilter] = useState<string>("all");
  const [showForm, setShowForm] = useState(false);
  const [editCourse, setEditCourse] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [assignDialog, setAssignDialog] = useState<{
    courseId: number;
    courseName: string;
  } | null>(null);
  const [selectedLecturerId, setSelectedLecturerId] = useState<string>("");

  const { data: semesters = [] } = trpc.semesters.list.useQuery();
  const { data: activeSemester } = trpc.semesters.getActive.useQuery();
  const { data: lecturers = [] } = trpc.users.lecturers.useQuery();
  const {
    data: courses = [],
    isLoading,
    refetch,
  } = trpc.courses.list.useQuery({
    search: search || undefined,
    department: deptFilter === "all" ? undefined : deptFilter,
  });

  const utils = trpc.useUtils();

  const createCourse = trpc.courses.create.useMutation({
    onSuccess: () => {
      toast.success("Course created");
      setShowForm(false);
      setForm({ ...emptyForm });
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const updateCourse = trpc.courses.update.useMutation({
    onSuccess: () => {
      toast.success("Course updated");
      setEditCourse(null);
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteCourse = trpc.courses.delete.useMutation({
    onSuccess: () => {
      toast.success("Course deleted");
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const assignLecturer = trpc.courses.assignLecturer.useMutation({
    onSuccess: () => {
      toast.success("Lecturer assigned");
      setAssignDialog(null);
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const openEdit = (course: any) => {
    setEditCourse(course);
    setForm({
      code: course.code ?? "",
      name: course.name ?? "",
      description: course.description ?? "",
      department: course.department ?? "",
      credits: String(course.credits ?? 3),
      level: String(course.level ?? 100),
      capacity: String(course.capacity ?? 30),
      scheduleDay: course.scheduleDay ?? "",
      scheduleTime: course.scheduleTime ?? "",
      room: course.room ?? "",
      semesterId: String(course.semesterId ?? ""),
      isActive: course.isActive ?? true,
    });
  };

  const handleSubmit = () => {
    const payload = {
      ...form,
      credits: parseInt(form.credits),
      level: form.level as "100" | "200" | "300" | "400" | "500" | "600",
      capacity: parseInt(form.capacity),
      semesterId: form.semesterId ? parseInt(form.semesterId) : undefined,
    };
    if (editCourse) {
      updateCourse.mutate({ id: editCourse.id, ...payload });
    } else {
      createCourse.mutate(payload as any);
    }
  };

  const departments = Array.from(
    new Set(courses.map(c => c.department).filter(Boolean))
  );

  const CourseForm = () => (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <Label>Course Code *</Label>
          <Input
            value={form.code}
            onChange={e => setForm({ ...form, code: e.target.value })}
            placeholder="e.g. CS101"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Course Name *</Label>
          <Input
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            placeholder="Introduction to Computing"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Department</Label>
          <Input
            value={form.department}
            onChange={e => setForm({ ...form, department: e.target.value })}
            placeholder="Computer Science"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Semester</Label>
          <Select
            value={form.semesterId}
            onValueChange={v => setForm({ ...form, semesterId: v })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select semester" />
            </SelectTrigger>
            <SelectContent>
              {semesters.map(s => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Credits</Label>
          <Input
            type="number"
            min="1"
            max="12"
            value={form.credits}
            onChange={e => setForm({ ...form, credits: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Level</Label>
          <Select
            value={form.level}
            onValueChange={v => setForm({ ...form, level: v })}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["100", "200", "300", "400", "500", "600"].map(l => (
                <SelectItem key={l} value={l}>
                  {l}-level
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Capacity</Label>
          <Input
            type="number"
            min="1"
            value={form.capacity}
            onChange={e => setForm({ ...form, capacity: e.target.value })}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Schedule Day</Label>
          <Input
            value={form.scheduleDay}
            onChange={e => setForm({ ...form, scheduleDay: e.target.value })}
            placeholder="Mon/Wed"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Schedule Time</Label>
          <Input
            value={form.scheduleTime}
            onChange={e => setForm({ ...form, scheduleTime: e.target.value })}
            placeholder="9:00 AM - 10:30 AM"
          />
        </div>
        <div className="space-y-1.5">
          <Label>Room</Label>
          <Input
            value={form.room}
            onChange={e => setForm({ ...form, room: e.target.value })}
            placeholder="Room 101"
          />
        </div>
      </div>
      <div className="space-y-1.5">
        <Label>Description</Label>
        <Textarea
          value={form.description}
          onChange={e => setForm({ ...form, description: e.target.value })}
          rows={2}
        />
      </div>
    </div>
  );

  return (
    <UniversityLayout title="Course Management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Course Management</h1>
          <p className="text-muted-foreground mt-1">
            Create, update, and manage courses
          </p>
        </div>
        <Button
          onClick={() => {
            setEditCourse(null);
            setForm({ ...emptyForm });
            setShowForm(true);
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Course
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search courses..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={deptFilter} onValueChange={setDeptFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All Departments" />
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
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base">
            {isLoading ? "Loading..." : `${courses.length} Courses`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No courses found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left py-2 font-medium">Course</th>
                    <th className="text-left py-2 font-medium hidden md:table-cell">
                      Department
                    </th>
                    <th className="text-left py-2 font-medium hidden lg:table-cell">
                      Lecturer
                    </th>
                    <th className="text-center py-2 font-medium">Credits</th>
                    <th className="text-center py-2 font-medium hidden lg:table-cell">
                      Level
                    </th>
                    <th className="text-center py-2 font-medium hidden lg:table-cell">
                      Students
                    </th>
                    <th className="text-center py-2 font-medium">Status</th>
                    <th className="text-center py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(course => (
                    <tr
                      key={course.id}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="py-2.5">
                        <p className="font-mono text-xs text-primary font-semibold">
                          {course.code}
                        </p>
                        <p className="font-medium">{course.name}</p>
                      </td>
                      <td className="py-2.5 text-muted-foreground hidden md:table-cell">
                        {course.department ?? "—"}
                      </td>
                      <td className="py-2.5 text-muted-foreground hidden lg:table-cell">
                        {course.assignment?.lecturerId ? (
                          <span className="text-primary font-medium">
                            Assigned
                          </span>
                        ) : (
                          <span className="text-orange-500">Unassigned</span>
                        )}
                      </td>
                      <td className="py-2.5 text-center">{course.credits}</td>
                      <td className="py-2.5 text-center hidden lg:table-cell">
                        {course.level}
                      </td>
                      <td className="py-2.5 text-center hidden lg:table-cell">
                        {course.enrollmentCount ?? 0}
                      </td>
                      <td className="py-2.5 text-center">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-600"}`}
                        >
                          {course.isActive ? "Active" : "Inactive"}
                        </span>
                      </td>
                      <td className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            title="Assign Lecturer"
                            onClick={() =>
                              setAssignDialog({
                                courseId: course.id,
                                courseName: course.name,
                              })
                            }
                          >
                            <UserCheck className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => {
                              openEdit(course);
                              setShowForm(true);
                            }}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Delete ${course.name}?`))
                                deleteCourse.mutate({ id: course.id });
                            }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={open => !open && setShowForm(false)}
      >
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {editCourse ? "Edit Course" : "Create New Course"}
            </DialogTitle>
          </DialogHeader>
          <CourseForm />
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={createCourse.isPending || updateCourse.isPending}
            >
              {(createCourse.isPending || updateCourse.isPending) && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              {editCourse ? "Update Course" : "Create Course"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Assign Lecturer Dialog */}
      <Dialog
        open={!!assignDialog}
        onOpenChange={open => !open && setAssignDialog(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign Lecturer</DialogTitle>
          </DialogHeader>
          <div className="py-2">
            <p className="text-sm text-muted-foreground mb-4">
              Course: <strong>{assignDialog?.courseName}</strong>
            </p>
            <div className="space-y-1.5">
              <Label>Select Lecturer</Label>
              <Select
                value={selectedLecturerId}
                onValueChange={setSelectedLecturerId}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Choose a lecturer" />
                </SelectTrigger>
                <SelectContent>
                  {lecturers.map(l => (
                    <SelectItem key={l.id} value={String(l.id)}>
                      {l.name} {l.department ? `(${l.department})` : ""}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAssignDialog(null)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedLecturerId || assignLecturer.isPending}
              onClick={() => {
                if (assignDialog && selectedLecturerId) {
                  assignLecturer.mutate({
                    courseId: assignDialog.courseId,
                    lecturerId: parseInt(selectedLecturerId),
                  });
                }
              }}
            >
              {assignLecturer.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Assign Lecturer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UniversityLayout>
  );
}
