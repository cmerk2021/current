import { Command } from "cmdk";
import { useNavigate } from "react-router-dom";
import { CalendarDays, LayoutDashboard, List, Plus, Search, Settings, Sun } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useUI } from "@/lib/ui-store";
import { useLists } from "@/lib/queries";
import { useState } from "react";
import { useCreateTask } from "@/lib/queries";
import { toast } from "sonner";

export function CommandPalette() {
  const open = useUI((s) => s.commandOpen);
  const setOpen = useUI((s) => s.setCommand);
  const nav = useNavigate();
  const lists = useLists();
  const createTask = useCreateTask();
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
              placeholder="Type a command or task…"
              className="flex h-12 w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
            />
          </div>
          <Command.List className="max-h-[360px] overflow-y-auto p-2">
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

            <Command.Group heading="Navigation">
              <Item icon={Sun} onSelect={() => go("/today")}>Today</Item>
              <Item icon={CalendarDays} onSelect={() => go("/upcoming")}>Upcoming</Item>
              <Item icon={LayoutDashboard} onSelect={() => go("/dashboard")}>Dashboard</Item>
              <Item icon={Search} onSelect={() => go("/search")}>Search</Item>
              <Item icon={Settings} onSelect={() => go("/settings")}>Settings</Item>
            </Command.Group>

            {lists.data && lists.data.length > 0 && (
              <Command.Group heading="Lists">
                {lists.data.map((l) => (
                  <Item key={l.id} icon={List} onSelect={() => go(`/lists/${l.id}`)}>
                    {l.name}
                  </Item>
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
