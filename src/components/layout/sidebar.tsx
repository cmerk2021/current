import { NavLink, useNavigate } from "react-router-dom";
import {
  CalendarDays,
  ChevronDown,
  ChevronRight,
  Filter,
  Folder,
  Hash,
  Inbox,
  LayoutDashboard,
  MoreHorizontal,
  Plus,
  Search,
  Settings,
  Star,
  StarOff,
  Sun,
  Tag,
  TrendingUp,
} from "lucide-react";
import { useState } from "react";
import { resolveIcon } from "@/lib/icons";
import {
  useAreas,
  useCreateArea,
  useCreateList,
  useCreateProject,
  useLists,
  useProjects,
  useSmartFilters,
  useTags,
} from "@/lib/queries";
import {
  DEFAULT_SIDEBAR,
  readSidebar,
  usePreferences,
  useUpdateSidebar,
} from "@/lib/preferences";
import { featuresFor } from "@/lib/features";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";

const navItem =
  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";
const activeItem = "bg-accent text-foreground";

type SectionKey =
  | "favorites"
  | "lists"
  | "projects"
  | "areas"
  | "smart_filters"
  | "tags";

export function Sidebar() {
  const prefs = usePreferences();
  const features = featuresFor(prefs.data?.complexity ?? "balanced");
  const sb = readSidebar(prefs.data);
  const updateSidebar = useUpdateSidebar();
  const hidden = new Set(sb.hidden ?? []);

  const lists = useLists();
  const projects = useProjects();
  const areas = useAreas();
  const smartFilters = useSmartFilters();
  const tags = useTags();

  function toggleSection(key: SectionKey) {
    const next = new Set(hidden);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    updateSidebar({ hidden: Array.from(next) });
  }

  function toggleFavorite(key: string) {
    const cur = new Set(sb.favorites ?? []);
    if (cur.has(key)) cur.delete(key);
    else cur.add(key);
    updateSidebar({ favorites: Array.from(cur) });
  }

  const favorites = sb.favorites ?? [];

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Logo />
        <span className="text-base font-semibold tracking-tight">Current</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="ml-auto h-6 w-6">
              <MoreHorizontal className="h-3.5 w-3.5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Sections</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {(["favorites", "lists", "projects", "areas", "smart_filters", "tags"] as SectionKey[]).map(
              (key) => (
                <DropdownMenuItem key={key} onClick={() => toggleSection(key)}>
                  {hidden.has(key) ? "Show" : "Hide"} {sectionLabel(key)}
                </DropdownMenuItem>
              ),
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => updateSidebar(DEFAULT_SIDEBAR)}>
              Reset sidebar
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <nav className="flex-1 space-y-5 overflow-y-auto p-3">
        <div className="space-y-0.5">
          <SidebarLink to="/inbox" icon={Inbox}>Inbox</SidebarLink>
          <SidebarLink to="/today" icon={Sun}>Today</SidebarLink>
          {features.upcoming && <SidebarLink to="/upcoming" icon={CalendarDays}>Upcoming</SidebarLink>}
          {features.calendar && <SidebarLink to="/calendar" icon={CalendarDays}>Calendar</SidebarLink>}
          {features.dashboard && <SidebarLink to="/dashboard" icon={LayoutDashboard}>Dashboard</SidebarLink>}
          {features.search && <SidebarLink to="/search" icon={Search}>Search</SidebarLink>}
        </div>

        {!hidden.has("favorites") && favorites.length > 0 && (
          <Section title="Favorites">
            {favorites.map((fav) => {
              const [kind, id] = fav.split(":");
              if (kind === "list") {
                const l = lists.data?.find((x) => x.id === id);
                if (!l) return null;
                return (
                  <SidebarLink key={fav} to={`/lists/${l.id}`} icon={Inbox} color={l.color}>
                    {l.name}
                  </SidebarLink>
                );
              }
              if (kind === "project") {
                const p = projects.data?.find((x) => x.id === id);
                if (!p) return null;
                return (
                  <SidebarLink key={fav} to={`/projects/${p.id}`} icon={resolveIcon(p.icon, TrendingUp)} color={p.color}>
                    {p.name}
                  </SidebarLink>
                );
              }
              if (kind === "tag") {
                const t = tags.data?.find((x) => x.id === id);
                if (!t) return null;
                return (
                  <SidebarLink key={fav} to={`/tags/${t.id}`} icon={Hash} color={t.color}>
                    {t.name}
                  </SidebarLink>
                );
              }
              return null;
            })}
          </Section>
        )}

        {!hidden.has("lists") && (
          <Section title="Lists" action={<NewListButton />}>
            {lists.data?.length === 0 && <Empty>No lists yet</Empty>}
            {lists.data?.map((list) => (
              <SidebarItem
                key={list.id}
                to={`/lists/${list.id}`}
                icon={Inbox}
                color={list.color}
                label={list.name}
                isFavorite={favorites.includes(`list:${list.id}`)}
                onFavorite={() => toggleFavorite(`list:${list.id}`)}
              />
            ))}
          </Section>
        )}

        {features.projects && !hidden.has("projects") && (
          <Section title="Projects" action={<NewProjectButton />}>
            {projects.data?.length === 0 && <Empty>No projects yet</Empty>}
            {projects.data?.map((p) => (
              <SidebarItem
                key={p.id}
                to={`/projects/${p.id}`}
                icon={resolveIcon(p.icon, TrendingUp)}
                color={p.color}
                label={p.name}
                isFavorite={favorites.includes(`project:${p.id}`)}
                onFavorite={() => toggleFavorite(`project:${p.id}`)}
              />
            ))}
          </Section>
        )}

        {features.areas && !hidden.has("areas") && (
          <Section title="Areas" action={<NewAreaButton />}>
            {areas.data?.length === 0 && <Empty>No areas yet</Empty>}
            {areas.data?.map((a) => (
              <NavLink
                key={a.id}
                to={`/areas`}
                className={({ isActive }) => cn(navItem, isActive && activeItem)}
              >
                <Folder className="h-4 w-4" style={a.color ? { color: a.color } : undefined} />
                <span className="truncate">{a.name}</span>
              </NavLink>
            ))}
          </Section>
        )}

        {features.smartFilters && !hidden.has("smart_filters") && (
          <Section title="Smart filters" action={
            <NavLink to="/smart-filters" className="rounded-md p-1 hover:bg-accent">
              <Plus className="h-3.5 w-3.5" />
            </NavLink>
          }>
            {smartFilters.data?.length === 0 && <Empty>None yet</Empty>}
            {smartFilters.data?.map((sf) => (
              <NavLink
                key={sf.id}
                to={`/smart-filters/${sf.id}`}
                className={({ isActive }) => cn(navItem, isActive && activeItem)}
              >
                <Filter className="h-4 w-4" />
                <span className="truncate">{sf.name}</span>
              </NavLink>
            ))}
          </Section>
        )}

        {features.tags && !hidden.has("tags") && (
          <Section title="Tags" action={
            <NavLink to="/tags" className="rounded-md p-1 hover:bg-accent">
              <Plus className="h-3.5 w-3.5" />
            </NavLink>
          }>
            {tags.data?.length === 0 && <Empty>No tags yet</Empty>}
            {tags.data?.slice(0, 12).map((tg) => (
              <SidebarItem
                key={tg.id}
                to={`/tags/${tg.id}`}
                icon={Tag}
                color={tg.color}
                label={tg.name}
                isFavorite={favorites.includes(`tag:${tg.id}`)}
                onFavorite={() => toggleFavorite(`tag:${tg.id}`)}
              />
            ))}
          </Section>
        )}
      </nav>

      <div className="border-t border-border p-3">
        <NavLink to="/settings" className={({ isActive }) => cn(navItem, isActive && activeItem)}>
          <Settings className="h-4 w-4" /> Settings
        </NavLink>
      </div>
    </div>
  );
}

function SidebarLink({
  to,
  icon: Icon,
  color,
  children,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color?: string;
  children: React.ReactNode;
}) {
  return (
    <NavLink to={to} className={({ isActive }) => cn(navItem, isActive && activeItem)}>
      <Icon className="h-4 w-4" style={color ? { color } : undefined} />
      <span className="truncate">{children}</span>
    </NavLink>
  );
}

function SidebarItem({
  to,
  icon: Icon,
  color,
  label,
  isFavorite,
  onFavorite,
}: {
  to: string;
  icon: React.ComponentType<{ className?: string; style?: React.CSSProperties }>;
  color?: string;
  label: string;
  isFavorite: boolean;
  onFavorite: () => void;
}) {
  return (
    <div className="group relative">
      <NavLink to={to} className={({ isActive }) => cn(navItem, "pr-7", isActive && activeItem)}>
        <Icon className="h-4 w-4" style={color ? { color } : undefined} />
        <span className="truncate">{label}</span>
      </NavLink>
      <button
        onClick={onFavorite}
        className="absolute right-1 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100"
        aria-label="Favorite"
      >
        {isFavorite ? <Star className="h-3 w-3 fill-amber-400 text-amber-400" /> : <StarOff className="h-3 w-3" />}
      </button>
    </div>
  );
}

function Section({
  title,
  action,
  children,
}: {
  title: string;
  action?: React.ReactNode;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(true);
  return (
    <div>
      <div className="mb-1 flex items-center justify-between px-2.5">
        <button
          onClick={() => setOpen((o) => !o)}
          className="flex items-center gap-1 text-xs font-semibold uppercase tracking-wider text-muted-foreground hover:text-foreground"
        >
          {open ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
          {title}
        </button>
        {action}
      </div>
      {open && <div className="space-y-0.5">{children}</div>}
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="px-2.5 py-1 text-xs text-muted-foreground">{children}</p>;
}

function sectionLabel(k: SectionKey): string {
  switch (k) {
    case "favorites": return "favorites";
    case "lists": return "lists";
    case "projects": return "projects";
    case "areas": return "areas";
    case "smart_filters": return "smart filters";
    case "tags": return "tags";
  }
}

function Logo() {
  return (
    <span className="grid h-7 w-7 place-items-center rounded-md bg-gradient-to-br from-primary to-sky-500 text-primary-foreground">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" className="h-4 w-4">
        <path d="M6 15c4 4 8 4 12 0M6 9c4-4 8-4 12 0" strokeLinecap="round" />
      </svg>
    </span>
  );
}

function NewListButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const create = useCreateList();

  async function submit() {
    if (!name.trim()) return;
    try {
      await create.mutateAsync({ name: name.trim() });
      toast.success("List created");
      setName("");
      setOpen(false);
    } catch {
      toast.error("Couldn't create list");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="New list">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>New list</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="list-name">Name</Label>
          <Input id="list-name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Errands" autoFocus onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewProjectButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const create = useCreateProject();
  const nav = useNavigate();

  async function submit() {
    if (!name.trim()) return;
    try {
      const p = await create.mutateAsync({ name: name.trim() });
      toast.success("Project created");
      setName("");
      setOpen(false);
      nav(`/projects/${p.id}`);
    } catch {
      toast.error("Couldn't create project");
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="New project">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>New project</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="proj-name">Name</Label>
          <Input id="proj-name" value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Website redesign" autoFocus onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function NewAreaButton() {
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const create = useCreateArea();

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
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" className="h-6 w-6" aria-label="New area">
          <Plus className="h-3.5 w-3.5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle>New area</DialogTitle></DialogHeader>
        <div className="space-y-2">
          <Label>Name</Label>
          <Input value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Personal" autoFocus onKeyDown={(e) => e.key === "Enter" && submit()} />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>Cancel</Button>
          <Button onClick={submit} disabled={!name.trim() || create.isPending}>Create</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
