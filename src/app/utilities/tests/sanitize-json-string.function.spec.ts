import { TestBed } from '@angular/core/testing';
import { sanitizeJsonString } from '../sanitize-json-string.function';

describe('sanitizeJsonString', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({});
  });

  it('strips a leading byte-order mark that would otherwise fail JSON.parse', () => {
    const bom = String.fromCharCode(0xfeff);
    const raw = bom + '{"name":"test"}';

    expect(() => JSON.parse(raw)).toThrow();
    expect(() => JSON.parse(sanitizeJsonString(raw))).not.toThrow();
    expect(JSON.parse(sanitizeJsonString(raw))).toEqual({ name: 'test' });
  });

  it('trims leading and trailing whitespace', () => {
    const raw = '   \n {"name":"test"}  \t';
    expect(sanitizeJsonString(raw)).toEqual('{"name":"test"}');
  });

  it('strips embedded control characters outside string values', () => {
    const raw = '{"name":"test"}\x00\x07';
    expect(() => JSON.parse(raw)).toThrow();
    expect(JSON.parse(sanitizeJsonString(raw))).toEqual({ name: 'test' });
  });

  it('leaves pretty-printed JSON formatting (tabs, newlines, carriage returns) intact', () => {
    const raw = '{\n\t"name": "test",\r\n\t"value": 1\n}';
    expect(JSON.parse(sanitizeJsonString(raw))).toEqual({ name: 'test', value: 1 });
  });

  it('preserves non-ASCII characters inside string values', () => {
    const raw = '{"name":"café éè"}';
    expect(JSON.parse(sanitizeJsonString(raw))).toEqual({ name: 'café éè' });
  });
});
