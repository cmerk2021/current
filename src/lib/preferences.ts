import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pb, type PreferencesRecord } from "@/lib/pb";
import { useAuth } from "@/lib/auth";

const DEFAULTS = {
  complexity: "balanced" as const,
  theme: "system" as const,
  accent: "indigo" as const,
  density: "comfortable" as const,
  sidebar: { favorites: [], hidden: [] },
  widgets: { layout: [] },
  onboarded: false,
};

function describePbError(err: unknown): Error {
  const e = err as { status?: number; response?: { message?: string; data?: Record<string, { message?: string }> }; message?: string };
  const fieldErrors = e?.response?.data
    ? Object.entries(e.response.data)
        .map(([k, v]) => `${k}: ${v?.message ?? "invalid"}`)
        .join("; ")
    : "";
  const msg = [e?.response?.message ?? e?.message ?? "Request failed", fieldErrors]
    .filter(Boolean)
    .join(" — ");
  // Surface in console so the network tab isn't the only signal.
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
          return await pb
            .collection("preferences")
            .create<PreferencesRecord>({
              user: user!.id,
              complexity: DEFAULTS.complexity,
              theme: DEFAULTS.theme,
              accent: DEFAULTS.accent,
              density: DEFAULTS.density,
              onboarded: false,
            });
        } catch (createErr) {
          // A concurrent first-load (e.g. React StrictMode double-invoke) can race
          // and lose the UNIQUE(user) check. If a record now exists, return it.
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
        return await pb
          .collection("preferences")
          .update<PreferencesRecord>(current.id, patch);
      } catch (err) {
        throw describePbError(err);
      }
    },
    onSuccess: (data) => {
      qc.setQueryData(["preferences", user?.id], data);
    },
  });
}
