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

## Development, deployments and releases

Run `make help` for every command. The npm scripts still work; the Makefile wraps them so the
commands match the backend, app and firmware repositories.

```sh
make init          # npm ci
make dev           # Vite against the local backend (.env.development)
make dev:prod      # Vite against production (.env.production)
make verify        # format-check, lint, test, build
make deploy        # production build + firebase deploy --only hosting
```

`make deploy` requires an authenticated Firebase CLI with access to the configured project.

Cut a release from a clean `main` branch with:

```sh
make release                      # prompts for major/minor/patch/x.y.z
make release version=1.4.0        # a leading v and suffixes such as 1.4.0-rc.1 are accepted
```

`scripts/release.sh` runs `make verify`, updates `package.json` and `package-lock.json` with
`npm version` (which commits and tags `vX.Y.Z`), packages the production build as
`release/frontend-vX.Y.Z.tar.gz` with a `SHA256SUMS` file, pushes the commit and tag together, and
publishes a GitHub release with those files attached. It requires an authenticated `gh` CLI.
Deployment is intentionally a separate step: run `make deploy` afterwards.

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
