# React + Vite

> **Documentation:** See the [unified Open AIQ documentation](https://docs.air-iq.net/) for
> dashboard usage, device guides, architecture, and API conventions. This README remains the source
> of truth for frontend setup.

## Clerk authentication

Set `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL` in the appropriate Vite environment file (see
`.env.example`). In the Clerk Dashboard, enable Google, GitHub, and email/password sign-in; require
email verification; enable password reset; and register the exact development and production
frontend origins and redirect URLs. The matching origins must also be present in the backend's
`CLERK_AUTHORIZED_PARTIES`.

## Public map

The public landing page and community map use MapLibre GL JS with OpenFreeMap's keyless public
Liberty style. No map account or API key is required. Set the optional `VITE_MAP_STYLE_URL` only
when overriding the basemap with another MapLibre-compatible style.
OpenFreeMap/OpenMapTiles/OpenStreetMap attribution is provided by the style and rendered by
MapLibre.

Public routes live at `/`, `/map`, and `/devices/:id`; the Clerk-protected dashboard lives below
`/app`. Firebase Hosting rewrites all routes to the Vite entrypoint.

This template provides a minimal setup to get React working in Vite with HMR and some Oxlint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react)
  uses [Oxc](https://oxc.rs)
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc)
  uses [SWC](https://swc.rs/)

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build
performances. To add it, see
[this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the Oxlint configuration

If you are developing a production application, we recommend using TypeScript with type-aware lint
rules enabled. Check out the
[TS template](https://github.com/vitejs/vite/tree/main/packages/create-vite/template-react-ts) for
information on how to integrate TypeScript and Oxlint's TypeScript related rules in your project.
