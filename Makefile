NPM ?= npm

# Release configuration.
RELEASE_BRANCH ?= main
RELEASE_DIR    ?= release

.PHONY: help init dev dev\:prod build preview lint\:check lint\:fix format\:fix format\:check test verify deploy clean release

## help: Show available commands
help:
	@echo "Available commands:"
	@echo ""
	@sed -n 's/^## //p' $(MAKEFILE_LIST) | awk '{ i = index($$0, ": "); if (i) printf "  %-20s %s\n", substr($$0, 1, i - 1), substr($$0, i + 2); else print "" }'

## init: Install the exact dependencies from package-lock.json
init:
	$(NPM) ci

## dev: Start the Vite dev server against the local backend (.env.development)
dev:
	$(NPM) run dev

## dev:prod: Start the Vite dev server against production (.env.production)
dev\:prod:
	$(NPM) run dev -- --mode production

## build: Build the production frontend into dist/
build:
	$(NPM) run build

## preview: Serve the production build locally
preview:
	$(NPM) run preview

## lint:check: Run Oxlint with warnings denied
lint\:check:
	$(NPM) run lint:check

## lint:fix: Apply Oxlint's automatic fixes
lint\:fix:
	$(NPM) run lint:fix

## format:fix: Format sources with Prettier
format\:fix:
	$(NPM) run format:fix

## format:check: Check formatting without changing files
format\:check:
	$(NPM) run format:check

## test: Run the Vitest suite
test:
	$(NPM) test

## verify: Run format:check, lint:check, test and build
verify:
	@$(MAKE) --no-print-directory format:check
	@$(MAKE) --no-print-directory lint:check
	@$(MAKE) --no-print-directory test
	@$(MAKE) --no-print-directory build

## deploy: Build and deploy the current checkout to Firebase Hosting
deploy:
	bash scripts/deploy.sh

## clean: Remove build and release output
clean:
	rm -rf dist/ $(RELEASE_DIR)/

##.
## release: Verify, bump, tag, and publish — make release [version=major|minor|patch|1.2.3|1.2.3-rc.1]
release:
	@RELEASE_BRANCH="$(RELEASE_BRANCH)" RELEASE_VERSION="$(version)" RELEASE_DIR="$(RELEASE_DIR)" \
		bash scripts/release.sh
