<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-06 | Updated: 2026-02-06 -->

# shared

## Purpose
양쪽 IDE(VSCode, JetBrains)에서 공유하는 TextMate 문법 파일의 **단일 소스(Single Source of Truth)**. 이 디렉토리의 문법 파일이 수정되면 `build.sh sync`로 각 플러그인 디렉토리에 복사된다.

## Key Files

| File | Description |
|------|-------------|
| `syntaxes/qtn.tmLanguage.json` | QTN TextMate Grammar — 모든 키워드, 타입, 리터럴, 주석, 어트리뷰트에 대한 정규식 패턴과 스코프 매핑 |

## For AI Agents

### Working In This Directory
- **이 디렉토리가 문법 수정의 유일한 장소** — 절대로 `vscode-extension/syntaxes/`나 `jetbrains-plugin/.../Syntaxes/`를 직접 수정하지 않는다
- 수정 후 반드시 `build.sh sync` 실행하여 양쪽 IDE에 복사
- 스코프 매핑 규칙은 프로젝트 루트의 `CLAUDE.md` 참조

### Testing Requirements
- 문법 변경 후: `cd vscode-extension && npm test` (단위 테스트)
- 스냅샷 갱신: `cd vscode-extension && npm run test:snap`

### Common Patterns
- TextMate Grammar JSON 형식 (`patterns`, `repository`, `begin`/`end` 쌍)
- `scopeName: "source.qtn"` — 최상위 스코프

## Dependencies

### Internal
- `vscode-extension/syntaxes/` — sync 대상
- `jetbrains-plugin/src/main/resources/bundles/qtn.tmbundle/Syntaxes/` — sync 대상

<!-- MANUAL: -->
