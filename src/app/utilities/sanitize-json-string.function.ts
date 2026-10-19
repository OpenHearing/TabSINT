const LEADING_BOM = /^\uFEFF/;

/**
 * Whether a character code is a control character that is not legal JSON whitespace:
 * U+0000-U+0008, U+000B, U+000C, U+000E-U+001F, and U+007F (DEL).
 * @param code The UTF-16 code unit to check.
 * @returns True when the character should be stripped.
 */
function isStrayControlCharacter(code: number): boolean {
  return code <= 0x08 || code === 0x0b || code === 0x0c || (code >= 0x0e && code <= 0x1f) || code === 0x7f;
}

/**
 * Strips a leading byte-order mark, stray control characters, and surrounding whitespace
 * from a JSON string before parsing. Tab, newline, and carriage return are preserved since
 * they are legal JSON whitespace used for formatting between tokens.
 * @param input The raw string to sanitize, as read from a file or external source.
 * @returns The sanitized string, safe to pass to JSON.parse.
 */
export function sanitizeJsonString(input: string): string {
  let sanitized = '';
  for (const char of input.replace(LEADING_BOM, '')) {
    if (!isStrayControlCharacter(char.charCodeAt(0))) {
      sanitized += char;
    }
  }
  return sanitized.trim();
}
