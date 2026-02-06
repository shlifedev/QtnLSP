<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-06 | Updated: 2026-02-06 -->

# src

## Purpose
JetBrains 플러그인의 Kotlin 소스 코드와 리소스. TextMate 번들 등록과 LSP 서버 시작 로직을 포함한다.

## Subdirectories

| Directory | Purpose |
|-----------|---------|
| `main/kotlin/com/qtn/plugin/` | Kotlin 소스 — TextMate 번들 제공자, LSP 서버 제공자 |
| `main/resources/` | 플러그인 리소스 — 매니페스트, TextMate 번들 |

## For AI Agents

### Working In This Directory
- JDK 17 + Kotlin 1.9.x 환경 필요
- `main/kotlin/` — 플러그인 로직
- `main/resources/META-INF/` — 플러그인 매니페스트
- `main/resources/bundles/` — TextMate 번들 (shared/에서 복사)

<!-- MANUAL: -->
