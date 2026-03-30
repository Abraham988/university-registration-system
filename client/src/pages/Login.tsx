import { useState } from "react";
import { useLocation } from "wouter";
import { GraduationCap, Loader2, LogIn } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function LoginPage() {
  const [, setLocation] = useLocation();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState("");
  const [role, setRole] = useState<"student" | "lecturer" | "admin">("student");
  const [selectedProgram, setSelectedProgram] = useState<string>("");
  const [studentId, setStudentId] = useState("");

  const { data: programs = [] } = trpc.programs.list.useQuery();
  const utils = trpc.useUtils();

  const loginMutation = trpc.auth.login.useMutation({
    onSuccess: async data => {
      console.log("Login successful, role:", data.role);
      toast.success(
        data.role === "admin"
          ? "Welcome Admin!"
          : data.role === "lecturer"
            ? "Welcome Lecturer!"
            : "Welcome Student!"
      );
      await utils.auth.me.invalidate();
      await utils.auth.me.refetch();
      await new Promise(r => setTimeout(r, 300));
      const redirectPath =
        data.role === "admin"
          ? "/admin/dashboard"
          : data.role === "lecturer"
            ? "/lecturer/dashboard"
            : "/student/dashboard";
      console.log("Redirecting to:", redirectPath);
      setLocation(redirectPath);
    },
    onError: err => {
      console.error("Login error:", err);
      toast.error(err.message);
    },
  });

  const enrollProgramMutation = trpc.programs.enroll.useMutation({
    onSuccess: () => {
      toast.success("Enrolled in program! Redirecting to dashboard...");
      window.location.href = "/student/dashboard";
    },
    onError: err => toast.error(err.message),
  });

  const registerMutation = trpc.auth.register.useMutation({
    onSuccess: async (data, variables) => {
      toast.success("Account created! Please log in.");
      if (variables.role === "student" && selectedProgram) {
        enrollProgramMutation.mutate({
          programId: parseInt(selectedProgram),
          yearOfStudy: 1,
        });
      } else {
        setIsRegistering(false);
      }
    },
    onError: err => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isRegistering) {
      registerMutation.mutate({ name, email, password, role });
    } else {
      loginMutation.mutate({ email, password });
    }
  };

  const isLoading = loginMutation.isPending || registerMutation.isPending;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/10 p-4">
      <div className="w-full max-w-md">
        <div className="flex items-center justify-center gap-2 mb-8">
          <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
            <GraduationCap className="h-6 w-6 text-primary-foreground" />
          </div>
          <div>
            <span className="font-bold text-2xl text-foreground">
              UniPortal
            </span>
            <p className="text-xs text-muted-foreground">
              University Registration System
            </p>
          </div>
        </div>

        <Card>
          <CardHeader className="text-center">
            <CardTitle className="text-xl">
              {isRegistering ? "Create Account" : "Welcome Back"}
            </CardTitle>
            <CardDescription>
              {isRegistering
                ? "Fill in your details to register"
                : "Sign in to access your portal"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              {isRegistering && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      placeholder="John Doe"
                      value={name}
                      onChange={e => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label>Role</Label>
                    <div className="flex gap-2">
                      {(["student", "lecturer", "admin"] as const).map(r => (
                        <Button
                          key={r}
                          type="button"
                          variant={role === r ? "default" : "outline"}
                          size="sm"
                          onClick={() => setRole(r)}
                          className="flex-1 capitalize"
                        >
                          {r}
                        </Button>
                      ))}
                    </div>
                  </div>
                  {role === "student" && (
                    <>
                      <div className="space-y-2">
                        <Label htmlFor="studentId">Student ID</Label>
                        <Input
                          id="studentId"
                          placeholder="e.g. SCIT/2024/001"
                          value={studentId}
                          onChange={e => setStudentId(e.target.value)}
                          required
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Select Program</Label>
                        <Select
                          value={selectedProgram}
                          onValueChange={setSelectedProgram}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Choose your program" />
                          </SelectTrigger>
                          <SelectContent>
                            {programs.map(p => (
                              <SelectItem key={p.id} value={String(p.id)}>
                                {p.code} - {p.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </>
                  )}
                </>
              )}
              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@university.edu"
                  value={email}
                  onChange={e => setEmail(e.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <LogIn className="h-4 w-4 mr-2" />
                )}
                {isRegistering ? "Create Account" : "Sign In"}
              </Button>
            </form>

            <div className="mt-4 text-center text-sm">
              {isRegistering ? (
                <>
                  Already have an account?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setIsRegistering(false)}
                  >
                    Sign in
                  </button>
                </>
              ) : (
                <>
                  Don't have an account?{" "}
                  <button
                    type="button"
                    className="text-primary hover:underline"
                    onClick={() => setIsRegistering(true)}
                  >
                    Register
                  </button>
                </>
              )}
            </div>
          </CardContent>
        </Card>

        <div className="mt-6 text-center text-xs text-muted-foreground">
          <p>Demo accounts (any password works):</p>
          <p>
            admin@university.edu | lecturer@university.edu |
            student@university.edu
          </p>
        </div>
      </div>
    </div>
  );
}
