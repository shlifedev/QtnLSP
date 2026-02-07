#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log()   { echo -e "${GREEN}[build]${NC} $*"; }
error() { echo -e "${RED}[error]${NC} $*" >&2; }

usage() {
    cat <<EOF
Usage: $(basename "$0") <command>

Commands:
  sync        Sync shared grammar to all plugin directories
  test        Run grammar unit tests
  vscode          Build VSCode extension (.vsix)
  vscode-install  Build + install VSCode extension
  jetbrains       Build JetBrains plugin (.zip)
  all             Sync + test + build all plugins
  clean           Remove build artifacts

EOF
}

if ! command -v docker &>/dev/null; then
    error "Docker is required. Install Docker and try again."
    exit 1
fi

dc() {
    docker compose -f "$SCRIPT_DIR/docker-compose.yml" "$@"
}

# Build image only if Dockerfile changed
ensure_image() {
    dc build builder
}

cmd_clean() {
    log "Cleaning build artifacts..."
    rm -rf "$SCRIPT_DIR/dist"
    rm -f "$SCRIPT_DIR/vscode-extension/"*.vsix
    rm -rf "$SCRIPT_DIR/vscode-extension/dist"
    rm -rf "$SCRIPT_DIR/vscode-extension/out"
    rm -rf "$SCRIPT_DIR/language-server/out"
    rm -rf "$SCRIPT_DIR/jetbrains-plugin/build"
    rm -rf "$SCRIPT_DIR/vs-extension/bin"
    rm -rf "$SCRIPT_DIR/vs-extension/obj"
    rm -rf "$SCRIPT_DIR/vs-extension/LanguageServer"
    log "Clean complete."
}

COMMAND="${1:-}"

if [ -z "$COMMAND" ]; then
    usage
    exit 1
fi

case "$COMMAND" in
    sync)
        ensure_image
        log "Syncing grammar..."
        dc run --rm sync
        log "Grammar synced."
        ;;
    test)
        ensure_image
        log "Running tests..."
        dc run --rm test
        log "All tests passed."
        ;;
    vscode)
        ensure_image
        log "Building VSCode extension..."
        dc run --rm vscode
        log "VSCode extension built -> dist/vscode/"
        ;;
    vscode-install)
        ensure_image
        log "Building VSCode extension..."
        dc run --rm vscode
        VSIX=$(ls -t "$SCRIPT_DIR/dist/vscode/"*.vsix 2>/dev/null | head -1)
        if [ -z "$VSIX" ]; then
            error "No .vsix file found in dist/vscode/"
            exit 1
        fi
        log "Installing: $VSIX"
        code --install-extension "$VSIX"
        log "Done. Reload VSCode or open a .qtn file to verify."
        ;;
    jetbrains)
        ensure_image
        log "Building JetBrains plugin..."
        dc run --rm jetbrains
        log "JetBrains plugin built -> dist/jetbrains/"
        ;;
    all)
        ensure_image
        log "Building all..."
        dc run --rm all
        log "All builds complete -> dist/"
        ;;
    clean)
        cmd_clean
        ;;
    -h|--help)
        usage
        ;;
    *)
        error "Unknown command: $COMMAND"
        usage
        exit 1
        ;;
esac
