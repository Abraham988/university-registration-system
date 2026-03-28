import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, MapPin, BookOpen, Loader2 } from "lucide-react";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAY_SHORT: Record<string, string> = {
  Mon: "Monday", Tue: "Tuesday", Wed: "Wednesday", Thu: "Thursday",
  Fri: "Friday", Sat: "Saturday", Sun: "Sunday",
};

const COLORS = [
  "bg-blue-100 border-blue-300 text-blue-800",
  "bg-purple-100 border-purple-300 text-purple-800",
  "bg-emerald-100 border-emerald-300 text-emerald-800",
  "bg-orange-100 border-orange-300 text-orange-800",
  "bg-pink-100 border-pink-300 text-pink-800",
  "bg-cyan-100 border-cyan-300 text-cyan-800",
];

export default function StudentTimetable() {
  const { data: activeSemester } = trpc.semesters.getActive.useQuery();
  const { data: enrollments = [], isLoading } = trpc.enrollments.myCourses.useQuery(
    activeSemester ? { semesterId: activeSemester.id } : undefined,
    { enabled: !!activeSemester }
  );

  const activeEnrollments = enrollments.filter((e) => e.enrollment.status === "enrolled");

  // Parse schedule days: "Mon/Wed" → ["Monday", "Wednesday"]
  const parseDays = (scheduleDay: string | null): string[] => {
    if (!scheduleDay) return [];
    return scheduleDay
      .split(/[/,\s]+/)
      .map((d) => DAY_SHORT[d.trim()] ?? d.trim())
      .filter((d) => DAYS.includes(d));
  };

  // Build timetable grid
  const timetable: Record<string, Array<{ course: typeof activeEnrollments[0]["course"]; colorIdx: number }>> = {};
  DAYS.forEach((d) => (timetable[d] = []));

  activeEnrollments.forEach((e, idx) => {
    const days = parseDays(e.course.scheduleDay);
    days.forEach((day) => {
      if (timetable[day]) {
        timetable[day].push({ course: e.course, colorIdx: idx % COLORS.length });
      }
    });
  });

  const hasCourses = activeEnrollments.some((e) => e.course.scheduleDay);

  return (
    <UniversityLayout title="Timetable">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Weekly Timetable</h1>
        <p className="text-muted-foreground mt-1">
          {activeSemester ? activeSemester.name : "No active semester"}
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : activeEnrollments.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No enrolled courses for this semester.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Weekly grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            {DAYS.map((day) => (
              <div key={day} className="min-h-32">
                <div className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2 pb-1 border-b border-border">
                  {day.slice(0, 3)}
                </div>
                <div className="space-y-2">
                  {timetable[day].length === 0 ? (
                    <div className="h-20 rounded-lg border border-dashed border-border flex items-center justify-center">
                      <span className="text-xs text-muted-foreground/50">Free</span>
                    </div>
                  ) : (
                    timetable[day].map((item, i) => (
                      <div
                        key={i}
                        className={`p-2 rounded-lg border text-xs ${COLORS[item.colorIdx]}`}
                      >
                        <p className="font-semibold leading-tight truncate">{item.course.code}</p>
                        <p className="truncate mt-0.5 opacity-80">{item.course.name}</p>
                        {item.course.scheduleTime && (
                          <div className="flex items-center gap-1 mt-1 opacity-70">
                            <Clock className="h-2.5 w-2.5" />
                            <span>{item.course.scheduleTime}</span>
                          </div>
                        )}
                        {item.course.room && (
                          <div className="flex items-center gap-1 mt-0.5 opacity-70">
                            <MapPin className="h-2.5 w-2.5" />
                            <span>{item.course.room}</span>
                          </div>
                        )}
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Course list */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Course Schedule Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {activeEnrollments.map((e, idx) => (
                  <div key={e.enrollment.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                    <div className={`w-3 h-3 rounded-full mt-0.5 shrink-0 ${COLORS[idx % COLORS.length].split(" ")[0].replace("bg-", "bg-").replace("100", "400")}`} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p className="text-sm font-medium">{e.course.name}</p>
                          <p className="text-xs text-muted-foreground">{e.course.code} · {e.course.credits} credits</p>
                        </div>
                        <Badge variant="outline" className="text-xs shrink-0">{e.course.department}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-3 mt-2">
                        {e.course.scheduleDay && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Calendar className="h-3 w-3" />
                            {e.course.scheduleDay}
                          </div>
                        )}
                        {e.course.scheduleTime && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Clock className="h-3 w-3" />
                            {e.course.scheduleTime}
                          </div>
                        )}
                        {e.course.room && (
                          <div className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MapPin className="h-3 w-3" />
                            {e.course.room}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </UniversityLayout>
  );
}
