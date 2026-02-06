// Go to Definition handler for QTN Language Server
// Resolves symbol at cursor position to its definition location

import { DefinitionParams, Location, Position } from 'vscode-languageserver';
import { TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ProjectModel } from './project-model.js';

/**
 * Handle "Go to Definition" request.
 * Returns the location of the symbol definition if found.
 *
 * @param params - LSP definition request parameters (contains position)
 * @param projectModel - Project model with symbol table
 * @param documents - Document manager
 * @returns Location of definition, or null if not found or builtin
 */
export function handleDefinition(
  params: DefinitionParams,
  projectModel: ProjectModel,
  documents: TextDocuments<TextDocument>
): Location | null {
  // Get the document at the requested URI
  const document = documents.get(params.textDocument.uri);
  if (!document) {
    return null;
  }

  // Extract the word at the cursor position
  const word = getWordAtPosition(document, params.position);
  if (!word) {
    return null;
  }

  // Look up the symbol in the project model
  // Returns null for builtins or undefined symbols
  return projectModel.findDefinition(word);
}

/**
 * Get the word at a given position in the document.
 * A word consists of alphanumeric characters and underscores [a-zA-Z0-9_].
 *
 * @param document - The text document
 * @param position - The cursor position
 * @returns The word at the position, or null if no word found
 */
function getWordAtPosition(document: TextDocument, position: Position): string | null {
  const text = document.getText();
  const offset = document.offsetAt(position);

  // Find word start (scan backwards from cursor)
  let start = offset;
  while (start > 0 && isWordChar(text[start - 1])) {
    start--;
  }

  // Find word end (scan forwards from cursor)
  let end = offset;
  while (end < text.length && isWordChar(text[end])) {
    end++;
  }

  // No word found at cursor
  if (start === end) {
    return null;
  }

  // Extract and return the word
  return text.substring(start, end);
}

/**
 * Check if a character is a valid word character.
 * Word characters: [a-zA-Z0-9_]
 *
 * @param ch - Character to check
 * @returns true if ch is a word character
 */
function isWordChar(ch: string): boolean {
  return /[a-zA-Z0-9_]/.test(ch);
}
