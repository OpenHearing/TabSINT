/**
 * Calculate a CRC8 checksum for a byte array.
 * @param byte_array The byte array for checksum calculation.
 * @returns The CRC8 checksum.
 */
export function calculateCRC8(byte_array: Uint8Array) {
  let c = 0;
  const crc8_table = genCRC8Table();
  byte_array.forEach(byte => {
    c = crc8_table[(c ^ byte) % 256];
  });
  return new Uint8Array([c]);
}

/**
 * Calculate a CRC32 checksum for a byte array.
 * @param byteArray The byte array for checksum calculation.
 * @returns The CRC32 checksum.
 */
export function calculateCRC32(byteArray: Uint8Array): number {
  const crcTable = new Uint32Array(256);
  for (let index = 0; index <= 255; index++) {
    let tableValue = index;
    for (let k = 0; k <= 7; k++) {
      const leastSignificantBit = tableValue & 1;
      if (leastSignificantBit === 1) {
        const reversedGeneratorPolynomial = 0xedb88320;
        tableValue = reversedGeneratorPolynomial ^ (tableValue >>> 1);
      } else {
        tableValue = tableValue >>> 1;
      }
    }
    crcTable[index] = tableValue >>> 0;
  }
  const maxInt32 = 0xffffffff;
  let crcValue = maxInt32;
  for (const byte of byteArray) {
    const crcTableIndex = (crcValue ^ byte) & 255;
    crcValue = crcTable[crcTableIndex] ^ (crcValue >>> 8);
  }
  crcValue = (crcValue ^ maxInt32) >>> 0;
  return crcValue;
}

/**
 * Convert number to upper case hexadecimal string.
 * @param num The number to convert.
 * @param width The optional fixed width, defaults to 8.
 * @returns The hexadecimal string in upper case.
 */
export function numberToHex(num: number, width: number | undefined = 8): string {
  return num
    .toString(16)
    .padStart(width ?? 0, '0')
    .toUpperCase();
}

/**
 * Convert a string to a uint8 array.
 * @param str The string to convert.
 * @returns The uint8 array.
 */
export function str2arr(str: string): Uint8Array {
  return new TextEncoder().encode(str);
}

/**
 * Generate the checksum table for creating CRC8 checksums.
 * @returns The checksum table.
 */
function genCRC8Table() {
  const csTable = []; // 256 max len byte array
  for (let i = 0; i < 256; ++i) {
    let curr = i;
    for (let j = 0; j < 8; ++j) {
      if ((curr & 0x80) !== 0) {
        curr = ((curr << 1) ^ 0x07) % 256;
      } else {
        curr = (curr << 1) % 256;
      }
    }
    csTable[i] = curr;
  }
  return csTable;
}
