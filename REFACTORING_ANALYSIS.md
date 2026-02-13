# 리팩토링 심층 분석 (QtnLSP)

## 분석 범위
- `language-server/src` 중심으로 구조/성능/유지보수 관점에서 우선순위가 높은 리팩토링 포인트를 점검했다.
- 특히 **중복 로직**, **점진적 성능 저하 가능성**, **모듈 책임 경계**, **타입 안정성**에 초점을 맞췄다.

---

## 1) 가장 먼저 손봐야 할 영역 (High Impact)

### 1-1. 심볼 변환 로직의 중복 (`symbol-table.ts` vs `symbols.ts`)
**문제**
- `SymbolInfo` 생성(상세 문자열, children 구성, kind 매핑)이 `SymbolTable`과 `DocumentSymbol` 생성 로직에 사실상 중복 구현돼 있다.
- 타입/이벤트/시그널/입력/글로벌에 대해 거의 동일한 분기 구조가 반복된다.

**근거 파일**
- `language-server/src/symbol-table.ts`: `processTypeDefinition`, `processEventDefinition`, `processSignalDefinition` 등에서 심볼 projection 수행.
- `language-server/src/symbols.ts`: `createDefinitionSymbol`에서 동일한 분기와 detail formatting 재구현.

**리스크**
- 새 DSL 문법 추가 시 한쪽만 업데이트되어 UX 불일치 발생 가능.
- detail 문자열 정책(예: enum base type 표기)이 점점 분기되어 회귀 버그 유발.

**리팩토링 제안**
- `symbol-projection.ts`(신규)로 추상화:
  - `toSymbolDescriptor(def: Definition): SymbolDescriptor`
  - `toDocumentSymbol(desc)` / `toSymbolInfo(desc, fileUri)`
- “AST → 중간 표현(SymbolDescriptor) → LSP 응답 타입” 파이프라인으로 통일.

---

### 1-2. 단어 추출 로직의 중복 (`definition.ts`, `hover.ts`)
**문제**
- `getWordAtPosition` + `isWordChar`가 `definition.ts`와 `hover.ts`에 중복.
- hover는 `#` prefix 처리까지 포함해 미세하게 diverge.

**근거 파일**
- `language-server/src/definition.ts`
- `language-server/src/hover.ts`

**리팩토링 제안**
- `text-navigation.ts` 유틸 도입:
  - `getIdentifierAtPosition(document, position, { allowHashPrefix?: boolean })`
- 이후 completion/definition/hover에서 공통 사용.

**기대효과**
- 단어 경계 규칙(유니코드 식별자 허용 여부 등)을 단일 지점에서 제어 가능.

---

### 1-3. Completion 컨텍스트 판별기의 규칙 누적 (`completion.ts`)
**문제**
- `detectContext`가 raw text 스캔 기반의 휴리스틱으로 확장 중.
- `hasUnmatchedOpenBracket`, `isInsideInputBlock`, `isFieldTypePosition` 등이 서로 독립적으로 동작해 오탐/누락 케이스가 늘어날 수 있다.

**근거 파일**
- `language-server/src/completion.ts`

**리팩토링 제안**
- 2단계화:
  1. **경량 토큰화 기반 문맥 추출기**(주석/문자열 제외 처리 통합)
  2. Completion provider는 “문맥 enum”만 해석
- 중장기적으로 parser AST 일부를 재활용한 컨텍스트 판별로 전환.

**추가 개선 포인트**
- `symbolKindToCompletionItemKind`의 매직 넘버(5, 23, 10...)를 `SymbolKind.*` 상수로 대체.

---

### 1-4. 프로젝트 단위 심볼 테이블 재빌드 전략 (`project-model.ts`)
**문제**
- 문서 하나 변경 시 전체 문서를 재순회하여 심볼 테이블을 rebuild.
- 문서 수 증가 시 completion/hover/workspace symbol 요청의 tail latency가 증가할 수 있다.

**근거 파일**
- `language-server/src/project-model.ts`

**리팩토링 제안**
- 문서 단위 인덱스 캐시 도입:
  - `Map<uri, DocumentSymbolSlice>` 유지
  - 변경된 uri만 재파싱 후 diff-apply
- 현재 lazy-rebuild 구조는 유지하되, rebuild 범위를 full → changed documents로 축소.

---

## 2) 구조 개선 (Mid Impact)

### 2-1. Parser 단일 파일 비대화 (`parser.ts`)
**문제**
- top-level dispatch + 각 definition 파서 + recovery 로직이 단일 클래스에 집중.
- 수정 시 회귀 범위 파악이 어려움.

**근거 파일**
- `language-server/src/parser.ts`

**리팩토링 제안**
- 모듈 분리:
  - `parser-core.ts` (token cursor / expect / recovery)
  - `parser-top-level.ts`
  - `parser-types.ts`, `parser-events.ts`, `parser-preprocessor.ts`
- 공통 에러 메시지 템플릿화(`parser-errors.ts`)로 일관성 확보.

---

### 2-2. 타입 안정성 약한 구간 (`symbol-table.ts`)
**문제**
- `formatTypeReference(typeRef: any)` 등 `any` 사용.
- AST 진화 시 컴파일타임 보호 장치 약화.

**근거 파일**
- `language-server/src/symbol-table.ts`

**리팩토링 제안**
- `any` 제거 후 `TypeReference` 직접 사용.
- Symbol detail formatter를 pure function으로 분리해 unit test 타겟화.

---

### 2-3. ESM import 스타일 일관성
**문제**
- 일부 파일은 `./x.js`, 일부는 `./x` import를 사용.
- 빌드 파이프라인/런타임 변경 시 해석 차이로 장애 가능.

**근거 파일**
- 예: `language-server/src/server.ts`는 `.js` 확장 사용, `language-server/src/symbol-table.ts`는 미사용.

**리팩토링 제안**
- 언어 서버 패키지 내 import 규칙 통일(ESM 기준 `.js` 권장).
- ESLint 규칙 또는 TS path lint로 강제.

---

## 3) 기능 정확도 관점 개선

### 3-1. Semantic Token에서 이벤트 상속 타입 range 미추적
**문제**
- 코드 주석상 `event parentName`은 AST에 range가 없어 토큰화 생략 중.

**근거 파일**
- `language-server/src/semantic-tokens.ts`

**리팩토링 제안**
- AST에 `parentNameRange` 추가 후 parser에서 채움.
- semantic token/definition/hover에서 상속 타입 참조를 동일하게 활용.

### 3-2. 진단/복구 파이프라인 표준화
**문제**
- `ProjectModel.updateDocument`에서 parser 예외를 빈 문서+오류로 치환하는 fallback은 안전하지만, 에러 코드/분류 체계가 없다.

**근거 파일**
- `language-server/src/project-model.ts`

**리팩토링 제안**
- `ParseError`에 `code`, `severity`, `recoverable` 필드 확장.
- LSP Diagnostic으로 매핑되는 중앙 변환기 도입.

---

## 4) 우선순위 기반 실행 로드맵

### Phase A (1~2일) — 중복 제거/안정성
1. `text-navigation.ts` 도입 후 definition/hover/completion 재사용.
2. `SymbolKind` 매직 넘버 제거.
3. `symbol-table.ts` 내 `any` 제거.

### Phase B (2~4일) — 아키텍처 정리
1. `symbol-projection.ts` 도입으로 symbol 관련 중복 제거.
2. `completion context analyzer`를 토큰 기반으로 분리.

### Phase C (4일+) — 성능/정확도
1. 문서 단위 symbol slice 캐시.
2. AST range 보강(`event.parentNameRange`) + semantic token 정확도 향상.

---

## 5) 체크리스트 (리팩토링 완료 정의)
- [ ] 동일 AST 입력에 대해 `DocumentSymbol`/`WorkspaceSymbol` detail 표기가 일치한다.
- [ ] hover/definition의 identifier 추출 규칙이 단일 함수 기반으로 일관된다.
- [ ] completion context 관련 회귀 테스트(주석/문자열/중첩 generic) 추가.
- [ ] 대형 fixture(수천 라인)에서 completion 응답시간이 기존 대비 악화되지 않는다.
- [ ] import 스타일 규칙이 lint로 강제된다.
