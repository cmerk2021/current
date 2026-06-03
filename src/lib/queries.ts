import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { pb, type ListRecord, type ProjectRecord, type TagRecord, type TaskRecord } from "@/lib/pb";
import { useAuth } from "@/lib/auth";

/* -------------------------------- TASKS -------------------------------- */

export interface TaskFilter {
  list?: string;
  project?: string;
  done?: boolean;
  due?: "today" | "upcoming" | "overdue";
  parent?: string | null;
  search?: string;
}

function buildTaskFilter(userId: string, f: TaskFilter): string {
  const parts: string[] = [`user = "${userId}"`];
  if (f.list) parts.push(`list = "${f.list}"`);
  if (f.project) parts.push(`project = "${f.project}"`);
  if (typeof f.done === "boolean") parts.push(`done = ${f.done}`);
  if (f.parent === null) parts.push(`parent = ""`);
  else if (f.parent) parts.push(`parent = "${f.parent}"`);

  if (f.due === "today") {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    parts.push(`due != "" && due <= "${today.toISOString()}"`);
  } else if (f.due === "upcoming") {
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    parts.push(`due != "" && due > "${today.toISOString()}"`);
  } else if (f.due === "overdue") {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    parts.push(`due != "" && due < "${today.toISOString()}" && done = false`);
  }

  if (f.search) parts.push(`title ~ "${f.search.replace(/"/g, '\\"')}"`);
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

export function useCreateTask() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (input: Partial<TaskRecord> & { title: string }) => {
      return await pb.collection("tasks").create<TaskRecord>({
        user: user!.id,
        done: false,
        priority: "none",
        tags: [],
        order: Date.now(),
        ...input,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useUpdateTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<TaskRecord> }) => {
      const body: Partial<TaskRecord> = { ...patch };
      if (patch.done === true && !patch.completed_at) {
        body.completed_at = new Date().toISOString();
      } else if (patch.done === false) {
        body.completed_at = undefined;
      }
      return await pb.collection("tasks").update<TaskRecord>(id, body);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
}

export function useDeleteTask() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => pb.collection("tasks").delete(id),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
  });
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
    mutationFn: async (input: Partial<ListRecord> & { name: string }) => {
      return await pb.collection("lists").create<ListRecord>({
        user: user!.id,
        archived: false,
        order: Date.now(),
        ...input,
      });
    },
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
    mutationFn: async (input: Partial<ProjectRecord> & { name: string }) => {
      return await pb.collection("projects").create<ProjectRecord>({
        user: user!.id,
        status: "active",
        order: Date.now(),
        ...input,
      });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["projects"] }),
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
