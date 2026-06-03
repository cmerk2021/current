import PocketBase from "pocketbase";

const url = import.meta.env.VITE_PB_URL ?? "http://127.0.0.1:8090";

export const pb = new PocketBase(url);

// Disable automatic cancellation on every request — we want manual control via React Query keys.
pb.autoCancellation(false);

export type Id = string;

export interface BaseRecord {
  id: Id;
  created: string;
  updated: string;
}

export interface UserRecord extends BaseRecord {
  email: string;
  name?: string;
  avatar?: string;
  verified: boolean;
}

export type Complexity = "simple" | "balanced" | "advanced";
export type Theme = "system" | "light" | "dark";
export type Accent = "indigo" | "violet" | "blue" | "emerald" | "amber" | "rose" | "slate";
export type Density = "compact" | "comfortable" | "spacious";

export interface PreferencesRecord extends BaseRecord {
  user: Id;
  complexity: Complexity;
  theme: Theme;
  accent: Accent;
  density: Density;
  sidebar: SidebarPrefs | null;
  widgets: WidgetPrefs | null;
  onboarded: boolean;
}

export interface SidebarPrefs {
  favorites: Id[];
  hidden: string[];
}

export interface WidgetPrefs {
  layout: { id: string; visible: boolean; order: number }[];
}

export interface AreaRecord extends BaseRecord {
  user: Id;
  name: string;
  icon?: string;
  color?: string;
  order: number;
  archived: boolean;
}

export type ProjectStatus = "active" | "on_hold" | "completed" | "archived";

export interface ProjectRecord extends BaseRecord {
  user: Id;
  area?: Id;
  name: string;
  notes?: string;
  icon?: string;
  color?: string;
  status: ProjectStatus;
  order: number;
  due?: string;
}

export interface ListRecord extends BaseRecord {
  user: Id;
  project?: Id;
  name: string;
  icon?: string;
  color?: string;
  order: number;
  archived: boolean;
}

export interface TagRecord extends BaseRecord {
  user: Id;
  name: string;
  color?: string;
}

export type Priority = "none" | "low" | "medium" | "high" | "urgent";

export interface TaskRecord extends BaseRecord {
  user: Id;
  title: string;
  notes?: string;
  done: boolean;
  completed_at?: string;
  due?: string;
  scheduled?: string;
  priority: Priority;
  list?: Id;
  project?: Id;
  parent?: Id;
  tags: Id[];
  order: number;
  recurrence?: RecurrenceRule | null;
  attachments?: string[];
}

export interface RecurrenceRule {
  freq: "daily" | "weekly" | "monthly" | "yearly";
  interval: number;
  byweekday?: number[];
}

export interface SmartFilterRecord extends BaseRecord {
  user: Id;
  name: string;
  icon?: string;
  query: SmartFilterQuery;
  pinned: boolean;
}

export interface SmartFilterQuery {
  done?: boolean;
  priority?: Priority[];
  tags?: Id[];
  due?: "today" | "tomorrow" | "this_week" | "overdue" | "any";
  project?: Id;
  list?: Id;
}
