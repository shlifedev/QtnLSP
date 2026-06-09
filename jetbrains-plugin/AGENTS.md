<!-- Parent: ../AGENTS.md -->
<!-- Generated: 2026-02-06 | Updated: 2026-02-06 -->

# jetbrains-plugin

## Purpose
JetBrains Rider용 QTN DSL 플러그인. TextMate Bundle을 통한 신텍스 하이라이팅과 LSP 클라이언트를 통한 IntelliSense를 제공한다. Rider 2024.3+의 플랫폼 LSP extension point를 직접 사용한다.

## Key Files

| File | Description |
|------|-------------|
| `build.gradle.kts` | Gradle 빌드 설정 — IntelliJ Platform Plugin 2.x, Rider 타겟, TextMate 번들 의존성 |
| `settings.gradle.kts` | Gradle 프로젝트 설정 |
| `gradle.properties` | 플러그인 버전, 플랫폼 버전, 빌드 범위 설정 |
| `META-INF/plugin.xml` | 플러그인 매니페스트 (루트 — Gradle에서 참조) |
| `src/main/kotlin/com/qtn/plugin/QtnTextMateBundleProvider.kt` | TextMate 번들 등록 — 플러그인 경로에서 tmbundle 로드 |
| `src/main/kotlin/com/qtn/plugin/QtnLspServerSupportProvider.kt` | LSP 서버 시작 — `node language-server/out/server.js --stdio` |
| `src/main/resources/META-INF/plugin.xml` | 메인 플러그인 매니페스트 — Rider/TextMate 의존성, TextMate + LSP 확장점 |
| `src/main/resources/bundles/qtn.tmbundle/` | TextMate 번들 (info.plist + Syntaxes/qtn.tmLanguage.json) |

## For AI Agents

### Working In This Directory
- **Kotlin 소스 수정 시 JDK 21 toolchain 필요** (Rider 2024.3+ 타깃)
- `build.sh jetbrains`는 Docker 빌더의 JDK 21 환경에서 실행
- `syntaxes/` 파일은 `shared/`에서 복사됨 — 직접 수정 금지 (`build.sh sync`)
- LSP 서버는 빌드 시 `../language-server/out/` + `../language-server/node_modules/`를 플러그인 sandbox에 복사
- `prepareSandbox` Gradle 태스크가 번들 + language-server를 플러그인 디렉토리에 배치

### Architecture
```
plugin.xml
  ├── TextMateBundleProvider → bundles/qtn.tmbundle/ (syntax highlighting)
  └── LspServerSupportProvider → node server.js --stdio
```

### Testing Requirements
- 빌드 테스트: `./gradlew buildPlugin` (JDK 21 toolchain)
- 로컬 테스트: `./gradlew runIde` (Rider 인스턴스 실행)
- language-server 변경 시 `cd ../language-server && npm run build` 선행 필요

### Common Patterns
- `ProjectWideLspServerDescriptor` 상속 — 프로젝트 범위 LSP 서버
- `TextMateBundleProvider` 구현 — 플러그인 경로 기반 번들 로딩
- Rider 전용 호환성 선언: `<depends>com.intellij.modules.rider</depends>`

## Dependencies

### Internal
- `shared/syntaxes/qtn.tmLanguage.json` — TextMate 문법 원본 (sync 대상)
- `language-server/` — LSP 서버 (out/ + node_modules/ 복사)

### External
- IntelliJ Platform SDK (Rider 2024.3+)
- `org.jetbrains.plugins.textmate` — TextMate 번들 지원 (bundled plugin)
- `com.intellij.platform.lsp.api` — Rider 2024.3+ 플랫폼 LSP API
- Kotlin 1.9.x, JDK 21, Gradle 8.x

<!-- MANUAL: -->
