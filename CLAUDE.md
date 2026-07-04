# Project Rules

AIQ frontend — React + Vite (JavaScript), styled with Tailwind CSS v4 and shadcn/ui.

## Read before implementing
- Available scripts → `package.json` (`dev`, `build`, `lint`, `preview`)
- Entry point → `src/main.jsx` mounts `src/App.jsx` into `index.html`
- Styling → Tailwind v4 via `@tailwindcss/vite`; global styles and theme tokens in `src/index.css`
- UI components → shadcn/ui in `src/components/ui/`; config in `components.json`
  - Add a component with `npx shadcn@latest add <name>` (do not hand-write them)
  - Import via the `@/` alias (e.g. `@/components/ui/button`, `@/lib/utils`)
- Structure → pages in `src/pages/`, feature components in `src/components/`
- Backend API → `src/lib/api.js` wraps the AIQ backend (device list/register/delete);
  base URL from `VITE_API_URL` (see `.env.example`)

## Behavioral rules (always apply)
- Do NOT run commands (dev, build, lint, etc.) unless asked.
  You may ask permission to run `npm run build` / `npm run lint` to verify a change.
- Do NOT commit or push unless explicitly asked.
- Do NOT create files unless necessary.
- Ask before making destructive changes.

## Code style
- Keep it simple; avoid over-engineering and premature abstractions.
- Lint with `oxlint` before considering a change done.
