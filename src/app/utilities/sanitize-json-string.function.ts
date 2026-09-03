// eslint-disable-next-line no-control-regex
const CONTROL_CHARACTERS = /[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g;
const LEADING_BOM = /^﻿/;

/**
 * Strips a leading byte-order mark, stray control characters, and surrounding whitespace
 * from a JSON string before parsing. Tab, newline, and carriage return are preserved since
 * they are legal JSON whitespace used for formatting between tokens.
 * @param input The raw string to sanitize, as read from a file or external source.
 * @returns The sanitized string, safe to pass to JSON.parse.
 */
export function sanitizeJsonString(input: string): string {
  return input.replace(LEADING_BOM, '').replace(CONTROL_CHARACTERS, '').trim();
}
