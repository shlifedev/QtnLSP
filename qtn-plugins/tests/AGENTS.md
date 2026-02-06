<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-06 | Updated: 2026-02-06 -->

# tests

## Purpose
공유 테스트 픽스처 디렉토리. 다양한 QTN DSL 구문 예제를 포함하며, 문법 테스트와 파서 테스트의 입력 데이터로 사용된다.

## Key Files

| File | Description |
|------|-------------|
| `fixtures/sample.qtn` | 종합 QTN 샘플 — component, struct, enum, flags, union, event, signal, input, global, import, pragma 등 전체 구문 커버 |
| `fixtures/types.qtn` | 타입 중심 테스트 — 기본 타입, Quantum 타입, 컬렉션, 제네릭, nullable |
| `fixtures/asset.qtn` | asset 선언 테스트 픽스처 |

## For AI Agents

### Working In This Directory
- 새 QTN 구문이나 엣지 케이스를 추가할 때 이 디렉토리에 `.qtn` 파일 추가
- `fixtures/sample.qtn`은 vscode-extension 스냅샷 테스트에서도 참조됨
- 픽스처 파일은 실제 Quantum 프로젝트의 `.qtn` 파일을 모방

### Testing Requirements
- 픽스처 변경 후 문법 테스트 + 파서 테스트 모두 재실행

## Dependencies

### Internal
- `vscode-extension/tests/snap/` — 스냅샷 테스트에서 참조
- `language-server/src/__tests__/` — 파서 테스트에서 참조 가능

<!-- MANUAL: -->
