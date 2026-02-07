// Hover handler for QTN Language Server
// Provides contextual documentation and type info when hovering over symbols

import { HoverParams, Hover, MarkupKind, Position } from 'vscode-languageserver';
import { TextDocuments } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';
import { ProjectModel } from './project-model.js';
import { BUILTIN_TYPE_MAP, KEYWORD_MAP, ATTRIBUTE_MAP, BuiltinTypeInfo, KeywordInfo, AttributeInfo, getDescription } from './builtins.js';
import { getLocale } from './locale.js';

/**
 * Handle "Hover" request.
 * Returns documentation for the symbol under the cursor.
 *
 * Lookup order:
 * 1. Keywords (component, struct, etc.)
 * 2. Built-in types (int, FP, list, etc.)
 * 3. Attributes (Header, Tooltip, etc.)
 * 4. User-defined types (from symbol table)
 *
 * @param params - LSP hover request parameters (contains position)
 * @param projectModel - Project model with symbol table
 * @param documents - Document manager
 * @returns Hover response with markdown documentation, or null if nothing found
 */
export function handleHover(
  params: HoverParams,
  projectModel: ProjectModel,
  documents: TextDocuments<TextDocument>
): Hover | null {
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

  // 1. Check if it's a keyword
  const keywordInfo = KEYWORD_MAP.get(word);
  if (keywordInfo) {
    return createKeywordHover(keywordInfo);
  }

  // 2. Check if it's a built-in type
  const builtinInfo = BUILTIN_TYPE_MAP.get(word);
  if (builtinInfo) {
    return createBuiltinTypeHover(builtinInfo);
  }

  // 3. Check if it's an attribute (may have '#' prefix)
  const attributeName = word.startsWith('#') ? word.substring(1) : word;
  const attributeInfo = ATTRIBUTE_MAP.get(attributeName);
  if (attributeInfo) {
    return createAttributeHover(attributeInfo);
  }

  // 4. Check if it's a user-defined symbol
  const symbolTable = projectModel.getSymbolTable();
  const symbolInfo = symbolTable.lookup(word);
  if (symbolInfo) {
    return createUserDefinedHover(symbolInfo);
  }

  // No match found
  return null;
}

/**
 * Create hover response for a keyword.
 * Format: **keyword** (category)
 *
 * Description
 */
function createKeywordHover(info: KeywordInfo): Hover {
  const markdown = `**${info.name}** (${info.category})\n\n${getDescription(info, getLocale())}`;

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: markdown
    }
  };
}

/**
 * Create hover response for a built-in type.
 *
 * Format for primitives:
 * **int** — `System.Int32` (4 bytes)
 *
 * Signed 32-bit integer
 *
 * Format for Quantum types:
 * **FPVector2** — `Photon.Deterministic.FPVector2`
 *
 * Quantum fixed-point 2D vector
 *
 * Format for collections:
 * **list** — `Quantum.QList<T>`
 *
 * Dynamic-length list (Quantum managed)
 */
function createBuiltinTypeHover(info: BuiltinTypeInfo): Hover {
  let markdown = `**${info.name}**`;

  // Add C# type mapping if available
  if (info.csharpType) {
    markdown += ` — \`${info.csharpType}\``;
  }

  // Add size for primitives
  if (info.size !== undefined) {
    const locale = getLocale();
    if (locale === 'ko') {
      markdown += ` (${info.size}바이트)`;
    } else {
      markdown += ` (${info.size} byte${info.size !== 1 ? 's' : ''})`;
    }
  }

  // Add description
  markdown += `\n\n${getDescription(info, getLocale())}`;

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: markdown
    }
  };
}

/**
 * Create hover response for an attribute.
 *
 * Format:
 * **Header** attribute
 *
 * Displays a header label in the Unity inspector
 *
 * Parameters: text
 */
function createAttributeHover(info: AttributeInfo): Hover {
  const locale = getLocale();
  const label = locale === 'ko' ? '어트리뷰트' : 'attribute';
  let markdown = `**${info.name}** ${label}\n\n${getDescription(info, locale)}`;

  // Add parameter list if available
  if (info.params && info.params.length > 0) {
    const paramLabel = locale === 'ko' ? '매개변수' : 'Parameters';
    markdown += `\n\n${paramLabel}: ${info.params.join(', ')}`;
  }

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: markdown
    }
  };
}

/**
 * Create hover response for a user-defined symbol.
 *
 * Format for types:
 * **component Player** (8 fields)
 *
 * Declared in `file:///project/player.qtn`
 *
 * Format for enum/flags:
 * **enum GameState** (5 members) : Byte
 *
 * Declared in `file:///project/state.qtn`
 */
function createUserDefinedHover(info: import('./symbol-table.js').SymbolInfo): Hover {
  let markdown = `**${info.detail}**`;

  // Add field/member count for container types
  const locale = getLocale();
  if (info.children && info.children.length > 0) {
    if (locale === 'ko') {
      const childType = info.children[0].kind === 13 /* EnumMember */ ? '멤버' : '필드';
      markdown += ` (${info.children.length}개 ${childType})`;
    } else {
      const childType = info.children[0].kind === 13 /* EnumMember */ ? 'member' : 'field';
      markdown += ` (${info.children.length} ${childType}${info.children.length !== 1 ? 's' : ''})`;
    }
  }

  // Add declaration location (skip for builtins)
  if (info.source === 'user' && info.location.uri !== 'builtin://') {
    // Extract filename from URI
    const filename = info.location.uri.split('/').pop() || info.location.uri;
    const declaredLabel = locale === 'ko' ? '선언 위치' : 'Declared in';
    markdown += `\n\n${declaredLabel}: \`${filename}\``;
  }

  return {
    contents: {
      kind: MarkupKind.Markdown,
      value: markdown
    }
  };
}

/**
 * Get the word at a given position in the document.
 * A word consists of alphanumeric characters and underscores [a-zA-Z0-9_].
 * Also handles '#' prefix for preprocessor keywords (#pragma, #define).
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

  // Check for '#' prefix (preprocessor directives)
  if (start > 0 && text[start - 1] === '#') {
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
