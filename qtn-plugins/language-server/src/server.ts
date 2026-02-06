// LSP Server Entry Point for QTN Language Server
// This file sets up the LSP connection, document sync, and LSP feature handlers.

import {
  createConnection,
  ProposedFeatures,
  TextDocuments,
  TextDocumentSyncKind,
  InitializeParams,
  InitializeResult,
  FileChangeType,
} from 'vscode-languageserver/node';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ProjectModel } from './project-model.js';
import { handleDefinition } from './definition.js';
import { handleCompletion } from './completion.js';
import { handleHover } from './hover.js';
import { handleDocumentSymbol, handleWorkspaceSymbol } from './symbols.js';
import { setLocale } from './locale.js';

// Create LSP connection using Node IPC
const connection = createConnection(ProposedFeatures.all);

// Create text document manager
const documents = new TextDocuments(TextDocument);

// Create project model to manage .qtn files and symbols
const projectModel = new ProjectModel();

// Initialize handler - declare server capabilities
connection.onInitialize((params: InitializeParams): InitializeResult => {
  // Read locale from initialization options
  const options = params.initializationOptions as { locale?: string } | undefined;
  if (options?.locale?.startsWith('ko')) {
    setLocale('ko');
  }

  return {
    capabilities: {
      // Incremental document sync - only send changes, not full text
      textDocumentSync: TextDocumentSyncKind.Incremental,

      // Code completion with trigger characters
      completionProvider: {
        triggerCharacters: ['.', '<', '[', '#'],
        resolveProvider: false,
      },

      // Go to definition
      definitionProvider: true,

      // Hover info
      hoverProvider: true,

      // Document symbols (outline)
      documentSymbolProvider: true,

      // Workspace-wide symbol search
      workspaceSymbolProvider: true,
    },
  };
});

// Document change handler - update project model when documents change
documents.onDidChangeContent((change) => {
  projectModel.updateDocument(change.document.uri, change.document.getText());
});

// Document close handler - remove document from project model
documents.onDidClose((event) => {
  projectModel.removeDocument(event.document.uri);
});

// Handle workspace file changes (external edits, file creation/deletion)
connection.onDidChangeWatchedFiles((params) => {
  for (const change of params.changes) {
    if (!change.uri.endsWith('.qtn')) continue;

    switch (change.type) {
      case FileChangeType.Deleted:
        projectModel.removeDocument(change.uri);
        break;
      case FileChangeType.Created:
      case FileChangeType.Changed:
        // For external changes, we rely on the document sync
        // The IDE will send didOpen/didChangeContent for open documents
        // For non-open files, we'd need to read them - skip for now
        break;
    }
  }
});

// ============================================================================
// LSP REQUEST HANDLERS (STUBS - will be implemented in Phase 3-6)
// ============================================================================

// T013-T014: Completion handler
// Provides: keywords, types, fields, built-ins
connection.onCompletion((params) => {
  return handleCompletion(params, projectModel, documents);
});

// T015-T016: Go to Definition handler
// Navigate to symbol definitions
connection.onDefinition((params) => {
  return handleDefinition(params, projectModel, documents);
});

// T017-T018: Hover handler
// Shows type info and documentation
connection.onHover((params) => {
  return handleHover(params, projectModel, documents);
});

// T019-T020: Document Symbols handler
// Provides outline/structure of current file
connection.onDocumentSymbol((params) => {
  return handleDocumentSymbol(params, projectModel);
});

// T019-T020: Workspace Symbols handler
// Provides project-wide symbol search
connection.onWorkspaceSymbol((params) => {
  return handleWorkspaceSymbol(params, projectModel);
});

// ============================================================================
// START SERVER
// ============================================================================

// Listen to document events
documents.listen(connection);

// Start listening for LSP requests
connection.listen();

// Export for testing and use by feature handlers
export { connection, documents, projectModel };
