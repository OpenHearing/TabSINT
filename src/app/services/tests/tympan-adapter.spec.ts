import { TestBed } from '@angular/core/testing';
import { TympanAdapter } from '../devices/tympan-adapter';
import { Logger } from '../logger.service';

const msg = '[1,"requestId"]';
const DataView1: DataView = new DataView(new Uint8Array([5, 91, 49, 44, 34, 114, 101, 113, 117, 101, 115, 116, 73, 100, 34, 93, 3, 143, 2]).buffer);
const DataView2: DataView = new DataView(new Uint8Array([91, 49, 44, 34, 114, 101, 113, 117, 101, 115, 116, 73, 100, 34, 93]).buffer);
const bytes1: Uint8Array = new Uint8Array([15]);
const bytes_1_escaped: Uint8Array = new Uint8Array([3, 143]);
const bytes2: Uint8Array = new Uint8Array([3, 143]);
const bytes_2_unescaped: Uint8Array = new Uint8Array([15]);

describe('tympanWrap', () => {
  let tympanAdapter: TympanAdapter;
  let mockLogger: jasmine.SpyObj<Logger>;

  beforeEach(async () => {
    mockLogger = jasmine.createSpyObj('Logger', ['debug']);
    TestBed.configureTestingModule({
      providers: [TympanAdapter, { provide: Logger, useValue: mockLogger }],
    });
    tympanAdapter = TestBed.inject(TympanAdapter);
  });

  it('msgToDataView', () => {
    // @ts-expect-error - Private method access
    const msg_to_write = tympanAdapter.msgToDataView(msg);
    expect(new Uint8Array(msg_to_write.buffer)).toEqual(new Uint8Array(DataView1.buffer));
  });

  it('dataViewToString', () => {
    // @ts-expect-error - Private method access
    const msg_resp = tympanAdapter.dataViewToString(DataView2);
    expect(msg_resp).toMatch(msg);
  });

  it('handleEscaping', () => {
    // @ts-expect-error - Private method access
    const escaped_bytes = tympanAdapter.handleEscaping(bytes1);
    expect(escaped_bytes).toEqual(bytes_1_escaped);
  });

  it('handleUnescaping', () => {
    // @ts-expect-error - Private method access
    const unescaped_bytes = tympanAdapter.handleUnescaping(bytes2);
    expect(unescaped_bytes).toEqual(bytes_2_unescaped);
  });
});
