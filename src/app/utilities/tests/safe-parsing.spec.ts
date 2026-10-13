import { TestBed } from '@angular/core/testing';
import { safeParse } from '../safe-parsing';
import { JSONSchemaType } from 'ajv';

interface SafeParseTestInterface {
  arr: string[];
  key: string;
  obj: {
    key: string;
  };
}

describe('safeParsing', () => {
  let safeParseTestSchema: JSONSchemaType<SafeParseTestInterface>;
  let objectWithValidProperties: SafeParseTestInterface;
  beforeEach(async () => {
    TestBed.configureTestingModule({});
    safeParseTestSchema = {
      type: 'object',
      properties: {
        arr: { type: 'array', items: { type: 'string' }, default: [] },
        key: { type: 'string', default: '' },
        obj: { type: 'object', properties: { key: { type: 'string', default: '' } }, default: { key: '' }, required: ['key'] },
      },
      required: ['arr', 'key', 'obj'],
    };

    objectWithValidProperties = {
      arr: ['arr'],
      key: 'key',
      obj: { key: 'objKey' },
    };
  });

  it('returns object with valid properties', () => {
    const jsonString = JSON.stringify(objectWithValidProperties);
    const output = safeParse(jsonString, safeParseTestSchema);
    expect(output?.arr).toEqual(objectWithValidProperties.arr);
    expect(output?.key).toEqual(objectWithValidProperties.key);
    expect(output?.obj).toEqual(objectWithValidProperties.obj);
  });

  it('returns object with missing array added', () => {
    const objectWithMissingArray = {
      key: objectWithValidProperties.key,
      obj: objectWithValidProperties.obj,
    };
    const jsonString = JSON.stringify(objectWithMissingArray);
    const output = safeParse(jsonString, safeParseTestSchema);
    expect(output?.arr).toEqual(safeParseTestSchema.properties.arr.default);
    expect(output?.key).toEqual(objectWithValidProperties.key);
    expect(output?.obj).toEqual(objectWithValidProperties.obj);
  });

  it('returns object with key replaced', () => {
    const objectWithBadKey = {
      ...objectWithValidProperties,
      key: [],
    };
    const jsonString = JSON.stringify(objectWithBadKey);
    const output = safeParse(jsonString, safeParseTestSchema);
    expect(output?.arr).toEqual(objectWithValidProperties.arr);
    expect(output?.key).toEqual(safeParseTestSchema.properties.key.default);
    expect(output?.obj).toEqual(objectWithValidProperties.obj);
  });

  it('returns object with nested property replaced', () => {
    const objectWithBadNestedProperty = {
      ...objectWithValidProperties,
      obj: { key: -1 },
    };
    const jsonString = JSON.stringify(objectWithBadNestedProperty);
    const output = safeParse(jsonString, safeParseTestSchema);
    expect(output?.arr).toEqual(objectWithValidProperties.arr);
    expect(output?.key).toEqual(objectWithValidProperties.key);
    expect(output?.obj).toEqual(safeParseTestSchema.properties.obj.default);
  });

  it('returns object with array item removed', () => {
    const objectWithBadArray = {
      ...objectWithValidProperties,
      arr: [-1],
    };
    const jsonString = JSON.stringify(objectWithBadArray);
    const output = safeParse(jsonString, safeParseTestSchema);
    expect(output?.arr).toEqual(safeParseTestSchema.properties.arr.default);
    expect(output?.key).toEqual(objectWithValidProperties.key);
    expect(output?.obj).toEqual(objectWithValidProperties.obj);
  });
});
