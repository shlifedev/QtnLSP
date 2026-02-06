// Project Model for QTN Language Server
// Manages multiple .qtn documents and a unified symbol table across the project.

import { Location } from 'vscode-languageserver';
import { QtnDocument } from './ast.js';
import { parse } from './parser.js';
import { SymbolTable, SymbolInfo } from './symbol-table.js';

/**
 * ProjectModel manages the state of all .qtn files in the project.
 * It maintains:
 * - A map of URI -> parsed QtnDocument
 * - A unified SymbolTable aggregating symbols from all documents
 *
 * When documents change, the symbol table is rebuilt from scratch to ensure consistency.
 */
export class ProjectModel {
  private documents: Map<string, QtnDocument>;
  private symbolTable: SymbolTable;
  private dirty: boolean;

  constructor() {
    this.documents = new Map();
    this.symbolTable = new SymbolTable();
    this.dirty = false;
    // Pre-populate with built-in types
    this.symbolTable.mergeBuiltins();
  }

  /**
   * Update a document: re-parse the text and mark symbol table as dirty.
   * The symbol table will be lazily rebuilt on next access.
   * @param uri - Document URI
   * @param text - Full document text
   */
  updateDocument(uri: string, text: string): void {
    // Parse the document
    const doc = parse(text, uri);

    // Store in documents map
    this.documents.set(uri, doc);

    // Mark symbol table as dirty for lazy rebuild
    this.dirty = true;
  }

  /**
   * Remove a document from the project model.
   * @param uri - Document URI to remove
   */
  removeDocument(uri: string): void {
    this.documents.delete(uri);

    // Mark symbol table as dirty for lazy rebuild
    this.dirty = true;
  }

  /**
   * Get a parsed document by URI.
   * @param uri - Document URI
   * @returns The parsed QtnDocument, or undefined if not found
   */
  getDocument(uri: string): QtnDocument | undefined {
    return this.documents.get(uri);
  }

  /**
   * Get all documents in the project.
   * @returns Map of URI -> QtnDocument
   */
  getAllDocuments(): Map<string, QtnDocument> {
    return this.documents;
  }

  /**
   * Get all symbols from the symbol table.
   * Rebuilds the symbol table if it's marked as dirty.
   * @returns Array of all SymbolInfo objects
   */
  getAllSymbols(): SymbolInfo[] {
    this.ensureSymbolTableFresh();

    const symbols: SymbolInfo[] = [];

    // Collect all type symbols
    for (const symbol of this.symbolTable.types.values()) {
      symbols.push(symbol);
    }

    // Collect all constant symbols
    for (const symbol of this.symbolTable.constants.values()) {
      symbols.push(symbol);
    }

    return symbols;
  }

  /**
   * Find the definition location of a symbol by name.
   * Rebuilds the symbol table if it's marked as dirty.
   * @param name - Symbol name to look up
   * @returns Location if found and user-defined, null otherwise
   */
  findDefinition(name: string): Location | null {
    this.ensureSymbolTableFresh();

    const symbol = this.symbolTable.lookup(name);

    // Only return user-defined symbols (not builtins or imports)
    if (symbol && symbol.source === 'user') {
      return symbol.location;
    }

    return null;
  }

  /**
   * Get the symbol table for direct access by handlers.
   * Rebuilds the symbol table if it's marked as dirty.
   * @returns The SymbolTable instance
   */
  getSymbolTable(): SymbolTable {
    this.ensureSymbolTableFresh();
    return this.symbolTable;
  }

  /**
   * Ensure the symbol table is fresh, rebuilding if necessary.
   * This is called by all methods that access the symbol table.
   */
  private ensureSymbolTableFresh(): void {
    if (this.dirty) {
      this.rebuildSymbolTable();
      this.dirty = false;
    }
  }

  /**
   * Rebuild the symbol table from all documents.
   * This creates a fresh symbol table, merges builtins, then adds symbols from each document.
   */
  private rebuildSymbolTable(): void {
    // Create new symbol table
    this.symbolTable = new SymbolTable();

    // Pre-populate with built-ins
    this.symbolTable.mergeBuiltins();

    // Add symbols from each document
    for (const doc of this.documents.values()) {
      this.symbolTable.addFromDocument(doc);
    }
  }
}
