import UniversityLayout from "@/components/university/UniversityLayout";
import { trpc } from "@/lib/trpc";
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { School, Plus, Loader2, Edit, Trash2, BookOpen } from "lucide-react";
import { toast } from "sonner";

const emptyForm = {
  code: "",
  name: "",
  faculty: "",
  department: "",
  durationYears: "4",
  description: "",
};

export default function AdminPrograms() {
  const [showForm, setShowForm] = useState(false);
  const [editProgram, setEditProgram] = useState<any>(null);
  const [form, setForm] = useState({ ...emptyForm });

  const {
    data: programs = [],
    isLoading,
    refetch,
  } = trpc.programs.all.useQuery();
  const utils = trpc.useUtils();

  const createProgram = trpc.programs.create.useMutation({
    onSuccess: () => {
      toast.success("Program created");
      setShowForm(false);
      setForm({ ...emptyForm });
      refetch();
    },
    onError: (err: any) => toast.error(err.message),
  });

  const handleSubmit = () => {
    createProgram.mutate({
      ...form,
      durationYears: parseInt(form.durationYears),
    } as any);
  };

  return (
    <UniversityLayout title="Program Management">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-bold">Program Management</h1>
          <p className="text-muted-foreground mt-1">
            Manage degree programs and curricula
          </p>
        </div>
        <Button
          onClick={() => {
            setShowForm(true);
            setForm({ ...emptyForm });
          }}
        >
          <Plus className="h-4 w-4 mr-2" />
          New Program
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : programs.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <School className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
            <p className="text-muted-foreground">No programs yet.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {programs.map(program => (
            <Card
              key={program.id}
              className="hover:shadow-md transition-shadow"
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-mono text-sm text-primary font-semibold">
                      {program.code}
                    </p>
                    <CardTitle className="text-base mt-1">
                      {program.name}
                    </CardTitle>
                  </div>
                  <Badge variant="outline">{program.durationYears} years</Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <School className="h-4 w-4" />
                    {program.faculty}
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    {program.department}
                  </div>
                  {program.description && (
                    <p className="text-xs text-muted-foreground line-clamp-2 mt-2">
                      {program.description}
                    </p>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog
        open={showForm}
        onOpenChange={open => !open && setShowForm(false)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Program</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Program Code *</Label>
                <Input
                  value={form.code}
                  onChange={e => setForm({ ...form, code: e.target.value })}
                  placeholder="e.g. SCIT"
                />
              </div>
              <div className="space-y-1.5">
                <Label>Duration (years)</Label>
                <Input
                  type="number"
                  min="1"
                  max="8"
                  value={form.durationYears}
                  onChange={e =>
                    setForm({ ...form, durationYears: e.target.value })
                  }
                />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Program Name *</Label>
              <Input
                value={form.name}
                onChange={e => setForm({ ...form, name: e.target.value })}
                placeholder="Bachelor of Science in Information Technology"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Faculty *</Label>
              <Input
                value={form.faculty}
                onChange={e => setForm({ ...form, faculty: e.target.value })}
                placeholder="e.g. Faculty of Science"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Department *</Label>
              <Input
                value={form.department}
                onChange={e => setForm({ ...form, department: e.target.value })}
                placeholder="e.g. Computer Science"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={e =>
                  setForm({ ...form, description: e.target.value })
                }
                rows={3}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowForm(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={createProgram.isPending}>
              {createProgram.isPending && (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              )}
              Create Program
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </UniversityLayout>
  );
}

import { Badge } from "@/components/ui/badge";
