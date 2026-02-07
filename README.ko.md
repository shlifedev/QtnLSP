<p align="center">
  <a href="README.md">English</a> | <a href="README.ko.md">한국어</a> | <a href="README.ja.md">日本語</a> | <a href="README.zh-TW.md">繁體中文</a>
</p>

# QtnLSP

Photon Quantum3 DSL(`.qtn`) 파일을 위한 구문 강조 및 LSP 기반 IntelliSense.

**VSCode**, **JetBrains Rider**, **Visual Studio 2022**를 지원합니다.

## 지원 IDE

| IDE | 버전 |
|-----|------|
| VSCode | 1.50+ |
| JetBrains Rider | 2022.3+ |
| Visual Studio | 2022 (17.0+) |

## 설치

[GitHub Releases](../../releases)에서 최신 빌드를 다운로드하세요.

**VSCode**
```bash
code --install-extension qtn-syntax-highlighting-<version>.vsix
```

**JetBrains Rider**
Settings > Plugins > Install Plugin from Disk > `.zip` 파일 선택.

**Visual Studio 2022**
다운로드한 `.vsix` 파일을 더블클릭하여 설치.

## 빌드

[Docker](https://www.docker.com/) 필요. 그 외 로컬 툴체인은 불필요합니다.

```bash
sh build.sh all        # 동기화 + 테스트 + 전체 빌드
sh build.sh vscode     # VSCode 확장만
sh build.sh jetbrains  # JetBrains 플러그인만
```

## 라이선스

MIT
