// computeDiagnostics 단위 테스트: 파싱 오류, 중복 타입 이름, 미지 타입 참조

import { describe, it, expect } from 'vitest';
import { DiagnosticSeverity } from 'vscode-languageserver';
import { ProjectModel } from '../project-model.js';
import { computeDiagnostics } from '../diagnostics.js';

const URI_A = 'test://a.qtn';
const URI_B = 'test://b.qtn';

function diagnose(source: string): ReturnType<typeof computeDiagnostics> {
  const projectModel = new ProjectModel();
  projectModel.updateDocument(URI_A, source);
  return computeDiagnostics(URI_A, projectModel);
}

describe('parse error diagnostics', () => {
  it('reports a syntax error with Error severity', () => {
    const diagnostics = diagnose('component Player {\n  FP Health\n');
    expect(diagnostics.length).toBeGreaterThan(0);
    expect(diagnostics.every((d) => d.source === 'qtn')).toBe(true);
    expect(diagnostics.some((d) => d.severity === DiagnosticSeverity.Error)).toBe(true);
  });

  it('reports an unterminated block comment', () => {
    const diagnostics = diagnose('component Player { FP Health; }\n/* never closed');
    expect(diagnostics.some((d) => d.message.includes('Unterminated block comment'))).toBe(true);
  });

  it('returns no diagnostics for a valid document', () => {
    const diagnostics = diagnose(`
enum WeaponType { Sword, Bow }

component Player {
  FP Health;
  WeaponType Weapon;
}

signal OnHit(EntityRef target);
`);
    expect(diagnostics).toEqual([]);
  });
});

describe('duplicate type name diagnostics', () => {
  it('flags duplicates within a single document', () => {
    const diagnostics = diagnose(`
component Player { FP Health; }
struct Player { FP Armor; }
`);
    const dups = diagnostics.filter((d) => d.message.includes("Duplicate definition of 'Player'"));
    expect(dups).toHaveLength(2);
    expect(dups.every((d) => d.severity === DiagnosticSeverity.Error)).toBe(true);
    // 정의 블록 전체가 아니라 이름 토큰만 가리킨다
    expect(dups[0].range.start.line).toBe(1);
    expect(dups[0].range.start.character).toBe(10);
    expect(dups[0].range.end.character).toBe(16);
    // 상대 위치가 relatedInformation으로 연결된다
    expect(dups[0].relatedInformation).toHaveLength(1);
  });

  it('flags duplicates across documents with cross-file related info', () => {
    const projectModel = new ProjectModel();
    projectModel.updateDocument(URI_A, 'component Player { FP Health; }');
    projectModel.updateDocument(URI_B, 'event Player { Int32 Damage; }');

    const diagnostics = computeDiagnostics(URI_A, projectModel);
    const dup = diagnostics.find((d) => d.message.includes('Duplicate definition'));
    expect(dup).toBeDefined();
    expect(dup!.relatedInformation?.[0].location.uri).toBe(URI_B);
  });

  it('does not flag multiple input/global blocks (merged by codegen)', () => {
    const diagnostics = diagnose(`
input { FPVector2 Move; }
input { button Jump; }
global { FP Timer; }
global { Int32 Round; }
`);
    expect(diagnostics.filter((d) => d.message.includes('Duplicate'))).toEqual([]);
  });
});

describe('unknown type reference diagnostics', () => {
  it('warns on a field type that is neither builtin, user-defined, nor imported', () => {
    const diagnostics = diagnose('component Player { Missing Health; }');
    const unknown = diagnostics.find((d) => d.message === "Unknown type 'Missing'");
    expect(unknown).toBeDefined();
    expect(unknown!.severity).toBe(DiagnosticSeverity.Warning);
    expect(unknown!.range.start.character).toBe(19);
  });

  it('does not warn for builtin, user-defined, or imported types', () => {
    const diagnostics = diagnose(`
import struct ExternalThing(16);

struct Inner { FP Value; }

component Player {
  FP Health;
  Inner Nested;
  ExternalThing External;
  list<Inner> Children;
}
`);
    expect(diagnostics).toEqual([]);
  });

  it('warns on unknown types nested in generic args', () => {
    const diagnostics = diagnose('component Player { list<Missing> Items; }');
    expect(diagnostics.some((d) => d.message === "Unknown type 'Missing'")).toBe(true);
  });

  it('skips dotted names (C#-qualified types)', () => {
    const diagnostics = diagnose('component Player { My.Namespace.Thing Value; }');
    expect(diagnostics.filter((d) => d.message.startsWith('Unknown type'))).toEqual([]);
  });

  it('skips C#-side types referenced via ref containers', () => {
    // asset_ref/entity_ref 등의 인자는 C#에 정의된 에셋/프로토타입 클래스 — 정상 패턴
    const diagnostics = diagnose(`
component Player {
  asset_ref<WeaponData> Weapon;
  entity_ref<PassiveEffect> Passive;
  entity_prototype_ref<EnemyUnit> Prototype;
  component_prototype_ref<WeaponStats> Stats;
  dictionary<Int32, list<asset_ref<ItemData>>> Catalog;
}
`);
    expect(diagnostics).toEqual([]);
  });

  it('still checks args of regular collections', () => {
    const diagnostics = diagnose('component Player { dictionary<Int32, Missing> Items; }');
    expect(diagnostics.some((d) => d.message === "Unknown type 'Missing'")).toBe(true);
  });

  it('does not warn for newly added Quantum builtin types', () => {
    const diagnostics = diagnose(`
component Player {
  Transform2D Transform;
  CharacterController3D Controller;
  ColorRGBA Color;
  RNGSession Rng;
  AssetGuid Guid;
}
`);
    expect(diagnostics).toEqual([]);
  });

  it('warns on an unknown event parent', () => {
    const diagnostics = diagnose('event Derived : MissingBase { Int32 Data; }');
    expect(diagnostics.some((d) => d.message === "Unknown event type 'MissingBase'")).toBe(true);
  });

  it('resolves event parents defined in another file', () => {
    const projectModel = new ProjectModel();
    projectModel.updateDocument(URI_A, 'abstract event BaseEvent { Int32 Common; }');
    projectModel.updateDocument(URI_B, 'event Derived : BaseEvent { FP Extra; }');

    expect(computeDiagnostics(URI_B, projectModel)).toEqual([]);
  });
});
