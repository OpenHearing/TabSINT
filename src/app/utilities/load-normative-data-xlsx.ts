import { TabsintFs } from 'tabsintfs';
import { ProtocolMetaInterface } from '../models/protocol/protocol.interface';
import { NormativeDataInterface } from '../interfaces/normative-data-interface';
import { ProtocolServer } from './constants';
import { Buffer } from "buffer";
import * as XLSX from 'xlsx';
import { WAIInterface } from '../views/response-area/response-areas/wideband-acoustic-immittance/wai-exam/wai-exam.interface';
import { SweptDpoaeInterface } from '../views/response-area/response-areas/swept-dpoae/swept-dpoae-exam/swept-dpoae-exam.interface';

/**
 * Validate that the file headers align with the expected headers/properties for the data 
 * @param actualHeaders The headers read from the file
 * @param expectedPositions The expected headers which align with data properties
 */
function validateHeaders(actualHeaders: string[], expectedPositions: { [key: string]: number; }) {
  for (const [expectedHeader, expectedIndex] of Object.entries(expectedPositions)) {
    if (actualHeaders[expectedIndex] !== expectedHeader) {
      throw new Error(`Header validation failed: Expected "${expectedHeader}" at index ${expectedIndex}, but found "${actualHeaders[expectedIndex]}"`);
    }
  }
}

/**
 * Parse the buffer data from an XLSX file into an array of data objects
 * @param xlsxFileContent The file contents as an array buffer
 * @returns A promise that resolves to an array of normative data
 */
async function parseXlsxBuffer(xlsxFileContent: ArrayBuffer): Promise<NormativeDataInterface[]> {
  const dataList: NormativeDataInterface[] = [];
  const workbook: XLSX.WorkBook = XLSX.read(xlsxFileContent, { type: 'array' });
  if (workbook.SheetNames.length < 1) {
    return dataList;
  }
  // Only use the first workbook sheet
  const worksheetName: string = workbook.SheetNames[0];
  const workSheet: XLSX.WorkSheet = workbook.Sheets[worksheetName];
  // Convert to data array
  const lines: any[][] = XLSX.utils.sheet_to_json(workSheet, { header: 1 });
  const headerIndex = lines.findIndex((line) => line[0].startsWith('X'));
  const header = lines[headerIndex];
  const expectedHeaderPositions: { [key: string]: number; } = {
    'X': 0,
    'Y_MIN': 1,
    'Y_MAX': 2,
  };
  validateHeaders(header, expectedHeaderPositions);

  lines.slice(headerIndex + 1).forEach((line: any[], idx: number) => {
    if (line.length >= 3) {
      dataList.push({
        x: parseFloat(line[0]),
        yMin: parseFloat(line[1]),
        yMax: parseFloat(line[2]),
      });
    }
  });

  return dataList;
}

/**
 * Get normative data for the Swept DPOAE response area.
 * @param responseArea The response area to load data for.
 * @param meta The metadata associated with the protocol to determine the full file path information
 * @returns A promise that resolves to the updated response area.
 */
export async function loadSweptDPOAENormativeData(responseArea: SweptDpoaeInterface, meta: ProtocolMetaInterface): Promise<SweptDpoaeInterface> {
  if (responseArea.normativeDataPath) {
    const normativeData = await loadNormativeDataXlsx(responseArea.normativeDataPath, meta);
    return { ...responseArea, normativeData: normativeData };
  }
  return responseArea;
}

/**
 * Get normative data for the WAI response area.
 * @param responseArea The response area to load data for.
 * @param meta The metadata associated with the protocol to determine the full file path information
 * @returns A promise that resolves to the updated response area.
 */
export async function loadWAINormativeData(responseArea: WAIInterface, meta: ProtocolMetaInterface): Promise<WAIInterface> {
  if (responseArea.normativeAbsorbanceDataPath) {
    const normativeData = await loadNormativeDataXlsx(responseArea.normativeAbsorbanceDataPath, meta);
    return { ...responseArea, normativeAbsorbanceData: normativeData };
  }
  return responseArea;
}

/**
 * Get normative data from the provided XLSX file
 * @param normativeDataFilePath The file name of the normative data 
 * @param meta The metadata associated with the protocol to determine the full file path information
 * @returns A promise that resolves to an array of normative data
 */
export async function loadNormativeDataXlsx(normativeDataFilePath: string, meta: ProtocolMetaInterface): Promise<NormativeDataInterface[]> {
  let xlsxArrayBuffer;
  if (meta.server == ProtocolServer.Developer) {
    const xlsxFilePath = 'assets/' + meta.path + '/' + normativeDataFilePath;
    const resp = await fetch(xlsxFilePath);
    if (!resp.ok) {
      throw new Error(`Failed to fetch the file: ${resp.statusText}`);
    }
    xlsxArrayBuffer = await resp.arrayBuffer();
  } else if (meta.server === ProtocolServer.LocalServer || meta.server === ProtocolServer.Gitlab) {
    const resp = await TabsintFs.readFile({ rootUri: meta.contentURI, filePath: normativeDataFilePath, asBase64: true });
    const xlsxBuffer = Buffer.from(resp?.content, 'base64');
    xlsxArrayBuffer = xlsxBuffer.buffer.slice(xlsxBuffer.byteOffset, xlsxBuffer.byteOffset + xlsxBuffer.byteLength);
  }

  if (xlsxArrayBuffer) {
    const normativeData: NormativeDataInterface[] = await parseXlsxBuffer(xlsxArrayBuffer);
    return normativeData;
  } else {
    throw new Error('Error processing normative data: No XLSX content found.');
  }
}