<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-06 | Updated: 2026-02-07 -->

# language-server

## Purpose
QTN DSL을 위한 Language Server Protocol(LSP) 구현. 자동 완성, 정의 이동, hover 정보, 문서/워크스페이스 심볼, semantic tokens를 제공한다. VSCode, JetBrains, Visual Studio 세 IDE에서 공유하는 단일 서버.

## Key Files

| File | Description |
|------|-------------|
| `src/server.ts` | LSP 서버 진입점 — 연결 설정, capability 선언, 핸들러 등록 |
| `src/lexer.ts` | 토크나이저 — QTN 소스를 토큰 스트림으로 변환 (keyword, identifier, number, string, punctuation) |
| `src/parser.ts` | 재귀 하강 파서 — 토큰 스트림을 AST로 변환, panic-mode 에러 복구 |
| `src/ast.ts` | AST 노드 타입 정의 — TypeDefinition, EventDefinition, SignalDefinition 등 |
| `src/symbol-table.ts` | 심볼 테이블 — AST에서 심볼 추출, 빌트인 타입 병합(source: builtin/user/import), fuzzy search |
| `src/project-model.ts` | 프로젝트 모델 — 다중 .qtn 파일 관리, 통합 심볼 테이블, lazy rebuild |
| `src/completion.ts` | 자동 완성 핸들러 — 컨텍스트 감지(top-level, field, attribute, import 등) |
| `src/definition.ts` | 정의 이동 핸들러 — 커서 위치의 심볼 정의 위치 반환 |
| `src/hover.ts` | Hover 핸들러 — 키워드/빌트인/어트리뷰트/사용자 정의 타입의 문서 표시 |
| `src/symbols.ts` | 심볼 핸들러 — 문서 아웃라인(DocumentSymbol) + 워크스페이스 심볼 검색 |
| `src/semantic-tokens.ts` | Semantic Tokens — 사용자 정의 타입에만 토큰 발행 (빌트인 타입은 TextMate에 위임) |
| `src/builtins.ts` | 빌트인 정의 — 기본 타입(18), Quantum 타입(24), 컬렉션(9), 키워드, 어트리뷰트 |
| `src/locale.ts` | 다국어(한/영) 로케일 감지 및 전환 |
| `tsconfig.json` | TypeScript 설정 — ES2022, Node16 모듈, strict 모드 |
| `webpack.config.js` | Webpack 설정 — VSCode용 단일 파일 번들링 (dist/server.js) |
| `package.json` | 의존성 — vscode-languageserver 9.x, vitest |
| `EDGE_CASE_HARDENING.md` | 파서 엣지 케이스 강화 문서 |

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `src/__tests__/` | 파서 엣지 케이스 + semantic tokens 테스트 (vitest) |

## For AI Agents

### Working In This Directory
- LSP 기능 확장은 이 디렉토리에서만 수행 — 세 IDE에 자동 반영됨
- 빌드: `npm run build` (tsc)
- 새 LSP 기능 추가 시 `server.ts`에 핸들러 등록 필요
- 모든 타입/키워드는 `builtins.ts`에서 중앙 관리
- Semantic tokens는 사용자 정의 타입(enum, struct, component 등)에만 발행 — 빌트인 타입(`FP`, `byte` 등)은 TextMate 문법이 담당 (JetBrains 호환성)

### Architecture
```
[.qtn text] → lexer.ts(tokenize) → parser.ts(parse) → ast.ts(QtnDocument)
                                                            ↓
                                               project-model.ts(ProjectModel)
                                                            ↓
                                                   symbol-table.ts(SymbolTable)
                                                            ↓
                                  completion / definition / hover / symbols / semantic-tokens
```

### Testing Requirements
- `npm test` — vitest로 파서 + semantic tokens 테스트 실행
- 새 구문 추가 시 `src/__tests__/parser-edge-cases.test.ts`에 테스트 추가
- semantic token 변경 시 `src/__tests__/semantic-tokens.test.ts`에 테스트 추가

### Common Patterns
- **Incremental document sync**: 문서 변경 시 ProjectModel.updateDocument()로 재파싱 → 심볼 테이블 lazy rebuild
- **Panic-mode recovery**: 파서 에러 시 `}`, `;`, 또는 top-level 키워드까지 스킵
- **Builtin merge**: 심볼 테이블에 빌트인 타입을 먼저 추가(source: 'builtin'), 사용자 정의 타입이 우선
- **Semantic token 빌트인 스킵**: `symbol.source === 'builtin'`이면 semantic token 미발행 → TextMate 하이라이팅 보존

## Dependencies

### Internal
- `shared/syntaxes/qtn.tmLanguage.json` — TextMate 문법 (직접 의존은 없으나, 같은 DSL 정의 공유)

### External
- `vscode-languageserver` 9.x — LSP 프로토콜 구현
- `vscode-languageserver-textdocument` — 문서 모델
- `typescript` 5.x — 컴파일러
- `vitest` 1.x — 테스트 러너

<!-- MANUAL: -->
