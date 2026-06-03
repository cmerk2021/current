import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Folder, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAreas, useCreateArea, useDeleteArea, useProjects } from "@/lib/queries";
import { toast } from "sonner";

export function AreasPage() {
  const areas = useAreas();
  const projects = useProjects();
  const create = useCreateArea();
  const del = useDeleteArea();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");

  async function submit() {
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ name: name.trim() });
      toast.success("Area created");
      setName("");
      setOpen(false);
    } catch {
      toast.error("Couldn't create area");
    }
  }

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Areas</h1>
          <p className="mt-1 text-sm text-muted-foreground">Group projects by life domain.</p>
        </div>
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4" /> New area</Button>
          </DialogTrigger>
          <DialogContent className="max-w-sm">
            <DialogHeader><DialogTitle>New area</DialogTitle></DialogHeader>
            <div>
              <Label>Name</Label>
              <Input value={name} onChange={(e) => setName(e.target.value)} autoFocus
                placeholder="e.g. Work, Personal, Health" />
            </div>
            <DialogFooter>
              <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
              <Button onClick={submit} disabled={!name.trim()}>Create</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </header>

      {areas.data?.length === 0 ? (
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          Areas group projects together. Try Work, Personal, or Health.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(areas.data ?? []).map((a) => {
            const inArea = (projects.data ?? []).filter((p) => p.area === a.id);
            return (
              <Card key={a.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 text-base font-semibold">
                      <Folder className="h-4 w-4" style={a.color ? { color: a.color } : undefined} />
                      {a.name}
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => {
                        if (confirm(`Delete area "${a.name}"? Its projects will remain.`))
                          del.mutate(a.id);
                      }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <p className="mt-1 text-xs text-muted-foreground">
                    {inArea.length} project{inArea.length === 1 ? "" : "s"}
                  </p>
                  <div className="mt-2 space-y-1">
                    {inArea.map((p) => (
                      <button
                        key={p.id}
                        onClick={() => nav(`/projects/${p.id}`)}
                        className="block w-full rounded px-2 py-1 text-left text-sm hover:bg-accent"
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                  <AssignProject areaId={a.id} />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function AssignProject({ areaId }: { areaId: string }) {
  const projects = useProjects();
  const unassigned = (projects.data ?? []).filter((p) => !p.area);
  const [open, setOpen] = useState(false);
  if (unassigned.length === 0) return null;
  return (
    <div className="mt-3">
      {!open ? (
        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => setOpen(true)}>
          <Plus className="h-3 w-3" /> Assign project
        </Button>
      ) : (
        <Select onValueChange={async (v) => {
          const { pb } = await import("@/lib/pb");
          await pb.collection("projects").update(v, { area: areaId });
          window.location.reload();
        }}>
          <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Pick project…" /></SelectTrigger>
          <SelectContent>
            {unassigned.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </div>
  );
}
