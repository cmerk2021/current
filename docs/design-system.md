# Design System

The Current design system is small on purpose. Three primitives compose
nearly every screen.

## Tokens

All design tokens are CSS custom properties in HSL, defined in
[`src/styles/globals.css`](../src/styles/globals.css). Tailwind reads them via
`hsl(var(--token))` in [`tailwind.config.js`](../tailwind.config.js).

### Color roles

| Token                   | Role                                  |
| ----------------------- | ------------------------------------- |
| `--background`          | Page background                       |
| `--foreground`          | Primary text                          |
| `--card`                | Surfaces (lists, dialogs, cards)      |
| `--popover`             | Floating surfaces (menus, popovers)   |
| `--muted`               | Secondary surfaces, subtle fills      |
| `--muted-foreground`    | Secondary text                        |
| `--border`              | Hairlines and dividers                |
| `--input`               | Form control borders                  |
| `--primary`             | The accent color (theme-able)         |
| `--ring`                | Focus rings                           |
| `--destructive`         | Errors and dangerous actions          |

### Themes

- Light and dark have independently tuned tokens, not algorithmic inversions.
- Theme is applied by toggling `class="dark"` on `<html>`.

### Accents

`data-accent="<name>"` on `<html>` swaps the `--primary` and `--ring` HSL
triples. Built-in accents: indigo, violet, blue, emerald, amber, rose, slate.

### Density

`data-density="<level>"` on `<html>` sets `--row-pad-y`, used by the `row-pad`
utility on task rows. Levels: compact, comfortable, spacious.

### Radius

`--radius: 0.6rem` drives Tailwind's `rounded-lg`, `rounded-md`, `rounded-sm`.

## Typography

- Font: **Inter** (variable), loaded via `<link rel="stylesheet">`.
- Headings: `tracking-tight`, weight 600.
- Body: 14 px (`text-sm`) is the default for in-app content.
- Numerics enable `cv11`, `ss01`, `ss03` for tabular numerics and stylistic
  fixes.

## Motion

- Default duration: **150 ms**.
- Easing: Framer Motion's default ease.
- Use `motion.div` with `layout` for task list reordering.
- Never animate layout properties that cause reflow on large lists. Prefer
  opacity/transform.

## Primitives

Wrapped Radix primitives live in `src/components/ui/`. The wrapper style is
shadcn/ui inspired but hand-rolled — no generator required.

| Component         | Built on                       |
| ----------------- | ------------------------------ |
| `Button`          | `class-variance-authority`, `Radix Slot` |
| `Input`, `Textarea`, `Label` | native HTML + Radix Label |
| `Checkbox`        | native input, custom indicator |
| `Dialog`          | `@radix-ui/react-dialog`       |
| `DropdownMenu`    | `@radix-ui/react-dropdown-menu`|
| `Popover`         | `@radix-ui/react-popover`      |
| `Tabs`            | `@radix-ui/react-tabs`         |
| `Switch`          | `@radix-ui/react-switch`       |
| `Card`            | tailwind only                  |
| `Badge`           | tailwind only                  |

## Composition rules

- Pages live in `src/pages/` and own their layout and data.
- Feature components (task list, quick-add) live in
  `src/components/<domain>/` and are framework-free of routing.
- Anything route- or store-aware does **not** belong in `src/components/ui/`.

## Accessibility

- All interactive components have visible focus states (`focus-ring`).
- Color is never the only signal — priority chips also carry text and an icon.
- Dialogs trap focus and restore it on close (Radix handles this).
- Keyboard shortcuts are documented in-app via the command palette.
