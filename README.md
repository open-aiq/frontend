# Open AIQ web dashboard

> **Documentation:** See the [unified Open AIQ documentation](https://docs.air-iq.net/) for
> dashboard usage, device guides, architecture, and API conventions. This README remains the source
> of truth for frontend setup.

## Clerk authentication

Set `VITE_CLERK_PUBLISHABLE_KEY` and `VITE_API_URL` in the appropriate Vite environment file (see
`.env.example`). In the Clerk Dashboard, enable Google, GitHub, and email/password sign-in; require
email verification; enable password reset; and register the production frontend origins and redirect
URLs. The matching origins must also be present in the backend's `CLERK_AUTHORIZED_PARTIES`.

## Public map

The public landing page and community map use MapLibre GL JS with OpenFreeMap's keyless public
Liberty style. No map account or API key is required. Set the optional `VITE_MAP_STYLE_URL` only
when overriding the basemap with another MapLibre-compatible style.
OpenFreeMap/OpenMapTiles/OpenStreetMap attribution is provided by the style and rendered by
MapLibre.

Public routes live at `/`, `/map`, and `/devices/:id`; the Clerk-protected dashboard lives below
`/app`. Firebase Hosting rewrites all routes to the Vite entrypoint.

## Look and feel

The dashboard follows the same Sand & Sage style as the docs site and the mobile app (see
`AGENTS.md` in the workspace root). Colors, shadows, radii, motion and AQI bands come from the
shared design tokens in `docs/src/data/tokens.json`. Change them there and run `make tokens:sync` in
`docs/`, which rewrites `src/styles/tokens.css` and `src/lib/aqi-bands.g.js`. Don't edit those files
by hand.

The docs site's visual playground page is the spec for the monitor card (`MonitorCard.jsx`), the
view inside a monitor (`readings.jsx`) and the shared states (`states.jsx`). In `make review`, the
**Playground** link shows the dashboard's versions so you can compare them. Use the
`surface-raised`, `surface-lift` and `surface-glow` utilities from `src/index.css` instead of
hard-coded colors.

Signed-in pages share one top bar, `AppShell.jsx`, to match the app's `AiqAppBar`. It shows a back
link or the wind mark, the title, an optional status chip and the avatar menu (`AccountMenu.jsx`).
The theme, account, links and sign out all live in that menu, so keep the bar itself that simple.
The visual playground page describes the full shell.

## Development, deployments and releases

Run `make help` for every command. The npm scripts still work; the Makefile wraps them so the
commands match the backend, app and firmware repositories.

```sh
make init          # npm ci
make review        # the real app with mock data, for visual review
make verify        # format-check, lint, test, build
make prototype:build  # the web and mobile prototype into dist/prototype/
make deploy        # production build + prototype + firebase deploy --only hosting
```

There's no live dev server against a backend. The production Clerk key only works on the production
domain, so everything beyond visual review is tested live after a deploy.

`make review` runs the real pages and components with mock data. Under `--mode review`, Vite swaps
`@/lib/api` and `@clerk/react` for the stand-ins in `src/review/`, so you don't need a backend or
sign-in. A small panel in the corner switches between scenarios: mixed data, no devices, all
offline, no readings yet, server error, always loading and signed out. It also links to every page.
Production builds never include `src/review/`.

We also host review mode at [`/prototype/`](https://open-airiq.web.app/prototype/), next to the
mobile app's gallery, so anyone can try both without signing in. One switch at the top flips between
Web and Mobile, and the **Screen** dropdown beside it opens a page on the active one: dashboard
pages on Web, and the app's real screens on mock data on Mobile (the app reads `?screen=<key>`). The
URL hash keeps your place, so you can link to `#web`, `#mobile`, or a screen such as `#web/account`
or `#mobile/account`. `make prototype:build` builds it: review mode with the `/prototype/web/` base
path, plus `make gallery:web` from the app repository, which needs Flutter and the app checked out
at `../app` (or set `APP_DIR`). `make deploy` runs it for you. The switch page itself is
`prototype/index.html`. For plain `<a href>` links to our own pages, use `appPath()` from
`src/lib/paths.js` so they keep working under that base path.

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
