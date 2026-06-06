// Converts QTN parse/lex errors into LSP diagnostics.
// Kept pure (no LSP connection) so it can be unit-tested in isolation.

import { Diagnostic, DiagnosticSeverity } from 'vscode-languageserver';
import { QtnDocument, ParseError } from './ast.js';

export const DIAGNOSTIC_SOURCE = 'qtn';

/** Convert a single parse error into an LSP diagnostic. */
function toDiagnostic(error: ParseError): Diagnostic {
  return {
    severity: DiagnosticSeverity.Error,
    range: error.range,
    message: error.message,
    source: DIAGNOSTIC_SOURCE,
  };
}

/**
 * Build the diagnostic list for a parsed document. Returns an empty array
 * when there are no parse errors so callers can clear stale diagnostics.
 */
export function diagnosticsForDocument(doc: QtnDocument): Diagnostic[] {
  return doc.parseErrors.map(toDiagnostic);
}
