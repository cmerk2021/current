import { useMemo, useState } from "react";
import { DndContextLite } from "@/components/dnd";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus } from "lucide-react";
import { useTasks, useUpdateTask } from "@/lib/queries";
import { useUI } from "@/lib/ui-store";
import type { Priority, TaskRecord } from "@/lib/pb";
import { Input } from "@/components/ui/input";
import { useCreateTask } from "@/lib/queries";
import { cn } from "@/lib/utils";

const COLUMNS: { id: Priority; label: string; tone: string }[] = [
  { id: "urgent", label: "Urgent", tone: "border-rose-500/40" },
  { id: "high", label: "High", tone: "border-orange-500/40" },
  { id: "medium", label: "Medium", tone: "border-amber-500/40" },
  { id: "low", label: "Low", tone: "border-sky-500/40" },
  { id: "none", label: "No priority", tone: "border-border" },
];

interface BoardProps {
  filter?: { list?: string; project?: string };
}

export function BoardView({ filter = {} }: BoardProps) {
  const tasks = useTasks({ ...filter, done: false });
  const update = useUpdateTask();
  const create = useCreateTask();
  const openTask = useUI((s) => s.openTask);

  const grouped = useMemo(() => {
    const g: Record<Priority, TaskRecord[]> = {
      urgent: [],
      high: [],
      medium: [],
      low: [],
      none: [],
    };
    for (const t of tasks.data ?? []) g[t.priority]?.push(t);
    return g;
  }, [tasks.data]);

  return (
    <DndContextLite onDrop={(id, col) => update.mutate({ id, patch: { priority: col as Priority } })}>
      <div className="grid auto-cols-[minmax(240px,1fr)] grid-flow-col gap-3 overflow-x-auto pb-2">
        {COLUMNS.map((c) => (
          <Column
            key={c.id}
            id={c.id}
            label={c.label}
            tone={c.tone}
            tasks={grouped[c.id]}
            onAdd={async (title) => {
              await create.mutateAsync({ title, priority: c.id, ...filter });
            }}
            onOpen={openTask}
          />
        ))}
      </div>
    </DndContextLite>
  );
}

function Column({
  id,
  label,
  tone,
  tasks,
  onAdd,
  onOpen,
}: {
  id: string;
  label: string;
  tone: string;
  tasks: TaskRecord[];
  onAdd: (title: string) => void;
  onOpen: (id: string) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState("");

  return (
    <Card
      className={cn("flex h-full flex-col border-t-2", tone)}
      data-dnd-col={id}
    >
      <CardHeader className="p-3">
        <CardTitle className="flex items-center justify-between text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          {label}
          <Badge variant="muted">{tasks.length}</Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-1 space-y-2 p-2">
        {tasks.map((t) => (
          <button
            key={t.id}
            data-dnd-id={t.id}
            draggable
            onClick={() => onOpen(t.id)}
            className="block w-full cursor-grab rounded-md border border-border bg-card p-2.5 text-left text-sm shadow-sm hover:border-primary/40"
          >
            <div className="font-medium">{t.title}</div>
            {t.due && (
              <div className="mt-1 text-[11px] text-muted-foreground">
                {new Date(t.due).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
              </div>
            )}
          </button>
        ))}
        {adding ? (
          <Input
            autoFocus
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => {
              if (title.trim()) onAdd(title.trim());
              setTitle("");
              setAdding(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") (e.target as HTMLInputElement).blur();
              if (e.key === "Escape") {
                setTitle("");
                setAdding(false);
              }
            }}
            className="h-8 text-sm"
            placeholder="New task"
          />
        ) : (
          <Button
            variant="ghost"
            size="sm"
            className="w-full justify-start text-xs text-muted-foreground"
            onClick={() => setAdding(true)}
          >
            <Plus className="h-3 w-3" /> Add
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
