<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-06 | Updated: 2026-02-06 -->

# tests

## Purpose
VSCode 확장의 TextMate 문법 테스트. 단위 테스트(unit/)와 스냅샷 테스트(snap/)로 구성되며, `vscode-tmgrammar-test` 도구로 실행된다.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `unit/` | 카테고리별 문법 단위 테스트 (7개 파일) |
| `snap/` | 스냅샷 테스트 — 전체 토큰화 결과 비교 |

## For AI Agents

### Working In This Directory
- 새 문법 규칙 추가 시 해당 카테고리의 `unit/*.qtn.test` 파일에 테스트 추가
- 단위 테스트: `cd vscode-extension && npm test`
- 스냅샷 테스트: `cd vscode-extension && npm run test:snap`
- 단위 테스트 형식: `// SYNTAX TEST "source.qtn"` 헤더 + `// ^^^ scope.name` 어서션 주석

### Common Patterns
- `// <-- comment.line.double-slash.qtn` — 전체 라인 스코프 검증
- `// ^^^^^^^ keyword.declaration.qtn` — 부분 범위 스코프 검증
- 스냅샷 파일(`.snap`)은 자동 생성됨 — 커밋 전 수동 검증 필요

## Dependencies

### Internal
- `../syntaxes/qtn.tmLanguage.json` — 테스트 대상 문법 파일

### External
- `vscode-tmgrammar-test` — 테스트 러너

<!-- MANUAL: -->
