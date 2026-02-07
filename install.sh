#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

RED='\033[0;31m'
GREEN='\033[0;32m'
NC='\033[0m'

log()   { echo -e "${GREEN}[install]${NC} $*"; }
error() { echo -e "${RED}[error]${NC} $*" >&2; }

usage() {
    cat <<EOF
Usage: $(basename "$0") <target>

Targets:
  vscode      Install VSCode extension (.vsix)
  jetbrains   Open JetBrains plugin install guide
  all         Install all available plugins

EOF
}

install_vscode() {
    VSIX=$(ls -t "$SCRIPT_DIR/vscode-extension/"*.vsix 2>/dev/null | head -1)

    if [ -z "$VSIX" ]; then
        error "No .vsix file found. Run ./build.sh vscode first."
        exit 1
    fi

    log "Installing VSCode extension: $(basename "$VSIX")"
    code --install-extension "$VSIX"
    log "Done. Reload VSCode or open a .qtn file to verify."
}

install_jetbrains() {
    ZIP=$(ls -t "$SCRIPT_DIR/jetbrains-plugin/build/distributions/"*.zip 2>/dev/null | head -1)

    if [ -z "$ZIP" ]; then
        error "No plugin .zip found. Run ./build.sh jetbrains first."
        echo ""
        echo "  JetBrains plugins cannot be installed from CLI."
        echo "  After building, install manually:"
        echo "    1. Rider > Settings > Plugins > Gear icon > Install Plugin from Disk..."
        echo "    2. Select the .zip file from jetbrains-plugin/build/distributions/"
        exit 1
    fi

    log "JetBrains plugin built at: $ZIP"
    echo ""
    echo "  JetBrains plugins must be installed via the IDE:"
    echo "    1. Open Rider (or IntelliJ IDEA)"
    echo "    2. Settings > Plugins > Gear icon > Install Plugin from Disk..."
    echo "    3. Select: $ZIP"
    echo "    4. Restart the IDE"
}

install_all() {
    install_vscode
    echo ""
    install_jetbrains
}

if [ $# -eq 0 ]; then
    usage
    exit 1
fi

case "$1" in
    vscode)     install_vscode ;;
    jetbrains)  install_jetbrains ;;
    all)        install_all ;;
    *)
        error "Unknown target: $1"
        usage
        exit 1
        ;;
esac
