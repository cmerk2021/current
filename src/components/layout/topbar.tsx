import { LogOut, PanelLeft, Search, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/lib/auth";
import { useUI } from "@/lib/ui-store";

export function Topbar() {
  const { user, signOut } = useAuth();
  const toggleSidebar = useUI((s) => s.toggleSidebar);
  const toggleCommand = useUI((s) => s.toggleCommand);
  const nav = useNavigate();

  return (
    <header className="flex h-14 items-center gap-2 border-b border-border px-4">
      <Button variant="ghost" size="icon" onClick={toggleSidebar} aria-label="Toggle sidebar">
        <PanelLeft className="h-4 w-4" />
      </Button>

      <Button
        variant="outline"
        size="sm"
        onClick={toggleCommand}
        className="ml-1 hidden h-8 min-w-[220px] justify-start gap-2 text-muted-foreground md:flex"
      >
        <Search className="h-3.5 w-3.5" />
        <span className="flex-1 text-left">Search or jump…</span>
        <kbd className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">⌘K</kbd>
      </Button>

      <div className="ml-auto flex items-center gap-1">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="gap-2">
              <span className="grid h-6 w-6 place-items-center rounded-full bg-primary/20 text-xs font-medium text-primary">
                {(user?.name?.[0] ?? user?.email?.[0] ?? "C").toUpperCase()}
              </span>
              <span className="hidden text-sm md:inline">{user?.name || user?.email}</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-[12rem]">
            <DropdownMenuLabel className="truncate">{user?.email}</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => nav("/settings")}>
              <Sparkles className="h-4 w-4" /> Personalization
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => signOut()}>
              <LogOut className="h-4 w-4" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
