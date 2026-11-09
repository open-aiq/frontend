#!/usr/bin/env bash
# Build the hosted prototype into dist/prototype/, served at /prototype/:
#
#   dist/prototype/index.html  the page with the Web | Mobile switch
#   dist/prototype/web/        the dashboard in review mode (mock data, no sign-in)
#   dist/prototype/mobile/     the app's gallery, built for the web from ../app
#
# Run it after `npm run build`, which empties dist/.
set -euo pipefail

die() {
	echo "error: $*" >&2
	exit 1
}

cd "$(dirname "$0")/.."
APP_DIR="${APP_DIR:-../app}"
OUT=dist/prototype

[ -d dist ] || die "dist/ not found. Run 'npm run build' first."
[ -f "$APP_DIR/pubspec.yaml" ] ||
	die "The mobile app isn't at $APP_DIR. Clone open-aiq/app next to this repository, or set APP_DIR."
command -v flutter >/dev/null 2>&1 ||
	die "Flutter not found. The mobile half of the prototype needs it: https://docs.flutter.dev/get-started/install"

echo "==> Building the web prototype"
npx vite build --mode review --base=/prototype/web/ --outDir "$OUT/web" --emptyOutDir

echo "==> Building the mobile prototype"
make -C "$APP_DIR" gallery:web BASE_HREF=/prototype/mobile/ GALLERY_WEB_DIR=build/gallery_web
rm -rf "$OUT/mobile"
cp -R "$APP_DIR/build/gallery_web" "$OUT/mobile"

echo "==> Adding the switch page"
cp prototype/index.html "$OUT/index.html"
cp src/styles/tokens.css "$OUT/tokens.css"

echo "==> Prototype ready in $OUT"
