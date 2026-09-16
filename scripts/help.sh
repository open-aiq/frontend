#!/usr/bin/env bash
set -euo pipefail

cat <<'EOF'
Available commands:

  npm run dev                         Start the Vite development server
  npm run build                       Build the production frontend
  npm run lint                        Run Oxlint with warnings denied
  npm test                            Run the test suite
  npm run preview                     Preview the production build
  npm run deploy                      Build and deploy to Firebase Hosting
  npm run release                     Prompt for major, minor, patch, or an exact version
  npm run release -- 1.2.3            Release an exact semantic version
  npm run release -- 1.2.3-rc.1       Release a prerelease version

Release versions may optionally start with "v". Releases require a clean main branch.
EOF
