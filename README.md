<p align="center">
  <a href="README.md">English</a> | <a href="README.ko.md">한국어</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh-TW.md">繁體中文</a>
</p>

# QtnLSP

Syntax highlighting and LSP-based IntelliSense for Photon Quantum3 DSL (`.qtn`) files.

Supports **VSCode**, **JetBrains Rider**, and **Visual Studio 2022**.

## Supported IDEs

| IDE | Version |
|-----|---------|
| VSCode | 1.50+ |
| JetBrains Rider | 2022.3+ |
| Visual Studio | 2022 (17.0+) |

## Installation

Download the latest build from [GitHub Releases](../../releases).

**VSCode**
```bash
code --install-extension qtn-syntax-highlighting-<version>.vsix
```

**JetBrains Rider**
Settings > Plugins > Install Plugin from Disk > select the `.zip` file.

**Visual Studio 2022**
Double-click the downloaded `.vsix` file to install.

## Build

[Docker](https://www.docker.com/) required. No other local toolchain needed.

```bash
sh build.sh all        # sync + test + build all plugins
sh build.sh vscode     # VSCode extension only
sh build.sh jetbrains  # JetBrains plugin only
```

## License

MIT
