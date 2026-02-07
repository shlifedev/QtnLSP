<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-06 | Updated: 2026-02-07 -->

# tests

## Purpose
공유 테스트 픽스처 디렉토리. 다양한 QTN DSL 구문 예제를 포함하며, 문법 테스트와 파서 테스트의 입력 데이터로 사용된다.

## Key Files

| File | Description |
|------|-------------|
| `fixtures/sample.qtn` | 종합 QTN 샘플 — component, struct, enum, flags, union, event, signal, input, global, import, pragma 등 전체 구문 커버 |
| `fixtures/types.qtn` | 타입 중심 테스트 — 기본 타입, Quantum 타입, 컬렉션, 제네릭, nullable |
| `fixtures/asset.qtn` | asset 선언 테스트 픽스처 |
| `fixtures/test.qtn` | 기본 컴포넌트, enum, 간단한 필드를 포함한 기초 QTN 구조 테스트 |
| `fixtures/advanced-attributes.qtn` | 어트리뷰트 종합 — Range, Tooltip, Header, DrawIf, RangeEx 등 모든 어트리뷰트 타입 검증 |
| `fixtures/collections_stress.qtn` | 컬렉션 스트레스 — list, dictionary, hash_set, array, bitset 및 중첩 제네릭 테스트 |
| `fixtures/combat_system.qtn` | 전투 시스템 — 복잡한 어트리뷰트 조합, 추상 이벤트 상속, 시그널 포인터 |
| `fixtures/complex-types.qtn` | 복합 타입 — 깊게 중첩된 제네릭, nullable 타입, struct 상속, 프로토타입 참조 |
| `fixtures/edge_cases.qtn` | 엣지 케이스 — 경계 조건, 빈 선언, 극단값, 비정상 구문 패턴, 주석 엣지 케이스 |
| `fixtures/events-signals-imports.qtn` | 이벤트/시그널/임포트 — 클라이언트/서버 이벤트, 추상 이벤트 계층, synced, 다양한 파라미터 시그널 |
| `fixtures/moba_game.qtn` | MOBA 게임 — 상호 참조 struct, 다중 singleton, 복잡 컬렉션, union, pragma 포함 완전한 게임 정의 |
| `fixtures/network_events.qtn` | 네트워크 이벤트 — 다중 레벨 이벤트 상속, 클라이언트/서버 이벤트, nothashed, 복합 시그널 |
| `fixtures/physics_world.qtn` | 물리 월드 — 물리 타입, nullable 벡터, Bounds, Matrix, Joint, Shape, Hit, bitset |

## For AI Agents

### Working In This Directory
- 새 QTN 구문이나 엣지 케이스를 추가할 때 이 디렉토리에 `.qtn` 파일 추가
- `fixtures/sample.qtn`은 vscode-extension 스냅샷 테스트에서도 참조됨
- 픽스처 파일은 실제 Quantum 프로젝트의 `.qtn` 파일을 모방
- 도메인별 픽스처(combat_system, moba_game, physics_world 등)는 실제 게임 프로젝트 구조를 반영

### Testing Requirements
- 픽스처 변경 후 문법 테스트 + 파서 테스트 모두 재실행

## Dependencies

### Internal
- `vscode-extension/tests/snap/` — 스냅샷 테스트에서 참조
- `language-server/src/__tests__/` — 파서 테스트에서 참조 가능

<!-- MANUAL: -->
