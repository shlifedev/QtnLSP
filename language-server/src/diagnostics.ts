// Diagnostics for QTN documents.
// 파싱 오류(Error) + 프로젝트 전역 중복 타입 이름(Error) + 미지 타입 참조(Warning)를 계산한다.

import {
  Diagnostic,
  DiagnosticSeverity,
  DiagnosticRelatedInformation,
} from 'vscode-languageserver';
import {
  Definition,
  EventDefinition,
  SignalDefinition,
  SourceRange,
  TypeDefinition,
  TypeReference,
} from './ast.js';
import { KEYWORDS } from './lexer.js';
import { ProjectModel } from './project-model.js';

// 이 컨테이너들의 제네릭 인자는 C# 쪽에 정의된 에셋/프로토타입 클래스를 가리키는 게
// 정상 패턴이라 (.qtn에 정의가 없어도 유효) 미지 타입 검사에서 제외한다.
const CSHARP_REF_CONTAINERS = new Set([
  'asset_ref',
  'entity_ref',
  'player_ref',
  'entity_prototype_ref',
  'component_prototype_ref',
  'AssetRef',
  'EntityRef',
  'PlayerRef',
]);

const DIAGNOSTIC_SOURCE = 'qtn';

// 이름이 심볼 네임스페이스를 차지하는 정의 — input/global은 프로젝트에 여러 개 와도 병합되므로 제외
type NamedDefinition = TypeDefinition | EventDefinition | SignalDefinition;

function isNamedDefinition(def: Definition): def is NamedDefinition {
  switch (def.kind) {
    case 'component':
    case 'struct':
    case 'enum':
    case 'flags':
    case 'union':
    case 'asset':
    case 'event':
    case 'signal':
      return true;
    default:
      return false;
  }
}

function nameRangeOf(def: NamedDefinition): SourceRange {
  return def.nameRange ?? def.range;
}

interface Occurrence {
  uri: string;
  def: NamedDefinition;
}

function collectNamedDefinitions(projectModel: ProjectModel): Map<string, Occurrence[]> {
  const byName = new Map<string, Occurrence[]>();
  for (const [uri, doc] of projectModel.getAllDocuments()) {
    for (const def of doc.definitions) {
      if (!isNamedDefinition(def)) continue;
      const list = byName.get(def.name);
      if (list) {
        list.push({ uri, def });
      } else {
        byName.set(def.name, [{ uri, def }]);
      }
    }
  }
  return byName;
}

// collectTypeReferences는 모든 제네릭 인자를 평탄화해 컨테이너 정보가 사라지므로,
// C# ref 컨테이너의 인자를 걸러내려면 최상위 typeRef부터 재귀를 직접 제어해야 한다.
function collectCheckableTypeRefs(def: Definition): TypeReference[] {
  const refs: TypeReference[] = [];

  function visit(typeRef: TypeReference): void {
    refs.push(typeRef);
    if (CSHARP_REF_CONTAINERS.has(typeRef.name)) {
      return; // 인자는 C# 쪽 타입 — 검사하지 않는다
    }
    for (const arg of typeRef.genericArgs) {
      if ('name' in arg) {
        visit(arg);
      }
    }
  }

  const topLevel: TypeReference[] = [];
  if (def.kind === 'signal') {
    for (const param of (def as SignalDefinition).parameters) {
      topLevel.push(param.typeRef);
    }
  } else {
    const withFields = def as { fields?: { typeRef: TypeReference }[] };
    for (const field of withFields.fields ?? []) {
      topLevel.push(field.typeRef);
    }
  }

  for (const typeRef of topLevel) {
    visit(typeRef);
  }

  return refs;
}

export function computeDiagnostics(uri: string, projectModel: ProjectModel): Diagnostic[] {
  const doc = projectModel.getDocument(uri);
  if (!doc) {
    return [];
  }

  const diagnostics: Diagnostic[] = [];

  // 1. 렉서/파서 오류 — 이미 LSP 호환 range를 갖고 있어 1:1 매핑
  for (const error of doc.parseErrors) {
    diagnostics.push({
      range: error.range,
      message: error.message,
      severity: DiagnosticSeverity.Error,
      source: DIAGNOSTIC_SOURCE,
    });
  }

  // 2. 중복 타입 이름 (프로젝트 전역) — 심볼 테이블은 충돌 시 덮어쓰므로 문서를 직접 순회
  const namedDefs = collectNamedDefinitions(projectModel);
  for (const def of doc.definitions) {
    if (!isNamedDefinition(def)) continue;

    const occurrences = namedDefs.get(def.name) ?? [];
    if (occurrences.length < 2) continue;

    const others = occurrences.filter((o) => !(o.uri === uri && o.def === def));
    const relatedInformation: DiagnosticRelatedInformation[] = others.map((o) => ({
      location: { uri: o.uri, range: nameRangeOf(o.def) },
      message: `'${def.name}' is also defined here`,
    }));

    diagnostics.push({
      range: nameRangeOf(def),
      message: `Duplicate definition of '${def.name}'`,
      severity: DiagnosticSeverity.Error,
      source: DIAGNOSTIC_SOURCE,
      relatedInformation,
    });
  }

  // 3. 미지 타입 참조 — QTN은 import로 C# 타입을 끌어오는 게 정상 패턴이라 Error가 아닌 Warning.
  //    점(.)이 포함된 이름(C# 한정 이름), keyword 타입, C# ref 컨테이너의 인자는 건너뛴다.
  const symbolTable = projectModel.getSymbolTable();
  for (const def of doc.definitions) {
    for (const typeRef of collectCheckableTypeRefs(def)) {
      if (typeRef.name.includes('.')) continue;
      if (KEYWORDS.has(typeRef.name)) continue;
      if (symbolTable.lookup(typeRef.name)) continue;

      diagnostics.push({
        range: typeRef.nameRange,
        message: `Unknown type '${typeRef.name}'`,
        severity: DiagnosticSeverity.Warning,
        source: DIAGNOSTIC_SOURCE,
      });
    }

    // 이벤트 상속의 부모 타입도 확인
    if (def.kind === 'event') {
      const eventDef = def as EventDefinition;
      if (
        eventDef.parentName &&
        eventDef.parentNameRange &&
        !eventDef.parentName.includes('.') &&
        !symbolTable.lookup(eventDef.parentName)
      ) {
        diagnostics.push({
          range: eventDef.parentNameRange,
          message: `Unknown event type '${eventDef.parentName}'`,
          severity: DiagnosticSeverity.Warning,
          source: DIAGNOSTIC_SOURCE,
        });
      }
    }
  }

  return diagnostics;
}
