import { shuffleArray } from '../shuffle-array';

describe('shuffleArray', () => {
  it('returns the same array reference', () => {
    const arr = [1, 2, 3];
    expect(shuffleArray(arr)).toBe(arr);
  });

  it('preserves all elements', () => {
    const arr = [1, 2, 3, 4, 5];
    const result = shuffleArray([...arr]);
    expect(result.sort()).toEqual(arr.sort());
  });

  it('handles an empty array', () => {
    expect(shuffleArray([])).toEqual([]);
  });

  it('handles a single-element array', () => {
    expect(shuffleArray([42])).toEqual([42]);
  });
});
