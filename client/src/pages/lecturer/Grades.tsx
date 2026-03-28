import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Loader2, ArrowLeft, Save, GraduationCap } from "lucide-react";
import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { toast } from "sonner";
import { calculateLetterGrade, calculateTotalScore, getGradeColor } from "../../../../shared/gpa";

interface GradeEntry {
  enrollmentId: number;
  studentName: string;
  studentId: string | null;
  assignmentScore: string;
  midtermScore: string;
  finalScore: string;
  remarks: string;
  currentGrade: string | null;
  currentTotal: string | null;
}

export default function LecturerGrades() {
  const params = useParams<{ courseId: string }>();
  const courseId = parseInt(params.courseId ?? "0");
  const [entries, setEntries] = useState<GradeEntry[]>([]);
  const [saving, setSaving] = useState<number | null>(null);

  const { data: course } = trpc.courses.getById.useQuery({ id: courseId }, { enabled: !!courseId });
  const { data: roster = [], isLoading, refetch } = trpc.grades.byCourse.useQuery(
    { courseId },
    { enabled: !!courseId }
  );

  useEffect(() => {
    if (roster.length > 0) {
      setEntries(
        roster.map((r) => ({
          enrollmentId: r.enrollment.id,
          studentName: r.student.name ?? "Unknown",
          studentId: r.student.studentId,
          assignmentScore: r.grade?.assignmentScore?.toString() ?? "",
          midtermScore: r.grade?.midtermScore?.toString() ?? "",
          finalScore: r.grade?.finalScore?.toString() ?? "",
          remarks: r.grade?.remarks ?? "",
          currentGrade: r.grade?.letterGrade ?? null,
          currentTotal: r.grade?.totalScore?.toString() ?? null,
        }))
      );
    }
  }, [roster]);

  const upsertGrade = trpc.grades.upsert.useMutation({
    onSuccess: (data, variables) => {
      toast.success(`Grade saved: ${data.letterGrade} (${data.total.toFixed(1)})`);
      setSaving(null);
      refetch();
    },
    onError: (err) => {
      toast.error(err.message);
      setSaving(null);
    },
  });

  const updateEntry = (enrollmentId: number, field: keyof GradeEntry, value: string) => {
    setEntries((prev) =>
      prev.map((e) => (e.enrollmentId === enrollmentId ? { ...e, [field]: value } : e))
    );
  };

  const saveGrade = (entry: GradeEntry) => {
    setSaving(entry.enrollmentId);
    upsertGrade.mutate({
      enrollmentId: entry.enrollmentId,
      assignmentScore: entry.assignmentScore ? parseFloat(entry.assignmentScore) : undefined,
      midtermScore: entry.midtermScore ? parseFloat(entry.midtermScore) : undefined,
      finalScore: entry.finalScore ? parseFloat(entry.finalScore) : undefined,
      remarks: entry.remarks || undefined,
    });
  };

  const getPreviewGrade = (entry: GradeEntry) => {
    const a = entry.assignmentScore ? parseFloat(entry.assignmentScore) : null;
    const m = entry.midtermScore ? parseFloat(entry.midtermScore) : null;
    const f = entry.finalScore ? parseFloat(entry.finalScore) : null;
    if (a === null && m === null && f === null) return null;
    const total = calculateTotalScore(a, m, f);
    return calculateLetterGrade(total);
  };

  return (
    <UniversityLayout title="Manage Grades">
      <div className="flex items-center gap-3 mb-6">
        <Button variant="ghost" size="sm" asChild>
          <Link href="/lecturer/courses"><ArrowLeft className="h-4 w-4 mr-1" />Back</Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{course?.name ?? "Grade Management"}</h1>
          <p className="text-muted-foreground text-sm">
            {course?.code} · Weights: Assignment 30% | Midterm 30% | Final 40%
          </p>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <GraduationCap className="h-4 w-4" />
            Student Grades
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-8">
              <GraduationCap className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No students enrolled in this course.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left py-2 font-medium">Student</th>
                    <th className="text-center py-2 font-medium w-28">Assignment (30%)</th>
                    <th className="text-center py-2 font-medium w-28">Midterm (30%)</th>
                    <th className="text-center py-2 font-medium w-28">Final (40%)</th>
                    <th className="text-center py-2 font-medium w-24">Preview</th>
                    <th className="text-center py-2 font-medium w-24">Saved</th>
                    <th className="text-center py-2 font-medium w-20">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {entries.map((entry) => {
                    const preview = getPreviewGrade(entry);
                    return (
                      <tr key={entry.enrollmentId} className="border-b border-border/50 hover:bg-muted/20">
                        <td className="py-2.5">
                          <p className="font-medium">{entry.studentName}</p>
                          {entry.studentId && (
                            <p className="text-xs text-muted-foreground">{entry.studentId}</p>
                          )}
                        </td>
                        {(["assignmentScore", "midtermScore", "finalScore"] as const).map((field) => (
                          <td key={field} className="py-2 px-1">
                            <Input
                              type="number"
                              min="0"
                              max="100"
                              step="0.1"
                              value={entry[field]}
                              onChange={(e) => updateEntry(entry.enrollmentId, field, e.target.value)}
                              className="h-8 text-center text-xs w-full"
                              placeholder="0–100"
                            />
                          </td>
                        ))}
                        <td className="py-2.5 text-center">
                          {preview ? (
                            <div>
                              <span className={`font-bold text-sm ${getGradeColor(preview.letterGrade)}`}>
                                {preview.letterGrade}
                              </span>
                              <p className="text-xs text-muted-foreground">
                                {calculateTotalScore(
                                  entry.assignmentScore ? parseFloat(entry.assignmentScore) : null,
                                  entry.midtermScore ? parseFloat(entry.midtermScore) : null,
                                  entry.finalScore ? parseFloat(entry.finalScore) : null
                                ).toFixed(1)}
                              </p>
                            </div>
                          ) : (
                            <span className="text-muted-foreground text-xs">—</span>
                          )}
                        </td>
                        <td className="py-2.5 text-center">
                          {entry.currentGrade ? (
                            <span className={`font-bold ${getGradeColor(entry.currentGrade)}`}>
                              {entry.currentGrade}
                            </span>
                          ) : (
                            <span className="text-muted-foreground text-xs">None</span>
                          )}
                        </td>
                        <td className="py-2.5 text-center">
                          <Button
                            size="sm"
                            variant="outline"
                            className="h-7 text-xs"
                            onClick={() => saveGrade(entry)}
                            disabled={saving === entry.enrollmentId}
                          >
                            {saving === entry.enrollmentId ? (
                              <Loader2 className="h-3 w-3 animate-spin" />
                            ) : (
                              <><Save className="h-3 w-3 mr-1" />Save</>
                            )}
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </UniversityLayout>
  );
}
