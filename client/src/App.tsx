import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch, useLocation } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";
import { useEffect } from "react";

// Public pages
import Home from "./pages/Home";
import LoginPage from "./pages/Login";

// Student pages
import StudentDashboard from "./pages/student/Dashboard";
import StudentCourses from "./pages/student/Courses";
import StudentCatalog from "./pages/student/Catalog";
import StudentGrades from "./pages/student/Grades";
import StudentTimetable from "./pages/student/Timetable";
import StudentProfile from "./pages/student/Profile";

// Lecturer pages
import LecturerDashboard from "./pages/lecturer/Dashboard";
import LecturerCourses from "./pages/lecturer/Courses";
import LecturerRoster from "./pages/lecturer/Roster";
import LecturerGrades from "./pages/lecturer/Grades";
import LecturerProfile from "./pages/lecturer/Profile";

// Admin pages
import AdminDashboard from "./pages/admin/Dashboard";
import AdminUsers from "./pages/admin/Users";
import AdminPrograms from "./pages/admin/Programs";
import AdminCourses from "./pages/admin/Courses";
import AdminSemesters from "./pages/admin/Semesters";
import AdminEnrollments from "./pages/admin/Enrollments";
import AdminReports from "./pages/admin/Reports";

const publicRoutes = ["/", "/login", "/register"];

function RoleRouter() {
  const { user, loading, isAuthenticated } = useAuth();
  const [location, setLocation] = useLocation();

  useEffect(() => {
    if (!loading) {
      const isPublicRoute = publicRoutes.some(route =>
        route === "/" ? location === "/" : location.startsWith(route)
      );

      if (!isAuthenticated && !isPublicRoute) {
        setLocation("/login");
      } else if (
        isAuthenticated &&
        (location === "/login" || location === "/")
      ) {
        if (user?.role === "admin") setLocation("/admin/dashboard");
        else if (user?.role === "lecturer") setLocation("/lecturer/dashboard");
        else setLocation("/student/dashboard");
      }
    }
  }, [loading, isAuthenticated, user, location, setLocation]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">
            Loading University Portal...
          </p>
        </div>
      </div>
    );
  }

  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/login" component={LoginPage} />

      {/* Student Routes */}
      <Route path="/student/dashboard" component={StudentDashboard} />
      <Route path="/student/courses" component={StudentCourses} />
      <Route path="/student/catalog" component={StudentCatalog} />
      <Route path="/student/grades" component={StudentGrades} />
      <Route path="/student/timetable" component={StudentTimetable} />
      <Route path="/student/profile" component={StudentProfile} />

      {/* Lecturer Routes */}
      <Route path="/lecturer/dashboard" component={LecturerDashboard} />
      <Route path="/lecturer/courses" component={LecturerCourses} />
      <Route path="/lecturer/roster/:courseId" component={LecturerRoster} />
      <Route path="/lecturer/grades/:courseId" component={LecturerGrades} />
      <Route path="/lecturer/profile" component={LecturerProfile} />

      {/* Admin Routes */}
      <Route path="/admin/dashboard" component={AdminDashboard} />
      <Route path="/admin/users" component={AdminUsers} />
      <Route path="/admin/programs" component={AdminPrograms} />
      <Route path="/admin/courses" component={AdminCourses} />
      <Route path="/admin/semesters" component={AdminSemesters} />
      <Route path="/admin/enrollments" component={AdminEnrollments} />
      <Route path="/admin/reports" component={AdminReports} />

      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light">
        <TooltipProvider>
          <Toaster />
          <RoleRouter />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
