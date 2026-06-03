import { useEffect, useRef, type ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { Sidebar } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { CommandPalette } from "@/components/command-palette";
import { TaskDetailDialog } from "@/components/tasks/task-detail-dialog";
import { useUI } from "@/lib/ui-store";
import { readSidebar, usePreferences } from "@/lib/preferences";
import { cn } from "@/lib/utils";

export function AppShell({ children }: { children: ReactNode }) {
  const sidebarOpen = useUI((s) => s.sidebarOpen);
  const setSidebar = useUI((s) => s.setSidebar);
  const toggleCommand = useUI((s) => s.toggleCommand);
  const prefs = usePreferences();
  const sidebar = readSidebar(prefs.data);
  const position = sidebar.position ?? "left";

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        toggleCommand();
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleCommand]);

  // Default sidebar closed on mobile at mount; sync on breakpoint changes
  const didInit = useRef(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    if (!didInit.current) {
      didInit.current = true;
      setSidebar(mq.matches);
    }
    const onChange = (e: MediaQueryListEvent) => setSidebar(e.matches);
    mq.addEventListener?.("change", onChange);
    return () => mq.removeEventListener?.("change", onChange);
  }, [setSidebar]);

  // Close mobile drawer when navigating
  const location = useLocation();
  useEffect(() => {
    if (typeof window !== "undefined" && !window.matchMedia("(min-width: 768px)").matches) {
      setSidebar(false);
    }
  }, [location.pathname, setSidebar]);

  const aside = (
    <aside
      className={cn(
        "hidden border-border bg-card/40 transition-all md:flex md:flex-col",
        position === "right" ? "border-l" : "border-r",
        sidebarOpen ? "w-64" : "w-0 overflow-hidden",
      )}
    >
      <Sidebar />
    </aside>
  );

  return (
    <div className="flex h-full w-full overflow-hidden bg-background">
      {position === "left" && aside}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />
        <main className="flex-1 overflow-y-auto">
          <div className="mx-auto w-full max-w-5xl px-6 py-8">{children}</div>
        </main>
      </div>
      {position === "right" && aside}

      {/* Mobile drawer */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden" role="dialog" aria-modal="true">
          <div
            className="absolute inset-0 bg-background/70 backdrop-blur-sm"
            onClick={() => setSidebar(false)}
          />
          <div
            className={cn(
              "absolute inset-y-0 flex w-72 max-w-[85%] flex-col border-border bg-card shadow-xl animate-in",
              position === "right"
                ? "right-0 border-l slide-in-from-right"
                : "left-0 border-r slide-in-from-left",
            )}
          >
            <Sidebar />
          </div>
        </div>
      )}

      <CommandPalette />
      <TaskDetailDialog />
    </div>
  );
}
