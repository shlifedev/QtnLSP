<p align="center">
  <a href="README.md">English</a> | <a href="README.ko.md">한국어</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh-TW.md">繁體中文</a>
</p>

# QtnLSP

Photon Quantum3 DSL(`.qtn`)ファイル向けのシンタックスハイライトとLSPベースのIntelliSense。

**VSCode**、**JetBrains Rider**、**Visual Studio 2022**に対応しています。

## 対応IDE

| IDE | バージョン |
|-----|-----------|
| VSCode | 1.50+ |
| JetBrains Rider | 2022.3+ |
| Visual Studio | 2022 (17.0+) |

## インストール

[GitHub Releases](../../releases)から最新ビルドをダウンロードしてください。

**VSCode**
```bash
code --install-extension qtn-syntax-highlighting-<version>.vsix
```

**JetBrains Rider**
Settings > Plugins > Install Plugin from Disk > `.zip`ファイルを選択。

**Visual Studio 2022**
ダウンロードした`.vsix`ファイルをダブルクリックしてインストール。

## ビルド

[Docker](https://www.docker.com/)が必要です。その他のローカルツールチェーンは不要です。

```bash
sh build.sh all        # 同期 + テスト + 全プラグインビルド
sh build.sh vscode     # VSCode拡張のみ
sh build.sh jetbrains  # JetBrainsプラグインのみ
```

## ライセンス

MIT
