<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

## Repository workflow

- Develop on `featdev1`. Never commit directly to `main`.
- Push development commits to `origin/featdev1`.
- Do not create a pull request unless the user explicitly requests one. If the user requests a pull request and merge, keep `featdev1` after merging.
- Do not force-push or delete `featdev1` without the user's explicit request.

## UI implementation

- Build interface elements by composing components generated from shadcn/ui. Use Tailwind utilities for layout and spacing and shadcn theme tokens for colors.
- Avoid bespoke component styling and custom CSS for page elements. Add new shadcn/ui components through the CLI when a needed primitive is missing.
- Treat the site as a utility: show search, data, and task controls immediately. Do not add marketing hero sections or promotional copy to the application UI.
