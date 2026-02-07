// QTN Lexer - Token stream generator for QTN parser
import { Position, SourceRange } from './ast.js';

// Token types
export enum TokenType {
  keyword = 'keyword',
  identifier = 'identifier',
  number = 'number',
  string = 'string',
  punctuation = 'punctuation',
  comment = 'comment',
  eof = 'eof',
  unknown = 'unknown',
}

// Token with type, value, and source range
export interface QtnToken {
  type: TokenType;
  value: string;
  range: SourceRange;
}

// Keyword mapping (from reference Lexer.cs)
const KEYWORDS = new Set([
  'struct', 'union', 'enum', 'flags', 'component', 'fields', 'use', 'global',
  'buffers', 'input', 'signal', 'asset_ref', 'AssetRef', 'array', 'entity_ref',
  'EntityRef', 'entity_prototype_ref', 'component_prototype_ref', 'bitset',
  'void', 'import', 'button', 'Button', 'nothashed', 'event', 'abstract',
  'synced', 'asset', 'command', 'player_ref', 'local', 'remote', 'filter',
  'has', 'not', 'any', 'list', 'dictionary', 'typeof', 'using', 'singleton',
  'qstringutf8', 'QStringUtf8', 'qstring', 'QString', 'client', 'server',
  'enum_count', 'hash_set', 'ref', 'set', 'PlayerRef',
]);

// Single-character punctuation
const PUNCTUATION_SINGLE = new Set([
  '{', '}', '(', ')', '[', ']', '<', '>', ':', ';', ',', '=', '*', '#', '?', '.',
]);

// Lexer state
class Lexer {
  private text: string;
  private pos: number;
  private line: number;
  private character: number;
  private tokens: QtnToken[];

  constructor(text: string) {
    this.text = text;
    this.pos = 0;
    this.line = 0;
    this.character = 0;
    this.tokens = [];
  }

  // Get current character
  private current(): string {
    return this.pos < this.text.length ? this.text[this.pos] : '';
  }

  // Peek ahead without consuming
  private peek(offset: number = 1): string {
    const idx = this.pos + offset;
    return idx < this.text.length ? this.text[idx] : '';
  }

  // Advance by one character, update line/character
  private advance(): void {
    const ch = this.current();
    this.pos++;

    if (ch === '\n') {
      this.line++;
      this.character = 0;
    } else if (ch === '\r') {
      // Check for \r\n
      if (this.current() === '\n') {
        this.pos++;
      }
      this.line++;
      this.character = 0;
    } else {
      this.character++;
    }
  }

  // Get current position
  private currentPosition(): Position {
    return { line: this.line, character: this.character };
  }

  // Skip whitespace (space, tab, newline, carriage return)
  private skipWhitespace(): void {
    while (this.pos < this.text.length) {
      const ch = this.current();
      if (ch === ' ' || ch === '\t' || ch === '\n' || ch === '\r') {
        this.advance();
      } else {
        break;
      }
    }
  }

  // Skip single-line comment: // ...
  private skipLineComment(): void {
    // Skip //
    this.advance();
    this.advance();

    // Skip until end of line or EOF
    while (this.pos < this.text.length) {
      const ch = this.current();
      if (ch === '\n' || ch === '\r') {
        break;
      }
      this.advance();
    }
  }

  // Skip multi-line comment: /* ... */
  private skipBlockComment(): void {
    // Skip /*
    this.advance();
    this.advance();

    // Skip until */ or EOF
    while (this.pos < this.text.length) {
      const ch = this.current();
      if (ch === '*' && this.peek() === '/') {
        this.advance(); // skip *
        this.advance(); // skip /
        break;
      }
      this.advance();
    }
  }

  // Read string literal: "..."
  private readString(): QtnToken {
    const start = this.currentPosition();
    let value = '';

    // Skip opening quote
    this.advance();

    while (this.pos < this.text.length) {
      const ch = this.current();

      if (ch === '"') {
        // End of string
        this.advance();
        break;
      } else if (ch === '\\') {
        // Escape sequence
        this.advance();
        const next = this.current();
        if (next) {
          // Store escaped character (simple handling)
          if (next === 'n') {
            value += '\n';
          } else if (next === 't') {
            value += '\t';
          } else if (next === 'r') {
            value += '\r';
          } else if (next === '\\') {
            value += '\\';
          } else if (next === '"') {
            value += '"';
          } else {
            // Unknown escape, store as-is
            value += next;
          }
          this.advance();
        }
      } else {
        value += ch;
        this.advance();
      }
    }

    const end = this.currentPosition();
    return {
      type: TokenType.string,
      value,
      range: { start, end },
    };
  }

  // Read number: integer, float, or hex
  private readNumber(): QtnToken {
    const start = this.currentPosition();
    let value = '';

    // Handle negative sign
    if (this.current() === '-') {
      value += '-';
      this.advance();
    }

    // Hex number: 0x or 0X
    if (this.current() === '0' && (this.peek() === 'x' || this.peek() === 'X')) {
      value += this.current();
      this.advance();
      value += this.current();
      this.advance();

      // Read hex digits
      while (this.pos < this.text.length) {
        const ch = this.current();
        if ((ch >= '0' && ch <= '9') || (ch >= 'a' && ch <= 'f') || (ch >= 'A' && ch <= 'F')) {
          value += ch;
          this.advance();
        } else {
          break;
        }
      }
    } else {
      // Decimal number (integer or float)
      let hasDot = false;

      while (this.pos < this.text.length) {
        const ch = this.current();
        if (ch >= '0' && ch <= '9') {
          value += ch;
          this.advance();
        } else if (ch === '.' && !hasDot && this.peek() >= '0' && this.peek() <= '9') {
          hasDot = true;
          value += ch;
          this.advance();
        } else {
          break;
        }
      }
    }

    const end = this.currentPosition();
    return {
      type: TokenType.number,
      value,
      range: { start, end },
    };
  }

  // Read identifier or keyword
  private readIdentifier(): QtnToken {
    const start = this.currentPosition();
    let value = '';

    // Read identifier: [a-zA-Z_@][a-zA-Z0-9_@]*
    while (this.pos < this.text.length) {
      const ch = this.current();
      if (
        (ch >= 'a' && ch <= 'z') ||
        (ch >= 'A' && ch <= 'Z') ||
        (ch >= '0' && ch <= '9') ||
        ch === '_' ||
        ch === '@'
      ) {
        value += ch;
        this.advance();
      } else {
        break;
      }
    }

    const end = this.currentPosition();
    const type = KEYWORDS.has(value) ? TokenType.keyword : TokenType.identifier;

    return {
      type,
      value,
      range: { start, end },
    };
  }

  // Read punctuation
  private readPunctuation(): QtnToken {
    const start = this.currentPosition();
    const ch = this.current();

    // Check for two-character punctuation: =>
    if (ch === '=' && this.peek() === '>') {
      this.advance();
      this.advance();
      const end = this.currentPosition();
      return {
        type: TokenType.punctuation,
        value: '=>',
        range: { start, end },
      };
    }

    // Single-character punctuation
    this.advance();
    const end = this.currentPosition();
    return {
      type: TokenType.punctuation,
      value: ch,
      range: { start, end },
    };
  }

  // Special handling for # (check for #pragma or #define)
  private readHashOrDirective(): QtnToken {
    const start = this.currentPosition();
    const ch = this.current();

    // Peek ahead for "pragma" or "define"
    let lookahead = '';
    let idx = 1;
    while (idx < 20 && this.pos + idx < this.text.length) {
      const c = this.peek(idx);
      if ((c >= 'a' && c <= 'z') || (c >= 'A' && c <= 'Z')) {
        lookahead += c;
        idx++;
      } else {
        break;
      }
    }

    if (lookahead === 'pragma') {
      // Emit #pragma as a single keyword token
      for (let i = 0; i <= 6; i++) {
        this.advance();
      }
      const end = this.currentPosition();
      return {
        type: TokenType.keyword,
        value: '#pragma',
        range: { start, end },
      };
    } else if (lookahead === 'define') {
      // Emit #define as a single keyword token
      for (let i = 0; i <= 6; i++) {
        this.advance();
      }
      const end = this.currentPosition();
      return {
        type: TokenType.keyword,
        value: '#define',
        range: { start, end },
      };
    }

    // Otherwise, emit # as punctuation
    this.advance();
    const end = this.currentPosition();
    return {
      type: TokenType.punctuation,
      value: ch,
      range: { start, end },
    };
  }

  // Main tokenization loop
  tokenize(): QtnToken[] {
    while (this.pos < this.text.length) {
      this.skipWhitespace();

      if (this.pos >= this.text.length) {
        break;
      }

      const ch = this.current();

      // Comments
      if (ch === '/' && this.peek() === '/') {
        this.skipLineComment();
        continue;
      }
      if (ch === '/' && this.peek() === '*') {
        this.skipBlockComment();
        continue;
      }

      // String
      if (ch === '"') {
        this.tokens.push(this.readString());
        continue;
      }

      // Number (digit or negative sign followed by digit)
      if ((ch >= '0' && ch <= '9') || (ch === '-' && this.peek() >= '0' && this.peek() <= '9')) {
        this.tokens.push(this.readNumber());
        continue;
      }

      // Hash (directive or punctuation)
      if (ch === '#') {
        this.tokens.push(this.readHashOrDirective());
        continue;
      }

      // Identifier or keyword
      if ((ch >= 'a' && ch <= 'z') || (ch >= 'A' && ch <= 'Z') || ch === '_' || ch === '@') {
        this.tokens.push(this.readIdentifier());
        continue;
      }

      // Punctuation
      if (PUNCTUATION_SINGLE.has(ch)) {
        this.tokens.push(this.readPunctuation());
        continue;
      }

      // Unknown character
      const start = this.currentPosition();
      this.advance();
      const end = this.currentPosition();
      this.tokens.push({
        type: TokenType.unknown,
        value: ch,
        range: { start, end },
      });
    }

    // EOF token
    const eofPos = this.currentPosition();
    this.tokens.push({
      type: TokenType.eof,
      value: '',
      range: { start: eofPos, end: eofPos },
    });

    return this.tokens;
  }
}

// Main entry point
export function tokenize(text: string): QtnToken[] {
  const lexer = new Lexer(text);
  return lexer.tokenize();
}
