import { NavLink } from "react-router-dom";
import { CalendarDays, Inbox, LayoutDashboard, Plus, Search, Settings, Sun } from "lucide-react";
import { useLists, useCreateList } from "@/lib/queries";
import { usePreferences } from "@/lib/preferences";
import { featuresFor } from "@/lib/features";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";
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
import { toast } from "sonner";

const navItem =
  "flex items-center gap-2.5 rounded-md px-2.5 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-accent-foreground";
const activeItem = "bg-accent text-accent-foreground";

export function Sidebar() {
  const prefs = usePreferences();
  const lists = useLists();
  const features = featuresFor(prefs.data?.complexity ?? "balanced");

  return (
    <div className="flex h-full flex-col">
      <div className="flex h-14 items-center gap-2 border-b border-border px-4">
        <Logo />
        <span className="text-base font-semibold tracking-tight">Current</span>
      </div>

      <nav className="flex-1 space-y-6 overflow-y-auto p-3">
        <div className="space-y-0.5">
          <NavLink to="/today" className={({ isActive }) => cn(navItem, isActive && activeItem)}>
            <Sun className="h-4 w-4" /> Today
          </NavLink>
          {features.upcoming && (
            <NavLink
              to="/upcoming"
              className={({ isActive }) => cn(navItem, isActive && activeItem)}
            >
              <CalendarDays className="h-4 w-4" /> Upcoming
            </NavLink>
          )}
          {features.dashboard && (
            <NavLink
              to="/dashboard"
              className={({ isActive }) => cn(navItem, isActive && activeItem)}
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </NavLink>
          )}
          {features.search && (
            <NavLink to="/search" className={({ isActive }) => cn(navItem, isActive && activeItem)}>
              <Search className="h-4 w-4" /> Search
            </NavLink>
          )}
        </div>

        <div>
          <div className="mb-1 flex items-center justify-between px-2.5">
            <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Lists
            </span>
            <NewListButton />
          </div>
          <div className="space-y-0.5">
            {lists.data?.length === 0 && (
              <p className="px-2.5 py-1 text-xs text-muted-foreground">No lists yet</p>
            )}
            {lists.data?.map((list) => (
              <NavLink
                key={list.id}
                to={`/lists/${list.id}`}
                className={({ isActive }) => cn(navItem, isActive && activeItem)}
              >
                <Inbox className="h-4 w-4" style={list.color ? { color: list.color } : undefined} />
                <span className="truncate">{list.name}</span>
              </NavLink>
            ))}
          </div>
        </div>
      </nav>

      <div className="border-t border-border p-3">
        <NavLink to="/settings" className={({ isActive }) => cn(navItem, isActive && activeItem)}>
          <Settings className="h-4 w-4" /> Settings
        </NavLink>
      </div>
    </div>
  );
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
        <DialogHeader>
          <DialogTitle>New list</DialogTitle>
        </DialogHeader>
        <div className="space-y-2">
          <Label htmlFor="list-name">Name</Label>
          <Input
            id="list-name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Errands"
            autoFocus
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={submit} disabled={!name.trim() || create.isPending}>
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
