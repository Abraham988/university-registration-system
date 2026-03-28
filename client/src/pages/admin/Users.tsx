import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { Label } from "@/components/ui/label";
import { Users, Search, Loader2, Edit, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";

const roleColors: Record<string, string> = {
  admin: "bg-red-100 text-red-700",
  lecturer: "bg-purple-100 text-purple-700",
  student: "bg-blue-100 text-blue-700",
};

export default function AdminUsers() {
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [editUser, setEditUser] = useState<any>(null);
  const [editForm, setEditForm] = useState({
    name: "",
    email: "",
    role: "student",
    department: "",
    studentId: "",
    employeeId: "",
  });

  const {
    data: users = [],
    isLoading,
    refetch,
  } = trpc.users.list.useQuery({
    search: search || undefined,
    role: (roleFilter === "all" ? undefined : roleFilter) as any,
  });
  const utils = trpc.useUtils();

  const updateUser = trpc.users.update.useMutation({
    onSuccess: () => {
      toast.success("User updated successfully");
      setEditUser(null);
      refetch();
    },
    onError: err => toast.error(err.message),
  });

  const deleteUser = trpc.users.delete.useMutation({
    onSuccess: () => {
      toast.success("User deleted");
      refetch();
    },
    onError: err => toast.error(err.message),
  });

  const openEdit = (user: any) => {
    setEditUser(user);
    setEditForm({
      name: user.name ?? "",
      email: user.email ?? "",
      role: user.role ?? "student",
      department: user.department ?? "",
      studentId: user.studentId ?? "",
      employeeId: user.employeeId ?? "",
    });
  };

  return (
    <UniversityLayout title="User Management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">User Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage students, lecturers, and administrators
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name or email..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="w-full sm:w-40">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            <SelectItem value="student">Students</SelectItem>
            <SelectItem value="lecturer">Lecturers</SelectItem>
            <SelectItem value="admin">Admins</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-4 w-4" />
            {isLoading ? "Loading..." : `${users.length} Users`}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-8">
              <Users className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
              <p className="text-muted-foreground">No users found.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-xs text-muted-foreground">
                    <th className="text-left py-2 font-medium">User</th>
                    <th className="text-left py-2 font-medium">Role</th>
                    <th className="text-left py-2 font-medium hidden md:table-cell">
                      Department
                    </th>
                    <th className="text-left py-2 font-medium hidden lg:table-cell">
                      ID
                    </th>
                    <th className="text-left py-2 font-medium hidden lg:table-cell">
                      Joined
                    </th>
                    <th className="text-center py-2 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr
                      key={user.id}
                      className="border-b border-border/50 hover:bg-muted/30"
                    >
                      <td className="py-2.5">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                            {user.name?.charAt(0)?.toUpperCase() ?? "?"}
                          </div>
                          <div>
                            <p className="font-medium">{user.name ?? "—"}</p>
                            <p className="text-xs text-muted-foreground">
                              {user.email ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="py-2.5">
                        <span
                          className={`text-xs px-2 py-0.5 rounded-full font-medium ${roleColors[user.role] ?? ""}`}
                        >
                          {user.role}
                        </span>
                      </td>
                      <td className="py-2.5 text-muted-foreground hidden md:table-cell">
                        {(user as any).department ?? "—"}
                      </td>
                      <td className="py-2.5 text-muted-foreground text-xs hidden lg:table-cell">
                        {(user as any).studentId ??
                          (user as any).employeeId ??
                          "—"}
                      </td>
                      <td className="py-2.5 text-muted-foreground text-xs hidden lg:table-cell">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="py-2.5 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0"
                            onClick={() => openEdit(user)}
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 w-7 p-0 text-destructive hover:text-destructive"
                            onClick={() => {
                              if (confirm(`Delete ${user.name}?`))
                                deleteUser.mutate({ id: user.id });
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

      {/* Edit Dialog */}
      <Dialog
        open={!!editUser}
        onOpenChange={open => !open && setEditUser(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit User</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Full Name</Label>
                <Input
                  value={editForm.name}
                  onChange={e =>
                    setEditForm({ ...editForm, name: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Email</Label>
                <Input
                  value={editForm.email}
                  onChange={e =>
                    setEditForm({ ...editForm, email: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Role</Label>
                <Select
                  value={editForm.role}
                  onValueChange={v => setEditForm({ ...editForm, role: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="student">Student</SelectItem>
                    <SelectItem value="lecturer">Lecturer</SelectItem>
                    <SelectItem value="admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Department</Label>
                <Input
                  value={editForm.department}
                  onChange={e =>
                    setEditForm({ ...editForm, department: e.target.value })
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label>Student ID</Label>
                <Input
                  value={editForm.studentId}
                  onChange={e =>
                    setEditForm({ ...editForm, studentId: e.target.value })
                  }
                  placeholder="e.g. STU-2024-001"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Employee ID</Label>
                <Input
                  value={editForm.employeeId}
                  onChange={e =>
                    setEditForm({ ...editForm, employeeId: e.target.value })
                  }
                  placeholder="e.g. EMP-001"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditUser(null)}>
              Cancel
            </Button>
            <Button
              onClick={() =>
                updateUser.mutate({
                  id: editUser.id,
                  name: editForm.name,
                  email: editForm.email,
                  role: editForm.role as any,
                  department: editForm.department,
                  studentId: editForm.studentId,
                  employeeId: editForm.employeeId,
                })
              }
              disabled={updateUser.isPending}
            >
              {updateUser.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UniversityLayout>
  );
}
