# Contributing

Thanks for your interest in Current! This is an open-source project. Issues
and pull requests are welcome.

## Ground rules

- **Progressive Complexity is non-negotiable.** New features must default to
  hidden for users on a lower complexity tier than the one they target. If
  your feature can't be gated, the design needs rethinking before code.
- **No placeholders.** Don't merge `TODO`, mocked data, or "coming soon"
  buttons. Ship a thin slice or don't ship it.
- **Keep it small.** Prefer a 100-line PR over a 1000-line one. Prefer a
  feature you can describe in one sentence over one you can't.

## Setup

```bash
git clone <your fork>
cd current
npm install
cp .env.example .env

# In a second terminal, run PocketBase v0.31.0 and import pb_schema.json

npm run dev
```

## Quality gates

Every PR must pass:

```bash
npm run typecheck   # tsc strict
npm run lint        # eslint
npm run build       # vite production build
```

CI runs all three on every push.

## Coding conventions

- TypeScript strict mode is on. No `any` unless justified in a comment.
- Use the path alias `@/` for `src/` imports.
- Server data → TanStack Query. Transient UI state → Zustand. Never mix them.
- Tailwind classes are sorted by `prettier-plugin-tailwindcss`. Don't fight
  the sorter.
- Components live in either `src/components/ui/` (generic) or
  `src/components/<domain>/` (feature). Pages live in `src/pages/`.

## Adding a feature

1. Decide which complexity tier(s) it belongs to and update
   [`src/lib/features.ts`](../src/lib/features.ts).
2. If you need new data, edit the PocketBase schema in the admin UI, then
   re-export and commit `pb_schema.json`.
3. Add TypeScript types to [`src/lib/pb.ts`](../src/lib/pb.ts) and any
   needed hooks to [`src/lib/queries.ts`](../src/lib/queries.ts).
4. Build the UI. Gate it behind `features.<yourFeature>`.
5. Update docs — at minimum `docs/current-platform-overview.md` §3.

## Reporting bugs

Include:

- Browser and OS
- PocketBase version
- Steps to reproduce
- What you expected vs what happened
- Screenshots or a short screen recording when relevant

## License

By contributing you agree your contributions will be licensed under the
[MIT License](../LICENSE).
