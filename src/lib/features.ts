import type { Complexity } from "@/lib/pb";

/**
 * Progressive Complexity tiers.
 * Every feature gates itself against the user's current complexity level.
 * Beginners see only the essentials. Advanced users unlock the full surface.
 */

export interface FeatureMatrix {
  /* Core */
  tasks: true;
  lists: true;
  today: true;
  search: true;

  /* Optional */
  dueDates: boolean;
  priorities: boolean;
  notes: boolean;
  tags: boolean;
  subtasks: boolean;
  recurring: boolean;
  attachments: boolean;

  /* Organization */
  projects: boolean;
  areas: boolean;
  smartFilters: boolean;

  /* Views */
  board: boolean;
  calendar: boolean;
  upcoming: boolean;

  /* Power */
  dashboard: boolean;
  widgets: boolean;
  commandPalette: boolean;
  customization: boolean;
}

const MATRIX: Record<Complexity, FeatureMatrix> = {
  simple: {
    tasks: true,
    lists: true,
    today: true,
    search: true,
    dueDates: true,
    priorities: false,
    notes: false,
    tags: false,
    subtasks: false,
    recurring: false,
    attachments: false,
    projects: false,
    areas: false,
    smartFilters: false,
    board: false,
    calendar: false,
    upcoming: true,
    dashboard: false,
    widgets: false,
    commandPalette: true,
    customization: true,
  },
  balanced: {
    tasks: true,
    lists: true,
    today: true,
    search: true,
    dueDates: true,
    priorities: true,
    notes: true,
    tags: true,
    subtasks: true,
    recurring: false,
    attachments: false,
    projects: true,
    areas: false,
    smartFilters: false,
    board: true,
    calendar: false,
    upcoming: true,
    dashboard: true,
    widgets: false,
    commandPalette: true,
    customization: true,
  },
  advanced: {
    tasks: true,
    lists: true,
    today: true,
    search: true,
    dueDates: true,
    priorities: true,
    notes: true,
    tags: true,
    subtasks: true,
    recurring: true,
    attachments: true,
    projects: true,
    areas: true,
    smartFilters: true,
    board: true,
    calendar: true,
    upcoming: true,
    dashboard: true,
    widgets: true,
    commandPalette: true,
    customization: true,
  },
};

export function featuresFor(level: Complexity): FeatureMatrix {
  return MATRIX[level];
}

export const COMPLEXITY_META: Record<
  Complexity,
  { title: string; tagline: string; description: string }
> = {
  simple: {
    title: "Simple",
    tagline: "Just the essentials.",
    description:
      "Tasks, lists, and a Today view. Nothing more. Perfect when you just need to remember what to do.",
  },
  balanced: {
    title: "Balanced",
    tagline: "Structure when you want it.",
    description:
      "Adds projects, priorities, tags, notes, subtasks, and a board view. A flexible system without the clutter.",
  },
  advanced: {
    title: "Advanced",
    tagline: "The full system.",
    description:
      "Everything balanced has, plus areas, recurring tasks, attachments, calendar, smart filters, dashboards, and widgets.",
  },
};
