import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import {
  GraduationCap,
  BookOpen,
  Users,
  BarChart3,
  Shield,
  Clock,
  ArrowRight,
  Loader2,
} from "lucide-react";
import { useEffect } from "react";
import { useLocation } from "wouter";

export default function Home() {
  const { user, loading, isAuthenticated } = useAuth();
  const [, navigate] = useLocation();

  useEffect(() => {
    if (!loading && isAuthenticated && user) {
      if (user.role === "admin") navigate("/admin/dashboard");
      else if (user.role === "lecturer") navigate("/lecturer/dashboard");
      else navigate("/student/dashboard");
    }
  }, [loading, isAuthenticated, user]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card/80 backdrop-blur sticky top-0 z-40">
        <div className="container flex items-center justify-between h-16">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center">
              <GraduationCap className="h-5 w-5 text-primary-foreground" />
            </div>
            <div>
              <span className="font-bold text-foreground">UniPortal</span>
              <span className="text-xs text-muted-foreground ml-1 hidden sm:inline">
                University Registration System
              </span>
            </div>
          </div>
          <Button asChild>
            <a href="/login">
              Sign In <ArrowRight className="h-4 w-4 ml-1" />
            </a>
          </Button>
        </div>
      </header>

      {/* Hero */}
      <section className="py-20 lg:py-28 bg-gradient-to-br from-primary/5 via-background to-accent/10">
        <div className="container text-center">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6">
            <GraduationCap className="h-4 w-4" />
            Academic Management Platform
          </div>
          <h1 className="text-4xl lg:text-6xl font-bold text-foreground mb-6 leading-tight">
            University Registration
            <br />
            <span className="text-primary">Made Simple</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-10">
            A comprehensive platform for students to enroll in courses,
            lecturers to manage classes and grades, and administrators to
            oversee the entire academic system.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild>
              <a href="/login">
                Get Started <ArrowRight className="h-4 w-4 ml-1" />
              </a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <a href="#features">Learn More</a>
            </Button>
          </div>
        </div>
      </section>

      {/* Role cards */}
      <section id="features" className="py-16 bg-background">
        <div className="container">
          <h2 className="text-2xl font-bold text-center mb-3">
            Built for Every Role
          </h2>
          <p className="text-muted-foreground text-center mb-12 max-w-xl mx-auto">
            Tailored experiences for students, lecturers, and administrators
            with role-based access control.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BookOpen,
                title: "Students",
                color: "text-blue-600 bg-blue-50",
                features: [
                  "Browse & enroll in courses",
                  "View timetable & schedule",
                  "Check grades & GPA",
                  "Academic history tracking",
                ],
              },
              {
                icon: Users,
                title: "Lecturers",
                color: "text-purple-600 bg-purple-50",
                features: [
                  "View assigned courses",
                  "Access class rosters",
                  "Upload & manage grades",
                  "Track student performance",
                ],
              },
              {
                icon: Shield,
                title: "Administrators",
                color: "text-red-600 bg-red-50",
                features: [
                  "Manage users & roles",
                  "Create & schedule courses",
                  "Assign lecturers",
                  "Generate reports",
                ],
              },
            ].map(role => (
              <div
                key={role.title}
                className="rounded-xl border border-border bg-card p-6 shadow-sm hover:shadow-md transition-shadow"
              >
                <div
                  className={`w-12 h-12 rounded-xl ${role.color} flex items-center justify-center mb-4`}
                >
                  <role.icon className="h-6 w-6" />
                </div>
                <h3 className="text-lg font-semibold mb-3">{role.title}</h3>
                <ul className="space-y-2">
                  {role.features.map(f => (
                    <li
                      key={f}
                      className="flex items-center gap-2 text-sm text-muted-foreground"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats */}
      <section className="py-16 bg-primary text-primary-foreground">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { value: "3", label: "User Roles" },
              { value: "Full", label: "CRUD Operations" },
              { value: "GPA", label: "Auto-Calculated" },
              { value: "Real-time", label: "Notifications" },
            ].map(stat => (
              <div key={stat.label}>
                <p className="text-3xl font-bold mb-1">{stat.value}</p>
                <p className="text-primary-foreground/70 text-sm">
                  {stat.label}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-background">
        <div className="container text-center">
          <h2 className="text-2xl font-bold mb-4">Ready to Get Started?</h2>
          <p className="text-muted-foreground mb-8">
            Sign in to access your personalized university portal.
          </p>
          <Button size="lg" asChild>
            <a href="/login">
              Sign In to UniPortal <ArrowRight className="h-4 w-4 ml-1" />
            </a>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border py-6 bg-card">
        <div className="container flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <GraduationCap className="h-4 w-4 text-primary" />
            <span className="text-sm font-medium">UniPortal</span>
          </div>
          <p className="text-xs text-muted-foreground">
            University Registration System — All rights reserved
          </p>
        </div>
      </footer>
    </div>
  );
}
