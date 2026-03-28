import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useState, useEffect } from "react";
import { toast } from "sonner";
import { User, Mail, Phone, MapPin, BookOpen, Loader2, Save } from "lucide-react";

export default function StudentProfile() {
  const { user } = useAuth();
  const utils = trpc.useUtils();

  const [form, setForm] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: (user as any)?.phone ?? "",
    department: (user as any)?.department ?? "",
    address: (user as any)?.address ?? "",
    bio: (user as any)?.bio ?? "",
  });

  useEffect(() => {
    if (user) {
      setForm({
        name: user.name ?? "",
        email: user.email ?? "",
        phone: (user as any).phone ?? "",
        department: (user as any).department ?? "",
        address: (user as any).address ?? "",
        bio: (user as any).bio ?? "",
      });
    }
  }, [user]);

  const update = trpc.users.updateProfile.useMutation({
    onSuccess: () => {
      toast.success("Profile updated successfully");
      utils.auth.me.invalidate();
    },
    onError: (err) => toast.error(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    update.mutate(form);
  };

  return (
    <UniversityLayout title="My Profile">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <p className="text-muted-foreground mt-1">Manage your personal information</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Avatar card */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="pt-6 text-center">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto mb-4 text-primary text-2xl font-bold">
              {user?.name?.charAt(0)?.toUpperCase() ?? "U"}
            </div>
            <p className="font-semibold text-lg">{user?.name}</p>
            <p className="text-sm text-muted-foreground">{user?.email}</p>
            <div className="mt-3">
              <span className={`text-xs px-3 py-1 rounded-full font-medium ${
                user?.role === "admin" ? "bg-red-100 text-red-700" :
                user?.role === "lecturer" ? "bg-purple-100 text-purple-700" :
                "bg-blue-100 text-blue-700"
              }`}>
                {user?.role?.charAt(0).toUpperCase()}{user?.role?.slice(1)}
              </span>
            </div>
            {(user as any)?.studentId && (
              <p className="text-xs text-muted-foreground mt-3">ID: {(user as any).studentId}</p>
            )}
            {(user as any)?.department && (
              <p className="text-xs text-muted-foreground">{(user as any).department}</p>
            )}
          </CardContent>
        </Card>

        {/* Edit form */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base">Edit Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <Label htmlFor="name">Full Name</Label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="name"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="pl-9"
                      placeholder="Your full name"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="email">Email Address</Label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) => setForm({ ...form, email: e.target.value })}
                      className="pl-9"
                      placeholder="your@email.com"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="phone">Phone Number</Label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="phone"
                      value={form.phone}
                      onChange={(e) => setForm({ ...form, phone: e.target.value })}
                      className="pl-9"
                      placeholder="+1 234 567 8900"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="department">Department</Label>
                  <div className="relative">
                    <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      id="department"
                      value={form.department}
                      onChange={(e) => setForm({ ...form, department: e.target.value })}
                      className="pl-9"
                      placeholder="e.g. Computer Science"
                    />
                  </div>
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="address">Address</Label>
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="address"
                    value={form.address}
                    onChange={(e) => setForm({ ...form, address: e.target.value })}
                    className="pl-9"
                    placeholder="Your address"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  placeholder="Tell us about yourself..."
                  rows={3}
                />
              </div>
              <Button type="submit" disabled={update.isPending} className="w-full sm:w-auto">
                {update.isPending ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Save className="h-4 w-4 mr-2" />}
                Save Changes
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </UniversityLayout>
  );
}
