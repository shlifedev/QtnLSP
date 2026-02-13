import { describe, it, expect } from 'vitest';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { MarkupKind, type HoverParams, type DefinitionParams } from 'vscode-languageserver';
import { ProjectModel } from '../project-model.js';
import { handleDefinition } from '../definition.js';
import { handleHover } from '../hover.js';

function createDocumentStore(uri: string, text: string) {
  const doc = TextDocument.create(uri, 'qtn', 1, text);
  return {
    doc,
    documents: {
      get(targetUri: string) {
        return targetUri === uri ? doc : undefined;
      },
    },
  };
}

describe('Word extraction in LSP handlers', () => {
  it('resolves definition for identifiers prefixed with @', () => {
    const uri = 'file:///test-at-definition.qtn';
    const text = `
struct @Player {
  int hp;
}

component Game {
  @Player actor;
}
`;

    const { doc, documents } = createDocumentStore(uri, text);
    const projectModel = new ProjectModel();
    projectModel.updateDocument(uri, text);

    const usageOffset = text.indexOf('@Player actor') + 2;
    const usagePos = doc.positionAt(usageOffset);

    const params: DefinitionParams = {
      textDocument: { uri },
      position: usagePos,
    };

    const definition = handleDefinition(params, projectModel, documents as never);
    expect(definition).not.toBeNull();
    expect(definition?.uri).toBe(uri);
    expect(definition?.range.start.line).toBe(1);
  });

  it('shows hover for user-defined identifiers prefixed with @', () => {
    const uri = 'file:///test-at-hover.qtn';
    const text = `
struct @Player {
  int hp;
}

component Game {
  @Player actor;
}
`;

    const { doc, documents } = createDocumentStore(uri, text);
    const projectModel = new ProjectModel();
    projectModel.updateDocument(uri, text);

    const usageOffset = text.indexOf('@Player actor') + 2;
    const usagePos = doc.positionAt(usageOffset);

    const params: HoverParams = {
      textDocument: { uri },
      position: usagePos,
    };

    const hover = handleHover(params, projectModel, documents as never);
    expect(hover).not.toBeNull();
    expect(hover?.contents).toMatchObject({
      kind: MarkupKind.Markdown,
    });

    const value = typeof hover?.contents === 'string'
      ? hover.contents
      : Array.isArray(hover?.contents)
        ? hover.contents.map(c => ('value' in c ? c.value : '')).join('\n')
        : hover?.contents.value;

    expect(value).toContain('Declared in');
  });
});
