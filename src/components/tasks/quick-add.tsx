import { useState } from "react";
import { CalendarDays, Flag, Hash, Inbox, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCreateTask, useLists, useProjects, useTags } from "@/lib/queries";
import type { Priority, TaskRecord } from "@/lib/pb";
import { usePreferences } from "@/lib/preferences";
import { featuresFor } from "@/lib/features";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PRIORITIES: Priority[] = ["none", "low", "medium", "high", "urgent"];
const PRIORITY_COLOR: Record<Priority, string> = {
  none: "text-muted-foreground",
  low: "text-sky-500",
  medium: "text-amber-500",
  high: "text-orange-500",
  urgent: "text-rose-500",
};

interface QuickAddProps {
  defaults?: Partial<TaskRecord>;
  placeholder?: string;
}

export function QuickAdd({ defaults, placeholder = "Add a task…" }: QuickAddProps) {
  const create = useCreateTask();
  const prefs = usePreferences();
  const features = featuresFor(prefs.data?.complexity ?? "balanced");
  const lists = useLists();
  const projects = useProjects();
  const tags = useTags();
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<string>("");
  const [priority, setPriority] = useState<Priority>("none");
  const [listId, setListId] = useState<string | undefined>(defaults?.list);
  const [projectId, setProjectId] = useState<string | undefined>(defaults?.project);
  const [tagIds, setTagIds] = useState<string[]>(defaults?.tags ?? []);

  async function submit() {
    const t = title.trim();
    if (!t) return;
    try {
      await create.mutateAsync({
        title: t,
        priority,
        due: due ? new Date(due).toISOString() : undefined,
        list: listId,
        project: projectId,
        tags: tagIds,
        ...defaults,
      });
      setTitle("");
      setDue("");
      setPriority("none");
    } catch {
      toast.error("Couldn't add task");
    }
  }

  return (
    <div className="surface flex flex-wrap items-center gap-1 p-1.5">
      <div className="grid h-7 w-7 place-items-center text-muted-foreground">
        <Plus className="h-4 w-4" />
      </div>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={placeholder}
        className="h-7 min-w-[120px] flex-1 border-0 bg-transparent px-0 shadow-none focus-visible:ring-0"
      />

      {features.dueDates && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("h-7 gap-1 text-xs", due && "text-foreground")}>
              <CalendarDays className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{due ? formatShort(due) : "Date"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto">
            <input
              type="date"
              value={due}
              onChange={(e) => setDue(e.target.value)}
              className="rounded-md border border-input bg-background px-2 py-1 text-sm"
            />
            {due && (
              <Button variant="ghost" size="sm" className="ml-2" onClick={() => setDue("")}>
                Clear
              </Button>
            )}
          </PopoverContent>
        </Popover>
      )}

      {features.priorities && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className={cn("h-7 gap-1 text-xs", PRIORITY_COLOR[priority])}>
              <Flag className="h-3.5 w-3.5" />
              <span className="hidden sm:inline capitalize">{priority}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-1">
            <div className="flex flex-col">
              {PRIORITIES.map((p) => (
                <button
                  key={p}
                  onClick={() => setPriority(p)}
                  className={cn(
                    "flex items-center gap-2 rounded-md px-2 py-1 text-left text-xs hover:bg-accent",
                    PRIORITY_COLOR[p],
                  )}
                >
                  <Flag className="h-3 w-3" />
                  <span className="capitalize">{p}</span>
                </button>
              ))}
            </div>
          </PopoverContent>
        </Popover>
      )}

      {features.projects && !defaults?.project && projects.data && projects.data.length > 0 && (
        <Select value={projectId ?? "__none"} onValueChange={(v) => setProjectId(v === "__none" ? undefined : v)}>
          <SelectTrigger className="h-7 w-auto gap-1 border-0 px-2 text-xs shadow-none">
            <Inbox className="h-3.5 w-3.5" />
            <SelectValue placeholder="Project" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">No project</SelectItem>
            {projects.data.map((p) => (
              <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {!defaults?.list && lists.data && lists.data.length > 0 && (
        <Select value={listId ?? "__none"} onValueChange={(v) => setListId(v === "__none" ? undefined : v)}>
          <SelectTrigger className="h-7 w-auto gap-1 border-0 px-2 text-xs shadow-none">
            <Inbox className="h-3.5 w-3.5" />
            <SelectValue placeholder="List" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__none">No list</SelectItem>
            {lists.data.map((l) => (
              <SelectItem key={l.id} value={l.id}>{l.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      {features.tags && tags.data && tags.data.length > 0 && !defaults?.tags && (
        <Popover>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
              <Hash className="h-3.5 w-3.5" />
              <span className="hidden sm:inline">{tagIds.length ? `${tagIds.length} tag` : "Tag"}</span>
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-48 p-2">
            <div className="space-y-1">
              {tags.data.map((tg) => {
                const on = tagIds.includes(tg.id);
                return (
                  <button
                    key={tg.id}
                    onClick={() =>
                      setTagIds(on ? tagIds.filter((x) => x !== tg.id) : [...tagIds, tg.id])
                    }
                    className={cn(
                      "flex w-full items-center gap-2 rounded px-2 py-1 text-left text-xs hover:bg-accent",
                      on && "bg-accent",
                    )}
                    style={tg.color ? { color: tg.color } : undefined}
                  >
                    <Hash className="h-3 w-3" /> {tg.name}
                  </button>
                );
              })}
            </div>
          </PopoverContent>
        </Popover>
      )}

      <Button size="sm" onClick={submit} disabled={!title.trim() || create.isPending}>
        Add
      </Button>
    </div>
  );
}

function formatShort(iso: string) {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString(undefined, { month: "short", day: "numeric" });
}
