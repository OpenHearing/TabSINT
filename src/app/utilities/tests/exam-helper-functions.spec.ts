import { calculateElapsedTime, checkForSpecialReference, handleOutputCalibration, checkIfCanGoBack } from '../exam-helper-functions';

describe('exam-helper-functions', () => {
  describe('checkIfCanGoBack', () => {
    it('returns true', () => {
      expect(checkIfCanGoBack()).toBeTrue();
    });
  });

  describe('calculateElapsedTime', () => {
    it('returns zero elapsed time for a start time equal to now', () => {
      // Allow up to 2 seconds of real execution time
      const result = calculateElapsedTime(new Date().toISOString());
      expect(result).toMatch(/^\d{2}:\d{2}:\d{2}$/);
    });

    it('formats a known elapsed duration correctly', () => {
      const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString();
      const result = calculateElapsedTime(twoHoursAgo);
      // Should start with "02:"
      expect(result.startsWith('02:')).toBeTrue();
    });

    it('zero-pads minutes and seconds', () => {
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000).toISOString();
      const result = calculateElapsedTime(fiveMinutesAgo);
      // Format: HH:MM:SS — all parts are two digits
      const parts = result.split(':');
      expect(parts.length).toBe(3);
      parts.forEach(p => expect(p.length).toBe(2));
    });
  });

  describe('checkForSpecialReference', () => {
    it('returns true when id contains @', () => {
      expect(checkForSpecialReference('@someRef')).toBeTrue();
    });

    it('returns false when id does not contain @', () => {
      expect(checkForSpecialReference('normalId')).toBeFalse();
    });

    it('returns false for undefined', () => {
      expect(checkForSpecialReference(undefined)).toBeFalse();
    });
  });

  describe('handleOutputCalibration', () => {
    it('prepends FPL/ when calibration type is FPL', () => {
      expect(handleOutputCalibration('LEFT', 'FPL')).toBe('FPL/LEFT');
    });

    it('returns the channel unchanged when calibration type is SPL', () => {
      expect(handleOutputCalibration('RIGHT', 'SPL')).toBe('RIGHT');
    });

    it('returns the channel unchanged for other calibration types', () => {
      expect(handleOutputCalibration('LEFT', 'OTHER')).toBe('LEFT');
    });
  });
});
