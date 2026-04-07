import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class EncryptResultsService {
  private async deriveKey(testDateTime: string, uuid: string): Promise<CryptoKey> {
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      new TextEncoder().encode(testDateTime),
      'PBKDF2',
      false,
      ['deriveKey']
    );
    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: new TextEncoder().encode(uuid),
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-CBC', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  private uint8ToBase64(bytes: Uint8Array): string {
    let binary = '';
    for (let i = 0; i < bytes.length; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  private base64ToUint8(b64: string): Uint8Array {
    return Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  }

  /**
   * Encrypt a plaintext string for storage in SQLite.
   * Returns a base64 string of the random IV (16 bytes) prepended to the AES-CBC ciphertext.
   */
  async encryptForStorage(testDateTime: string, uuid: string, plaintext: string): Promise<string> {
    const key = await this.deriveKey(testDateTime, uuid);
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      key,
      new TextEncoder().encode(plaintext)
    );
    const combined = new Uint8Array(16 + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), 16);
    return this.uint8ToBase64(combined);
  }

  /**
   * Decrypt a value previously encrypted with encryptForStorage.
   */
  async decryptFromStorage(testDateTime: string, uuid: string, stored: string): Promise<string> {
    const combined = this.base64ToUint8(stored);
    const iv = combined.slice(0, 16);
    const ciphertext = combined.slice(16);
    const key = await this.deriveKey(testDateTime, uuid);
    const plaintext = await crypto.subtle.decrypt(
      { name: 'AES-CBC', iv },
      key,
      ciphertext
    );
    return new TextDecoder().decode(plaintext);
  }

  /**
   * Encrypt a plaintext string for upload or export using hybrid encryption.
   * AES-CBC encrypts the data; RSA-OAEP (SHA-256) encrypts the raw AES key.
   * Returns [base64(iv+ciphertext), base64(encryptedAESKey)].
   */
  async encryptForUpload(
    testDateTime: string,
    uuid: string,
    publicKeyPem: string,
    plaintext: string
  ): Promise<[string, string]> {
    const key = await this.deriveKey(testDateTime, uuid);
    const iv = crypto.getRandomValues(new Uint8Array(16));
    const ciphertext = await crypto.subtle.encrypt(
      { name: 'AES-CBC', iv },
      key,
      new TextEncoder().encode(plaintext)
    );
    const combined = new Uint8Array(16 + ciphertext.byteLength);
    combined.set(iv, 0);
    combined.set(new Uint8Array(ciphertext), 16);
    const encryptedResult = this.uint8ToBase64(combined);

    const rawKey = await crypto.subtle.exportKey('raw', key);
    const rsaPublicKey = await this.importPublicKey(publicKeyPem);
    const encryptedKey = await crypto.subtle.encrypt({ name: 'RSA-OAEP' }, rsaPublicKey, rawKey);
    const encryptedAESKey = this.uint8ToBase64(new Uint8Array(encryptedKey));

    return [encryptedResult, encryptedAESKey];
  }

  private async importPublicKey(pem: string): Promise<CryptoKey> {
    const b64 = pem.replace(/-----[^-]+-----/g, '').replace(/\s+/g, '');
    const binary = this.base64ToUint8(b64);
    const buffer = binary.buffer.slice(binary.byteOffset, binary.byteOffset + binary.byteLength) as ArrayBuffer;
    return crypto.subtle.importKey(
      'spki',
      buffer,
      { name: 'RSA-OAEP', hash: 'SHA-256' },
      false,
      ['encrypt']
    );
  }
}
