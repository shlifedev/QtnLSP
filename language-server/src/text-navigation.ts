import { Position } from 'vscode-languageserver';
import { TextDocument } from 'vscode-languageserver-textdocument';

export interface IdentifierOptions {
  allowHashPrefix?: boolean;
}

export function getIdentifierAtPosition(
  document: TextDocument,
  position: Position,
  options: IdentifierOptions = {}
): string | null {
  const text = document.getText();
  const offset = document.offsetAt(position);

  let start = offset;
  while (start > 0 && isIdentifierChar(text[start - 1])) {
    start--;
  }

  if (options.allowHashPrefix && start > 0 && text[start - 1] === '#') {
    start--;
  }

  let end = offset;
  while (end < text.length && isIdentifierChar(text[end])) {
    end++;
  }

  if (start === end) {
    return null;
  }

  return text.substring(start, end);
}

export function isIdentifierChar(ch: string): boolean {
  return /[a-zA-Z0-9_]/.test(ch);
}
