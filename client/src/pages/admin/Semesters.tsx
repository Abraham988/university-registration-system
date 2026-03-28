import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Calendar, Plus, Edit, Trash2, Loader2, CheckCircle } from "lucide-react";
import { toast } from "sonner";

const emptyForm = { name: "", academicYear: "", term: "Fall" as "Fall" | "Spring" | "Summer", startDate: "", endDate: "", isActive: false };

export default function AdminSemesters() {
  const [showForm, setShowForm] = useState(false);
  const [editSemester, setEditSemester] = useState<any>(null);
  const [form, setForm] = useState<{ name: string; academicYear: string; term: "Fall" | "Spring" | "Summer"; startDate: string; endDate: string; isActive: boolean }>({ ...emptyForm });

  const { data: semesters = [], isLoading, refetch } = trpc.semesters.list.useQuery();

  const create = trpc.semesters.create.useMutation({
    onSuccess: () => { toast.success("Semester created"); setShowForm(false); setForm({ ...emptyForm }); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const update = trpc.semesters.update.useMutation({
    onSuccess: () => { toast.success("Semester updated"); setEditSemester(null); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const deleteSem = trpc.semesters.delete.useMutation({
    onSuccess: () => { toast.success("Semester deleted"); refetch(); },
    onError: (err: any) => toast.error(err.message),
  });

  const openEdit = (sem: any) => {
    setEditSemester(sem);
    setForm({
      name: sem.name ?? "",
      academicYear: sem.academicYear ?? "",
      term: sem.term ?? "Fall",
      startDate: sem.startDate ? new Date(sem.startDate).toISOString().split("T")[0] : "",
      endDate: sem.endDate ? new Date(sem.endDate).toISOString().split("T")[0] : "",
      isActive: sem.isActive ?? false,
    });
    setShowForm(true);
  };

  const handleSubmit = () => {
    const payload = {
      name: form.name,
      academicYear: form.academicYear || "2024-2025",
      term: form.term,
      startDate: form.startDate || undefined,
      endDate: form.endDate || undefined,
      isActive: form.isActive,
    };
    if (editSemester) {
      update.mutate({ id: editSemester.id, ...payload });
    } else {
      create.mutate(payload as any);
    }
  };

  return (
    <UniversityLayout title="Semester Management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Semester Management</h1>
          <p className="text-muted-foreground mt-1">Manage academic semesters and schedules</p>
        </div>
        <Button onClick={() => { setEditSemester(null); setForm({ ...emptyForm }); setShowForm(true); }}>
          <Plus className="h-4 w-4 mr-2" />New Semester
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : semesters.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Calendar className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground mb-4">No semesters created yet.</p>
            <Button onClick={() => setShowForm(true)}><Plus className="h-4 w-4 mr-2" />Create First Semester</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {semesters.map((sem) => (
            <Card key={sem.id} className={`hover:shadow-md transition-shadow ${sem.isActive ? "border-primary/50" : ""}`}>
              <CardContent className="pt-5">
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <p className="font-semibold">{sem.name}</p>
                    {sem.isActive && (
                      <div className="flex items-center gap-1 mt-1">
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-500" />
                        <span className="text-xs text-emerald-600 font-medium">Active Semester</span>
                      </div>
                    )}
                  </div>
                  <Badge variant={sem.isActive ? "default" : "secondary"} className="text-xs shrink-0">
                    {sem.isActive ? "Active" : "Inactive"}
                  </Badge>
                </div>
                <div className="space-y-1 text-xs text-muted-foreground mb-4">
                  {sem.startDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      Start: {new Date(sem.startDate).toLocaleDateString()}
                    </div>
                  )}
                  {sem.endDate && (
                    <div className="flex items-center gap-1.5">
                      <Calendar className="h-3 w-3" />
                      End: {new Date(sem.endDate).toLocaleDateString()}
                    </div>
                  )}
                  <div className="flex items-center gap-1.5">
                    <Calendar className="h-3 w-3" />
                    Created: {new Date(sem.createdAt).toLocaleDateString()}
                  </div>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" variant="outline" className="flex-1 text-xs" onClick={() => openEdit(sem)}>
                    <Edit className="h-3 w-3 mr-1" />Edit
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="text-xs text-destructive hover:text-destructive"
                    onClick={() => { if (confirm(`Delete ${sem.name}?`)) deleteSem.mutate({ id: sem.id }); }}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create/Edit Dialog */}
      <Dialog open={showForm} onOpenChange={(open) => !open && setShowForm(false)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editSemester ? "Edit Semester" : "Create New Semester"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label>Semester Name *</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="e.g. Fall 2024, Spring 2025"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Academic Year</Label>
                <Input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} placeholder="2024-2025" />
              </div>
              <div className="space-y-1.5">
                <Label>Term</Label>
                <Select value={form.term} onValueChange={(v) => setForm({ ...form, term: v as any })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Fall">Fall</SelectItem>
                    <SelectItem value="Spring">Spring</SelectItem>
                    <SelectItem value="Summer">Summer</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Start Date</Label>
                <Input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>End Date</Label>
                <Input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                checked={form.isActive}
                onCheckedChange={(v) => setForm({ ...form, isActive: v })}
              />
              <Label>Set as Active Semester</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={create.isPending || update.isPending || !form.name}>
              {(create.isPending || update.isPending) && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              {editSemester ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UniversityLayout>
  );
}
