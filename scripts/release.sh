#!/usr/bin/env bash
# Bump the npm version, push its commit and tag, and publish a GitHub release.
set -euo pipefail

RELEASE_BRANCH="${RELEASE_BRANCH:-main}"

die() {
	echo "error: $*" >&2
	exit 1
}

command -v gh >/dev/null 2>&1 || die "gh CLI not found: https://cli.github.com"
gh auth status >/dev/null 2>&1 || die "gh not authenticated. Run: gh auth login"

branch="$(git rev-parse --abbrev-ref HEAD)"
[ "$branch" = "$RELEASE_BRANCH" ] ||
	die "releases must be cut from '$RELEASE_BRANCH' (you are on '$branch')"

git diff-index --quiet HEAD -- ||
	die "working tree is dirty; commit or stash changes first"

current="v$(node -p "require('./package.json').version")"
choice="${1:-${RELEASE_VERSION:-}}"
if [ -z "$choice" ]; then
	read -rp "Current version: $current
Bump type or version [major/minor/patch/x.y.z]: " choice
fi

case "$choice" in
	major | minor | patch)
		version="${current#v}"
		major="${version%%.*}"
		rest="${version#*.}"
		minor="${rest%%.*}"
		patch="${rest#*.}"
		patch="${patch%%-*}"
		case "$choice" in
			major) major=$((major + 1)); minor=0; patch=0 ;;
			minor) minor=$((minor + 1)); patch=0 ;;
			patch) patch=$((patch + 1)) ;;
		esac
		next="v${major}.${minor}.${patch}"
		;;
	*)
		next="v${choice#v}"
		[[ "$next" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]] ||
			die "invalid version '$choice' (expected major, minor, patch, or a semantic version)"
		;;
esac

git rev-parse "$next" >/dev/null 2>&1 && die "tag $next already exists"

read -rp "Release $next from $branch? [y/N]: " confirm
case "$confirm" in
	y | Y) ;;
	*) die "aborted" ;;
esac

echo "==> Verifying release"
npm run lint
npm test
npm run build

echo "==> Bumping version"
created="$(npm version "${next#v}")"
[ "$created" = "$next" ] || die "npm created unexpected version '$created'"

echo "==> Pushing $next"
git push --atomic origin "$branch" "$next"

echo "==> Creating GitHub release"
gh release create "$next" \
	--title "$next" \
	--target "$branch" \
	--generate-notes

echo "==> Done: $next published. Run 'npm run deploy' to deploy it."
