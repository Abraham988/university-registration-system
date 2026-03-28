/**
 * GPA and grading utilities shared between server and client.
 */

export interface GradeEntry {
  credits: number;
  gradePoints: number | null | string;
  letterGrade: string | null;
  status: string;
}

/**
 * Calculate letter grade and grade points from a total score (0–100).
 */
export function calculateLetterGrade(total: number): { letterGrade: string; gradePoints: number } {
  if (total >= 90) return { letterGrade: "A+", gradePoints: 4.0 };
  if (total >= 85) return { letterGrade: "A", gradePoints: 4.0 };
  if (total >= 80) return { letterGrade: "A-", gradePoints: 3.7 };
  if (total >= 77) return { letterGrade: "B+", gradePoints: 3.3 };
  if (total >= 73) return { letterGrade: "B", gradePoints: 3.0 };
  if (total >= 70) return { letterGrade: "B-", gradePoints: 2.7 };
  if (total >= 67) return { letterGrade: "C+", gradePoints: 2.3 };
  if (total >= 63) return { letterGrade: "C", gradePoints: 2.0 };
  if (total >= 60) return { letterGrade: "C-", gradePoints: 1.7 };
  if (total >= 57) return { letterGrade: "D+", gradePoints: 1.3 };
  if (total >= 53) return { letterGrade: "D", gradePoints: 1.0 };
  if (total >= 50) return { letterGrade: "D-", gradePoints: 0.7 };
  return { letterGrade: "F", gradePoints: 0.0 };
}

/**
 * Calculate total score from components.
 * Weights: Assignment 30%, Midterm 30%, Final 40%
 */
export function calculateTotalScore(
  assignment: number | null,
  midterm: number | null,
  final: number | null
): number {
  const a = assignment ?? 0;
  const m = midterm ?? 0;
  const f = final ?? 0;
  return Math.round((a * 0.3 + m * 0.3 + f * 0.4) * 100) / 100;
}

/**
 * Calculate cumulative GPA from an array of grade entries.
 * Only includes completed/enrolled courses with grade points.
 */
export function calculateCumulativeGPA(entries: GradeEntry[]): number {
  let totalPoints = 0;
  let totalCredits = 0;

  for (const entry of entries) {
    if (entry.status === "dropped") continue;
    if (entry.gradePoints === null || entry.gradePoints === undefined) continue;
    const gp = Number(entry.gradePoints);
    if (isNaN(gp)) continue;
    totalPoints += gp * entry.credits;
    totalCredits += entry.credits;
  }

  if (totalCredits === 0) return 0;
  return Math.round((totalPoints / totalCredits) * 100) / 100;
}

/**
 * Get a color class for a letter grade (for UI display).
 */
export function getGradeColor(letterGrade: string | null): string {
  if (!letterGrade) return "text-muted-foreground";
  if (letterGrade.startsWith("A")) return "text-emerald-600";
  if (letterGrade.startsWith("B")) return "text-blue-600";
  if (letterGrade.startsWith("C")) return "text-yellow-600";
  if (letterGrade.startsWith("D")) return "text-orange-600";
  return "text-red-600";
}

/**
 * Get a badge variant for a letter grade.
 */
export function getGradeBadgeVariant(letterGrade: string | null): "default" | "secondary" | "destructive" | "outline" {
  if (!letterGrade) return "outline";
  if (letterGrade.startsWith("A")) return "default";
  if (letterGrade.startsWith("B") || letterGrade.startsWith("C")) return "secondary";
  return "destructive";
}
