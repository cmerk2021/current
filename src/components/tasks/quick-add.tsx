import { useState } from "react";
import { CalendarDays, Flag, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useCreateTask } from "@/lib/queries";
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
  const [title, setTitle] = useState("");
  const [due, setDue] = useState<string>("");
  const [priority, setPriority] = useState<Priority>("none");

  async function submit() {
    const t = title.trim();
    if (!t) return;
    try {
      await create.mutateAsync({
        title: t,
        priority,
        due: due || undefined,
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
    <div className="surface flex items-center gap-1 p-1.5">
      <div className="grid h-7 w-7 place-items-center text-muted-foreground">
        <Plus className="h-4 w-4" />
      </div>
      <Input
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        onKeyDown={(e) => e.key === "Enter" && submit()}
        placeholder={placeholder}
        className="h-7 border-0 px-0 shadow-none focus-visible:ring-0"
      />

      {features.dueDates && (
        <Popover>
          <PopoverTrigger asChild>
            <Button
              variant="ghost"
              size="sm"
              className={cn("h-7 gap-1 text-xs", due && "text-foreground")}
            >
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
              <Button
                variant="ghost"
                size="sm"
                className="ml-2"
                onClick={() => setDue("")}
              >
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
