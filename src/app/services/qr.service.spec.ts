import { TestBed } from '@angular/core/testing';
import { QrService } from './qr.service';
import { Logger } from './logger.service';

describe('QrService', () => {
  let qrService: QrService;
  let mockLogger: jasmine.SpyObj<Logger>;

  beforeEach(() => {
    mockLogger = jasmine.createSpyObj('Logger', ['debug', 'error']);

    TestBed.configureTestingModule({
      providers: [QrService, { provide: Logger, useValue: mockLogger }],
    });

    qrService = TestBed.inject(QrService);
  });

  it('should be created', () => {
    expect(qrService).toBeTruthy();
  });

  describe('urlToBlob', () => {
    it('converts a valid base64 data URL to a Blob', () => {
      // "hello" base64-encoded
      const base64 = btoa('hello');
      const url = `data:text/plain;base64,${base64}`;
      const blob = qrService.urlToBlob(url);
      expect(blob).toBeInstanceOf(Blob);
      expect(blob!.type).toBe('text/plain');
    });

    it('returns undefined for a URL without the expected format', () => {
      expect(qrService.urlToBlob('not-a-data-url')).toBeUndefined();
    });

    it('returns undefined when the MIME type part is malformed', () => {
      expect(qrService.urlToBlob(';base64,abc')).toBeUndefined();
    });
  });

  describe('scan', () => {
    it('returns undefined and logs an error when the scanner throws', async () => {
      spyOn((await import('@capacitor/barcode-scanner')).CapacitorBarcodeScanner, 'scanBarcode').and.rejectWith(new Error('scanner unavailable'));

      const result = await qrService.scan();
      expect(result).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('validatedScan', () => {
    it('returns undefined and logs an error when the scanner throws', async () => {
      spyOn((await import('@capacitor/barcode-scanner')).CapacitorBarcodeScanner, 'scanBarcode').and.rejectWith(new Error('scanner unavailable'));

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const schema = { type: 'object', properties: {}, required: [] } as any;
      const result = await qrService.validatedScan(schema);
      expect(result).toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
