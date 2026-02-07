<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-06 | Updated: 2026-02-06 -->

# vscode-extension

## Purpose
VSCode용 QTN DSL 확장. TextMate Grammar 기반 신텍스 하이라이팅과 Language Server Client를 통한 IntelliSense를 제공한다. `.qtn` 파일 연결, 괄호 매칭, 주석 토글, 코드 접기를 지원한다.

## Key Files

| File | Description |
|------|-------------|
| `src/extension.ts` | 확장 진입점 — LanguageClient 생성 및 시작 (stdio transport) |
| `package.json` | 확장 매니페스트 — 언어 등록(qtn), 문법, 빌드/테스트 스크립트, 의존성 |
| `language-configuration.json` | 괄호 매칭, 주석 토글(`//`, `/* */`), auto-close, 접기 규칙 |
| `syntaxes/qtn.tmLanguage.json` | TextMate 문법 (shared/에서 복사됨 — 직접 수정 금지) |
| `tsconfig.json` | TypeScript 설정 |
| `webpack.config.js` | 확장 번들링 설정 (dist/extension.js) |
| `.vscodeignore` | 패키징 제외 파일 목록 |
| `README.md` | 확장 설명 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `tests/unit/` | vscode-tmgrammar-test 단위 테스트 (7개 테스트 파일) |
| `tests/snap/` | 스냅샷 테스트 (sample.qtn → sample.qtn.snap) |

## For AI Agents

### Working In This Directory
- **`syntaxes/qtn.tmLanguage.json`을 직접 수정하지 않는다** — `shared/`에서 편집 후 `npm run sync-grammar` 실행
- LSP 클라이언트는 `dist/server.js`(language-server의 webpack 번들)에 연결
- 문법 동기화: `npm run sync-grammar` (= `cp ../shared/syntaxes/qtn.tmLanguage.json syntaxes/`)
- 패키징: `npx vsce package --no-dependencies` (vscode:prepublish가 컴파일+웹팩 자동 실행)

### Testing Requirements
- 단위 테스트: `npm test` — vscode-tmgrammar-test로 `tests/unit/*.test` 파일 검증
- 스냅샷 테스트: `npm run test:snap` — `tests/snap/*.qtn` 파일의 토큰화 결과 검증
- 새 문법 규칙 추가 시 해당 카테고리의 단위 테스트 파일에 테스트 추가

### Common Patterns
- 단위 테스트 파일은 `// SYNTAX TEST "source.qtn"` 헤더로 시작
- 테스트 어서션은 `// ^^^^^ scope.name` 형식의 주석
- 확장은 `onLanguage:qtn` 이벤트로 활성화

## Dependencies

### Internal
- `shared/syntaxes/qtn.tmLanguage.json` — 문법 원본 (sync-grammar으로 복사)
- `language-server/` — Webpack으로 번들링되어 `dist/server.js`에 포함

### External
- `vscode-languageclient` 9.x — LSP 클라이언트
- `@vscode/vsce` 3.x — 확장 패키징 도구
- `vscode-tmgrammar-test` — 문법 테스트 프레임워크
- VSCode 1.50+ — 최소 지원 버전

<!-- MANUAL: -->
