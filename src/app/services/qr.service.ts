import { inject, Injectable } from '@angular/core';
import Ajv, { JSONSchemaType } from 'ajv';
import { CapacitorBarcodeScanner, CapacitorBarcodeScannerAndroidScanningLibrary, CapacitorBarcodeScannerTypeHint } from '@capacitor/barcode-scanner';
import { Logger } from './logger.service';

/**
 * Service responsible for handling QR code functionality.
 */
@Injectable({
  providedIn: 'root',
})
export class QrService {
  private readonly logger = inject(Logger);

  /**
   * Validate an object against a provided schema.
   *
   * @param data The data to be validated.
   * @param schema The schema to validate against.
   * @returns The validated object or undefined if validation failed.
   */
  private validate<T = unknown>(data: object, schema: JSONSchemaType<T>): T | undefined {
    const copyData = structuredClone(data);
    const ajv = new Ajv({ useDefaults: false, removeAdditional: true });
    const validateAjv = ajv.compile(schema);
    const isValid = validateAjv(copyData);
    return isValid ? (copyData as T) : undefined;
  }

  /**
   * Scan a QR code.
   *
   * @returns The scanned data or undefined.
   */
  async scan(): Promise<string | undefined> {
    try {
      const scanResults = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanInstructions: 'Scan QR Code',
        scanText: 'Scan QR Code',
        android: { scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT },
      });
      return scanResults.ScanResult;
    } catch (err) {
      this.logger.error('Error scanning the QR code', err);
      return undefined;
    }
  }

  /**
   * Scan a QR code based on the provided schema.
   * If the QR code cannot be validated against the schema an undefined response is returned.
   *
   * @param schema The schema to validate the scanned data against.
   * @returns The scanned data in the specified schema format or undefined.
   */
  async validatedScan<T>(schema: JSONSchemaType<T>): Promise<T | undefined> {
    try {
      const scanResults = await CapacitorBarcodeScanner.scanBarcode({
        hint: CapacitorBarcodeScannerTypeHint.QR_CODE,
        scanInstructions: 'Scan QR Code',
        scanText: 'Scan QR Code',
        android: { scanningLibrary: CapacitorBarcodeScannerAndroidScanningLibrary.MLKIT },
      });
      const data = JSON.parse(scanResults.ScanResult ?? String());
      return this.validate(data, schema);
    } catch (err) {
      this.logger.error('Error scanning the QR code', err);
      return undefined;
    }
  }

  /**
   * Convert a URL containing QR code data to a Blob.
   *
   * @param url The URL to get data from.
   * @returns The data converted to a Blob format.
   */
  urlToBlob(url: string): Blob | undefined {
    const parts = url.split(';base64,');
    if (parts.length == 2 && parts[0].split(':').length == 2) {
      const dataType = parts[0].split(':')[1];
      const realData = parts[1];
      const byteCharacters = atob(realData);
      const uInt8Array = new Uint8Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; ++i) {
        uInt8Array[i] = byteCharacters.charCodeAt(i);
      }
      return new Blob([uInt8Array], { type: dataType });
    }
    return undefined;
  }
}
