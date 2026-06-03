import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pb, type PreferencesRecord, type SidebarPrefs, type UIPrefs, type WidgetPrefs } from "@/lib/pb";
import { useAuth } from "@/lib/auth";

const DEFAULTS = {
  complexity: "balanced" as const,
  theme: "system" as const,
  accent: "indigo" as const,
  density: "comfortable" as const,
};

export const DEFAULT_SIDEBAR: SidebarPrefs = {
  favorites: [],
  hidden: [],
  position: "left",
  compact: false,
};

export const DEFAULT_UI: UIPrefs = {
  radius: "medium",
  fontFamily: "system",
  fontSize: "medium",
  weekStartsOn: 1,
  reducedMotion: false,
  showCompleted: true,
  customAccent: null,
  confetti: false,
  defaultView: "today",
  groupBy: "none",
};

export const DEFAULT_WIDGETS: WidgetPrefs = {
  layout: [
    { id: "today", visible: true, order: 0 },
    { id: "overdue", visible: true, order: 1 },
    { id: "progress", visible: true, order: 2 },
    { id: "upcoming", visible: true, order: 3 },
    { id: "priority", visible: true, order: 4 },
    { id: "projects", visible: true, order: 5 },
    { id: "streak", visible: false, order: 6 },
  ],
};

function describePbError(err: unknown): Error {
  const e = err as {
    status?: number;
    response?: { message?: string; data?: Record<string, { message?: string }> };
    message?: string;
  };
  const fieldErrors = e?.response?.data
    ? Object.entries(e.response.data)
        .map(([k, v]) => `${k}: ${v?.message ?? "invalid"}`)
        .join("; ")
    : "";
  const msg = [e?.response?.message ?? e?.message ?? "Request failed", fieldErrors]
    .filter(Boolean)
    .join(" — ");
  console.error("[PB error]", e?.status, e?.response ?? e);
  return new Error(msg);
}

export function usePreferences() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["preferences", user?.id],
    enabled: !!user,
    queryFn: async () => {
      try {
        return await pb
          .collection("preferences")
          .getFirstListItem<PreferencesRecord>(`user = "${user!.id}"`);
      } catch (err: unknown) {
        const status = (err as { status?: number })?.status;
        if (status !== 404) throw describePbError(err);
        try {
          return await pb.collection("preferences").create<PreferencesRecord>({
            user: user!.id,
            ...DEFAULTS,
            onboarded: false,
          });
        } catch (createErr) {
          try {
            return await pb
              .collection("preferences")
              .getFirstListItem<PreferencesRecord>(`user = "${user!.id}"`);
          } catch {
            throw describePbError(createErr);
          }
        }
      }
    },
  });
}

export function useUpdatePreferences() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (patch: Partial<PreferencesRecord>) => {
      try {
        const current = await pb
          .collection("preferences")
          .getFirstListItem<PreferencesRecord>(`user = "${user!.id}"`);
        return await pb.collection("preferences").update<PreferencesRecord>(current.id, patch);
      } catch (err) {
        throw describePbError(err);
      }
    },
    onSuccess: (data) => {
      qc.setQueryData(["preferences", user?.id], data);
    },
  });
}

export function useUpdateUI() {
  const prefs = usePreferences();
  const update = useUpdatePreferences();
  return async (patch: Partial<UIPrefs>) => {
    const merged: UIPrefs = { ...DEFAULT_UI, ...(prefs.data?.ui ?? {}), ...patch };
    await update.mutateAsync({ ui: merged });
  };
}

export function useUpdateSidebar() {
  const prefs = usePreferences();
  const update = useUpdatePreferences();
  return async (patch: Partial<SidebarPrefs>) => {
    const merged: SidebarPrefs = { ...DEFAULT_SIDEBAR, ...(prefs.data?.sidebar ?? {}), ...patch };
    await update.mutateAsync({ sidebar: merged });
  };
}

export function useUpdateWidgets() {
  const update = useUpdatePreferences();
  return async (next: WidgetPrefs) => {
    await update.mutateAsync({ widgets: next });
  };
}

export function readUI(prefs: PreferencesRecord | undefined | null): UIPrefs {
  return { ...DEFAULT_UI, ...(prefs?.ui ?? {}) };
}

export function readSidebar(prefs: PreferencesRecord | undefined | null): SidebarPrefs {
  return { ...DEFAULT_SIDEBAR, ...(prefs?.sidebar ?? {}) };
}

export function readWidgets(prefs: PreferencesRecord | undefined | null): WidgetPrefs {
  const layout =
    prefs?.widgets?.layout && prefs.widgets.layout.length > 0
      ? prefs.widgets.layout
      : DEFAULT_WIDGETS.layout;
  return { layout };
}
