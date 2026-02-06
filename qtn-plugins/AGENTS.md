<!-- Generated: 2026-02-06 | Updated: 2026-02-06 -->

# qtn-plugins

## Purpose
Photon Quantum3 DSL(`.qtn`) 파일을 위한 IDE 플러그인 모노레포. TextMate Grammar 기반의 정적 신텍스 하이라이팅과 LSP 기반 IntelliSense(자동 완성, 정의 이동, hover, 심볼)를 VSCode 확장과 JetBrains Rider 플러그인으로 제공한다.

## Key Files

| File | Description |
|------|-------------|
| `build.sh` | 통합 빌드 스크립트 (sync, test, vscode, jetbrains, all, clean) |
| `install.sh` | 빌드된 플러그인 설치 스크립트 (VSCode: CLI, JetBrains: 가이드) |
| `package.json` | 워크스페이스 루트 — webpack 빌드 스크립트, client/server 컴파일 |
| `.gitignore` | node_modules, dist, out, build, .vsix 등 제외 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `shared/` | TextMate 문법 파일 단일 소스 (see `shared/AGENTS.md`) |
| `language-server/` | QTN Language Server — LSP 구현 (see `language-server/AGENTS.md`) |
| `vscode-extension/` | VSCode 확장 — LSP 클라이언트 + 문법 + 테스트 (see `vscode-extension/AGENTS.md`) |
| `jetbrains-plugin/` | JetBrains Rider 플러그인 — TextMate + LSP (see `jetbrains-plugin/AGENTS.md`) |
| `tests/` | 공유 테스트 픽스처 (see `tests/AGENTS.md`) |

## For AI Agents

### Working In This Directory
- **문법 파일은 반드시 `shared/syntaxes/qtn.tmLanguage.json`만 편집** — 편집 후 `build.sh sync` 또는 `npm run sync-grammar`(vscode-extension/)으로 동기화
- `package.json`의 스크립트는 client(vscode-extension)와 server(language-server)를 함께 컴파일/번들링
- DSL 문법 레퍼런스는 루트의 `DSL.md` 참고

### Testing Requirements
- 문법 테스트: `cd vscode-extension && npm test` (vscode-tmgrammar-test)
- 스냅샷 테스트: `cd vscode-extension && npm run test:snap`
- Language Server 테스트: `cd language-server && npm test` (vitest)
- JetBrains 빌드: `cd jetbrains-plugin && ./gradlew buildPlugin` (JDK 17 필요)
- 전체 빌드: `./build.sh all`

### Common Patterns
- **Single Source of Truth**: 문법(shared/) → 양쪽 IDE로 복사, LSP(language-server/) → 양쪽 IDE에서 공유
- Webpack으로 VSCode용 번들링, JetBrains는 out/ + node_modules/ 통째 복사
- TextMate 스코프 매핑은 `CLAUDE.md` 참조

## Dependencies

### External
- TypeScript 5.x, Node.js 18+
- `vscode-languageserver` / `vscode-languageclient` 9.x — LSP 구현
- `vscode-tmgrammar-test` — 문법 단위/스냅샷 테스트
- `@vscode/vsce` — VSCode 확장 패키징
- Kotlin 1.9.x, JDK 17, Gradle IntelliJ Platform Plugin 2.x — JetBrains 플러그인
- Webpack 5.x — 번들링

<!-- MANUAL: -->
