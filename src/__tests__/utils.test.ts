import { parseLivenessImages } from '../utils';

describe('parseLivenessImages', () => {
  it('parses a valid JSON array string', () => {
    const raw = JSON.stringify(['/path/a.jpg', '/path/b.jpg']);
    expect(parseLivenessImages(raw)).toEqual(['/path/a.jpg', '/path/b.jpg']);
  });

  it('returns empty array for empty string', () => {
    expect(parseLivenessImages('')).toEqual([]);
  });

  it('returns empty array for invalid JSON', () => {
    expect(parseLivenessImages('not-json')).toEqual([]);
  });

  it('returns empty array for JSON non-array (object)', () => {
    expect(parseLivenessImages('{"key":"val"}')).toEqual([]);
  });

  it('returns empty array for JSON null', () => {
    expect(parseLivenessImages('null')).toEqual([]);
  });

  it('handles an empty JSON array', () => {
    expect(parseLivenessImages('[]')).toEqual([]);
  });
});
