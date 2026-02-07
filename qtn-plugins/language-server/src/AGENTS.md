<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-06 | Updated: 2026-02-07 -->

# src

## Purpose
QTN Language Server의 핵심 소스 코드. 렉서 → 파서 → AST → 심볼 테이블 파이프라인과 LSP 기능 핸들러(completion, definition, hover, symbols, semantic-tokens)를 구현한다.

## Key Files

| File | Description |
|------|-------------|
| `server.ts` | LSP 서버 진입점 — createConnection, TextDocuments 관리, capability 선언, 핸들러 등록 |
| `lexer.ts` | 토크나이저 — 문자 스트림을 QtnToken(keyword/identifier/number/string/punctuation)으로 변환 |
| `parser.ts` | 재귀 하강 파서 — 토큰 스트림을 QtnDocument(AST)로 변환, panic-mode 에러 복구 |
| `ast.ts` | AST 노드 타입 정의 — Position, SourceRange, TypeReference, Attribute, 모든 Definition 타입 |
| `symbol-table.ts` | 심볼 테이블 — QtnDocument에서 SymbolInfo 추출, 빌트인 병합(source: builtin/user/import), fuzzy search |
| `project-model.ts` | 프로젝트 모델 — 다중 문서 관리, 통합 심볼 테이블 lazy rebuild |
| `completion.ts` | 자동 완성 — 컨텍스트 감지(topLevel/fieldType/attribute/inputBlock/import/enumBase/generic) |
| `definition.ts` | 정의 이동 — 커서 위치 단어 추출 → ProjectModel.findDefinition() |
| `hover.ts` | Hover — 키워드 → 빌트인 → 어트리뷰트 → 사용자 정의 순서로 문서 조회 |
| `symbols.ts` | 심볼 핸들러 — DocumentSymbol(계층적 아웃라인) + WorkspaceSymbol(퍼지 검색) |
| `semantic-tokens.ts` | Semantic Tokens — 사용자 정의 타입(enum/struct/component 등)에만 토큰 발행, 빌트인은 TextMate에 위임 |
| `builtins.ts` | 빌트인 데이터 — PRIMITIVE_TYPES(18), QUANTUM_TYPES(24), COLLECTION_TYPES(9), 키워드, 어트리뷰트 |
| `locale.ts` | 다국어(한/영) 로케일 감지 — LANG/LC_ALL 환경변수 기반 전환 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `__tests__/` | 파서 엣지 케이스 + semantic tokens 테스트 (vitest) |

## For AI Agents

### Working In This Directory
- **새 LSP 기능 추가 순서**: 1) ast.ts에 노드 타입 추가 → 2) parser.ts에 파싱 로직 → 3) 핸들러 파일(completion/definition/hover/symbols/semantic-tokens) 구현 → 4) server.ts에 핸들러 등록
- 빌트인 타입/키워드 추가는 `builtins.ts`에서만 수정
- 모든 파일은 `.js` 확장자로 상호 import (TypeScript ESM + Node16 모듈)
- Semantic tokens는 `symbol.source === 'builtin'`인 타입은 스킵 — TextMate가 빌트인 하이라이팅 담당 (JetBrains 호환성)

### Common Patterns
- `handleXxx(params, projectModel, documents)` — 표준 LSP 핸들러 시그니처
- `ProjectModel.getSymbolTable()` — lazy rebuild 보장된 심볼 테이블 접근
- `getWordAtPosition(document, position)` — 커서 위치 단어 추출 유틸리티 (definition.ts, hover.ts)
- `nodeKindToSymbolKind()` — AST NodeKind → LSP SymbolKind 변환
- `symbol.source` — `'builtin'` | `'user'` | `'import'` 구분으로 semantic token 발행 여부 결정

## Dependencies

### Internal
- 모든 파일이 `ast.ts`의 타입 정의에 의존
- `builtins.ts`는 completion, hover, symbol-table에서 참조
- `project-model.ts`는 `parser.ts`, `symbol-table.ts`에 의존
- `semantic-tokens.ts`는 `project-model.ts`, `symbol-table.ts`, `ast.ts`에 의존

### External
- `vscode-languageserver` — Connection, TextDocuments, LSP 타입
- `vscode-languageserver-textdocument` — TextDocument

<!-- MANUAL: -->
