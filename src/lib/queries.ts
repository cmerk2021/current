import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  pb,
  type AreaRecord,
  type ListRecord,
  type ProjectRecord,
  type RecurrenceRule,
  type SmartFilterRecord,
  type TagRecord,
  type TaskRecord,
} from "@/lib/pb";
import { useAuth } from "@/lib/auth";

/* -------------------------------- TASKS -------------------------------- */

export interface TaskFilter {
  list?: string;
  project?: string;
  area?: string;
  tag?: string;
  done?: boolean;
  due?: "today" | "tomorrow" | "this_week" | "upcoming" | "overdue" | "any" | "none";
  scheduled?: "today";
  todayView?: boolean;
  inbox?: boolean;
  priority?: string[];
  parent?: string | null;
  search?: string;
}

export function buildTaskFilter(userId: string, f: TaskFilter): string {
  const parts: string[] = [`user = "${userId}"`];
  if (f.list) parts.push(`list = "${f.list}"`);
  if (f.project) parts.push(`project = "${f.project}"`);
  if (f.tag) parts.push(`tags ~ "${f.tag}"`);
  if (typeof f.done === "boolean") parts.push(`done = ${f.done}`);
  if (f.parent === null) parts.push(`parent = ""`);
  else if (f.parent) parts.push(`parent = "${f.parent}"`);
  if (f.priority?.length) {
    parts.push("(" + f.priority.map((p) => `priority = "${p}"`).join(" || ") + ")");
  }

  const eod = new Date();
  eod.setHours(23, 59, 59, 999);
  const sod = new Date();
  sod.setHours(0, 0, 0, 0);

  if (f.due === "today") {
    parts.push(`due != "" && due <= "${eod.toISOString()}"`);
  } else if (f.due === "tomorrow") {
    const t1 = new Date(sod);
    t1.setDate(t1.getDate() + 1);
    const t2 = new Date(t1);
    t2.setHours(23, 59, 59, 999);
    parts.push(`due >= "${t1.toISOString()}" && due <= "${t2.toISOString()}"`);
  } else if (f.due === "this_week") {
    const end = new Date(sod);
    end.setDate(end.getDate() + 7);
    parts.push(`due >= "${sod.toISOString()}" && due <= "${end.toISOString()}"`);
  } else if (f.due === "upcoming") {
    parts.push(`due != "" && due > "${eod.toISOString()}"`);
  } else if (f.due === "overdue") {
    parts.push(`due != "" && due < "${sod.toISOString()}" && done = false`);
  } else if (f.due === "none") {
    parts.push(`due = ""`);
  }

  if (f.scheduled === "today") {
    parts.push(`scheduled >= "${sod.toISOString()}" && scheduled <= "${eod.toISOString()}"`);
  }

  if (f.todayView) {
    // Tasks for today = due on/before today OR scheduled for today.
    parts.push(
      `((due != "" && due <= "${eod.toISOString()}") || (scheduled >= "${sod.toISOString()}" && scheduled <= "${eod.toISOString()}"))`,
    );
  }

  if (f.inbox) {
    // Unfiled: no list, no project, no due, no scheduled.
    parts.push(`list = "" && project = "" && due = "" && scheduled = ""`);
  }

  if (f.search) parts.push(`(title ~ "${f.search.replace(/"/g, '\\"')}" || notes ~ "${f.search.replace(/"/g, '\\"')}")`);
  return parts.join(" && ");
}

export function useTasks(filter: TaskFilter = {}) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tasks", user?.id, filter],
    enabled: !!user,
    queryFn: async () => {
      const res = await pb.collection("tasks").getList<TaskRecord>(1, 500, {
        filter: buildTaskFilter(user!.id, filter),
        sort: "done,order,-created",
      });
      return res.items;
    },
  });
}

export function useTask(id: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["task", id],
    enabled: !!user && !!id,
    queryFn: async () => pb.collection("tasks").getOne<TaskRecord>(id!),
  });
}

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<TaskRecord> & { title: string }) =>
      await pb.collection("tasks").create<TaskRecord>({
        user: user!.id,
        done: false,
        priority: "none",
        tags: [],
        // Negative timestamp so newly-created tasks sort to the TOP of the
        // ascending-order list (manual reorder uses positive Date.now()-based
        // values, so reordered items stay where the user dropped them).
        order: -Date.now(),
        ...input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<TaskRecord> }) => {
      const body: Partial<TaskRecord> = { ...patch };
      if (patch.done === true && !patch.completed_at) {
        body.completed_at = new Date().toISOString();
      } else if (patch.done === false) {
        body.completed_at = undefined;
      }
      const updated = await pb.collection("tasks").update<TaskRecord>(id, body);

      // Recurrence engine — when a recurring task is completed, schedule the next one.
      if (patch.done === true && updated.recurrence && updated.due) {
        const nextDue = advanceRecurrence(updated.recurrence, new Date(updated.due));
        if (nextDue) {
          await pb.collection("tasks").create<TaskRecord>({
            user: user!.id,
            title: updated.title,
            notes: updated.notes,
            done: false,
            priority: updated.priority,
            list: updated.list,
            project: updated.project,
            parent: updated.parent,
            tags: updated.tags,
            order: Date.now(),
            due: nextDue.toISOString(),
            recurrence: updated.recurrence,
          });
        }
      }
      return updated;
    },
    onSuccess: (data) => {
      qc.invalidateQueries({ queryKey: ["tasks"] });
      qc.invalidateQueries({ queryKey: ["task", data.id] });
    },
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => pb.collection("tasks").delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useReorderTasks() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderedIds: string[]) => {
      const base = Date.now();
      await Promise.all(
        orderedIds.map((id, i) =>
          pb.collection("tasks").update(id, { order: base + i * 10 }),
        ),
      );
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function advanceRecurrence(r: RecurrenceRule, from: Date): Date | null {
  const next = new Date(from);
  const i = Math.max(1, r.interval);
  switch (r.freq) {
    case "daily":
      next.setDate(next.getDate() + i);
      break;
    case "weekly":
      if (r.byweekday?.length) {
        // find the next weekday in the rule on or after from+1
        for (let d = 1; d <= 7 * i; d++) {
          const c = new Date(from);
          c.setDate(from.getDate() + d);
          if (r.byweekday.includes(c.getDay())) return c;
        }
      }
      next.setDate(next.getDate() + 7 * i);
      break;
    case "monthly":
      next.setMonth(next.getMonth() + i);
      break;
    case "yearly":
      next.setFullYear(next.getFullYear() + i);
      break;
  }
  return next;
}

/* -------------------------------- LISTS -------------------------------- */

export function useLists() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["lists", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await pb.collection("lists").getList<ListRecord>(1, 200, {
        filter: `user = "${user!.id}" && archived = false`,
        sort: "order,name",
      });
      return res.items;
    },
  });
}

export function useCreateList() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<ListRecord> & { name: string }) =>
      await pb.collection("lists").create<ListRecord>({
        user: user!.id,
        archived: false,
        order: Date.now(),
        ...input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lists"] }),
  });
}

export function useUpdateList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ListRecord> }) =>
      pb.collection("lists").update<ListRecord>(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["lists"] }),
  });
}

export function useDeleteList() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => pb.collection("lists").delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["lists"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/* ------------------------------- PROJECTS ------------------------------ */

export function useProjects() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["projects", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await pb.collection("projects").getList<ProjectRecord>(1, 200, {
        filter: `user = "${user!.id}" && status != "archived"`,
        sort: "order,name",
      });
      return res.items;
    },
  });
}

export function useCreateProject() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<ProjectRecord> & { name: string }) =>
      await pb.collection("projects").create<ProjectRecord>({
        user: user!.id,
        status: "active",
        order: Date.now(),
        ...input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useUpdateProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<ProjectRecord> }) =>
      pb.collection("projects").update<ProjectRecord>(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
  });
}

export function useDeleteProject() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => pb.collection("projects").delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["projects"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/* --------------------------------- AREAS ------------------------------- */

export function useAreas() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["areas", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await pb.collection("areas").getList<AreaRecord>(1, 200, {
        filter: `user = "${user!.id}" && archived = false`,
        sort: "order,name",
      });
      return res.items;
    },
  });
}

export function useCreateArea() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<AreaRecord> & { name: string }) =>
      await pb.collection("areas").create<AreaRecord>({
        user: user!.id,
        archived: false,
        order: Date.now(),
        ...input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas"] }),
  });
}

export function useUpdateArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<AreaRecord> }) =>
      pb.collection("areas").update<AreaRecord>(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas"] }),
  });
}

export function useDeleteArea() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => pb.collection("areas").delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["areas"] }),
  });
}

/* --------------------------------- TAGS -------------------------------- */

export function useTags() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["tags", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await pb.collection("tags").getList<TagRecord>(1, 200, {
        filter: `user = "${user!.id}"`,
        sort: "name",
      });
      return res.items;
    },
  });
}

export function useCreateTag() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<TagRecord> & { name: string }) =>
      await pb.collection("tags").create<TagRecord>({
        user: user!.id,
        ...input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useUpdateTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<TagRecord> }) =>
      pb.collection("tags").update<TagRecord>(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tags"] }),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => pb.collection("tags").delete(id),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["tags"] });
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
  });
}

/* ----------------------------- SMART FILTERS --------------------------- */

export function useSmartFilters() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["smart_filters", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const res = await pb.collection("smart_filters").getList<SmartFilterRecord>(1, 200, {
        filter: `user = "${user!.id}"`,
        sort: "-pinned,name",
      });
      return res.items;
    },
  });
}

export function useCreateSmartFilter() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<SmartFilterRecord> & { name: string }) =>
      await pb.collection("smart_filters").create<SmartFilterRecord>({
        user: user!.id,
        pinned: false,
        ...input,
      }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["smart_filters"] }),
  });
}

export function useUpdateSmartFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<SmartFilterRecord> }) =>
      pb.collection("smart_filters").update<SmartFilterRecord>(id, patch),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["smart_filters"] }),
  });
}

export function useDeleteSmartFilter() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => pb.collection("smart_filters").delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["smart_filters"] }),
  });
}
