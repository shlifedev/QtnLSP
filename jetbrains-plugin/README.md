# Quantum DSL (QTN) Syntax Highlighting for JetBrains

Syntax highlighting for Photon Quantum3 DSL (`.qtn`) files in JetBrains Rider and IntelliJ IDEA.

## Overview

This plugin provides full syntax highlighting support for Quantum DSL files, enabling developers using JetBrains IDEs to write and read `.qtn` files with proper color-coded language constructs. The plugin is particularly useful for Rider users who work with Photon Quantum3 game development.

## Features

The plugin supports syntax highlighting for all QTN language constructs:

- **Declarations**: component, struct, event, signal, input, asset, global, enum, flags, union, singleton, abstract, import
- **Quantum Types**: FP, FPVector2, FPVector3, FPQuaternion, FPMatrix, FPBounds2, FPBounds3, EntityRef, PlayerRef, AssetRef, QString, QStringUtf8, LayerMask, Hit, Hit3D, Shape2D, Shape3D
- **Built-in Types**: bool, byte, sbyte, short, ushort, int, uint, long, ulong
- **Collection Types**: list, array, dictionary, hash_set, bitset
- **Keywords**: synced, local, remote, button, nothashed
- **Attributes**: [Header], [Tooltip], [Range], [RangeEx], [DrawIf], [HideInInspector], [Optional], and more
- **Comments**: Single-line (`//`) and multi-line (`/* */`)
- **Preprocessor Directives**: #pragma, #define
- **String and Number Literals**: Full support for string escaping and numeric formats
- **Nested Generic Types**: Proper highlighting for complex type declarations (e.g., `list<asset_ref<MyType>>`)

## Installation

### From JetBrains Marketplace

1. Open JetBrains Rider or IntelliJ IDEA
2. Go to **Settings/Preferences** → **Plugins** → **Marketplace**
3. Search for "Quantum DSL" or "QTN Syntax Highlighting"
4. Click **Install** and restart the IDE

### Manual Installation

1. Build the plugin (see Building from Source below)
2. Go to **Settings/Preferences** → **Plugins** → **Install Plugin from Disk**
3. Select the `.zip` file from `build/distributions/`
4. Restart the IDE

## Building from Source

### Prerequisites

- JDK 17 or later
- Gradle (included via gradlew)

### Build Steps

1. Clone or navigate to the plugin directory
2. Build the plugin:
   ```bash
   ./gradlew buildPlugin
   ```
   The built plugin will be available at `build/distributions/Quantum-DSL-***.zip`

3. To run the plugin in a test IDE instance:
   ```bash
   ./gradlew runIde
   ```
   This launches Rider with the plugin installed, allowing you to test syntax highlighting in real-time.

## Compatibility

- **Supported IDEs**: JetBrains Rider, IntelliJ IDEA
- **Minimum Version**: Rider 2022.3+ (build 223 and later)
- **IntelliJ IDEA**: 2022.3+ with compatible build number
- **TextMate Bundle**: Uses JetBrains TextMate plugin for grammar-based highlighting

## How It Works

The plugin leverages JetBrains' built-in TextMate grammar support. It registers a custom TextMate bundle (`qtn.tmbundle`) that defines syntax rules for `.qtn` files. When you open a `.qtn` file, the grammar is automatically applied, providing instant syntax highlighting without requiring a language server or complex semantic analysis.

## References

For detailed Quantum3 DSL documentation, visit:
- [Photon Quantum Documentation](https://doc.photonengine.com/en-us/quantum)
- [Photon Quantum DSL Reference](https://doc.photonengine.com/en-us/quantum/current/technical-samples/dsl)

## License

This plugin is distributed under the same license as the Quantum DSL project.

## Support

For issues, feature requests, or contributions, please refer to the project repository.
