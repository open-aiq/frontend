#!/usr/bin/env bash
#
# check-version-registry.sh — refuse releases that are not in the Open AIQ
# version registry.
#
# usage: scripts/check-version-registry.sh <component> <version>
#   component: backend | frontend | app | firmware
#   version:   the version being released, e.g. 0.4.1 or v0.5.0-rc.1
#
# The registry is open-aiq/docs src/data/versions.json, published at
# https://docs.air-iq.net/versions.json. A version is allowed only when its
# major.minor is listed for <component> in one of the registry's release lines.
# Patch releases inside a registered line need no registry change; a new major
# or minor version must be added to the registry (and deployed) first. If the
# registry cannot be fetched the release is refused as well.
#
# This file is shared by the backend, frontend, app, and device repositories;
# keep the copies identical.
#
set -euo pipefail

REGISTRY_URL="${VERSION_REGISTRY_URL:-https://docs.air-iq.net/versions.json}"
REGISTRY_SOURCE="https://github.com/open-aiq/docs/edit/main/src/data/versions.json"

[ $# -eq 2 ] || { echo "usage: $0 <component> <version>" >&2; exit 2; }
component="$1"
version="${2#v}"
core="${version%%[-+]*}"
[[ "$core" =~ ^[0-9]+\.[0-9]+\.[0-9]+$ ]] || { echo "error: '$2' is not a semantic version" >&2; exit 2; }
minor="${core%.*}"

refuse() {
	{
		echo
		echo "error: release blocked by the Open AIQ version registry."
		echo "       $1"
		echo
		echo "Every major or minor version must be registered before it is released:"
		echo "  1. Add \"$component\": \"$minor\" to a new or existing line in"
		echo "     $REGISTRY_SOURCE"
		echo "  2. Merge the change and wait for the docs site to deploy"
		echo "     ($REGISTRY_URL)."
		echo "  3. Run the release again."
		echo "Patch releases ($minor.x) need no change once $minor is registered."
		echo
	} >&2
	exit 1
}

command -v curl >/dev/null 2>&1 || refuse "curl is required to check the registry."
command -v python3 >/dev/null 2>&1 || refuse "python3 is required to read the registry."

registry="$(curl -fsSL --max-time 20 "$REGISTRY_URL" 2>/dev/null)" ||
	refuse "Could not fetch the registry from $REGISTRY_URL."

line="$(printf '%s' "$registry" | python3 -c '
import json, sys
component, minor = sys.argv[1], sys.argv[2]
try:
    registry = json.load(sys.stdin)
except ValueError:
    sys.exit(3)
for entry in registry.get("lines", []):
    if entry.get("components", {}).get(component) == minor:
        print(entry.get("line", "?"))
        sys.exit(0)
sys.exit(1)
' "$component" "$minor")" && status=0 || status=$?

case "$status" in
	0) echo "==> Version registry: $component $version belongs to release line $line" ;;
	3) refuse "The registry at $REGISTRY_URL is not valid JSON." ;;
	*) refuse "$component $minor is not registered (releasing $version)." ;;
esac
