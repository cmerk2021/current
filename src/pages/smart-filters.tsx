import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Filter, Plus, Trash2, Pin } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  useCreateSmartFilter,
  useDeleteSmartFilter,
  useSmartFilters,
  useTags,
  useTasks,
  useUpdateSmartFilter,
} from "@/lib/queries";
import { TaskList } from "@/components/tasks/task-list";
import type { Priority, SmartFilterQuery } from "@/lib/pb";
import { LoadingScreen } from "@/components/loading-screen";
import { toast } from "sonner";

const PRIORITIES: Priority[] = ["low", "medium", "high", "urgent"];
const DUE_OPTIONS = [
  { value: "any", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "tomorrow", label: "Tomorrow" },
  { value: "this_week", label: "This week" },
  { value: "overdue", label: "Overdue" },
];

export function SmartFiltersPage() {
  const filters = useSmartFilters();
  const del = useDeleteSmartFilter();
  const update = useUpdateSmartFilter();

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Smart filters</h1>
          <p className="mt-1 text-sm text-muted-foreground">Saved queries you can jump to from the sidebar.</p>
        </div>
        <NewFilterButton />
      </header>

      {filters.data?.length === 0 ? (
        <div className="surface p-10 text-center text-sm text-muted-foreground">
          No smart filters yet. Build one to see it pinned in your sidebar.
        </div>
      ) : (
        <div className="grid gap-3 md:grid-cols-2">
          {(filters.data ?? []).map((f) => (
            <Card key={f.id}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2 text-base font-semibold">
                    <Filter className="h-4 w-4" /> {f.name}
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className={`h-7 w-7 ${f.pinned ? "text-primary" : "text-muted-foreground"}`}
                      onClick={() => update.mutate({ id: f.id, patch: { pinned: !f.pinned } })}
                    >
                      <Pin className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-muted-foreground hover:text-destructive"
                      onClick={() => confirm(`Delete "${f.name}"?`) && del.mutate(f.id)}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <QuerySummary q={f.query} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function QuerySummary({ q }: { q: SmartFilterQuery }) {
  return (
    <div className="mt-2 flex flex-wrap gap-1 text-[11px] text-muted-foreground">
      {q.due && <Badge variant="muted">Due: {q.due}</Badge>}
      {q.priority?.length && <Badge variant="muted">Priority: {q.priority.join(", ")}</Badge>}
      {q.tags?.length && <Badge variant="muted">{q.tags.length} tag(s)</Badge>}
      {typeof q.done === "boolean" && <Badge variant="muted">{q.done ? "Completed" : "Open"}</Badge>}
      {q.search && <Badge variant="muted">Search: {q.search}</Badge>}
    </div>
  );
}

function NewFilterButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [q, setQ] = useState<SmartFilterQuery>({ done: false, due: "any" });
  const create = useCreateSmartFilter();
  const tags = useTags();

  async function submit() {
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ name: name.trim(), query: q });
      toast.success("Filter saved");
      setOpen(false);
      setName("");
      setQ({ done: false, due: "any" });
    } catch {
      toast.error("Couldn't save");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm"><Plus className="h-4 w-4" /> New filter</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>New smart filter</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div>
            <Label>Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. High priority this week" autoFocus />
          </div>
          <div>
            <Label>Due</Label>
            <Select value={q.due ?? "any"} onValueChange={(v) => setQ({ ...q, due: v as SmartFilterQuery["due"] })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {DUE_OPTIONS.map((o) => <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Priorities</Label>
            <div className="mt-1 flex gap-1">
              {PRIORITIES.map((p) => {
                const on = q.priority?.includes(p);
                return (
                  <Button
                    key={p}
                    type="button"
                    size="sm"
                    variant={on ? "default" : "outline"}
                    onClick={() => {
                      const cur = new Set(q.priority ?? []);
                      if (on) cur.delete(p);
                      else cur.add(p);
                      setQ({ ...q, priority: Array.from(cur) });
                    }}
                    className="capitalize"
                  >{p}</Button>
                );
              })}
            </div>
          </div>
          <div>
            <Label>Tags</Label>
            <div className="mt-1 flex flex-wrap gap-1">
              {(tags.data ?? []).map((tg) => {
                const on = q.tags?.includes(tg.id);
                return (
                  <Button
                    key={tg.id}
                    type="button"
                    size="sm"
                    variant={on ? "default" : "outline"}
                    onClick={() => {
                      const cur = new Set(q.tags ?? []);
                      if (on) cur.delete(tg.id);
                      else cur.add(tg.id);
                      setQ({ ...q, tags: Array.from(cur) });
                    }}
                  >{tg.name}</Button>
                );
              })}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <Label htmlFor="done-switch">Include completed</Label>
            <Switch
              id="done-switch"
              checked={q.done === undefined}
              onCheckedChange={(v) => setQ({ ...q, done: v ? undefined : false })}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim()}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export function SmartFilterPage() {
  const { id = "" } = useParams<{ id: string }>();
  const filters = useSmartFilters();
  const f = filters.data?.find((x) => x.id === id);
  const tasks = useTasks(f ? { ...f.query, tag: f.query.tags?.[0] } : {});
  const nav = useNavigate();

  if (filters.isLoading) return <LoadingScreen />;
  if (!f) {
    return (
      <div className="surface p-10 text-center text-sm text-muted-foreground">
        Filter not found. <Button variant="link" onClick={() => nav("/smart-filters")}>Manage filters</Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-semibold tracking-tight">{f.name}</h1>
        <QuerySummary q={f.query} />
      </header>
      <TaskList tasks={tasks.data ?? []} />
    </div>
  );
}
