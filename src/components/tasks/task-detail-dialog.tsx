import { useEffect, useState } from "react";
import {
  CalendarDays,
  Flag,
  Hash,
  Inbox,
  ListChecks,
  Notebook,
  Plus,
  Repeat,
  Trash2,
  X,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUI } from "@/lib/ui-store";
import {
  useCreateTag,
  useCreateTask,
  useDeleteTask,
  useLists,
  useProjects,
  useTags,
  useTask,
  useTasks,
  useUpdateTask,
} from "@/lib/queries";
import type { Priority, RecurrenceRule } from "@/lib/pb";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const PRIORITIES: Priority[] = ["none", "low", "medium", "high", "urgent"];
const PRIORITY_COLOR: Record<Priority, string> = {
  none: "text-muted-foreground",
  low: "text-sky-500",
  medium: "text-amber-500",
  high: "text-orange-500",
  urgent: "text-rose-500",
};

export function TaskDetailDialog() {
  const id = useUI((s) => s.taskDetailId);
  const close = useUI((s) => s.openTask);
  const open = !!id;

  return (
    <Dialog open={open} onOpenChange={(o) => !o && close(null)}>
      <DialogContent className="max-w-2xl gap-0 p-0">
        {id && <TaskDetail id={id} onClose={() => close(null)} />}
      </DialogContent>
    </Dialog>
  );
}

function TaskDetail({ id, onClose }: { id: string; onClose: () => void }) {
  const task = useTask(id);
  const update = useUpdateTask();
  const del = useDeleteTask();
  const lists = useLists();
  const projects = useProjects();
  const tags = useTags();
  const createTag = useCreateTag();
  const subtasks = useTasks({ parent: id });
  const createSub = useCreateTask();

  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [newSub, setNewSub] = useState("");
  const [newTag, setNewTag] = useState("");

  useEffect(() => {
    if (task.data) {
      setTitle(task.data.title);
      setNotes(task.data.notes ?? "");
    }
  }, [task.data]);

  if (!task.data) return <div className="p-10 text-sm text-muted-foreground">Loading…</div>;
  const t = task.data;

  function patch(p: Parameters<typeof update.mutate>[0]["patch"]) {
    update.mutate({ id, patch: p });
  }

  return (
    <div className="flex max-h-[85vh] flex-col">
      <DialogHeader className="border-b border-border px-5 py-4">
        <div className="flex items-center gap-3">
          <Checkbox
            checked={t.done}
            onCheckedChange={(c) => patch({ done: c })}
          />
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => title.trim() && title !== t.title && patch({ title: title.trim() })}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
            }}
            className="h-9 border-0 px-0 text-lg font-semibold shadow-none focus-visible:ring-0"
          />
        </div>
        <DialogTitle className="sr-only">Edit task</DialogTitle>
      </DialogHeader>

      <div className="grid flex-1 grid-cols-1 gap-6 overflow-y-auto p-5 md:grid-cols-[1fr_220px]">
        <div className="space-y-6 min-w-0">
          <div>
            <Label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Notebook className="h-3.5 w-3.5" /> Notes
            </Label>
            <Textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              onBlur={() => notes !== (t.notes ?? "") && patch({ notes })}
              placeholder="Add details, links, anything…"
              className="min-h-[140px]"
            />
          </div>

          <div>
            <Label className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <ListChecks className="h-3.5 w-3.5" /> Subtasks
            </Label>
            <div className="surface divide-y divide-border/60">
              {(subtasks.data ?? []).map((s) => (
                <div key={s.id} className="flex items-center gap-2 px-3 py-2">
                  <Checkbox
                    checked={s.done}
                    onCheckedChange={(c) =>
                      update.mutate({ id: s.id, patch: { done: c } })
                    }
                  />
                  <span className={cn("flex-1 text-sm", s.done && "line-through text-muted-foreground")}>
                    {s.title}
                  </span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    onClick={() => del.mutate(s.id)}
                  >
                    <X className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <div className="flex items-center gap-2 px-3 py-2">
                <Plus className="h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  value={newSub}
                  onChange={(e) => setNewSub(e.target.value)}
                  onKeyDown={async (e) => {
                    if (e.key === "Enter" && newSub.trim()) {
                      await createSub.mutateAsync({
                        title: newSub.trim(),
                        parent: id,
                        list: t.list,
                        project: t.project,
                      });
                      setNewSub("");
                    }
                  }}
                  placeholder="Add subtask…"
                  className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
                />
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <Field icon={CalendarDays} label="Due date">
            <DateInput
              value={t.due ?? ""}
              onChange={(v) => patch({ due: v || undefined })}
            />
          </Field>

          <Field icon={CalendarDays} label="Scheduled">
            <DateInput
              value={t.scheduled ?? ""}
              onChange={(v) => patch({ scheduled: v || undefined })}
            />
          </Field>

          <Field icon={Flag} label="Priority">
            <Select
              value={t.priority}
              onValueChange={(v) => patch({ priority: v as Priority })}
            >
              <SelectTrigger className="h-8">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {PRIORITIES.map((p) => (
                  <SelectItem key={p} value={p} className={PRIORITY_COLOR[p]}>
                    <span className="capitalize">{p}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field icon={Inbox} label="List">
            <Select
              value={t.list ?? "__none"}
              onValueChange={(v) => patch({ list: v === "__none" ? undefined : v })}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None</SelectItem>
                {(lists.data ?? []).map((l) => (
                  <SelectItem key={l.id} value={l.id}>
                    {l.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field icon={Inbox} label="Project">
            <Select
              value={t.project ?? "__none"}
              onValueChange={(v) => patch({ project: v === "__none" ? undefined : v })}
            >
              <SelectTrigger className="h-8">
                <SelectValue placeholder="None" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__none">None</SelectItem>
                {(projects.data ?? []).map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </Field>

          <Field icon={Hash} label="Tags">
            <div className="flex flex-wrap gap-1">
              {(t.tags ?? []).map((tid) => {
                const tg = tags.data?.find((x) => x.id === tid);
                if (!tg) return null;
                return (
                  <Badge
                    key={tid}
                    variant="muted"
                    className="cursor-pointer"
                    style={tg.color ? { color: tg.color } : undefined}
                    onClick={() =>
                      patch({ tags: (t.tags ?? []).filter((x) => x !== tid) })
                    }
                  >
                    {tg.name}
                    <X className="h-3 w-3" />
                  </Badge>
                );
              })}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 px-2 text-xs">
                    <Plus className="h-3 w-3" /> Tag
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-56 p-2">
                  <div className="space-y-1">
                    <div className="flex gap-1">
                      <Input
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        placeholder="New tag"
                        className="h-7"
                        onKeyDown={async (e) => {
                          if (e.key === "Enter" && newTag.trim()) {
                            try {
                              const created = await createTag.mutateAsync({ name: newTag.trim() });
                              patch({ tags: [...(t.tags ?? []), created.id] });
                              setNewTag("");
                            } catch {
                              toast.error("Tag already exists or invalid");
                            }
                          }
                        }}
                      />
                    </div>
                    <div className="max-h-44 overflow-y-auto">
                      {(tags.data ?? [])
                        .filter((tg) => !(t.tags ?? []).includes(tg.id))
                        .map((tg) => (
                          <button
                            key={tg.id}
                            onClick={() => patch({ tags: [...(t.tags ?? []), tg.id] })}
                            className="flex w-full items-center gap-2 rounded px-2 py-1 text-left text-sm hover:bg-accent"
                            style={tg.color ? { color: tg.color } : undefined}
                          >
                            <Hash className="h-3 w-3" />
                            {tg.name}
                          </button>
                        ))}
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
          </Field>

          <Field icon={Repeat} label="Repeat">
            <RecurrencePicker
              value={t.recurrence ?? null}
              onChange={(r) => patch({ recurrence: r })}
            />
          </Field>

          <div className="pt-2">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-destructive hover:bg-destructive/10"
              onClick={() => {
                del.mutate(id);
                onClose();
              }}
            >
              <Trash2 className="h-3.5 w-3.5" /> Delete task
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function Field({
  icon: Icon,
  label,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label className="mb-1 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3 w-3" /> {label}
      </Label>
      {children}
    </div>
  );
}

function DateInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const dateValue = value ? new Date(value).toISOString().slice(0, 10) : "";
  return (
    <div className="flex items-center gap-1">
      <input
        type="date"
        value={dateValue}
        onChange={(e) =>
          onChange(e.target.value ? new Date(e.target.value).toISOString() : "")
        }
        className="flex h-8 flex-1 rounded-md border border-input bg-background px-2 text-xs focus-ring"
      />
      {value && (
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={() => onChange("")}
        >
          <X className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
}

const WEEKDAYS = ["S", "M", "T", "W", "T", "F", "S"];

function RecurrencePicker({
  value,
  onChange,
}: {
  value: RecurrenceRule | null;
  onChange: (r: RecurrenceRule | null) => void;
}) {
  const r = value ?? null;
  return (
    <div className="space-y-2 rounded-md border border-input bg-background p-2">
      <Select
        value={r?.freq ?? "__none"}
        onValueChange={(v) => {
          if (v === "__none") onChange(null);
          else onChange({ freq: v as RecurrenceRule["freq"], interval: r?.interval ?? 1, byweekday: r?.byweekday });
        }}
      >
        <SelectTrigger className="h-8">
          <SelectValue placeholder="No repeat" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none">No repeat</SelectItem>
          <SelectItem value="daily">Daily</SelectItem>
          <SelectItem value="weekly">Weekly</SelectItem>
          <SelectItem value="monthly">Monthly</SelectItem>
          <SelectItem value="yearly">Yearly</SelectItem>
        </SelectContent>
      </Select>
      {r && (
        <div className="space-y-2">
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            Every
            <input
              type="number"
              min={1}
              max={99}
              value={r.interval}
              onChange={(e) =>
                onChange({ ...r, interval: Math.max(1, Number(e.target.value) || 1) })
              }
              className="h-7 w-12 rounded border border-input bg-background px-1 text-sm focus-ring"
            />
            {r.freq === "daily" && "day(s)"}
            {r.freq === "weekly" && "week(s)"}
            {r.freq === "monthly" && "month(s)"}
            {r.freq === "yearly" && "year(s)"}
          </div>
          {r.freq === "weekly" && (
            <div className="flex gap-1">
              {WEEKDAYS.map((w, i) => {
                const active = r.byweekday?.includes(i);
                return (
                  <button
                    key={i}
                    onClick={() => {
                      const cur = new Set(r.byweekday ?? []);
                      if (active) cur.delete(i);
                      else cur.add(i);
                      onChange({ ...r, byweekday: Array.from(cur).sort() });
                    }}
                    className={cn(
                      "h-6 w-6 rounded text-[11px] font-medium transition-colors",
                      active
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted text-muted-foreground hover:bg-accent",
                    )}
                  >
                    {w}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
