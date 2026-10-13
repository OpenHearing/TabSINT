import { TestBed } from '@angular/core/testing';
import { EncryptResultsService } from '../encrypt-results.service';

// RSA-2048 key pair generated offline for testing only — never used in production.

describe('EncryptResultsService', () => {
  let service: EncryptResultsService;
  const testDateTime = '2024-01-01T00:00:00.000Z';
  const uuid = 'test-device-uuid';

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [EncryptResultsService] });
    service = TestBed.inject(EncryptResultsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('encryptForStorage / decryptFromStorage', () => {
    it('round-trips plaintext correctly', async () => {
      const plaintext = 'Hello, secure world!';
      const stored = await service.encryptForStorage(testDateTime, uuid, plaintext);
      const result = await service.decryptFromStorage(testDateTime, uuid, stored);
      expect(result).toBe(plaintext);
    });

    it('produces a different ciphertext on each call (random IV)', async () => {
      const plaintext = 'same input';
      const a = await service.encryptForStorage(testDateTime, uuid, plaintext);
      const b = await service.encryptForStorage(testDateTime, uuid, plaintext);
      expect(a).not.toBe(b);
    });

    it('returns a non-empty base64 string', async () => {
      const stored = await service.encryptForStorage(testDateTime, uuid, 'data');
      expect(stored).toMatch(/^[A-Za-z0-9+/]+=*$/);
    });

    it('fails to decrypt when the wrong uuid is used', async () => {
      const stored = await service.encryptForStorage(testDateTime, uuid, 'secret');
      await expectAsync(service.decryptFromStorage(testDateTime, 'wrong-uuid', stored)).toBeRejected();
    });

    it('fails to decrypt when the wrong testDateTime is used', async () => {
      const stored = await service.encryptForStorage(testDateTime, uuid, 'secret');
      await expectAsync(service.decryptFromStorage('1970-01-01T00:00:00.000Z', uuid, stored)).toBeRejected();
    });

    it('round-trips an empty string', async () => {
      const stored = await service.encryptForStorage(testDateTime, uuid, '');
      const result = await service.decryptFromStorage(testDateTime, uuid, stored);
      expect(result).toBe('');
    });

    it('round-trips a large payload', async () => {
      const plaintext = 'x'.repeat(10000);
      const stored = await service.encryptForStorage(testDateTime, uuid, plaintext);
      const result = await service.decryptFromStorage(testDateTime, uuid, stored);
      expect(result).toBe(plaintext);
    });
  });
});
