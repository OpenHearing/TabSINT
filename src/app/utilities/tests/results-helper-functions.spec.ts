import { constructFilename, getDateString } from '../results-helper-functions';

describe('results-helper-functions', () => {
  describe('getDateString', () => {
    it('formats a given ISO datetime string', () => {
      const result = getDateString('2024-03-15T10:30:45.000Z');
      expect(result).toBe('2024-03-15T10-30-45');
    });

    it('falls back to a current-date string when no argument is given', () => {
      const result = getDateString(undefined);
      expect(result).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}$/);
    });
  });

  describe('constructFilename', () => {
    it('uses the device UUID when no resultFilename is provided', () => {
      const result = constructFilename('abc123', undefined, '2024-03-15T10:30:45.000Z');
      expect(result).toBe('abc123.2024-03-15T10-30-45');
    });

    it('uses resultFilename when provided', () => {
      const result = constructFilename('abc123', 'myProtocol', '2024-03-15T10:30:45.000Z');
      expect(result).toBe('myProtocol.2024-03-15T10-30-45');
    });

    it('appends suffix when provided', () => {
      const result = constructFilename('abc123', 'myProtocol', '2024-03-15T10:30:45.000Z', '.json');
      expect(result).toBe('myProtocol.2024-03-15T10-30-45.json');
    });
  });
});
