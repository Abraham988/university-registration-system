import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Clock, MapPin, Users, GraduationCap, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function LecturerCourses() {
  const { data: assignments = [], isLoading } = trpc.courses.myAssignedCourses.useQuery();

  return (
    <UniversityLayout title="My Courses">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Courses</h1>
        <p className="text-muted-foreground mt-1">All courses assigned to you</p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : assignments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <BookOpen className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No courses assigned yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {assignments.map((a) => (
            <Card key={a.assignment.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="text-xs font-mono text-primary font-semibold">{a.course.code}</p>
                    <p className="font-semibold text-sm mt-0.5">{a.course.name}</p>
                  </div>
                  <Badge variant="outline" className="text-xs shrink-0">{a.course.level}-lvl</Badge>
                </div>
                {a.course.description && (
                  <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{a.course.description}</p>
                )}
                <div className="space-y-1.5 mb-4">
                  {a.course.department && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <BookOpen className="h-3 w-3" />{a.course.department}
                    </div>
                  )}
                  {a.course.scheduleDay && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Clock className="h-3 w-3" />{a.course.scheduleDay} {a.course.scheduleTime}
                    </div>
                  )}
                  {a.course.room && (
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <MapPin className="h-3 w-3" />{a.course.room}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                    <Users className="h-3 w-3" />Capacity: {a.course.capacity}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" asChild>
                    <Link href={`/lecturer/roster/${a.course.id}`}><Users className="h-3 w-3 mr-1" />Class Roster</Link>
                  </Button>
                  <Button size="sm" className="flex-1 text-xs" asChild>
                    <Link href={`/lecturer/grades/${a.course.id}`}><GraduationCap className="h-3 w-3 mr-1" />Manage Grades</Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </UniversityLayout>
  );
}
