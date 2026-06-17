import { TestBed } from '@angular/core/testing';
import { calculateCRC32, calculateCRC8, numberToHex, str2arr } from '../checksums';

describe('checkums', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({});
  });

  it('calculateCRC8', () => {
    const dataView: DataView = new DataView(new Uint8Array([91, 49, 44, 34, 114, 101, 113, 117, 101, 115, 116, 73, 100, 34, 93]).buffer);
    const crc = calculateCRC8(new Uint8Array(dataView.buffer));
    expect(crc).toEqual(new Uint8Array([15]));
  });

  it('calculateCRC32', () => {
    const value = 'TEST';
    const crc = calculateCRC32(str2arr(value));
    expect(crc).toEqual(4008350648);
  });

  it('numberToHex', () => {
    const hex = numberToHex(4008350648);
    expect(hex).toEqual('EEEA93B8');
  });
});
