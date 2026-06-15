import { TestBed } from '@angular/core/testing';
import { calculateCRC8 } from '../checksums';

describe('checkums', () => {
  beforeEach(async () => {
    TestBed.configureTestingModule({});
  });

  it('calculateCRC8', () => {
    const dataView: DataView = new DataView(new Uint8Array([91, 49, 44, 34, 114, 101, 113, 117, 101, 115, 116, 73, 100, 34, 93]).buffer);
    const crc = calculateCRC8(new Uint8Array(dataView.buffer));
    expect(crc).toEqual(new Uint8Array([15]));
  });
});
