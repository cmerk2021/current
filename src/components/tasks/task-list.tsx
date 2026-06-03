import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import { CalendarDays, Flag, GripVertical, Hash, Repeat } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { useReorderTasks, useTags, useUpdateTask } from "@/lib/queries";
import type { Priority, TaskRecord } from "@/lib/pb";
import { readUI, usePreferences } from "@/lib/preferences";
import { featuresFor } from "@/lib/features";
import { cn, formatDate } from "@/lib/utils";
import { useUI } from "@/lib/ui-store";

const PRIORITY_META: Record<Priority, { label: string; cls: string }> = {
  none: { label: "None", cls: "text-muted-foreground" },
  low: { label: "Low", cls: "text-sky-500" },
  medium: { label: "Med", cls: "text-amber-500" },
  high: { label: "High", cls: "text-orange-500" },
  urgent: { label: "Urgent", cls: "text-rose-500" },
};

export function TaskItem({
  task,
  onDragStart,
  onDragOver,
  onDrop,
  dragging,
}: {
  task: TaskRecord;
  onDragStart?: () => void;
  onDragOver?: (e: React.DragEvent) => void;
  onDrop?: () => void;
  dragging?: boolean;
}) {
  const update = useUpdateTask();
  const prefs = usePreferences();
  const features = featuresFor(prefs.data?.complexity ?? "balanced");
  const tags = useTags();
  const openTask = useUI((s) => s.openTask);
  const ui = readUI(prefs.data);

  const overdue =
    !task.done && task.due && new Date(task.due) < new Date(new Date().setHours(0, 0, 0, 0));

  return (
    <motion.div
      layout={!ui.reducedMotion}
      initial={ui.reducedMotion ? false : { opacity: 0, y: 4 }}
      animate={{ opacity: 1, y: 0 }}
      exit={ui.reducedMotion ? undefined : { opacity: 0, height: 0 }}
      transition={{ duration: 0.15 }}
      className={cn(
        "group flex items-center gap-2 border-b border-border/60 row-pad px-2",
        dragging && "opacity-30",
      )}
      draggable={!!onDragStart}
      onDragStart={onDragStart}
      onDragOver={onDragOver}
      onDrop={onDrop}
    >
      {onDragStart && (
        <div className="flex cursor-grab items-center text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100">
          <GripVertical className="h-3.5 w-3.5" />
        </div>
      )}
      <div className="flex items-center">
        <Checkbox
          checked={task.done}
          onCheckedChange={(c) => update.mutate({ id: task.id, patch: { done: c } })}
        />
      </div>
      <button
        className="min-w-0 flex-1 text-left"
        onClick={() => openTask(task.id)}
      >
        <div className={cn("text-sm leading-5", task.done && "text-muted-foreground line-through")}>
          {task.title}
        </div>
        <div className="mt-0.5 flex flex-wrap items-center gap-1.5 text-[11px] text-muted-foreground">
          {features.dueDates && task.due && (
            <Badge variant={overdue ? "destructive" : "muted"}>
              <CalendarDays className="h-3 w-3" />
              {formatDate(task.due)}
            </Badge>
          )}
          {features.priorities && task.priority !== "none" && (
            <Badge variant="outline" className={PRIORITY_META[task.priority].cls}>
              <Flag className="h-3 w-3" />
              {PRIORITY_META[task.priority].label}
            </Badge>
          )}
          {features.recurring && task.recurrence && (
            <Badge variant="outline">
              <Repeat className="h-3 w-3" />
              {task.recurrence.freq}
            </Badge>
          )}
          {features.tags &&
            (task.tags ?? []).map((tid) => {
              const tg = tags.data?.find((x) => x.id === tid);
              if (!tg) return null;
              return (
                <Badge
                  key={tid}
                  variant="muted"
                  style={tg.color ? { color: tg.color } : undefined}
                >
                  <Hash className="h-3 w-3" /> {tg.name}
                </Badge>
              );
            })}
        </div>
      </button>
    </motion.div>
  );
}

export function TaskList({
  tasks,
  reorderable = true,
}: {
  tasks: TaskRecord[];
  reorderable?: boolean;
}) {
  const reorder = useReorderTasks();
  const [dragId, setDragId] = useState<string | null>(null);
  const [hoverId, setHoverId] = useState<string | null>(null);

  if (tasks.length === 0) {
    return (
      <div className="rounded-lg border border-dashed border-border/70 p-10 text-center text-sm text-muted-foreground">
        Nothing here yet. Add your first task above.
      </div>
    );
  }

  function handleDrop(targetId: string) {
    if (!dragId || dragId === targetId) {
      setDragId(null);
      setHoverId(null);
      return;
    }
    const ids = tasks.map((t) => t.id);
    const from = ids.indexOf(dragId);
    const to = ids.indexOf(targetId);
    if (from < 0 || to < 0) return;
    ids.splice(from, 1);
    ids.splice(to, 0, dragId);
    reorder.mutate(ids);
    setDragId(null);
    setHoverId(null);
  }

  return (
    <div className="surface divide-y divide-border/60 overflow-hidden">
      <AnimatePresence initial={false}>
        {tasks.map((t) => (
          <div
            key={t.id}
            className={cn(hoverId === t.id && dragId && dragId !== t.id && "bg-accent/40")}
            onDragLeave={() => setHoverId(null)}
          >
            <TaskItem
              task={t}
              dragging={dragId === t.id}
              onDragStart={reorderable ? () => setDragId(t.id) : undefined}
              onDragOver={
                reorderable
                  ? (e) => {
                      e.preventDefault();
                      setHoverId(t.id);
                    }
                  : undefined
              }
              onDrop={reorderable ? () => handleDrop(t.id) : undefined}
            />
          </div>
        ))}
      </AnimatePresence>
    </div>
  );
}
