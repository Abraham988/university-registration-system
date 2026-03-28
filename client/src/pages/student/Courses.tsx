import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { BookOpen, Clock, MapPin, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Link } from "wouter";

const statusColors: Record<string, string> = {
  enrolled: "bg-green-100 text-green-700",
  waitlisted: "bg-yellow-100 text-yellow-700",
  dropped: "bg-red-100 text-red-700",
  completed: "bg-blue-100 text-blue-700",
};

export default function StudentCourses() {
  const [selectedSemesterId, setSelectedSemesterId] = useState<string>("");
  const { data: semesters = [] } = trpc.semesters.list.useQuery();
  const { data: activeSemester } = trpc.semesters.getActive.useQuery();

  const semId = selectedSemesterId
    ? parseInt(selectedSemesterId)
    : activeSemester?.id;

  const { data: enrollments = [], isLoading } = trpc.enrollments.myCourses.useQuery(
    semId ? { semesterId: semId } : undefined
  );

  const utils = trpc.useUtils();
  const drop = trpc.enrollments.drop.useMutation({
    onSuccess: () => {
      toast.success("Course dropped successfully");
      utils.enrollments.myCourses.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const activeEnrollments = enrollments.filter((e) => e.enrollment.status !== "dropped");
  const droppedEnrollments = enrollments.filter((e) => e.enrollment.status === "dropped");

  return (
    <UniversityLayout title="My Courses">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">My Courses</h1>
          <p className="text-muted-foreground mt-1">Manage your course enrollments</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedSemesterId} onValueChange={setSelectedSemesterId}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder={activeSemester?.name ?? "Select semester"} />
            </SelectTrigger>
            <SelectContent>
              {semesters.map((s) => (
                <SelectItem key={s.id} value={String(s.id)}>
                  {s.name} {s.isActive && "✓"}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" asChild>
            <Link href="/student/catalog">+ Enroll</Link>
          </Button>
        </div>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : activeEnrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No courses enrolled for this semester.</p>
            <Button asChild>
              <Link href="/student/catalog">Browse Course Catalog</Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
            {activeEnrollments.map((e) => (
              <Card key={e.enrollment.id} className="hover:shadow-md transition-shadow">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="text-xs font-mono text-primary font-semibold">{e.course.code}</p>
                      <CardTitle className="text-sm mt-0.5 leading-tight">{e.course.name}</CardTitle>
                    </div>
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium shrink-0 ${statusColors[e.enrollment.status] ?? ""}`}>
                      {e.enrollment.status}
                    </span>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-1.5 mb-4">
                    {e.course.department && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <BookOpen className="h-3 w-3" />
                        {e.course.department}
                      </div>
                    )}
                    {e.course.scheduleDay && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Clock className="h-3 w-3" />
                        {e.course.scheduleDay} {e.course.scheduleTime}
                      </div>
                    )}
                    {e.course.room && (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {e.course.room}
                      </div>
                    )}
                    <p className="text-xs text-muted-foreground">{e.course.credits} credit hours</p>
                  </div>

                  {e.enrollment.status === "enrolled" && (
                    <AlertDialog>
                      <AlertDialogTrigger asChild>
                        <Button variant="outline" size="sm" className="w-full text-destructive hover:text-destructive">
                          <Trash2 className="h-3.5 w-3.5 mr-1.5" /> Drop Course
                        </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Drop {e.course.name}?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Are you sure you want to drop this course? This action may affect your academic record.
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            onClick={() => drop.mutate({ enrollmentId: e.enrollment.id })}
                          >
                            Drop Course
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>

          {droppedEnrollments.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-muted-foreground mb-3">Dropped Courses</h2>
              <div className="space-y-2">
                {droppedEnrollments.map((e) => (
                  <div key={e.enrollment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 opacity-60">
                    <div>
                      <span className="text-sm font-medium">{e.course.name}</span>
                      <span className="text-xs text-muted-foreground ml-2">({e.course.code})</span>
                    </div>
                    <Badge variant="outline" className="text-xs">Dropped</Badge>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </UniversityLayout>
  );
}
