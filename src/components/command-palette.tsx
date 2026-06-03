import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import {
  CalendarDays,
  Filter,
  Folder,
  Hash,
  LayoutDashboard,
  List,
  Moon,
  Palette,
  Plus,
  Search,
  Settings,
  Sun,
  TrendingUp,
} from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUI } from "@/lib/ui-store";
import {
  useAreas,
  useCreateTask,
  useLists,
  useProjects,
  useSmartFilters,
  useTags,
  useTasks,
} from "@/lib/queries";
import { useState } from "react";
import { toast } from "sonner";
import { useUpdatePreferences } from "@/lib/preferences";
import type { Accent, Theme } from "@/lib/pb";
import { featuresFor } from "@/lib/features";
import { usePreferences } from "@/lib/preferences";
import { resolveIcon } from "@/lib/icons";

export function CommandPalette() {
  const open = useUI((s) => s.commandOpen);
  const setOpen = useUI((s) => s.setCommand);
  const openTask = useUI((s) => s.openTask);
  const nav = useNavigate();
  const lists = useLists();
  const projects = useProjects();
  const areas = useAreas();
  const tags = useTags();
  const smartFilters = useSmartFilters();
  const tasks = useTasks();
  const createTask = useCreateTask();
  const updatePrefs = useUpdatePreferences();
  const prefs = usePreferences();
  const features = featuresFor(prefs.data?.complexity ?? "balanced");
  const [query, setQuery] = useState("");

  function go(path: string) {
    setOpen(false);
    nav(path);
  }

  async function quickAdd() {
    const title = query.trim();
    if (!title) return;
    try {
      await createTask.mutateAsync({ title });
      toast.success("Task added");
      setOpen(false);
      setQuery("");
    } catch {
      toast.error("Couldn't add task");
    }
  }

  const matchingTasks =
    query.trim().length >= 2
      ? (tasks.data ?? []).filter((t) => t.title.toLowerCase().includes(query.toLowerCase())).slice(0, 6)
      : [];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent className="max-w-xl gap-0 overflow-hidden p-0">
        <Command className="overflow-hidden" loop>
          <div className="flex items-center gap-2 border-b border-border px-3">
            <Search className="h-4 w-4 text-muted-foreground" />
            <Command.Input
              autoFocus
              value={query}
              onValueChange={setQuery}
              placeholder="Type a command, search a task, or jump…"
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-[420px] overflow-y-auto p-2">
            <Command.Empty className="px-3 py-6 text-center text-sm text-muted-foreground">
              No results.
            </Command.Empty>

            {query.trim() && (
              <Command.Group heading="Quick add">
                <Item icon={Plus} onSelect={quickAdd}>
                  Add task: <span className="ml-1 font-medium text-foreground">{query.trim()}</span>
                </Item>
              </Command.Group>
            )}

            {matchingTasks.length > 0 && (
              <Command.Group heading="Tasks">
                {matchingTasks.map((t) => (
                  <Item key={t.id} icon={List} onSelect={() => { setOpen(false); openTask(t.id); }}>
                    {t.title}
                  </Item>
                ))}
              </Command.Group>
            )}

            <Command.Group heading="Navigation">
              <Item icon={Sun} onSelect={() => go("/today")}>Today</Item>
              <Item icon={List} onSelect={() => go("/inbox")}>Inbox</Item>
              {features.upcoming && <Item icon={CalendarDays} onSelect={() => go("/upcoming")}>Upcoming</Item>}
              {features.calendar && <Item icon={CalendarDays} onSelect={() => go("/calendar")}>Calendar</Item>}
              {features.dashboard && <Item icon={LayoutDashboard} onSelect={() => go("/dashboard")}>Dashboard</Item>}
              {features.areas && <Item icon={Folder} onSelect={() => go("/areas")}>Areas</Item>}
              {features.tags && <Item icon={Hash} onSelect={() => go("/tags")}>Tags</Item>}
              {features.smartFilters && <Item icon={Filter} onSelect={() => go("/smart-filters")}>Smart filters</Item>}
              <Item icon={Search} onSelect={() => go("/search")}>Search</Item>
              <Item icon={Settings} onSelect={() => go("/settings")}>Settings</Item>
            </Command.Group>

            <Command.Group heading="Theme">
              {(["system", "light", "dark", "amoled"] as Theme[]).map((t) => (
                <Item
                  key={t}
                  icon={t === "light" ? Sun : Moon}
                  onSelect={async () => {
                    await updatePrefs.mutateAsync({ theme: t });
                    setOpen(false);
                    toast.success(`Theme: ${t}`);
                  }}
                >
                  <span className="capitalize">Switch to {t} theme</span>
                </Item>
              ))}
              {(["indigo", "violet", "blue", "emerald", "amber", "rose"] as Accent[]).map((a) => (
                <Item
                  key={a}
                  icon={Palette}
                  onSelect={async () => {
                    await updatePrefs.mutateAsync({ accent: a });
                    setOpen(false);
                    toast.success(`Accent: ${a}`);
                  }}
                >
                  <span className="capitalize">Accent → {a}</span>
                </Item>
              ))}
            </Command.Group>

            {lists.data && lists.data.length > 0 && (
              <Command.Group heading="Lists">
                {lists.data.map((l) => (
                  <Item key={l.id} icon={List} onSelect={() => go(`/lists/${l.id}`)}>{l.name}</Item>
                ))}
              </Command.Group>
            )}

            {features.projects && projects.data && projects.data.length > 0 && (
              <Command.Group heading="Projects">
                {projects.data.map((p) => (
                  <Item key={p.id} icon={resolveIcon(p.icon, TrendingUp)} onSelect={() => go(`/projects/${p.id}`)}>{p.name}</Item>
                ))}
              </Command.Group>
            )}

            {features.areas && areas.data && areas.data.length > 0 && (
              <Command.Group heading="Areas">
                {areas.data.map((a) => (
                  <Item key={a.id} icon={Folder} onSelect={() => go(`/areas`)}>{a.name}</Item>
                ))}
              </Command.Group>
            )}

            {features.smartFilters && smartFilters.data && smartFilters.data.length > 0 && (
              <Command.Group heading="Smart filters">
                {smartFilters.data.map((sf) => (
                  <Item key={sf.id} icon={Filter} onSelect={() => go(`/smart-filters/${sf.id}`)}>{sf.name}</Item>
                ))}
              </Command.Group>
            )}

            {features.tags && tags.data && tags.data.length > 0 && (
              <Command.Group heading="Tags">
                {tags.data.map((t) => (
                  <Item key={t.id} icon={Hash} onSelect={() => go(`/tags/${t.id}`)}>{t.name}</Item>
                ))}
              </Command.Group>
            )}
          </Command.List>
        </Command>
      </DialogContent>
    </Dialog>
  );
}

function Item({
  icon: Icon,
  children,
  onSelect,
}: {
  icon: React.ComponentType<{ className?: string }>;
  children: React.ReactNode;
  onSelect: () => void;
}) {
  return (
    <Command.Item
      onSelect={onSelect}
      className="flex cursor-pointer items-center gap-2 rounded-md px-2.5 py-2 text-sm aria-selected:bg-accent aria-selected:text-accent-foreground"
    >
      <Icon className="h-4 w-4 text-muted-foreground" />
      <span>{children}</span>
    </Command.Item>
  );
}
