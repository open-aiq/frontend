#!/usr/bin/env bash
# Build and deploy the frontend, plus the prototype at /prototype/, to Firebase Hosting.
set -euo pipefail

die() {
	echo "error: $*" >&2
	exit 1
}

command -v firebase >/dev/null 2>&1 ||
	die "Firebase CLI not found. Install it with: npm install --global firebase-tools"

echo "==> Building production frontend"
npm run build

echo "==> Building the prototype (served at /prototype/)"
bash scripts/build-prototype.sh

echo "==> Deploying to Firebase Hosting"
firebase deploy --only hosting
