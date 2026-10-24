## Project instructions

- Follow the architecture, code conventions, and validation commands in this file and the linked project instructions.
- Keep changes focused; inspect the existing implementation and related docs before changing behavior.
- Preserve the Server/Client Component boundary: database access belongs on the server, and client components receive serializable props or call server actions.
- Do not import Prisma or database credentials into client components.
- Report data-loading failures explicitly. Do not turn errors into empty success states.
- Keep UI components in the Atomic Design layer that matches their responsibility. Import only from the same or lower layers.
- Update the relevant architecture or AI-context documentation when a verified design decision or system behavior changes.
- Run the smallest relevant lint/type-check/build validation after changing code.

## Project structure

- `app/`: Next.js App Router routes, root layout, global styles, server actions, and providers.
- `app/components/atoms/`: single-purpose UI primitives.
- `app/components/molecules/`: small UI compositions built from atoms.
- `app/components/organisms/`: feature-level UI sections built from atoms and molecules.
- `app/components/templates/`: page layouts composed from organisms; keep data access out.
- `app/features/`: route-level feature orchestration, state, and data loading.
- `app/types/`: shared serializable application data contracts.
- `lib/`: server-side shared infrastructure, including the Prisma client.
- `prisma/`: Prisma schema and migrations.
- `generated/prisma/`: generated Prisma Client; never edit by hand.
- `.github/instructions/`: scoped Copilot instructions.
- `docs/architecture/`: verified architecture and data-model documentation.
- `docs/ai-context/`: verified project decisions, current state, and resolved issues.

See [docs/architecture/overview.md](./docs/architecture/overview.md), [docs/architecture/data-model.md](./docs/architecture/data-model.md), and [docs/ai-context/current-state.md](./docs/ai-context/current-state.md) for details.

## Required checks

- `npm run lint -- app` — lint the application.
- `npx tsc --noEmit` — type-check the application.
- `npm run build` — production build.
- `npx prisma validate` — validate Prisma schema changes.
- `npm run db:generate` — regenerate Prisma Client after changing the schema.

Read the installed Next.js guides under `node_modules/next/dist/docs/` when using unfamiliar Next.js APIs; this project uses Next.js 16 with Cache Components enabled.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
