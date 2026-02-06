#!/usr/bin/env bash
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SHARED_GRAMMAR="$SCRIPT_DIR/shared/syntaxes/qtn.tmLanguage.json"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

log()   { echo -e "${GREEN}[build]${NC} $*"; }
warn()  { echo -e "${YELLOW}[warn]${NC} $*"; }
error() { echo -e "${RED}[error]${NC} $*" >&2; }

usage() {
    cat <<EOF
Usage: $(basename "$0") <command>

Commands:
  sync        Sync shared grammar to all plugin directories
  test        Run grammar unit tests (VSCode extension)
  vscode      Build VSCode extension (.vsix)
  vscode-install  Build + install VSCode extension
  jetbrains   Build JetBrains plugin (.zip)
  vs          Build Visual Studio 2022 extension (.vsix)
  vs-install  Build + install Visual Studio extension
  all         Sync + test + build all plugins
  clean       Remove build artifacts

EOF
}

# Sync shared grammar to both IDE plugin directories
cmd_sync() {
    log "Syncing grammar from shared/ to plugins..."
    cp "$SHARED_GRAMMAR" "$SCRIPT_DIR/vscode-extension/syntaxes/qtn.tmLanguage.json"
    cp "$SHARED_GRAMMAR" "$SCRIPT_DIR/jetbrains-plugin/src/main/resources/bundles/qtn.tmbundle/Syntaxes/qtn.tmLanguage.json"
    cp "$SHARED_GRAMMAR" "$SCRIPT_DIR/vs-extension/Grammars/qtn.tmLanguage.json"
    log "Grammar synced."
}

# Run vscode-tmgrammar-test unit tests
cmd_test() {
    log "Running grammar unit tests..."
    cd "$SCRIPT_DIR/vscode-extension"

    if [ ! -d node_modules ]; then
        log "Installing dependencies..."
        npm install
    fi

    npm test
    log "All tests passed."
}

# Build VSCode extension (.vsix)
cmd_vscode() {
    log "Building VSCode extension..."

    # Install root workspace dependencies (webpack)
    cd "$SCRIPT_DIR"
    if [ ! -d node_modules ]; then
        log "Installing root workspace dependencies (webpack)..."
        npm install
    fi

    # Install client dependencies
    cd "$SCRIPT_DIR/vscode-extension"
    if [ ! -d node_modules ]; then
        log "Installing VSCode extension dependencies..."
        npm install
    fi

    # Install server dependencies
    cd "$SCRIPT_DIR/language-server"
    if [ ! -d node_modules ]; then
        log "Installing language server dependencies..."
        npm install
    fi

    # Build (vscode:prepublish hook runs compile + webpack automatically)
    cd "$SCRIPT_DIR/vscode-extension"
    npx vsce package --no-dependencies

    VSIX=$(ls -t *.vsix 2>/dev/null | head -1)
    if [ -n "$VSIX" ]; then
        log "VSCode extension built: vscode-extension/$VSIX"
    else
        error "Failed to build .vsix package"
        exit 1
    fi
}

# Detect JDK 17 for Gradle (Kotlin 1.9.x doesn't support Java 20+)
detect_jdk17() {
    # 1. Check /usr/libexec/java_home (macOS)
    if command -v /usr/libexec/java_home &>/dev/null; then
        local jdk17
        jdk17=$(/usr/libexec/java_home -v 17 2>/dev/null) && { echo "$jdk17"; return 0; }
    fi
    # 2. Check Homebrew
    local brew_jdk="/opt/homebrew/opt/openjdk@17/libexec/openjdk.jdk/Contents/Home"
    if [ -d "$brew_jdk" ]; then
        echo "$brew_jdk"; return 0
    fi
    return 1
}

# Build JetBrains plugin (.zip)
cmd_jetbrains() {
    log "Building JetBrains plugin..."

    # Build language server (shared with VSCode)
    cd "$SCRIPT_DIR/language-server"
    if [ ! -d node_modules ]; then
        log "Installing language server dependencies..."
        npm install
    fi
    log "Compiling language server..."
    npm run build

    cd "$SCRIPT_DIR/jetbrains-plugin"

    if ! command -v java &>/dev/null; then
        error "JDK is required. Install JDK 17 and try again."
        exit 1
    fi

    # Gradle 8.x + Kotlin 1.9.x requires JDK 17–21 to run
    local java_major
    java_major=$(java -version 2>&1 | head -1 | sed -E 's/.*"([0-9]+).*/\1/')
    if [ "$java_major" -gt 21 ] 2>/dev/null; then
        local jdk17_home
        if jdk17_home=$(detect_jdk17); then
            log "System Java $java_major detected; switching to JDK 17 at $jdk17_home"
            export JAVA_HOME="$jdk17_home"
        else
            error "Java $java_major is too new for Gradle Kotlin DSL. Install JDK 17: brew install openjdk@17"
            exit 1
        fi
    fi

    if [ ! -f gradlew ]; then
        warn "Gradle wrapper not found. Run 'gradle wrapper' first or install Gradle."
        error "Cannot build without gradlew. See jetbrains-plugin/README.md for setup."
        exit 1
    fi

    ./gradlew buildPlugin

    ZIP=$(ls -t build/distributions/*.zip 2>/dev/null | head -1)
    if [ -n "$ZIP" ]; then
        log "JetBrains plugin built: jetbrains-plugin/$ZIP"
    else
        error "Failed to build .zip package"
        exit 1
    fi
}

# Build Visual Studio 2022 extension (.vsix)
cmd_vs() {
    log "Building Visual Studio 2022 extension..."

    # Build language server (shared)
    cd "$SCRIPT_DIR/language-server"
    if [ ! -d node_modules ]; then
        log "Installing language server dependencies..."
        npm install
    fi
    log "Compiling language server..."
    npm run build

    # Copy language server output to VS extension
    log "Copying language server to VS extension..."
    rm -rf "$SCRIPT_DIR/vs-extension/LanguageServer"
    mkdir -p "$SCRIPT_DIR/vs-extension/LanguageServer"
    cp -r "$SCRIPT_DIR/language-server/out/"* "$SCRIPT_DIR/vs-extension/LanguageServer/"
    cp -r "$SCRIPT_DIR/language-server/node_modules" "$SCRIPT_DIR/vs-extension/LanguageServer/"

    # Build VSIX
    cd "$SCRIPT_DIR/vs-extension"

    if ! command -v dotnet &>/dev/null; then
        error ".NET SDK is required. Install .NET SDK 6.0+ and try again."
        error "Download from https://dotnet.microsoft.com/download"
        exit 1
    fi

    log "Building VSIX with dotnet..."
    dotnet build -c Release

    VSIX=$(find "$SCRIPT_DIR/vs-extension" -name "*.vsix" -type f 2>/dev/null | head -1)
    if [ -n "$VSIX" ]; then
        log "Visual Studio extension built: $VSIX"
    else
        log "Visual Studio extension built (VSIX in bin/Release output)."
    fi
}

# Build + install Visual Studio extension
cmd_vs_install() {
    cmd_sync
    cmd_vs

    cd "$SCRIPT_DIR/vs-extension"
    VSIX=$(find . -name "*.vsix" -type f 2>/dev/null | head -1)

    if [ -z "$VSIX" ]; then
        error "No .vsix file found for Visual Studio extension."
        exit 1
    fi

    log "To install in Visual Studio 2022:"
    log "  1. Open Visual Studio"
    log "  2. Extensions → Manage Extensions"
    log "  3. Drag and drop: $VSIX"
    log "  Or double-click the .vsix file."
}

# Build + install VSCode extension
cmd_vscode_install() {
    cmd_sync
    cmd_vscode

    cd "$SCRIPT_DIR/vscode-extension"
    VSIX=$(ls -t *.vsix 2>/dev/null | head -1)

    if [ -z "$VSIX" ]; then
        error "No .vsix file found."
        exit 1
    fi

    log "Installing VSCode extension: $VSIX"
    code --install-extension "$VSIX"
    log "Done. Reload VSCode or open a .qtn file to verify."
}

# Build everything
cmd_all() {
    cmd_sync
    cmd_test
    cmd_vscode
    cmd_jetbrains
    cmd_vs
    log "All builds complete."
}

# Clean build artifacts
cmd_clean() {
    log "Cleaning build artifacts..."
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

# Main
if [ $# -eq 0 ]; then
    usage
    exit 1
fi

case "$1" in
    sync)       cmd_sync ;;
    test)       cmd_test ;;
    vscode)     cmd_vscode ;;
    vscode-install) cmd_vscode_install ;;
    jetbrains)  cmd_jetbrains ;;
    vs)         cmd_vs ;;
    vs-install) cmd_vs_install ;;
    all)        cmd_all ;;
    clean)      cmd_clean ;;
    *)
        error "Unknown command: $1"
        usage
        exit 1
        ;;
esac
