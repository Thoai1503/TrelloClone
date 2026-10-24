---
description: "Use when creating or changing Next.js routes, React components, providers, or styles. Covers App Router boundaries and the project's Atomic Design layers."
applyTo: "app/**/*.tsx"
---

# Frontend conventions

- Use the Next.js App Router structure already in `app/`. Keep route entry points small and delegate feature behavior to `app/features/`.
- Treat components as Server Components by default. Add `"use client"` only when a component needs state, effects, event handlers, or browser APIs.
- Keep database queries and Prisma imports on the server. Pass only serializable data to Client Components.
- Follow the component dependency direction: `atoms → molecules → organisms → templates`. A layer may import from itself or a lower layer, never from a higher layer.
- Keep shared serializable UI/data contracts in `app/types/`; do not import UI types from server-action modules.
- Keep each component focused on one presentation responsibility. Templates compose UI; they do not query databases or own server actions.
- Put reusable primitives in `app/components/atoms/`, small compositions in `molecules/`, complete sections in `organisms/`, and page layouts in `templates/`.
- Export component-layer public APIs through that layer's `index.ts` barrel. Do not create barrels for one-off feature internals without a reuse need.
- Keep data loading, user-facing feature state, and orchestration in `app/features/<feature>/`.
- Use Tailwind CSS, semantic HTML, accessible labels, and responsive layouts consistent with existing components.
- Keep user-visible copy in Vietnamese unless the feature already establishes another language.
- Show loading, empty, not-found, and error states distinctly. Log unexpected failures and provide a user-visible recovery path where appropriate.
- Do not invent navigation or actions for controls that are not implemented; make unavailable behavior explicit.
