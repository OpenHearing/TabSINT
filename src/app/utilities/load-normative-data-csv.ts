import * as Papa from 'papaparse';
import { TabsintFs } from 'tabsintfs';
import { ProtocolMetaInterface } from '../models/protocol/protocol.interface';
import { NormativeDataInterface } from '../interfaces/normative-data-interface';
import { ProtocolServer } from './constants';

/**
 * Parse CSV data into individual line strings
 * @param csvString The data read from the file
 * @returns A promise that resolves to a list of line strings
 */
function parseCSVAsync(csvString: string) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
      header: false,
      dynamicTyping: true,
      complete: (results) => {
        resolve(results.data);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

/**
 * Validate that the headers of the file aligns with the expected headers/properties of the to be outputted data objects  
 * @param actualHeaders The headers read from the file
 * @param expectedPositions The expected headers which align with data properties
 */
function validateHeaders(actualHeaders: string[], expectedPositions: { [key: string]: number }) {
  for (const [expectedHeader, expectedIndex] of Object.entries(expectedPositions)) {
    if (actualHeaders[expectedIndex] !== expectedHeader) {
      throw new Error(`Header validation failed: Expected "${expectedHeader}" at index ${expectedIndex}, but found "${actualHeaders[expectedIndex]}"`);
    }
  }
}

/**
 * Parse the string data from a CSV file into list of data objects
 * @param csvFileContent The file contents as a string
 * @returns A promise that resolves to a list of normative data
 */
async function parseCsvString(csvFileContent: string): Promise<NormativeDataInterface[]> {
  const dataList: NormativeDataInterface[] = [];
  const lines: any[][] = await parseCSVAsync(csvFileContent) as any[][];
  const dataIndex = lines.findIndex((line) => line[0].startsWith('{DATA')) + 1;
  const header = lines[dataIndex];
  const expectedHeaderPositions: { [key: string]: number } = {
    'X': 0,
    'YMIN': 1,
    'YMAX': 2,
  };
  validateHeaders(header, expectedHeaderPositions);

  lines.slice(dataIndex + 1).forEach((line: any[], idx: number) => {
    if (line.length >= 3) {
      dataList.push({
        x: line[0],
        yMin: line[1],
        yMax: line[2],
      });
    }
  });

  return dataList;
}

/**
 * Get normative data from the provided CSV file
 * @param normativeDataFilePath The file name of the normative data 
 * @param meta The metadata associated with the running protocol, to determine the full file path information
 * @returns A promise that resolves to a list of normative data
 */
export async function loadNormativeDataCsv(normativeDataFilePath: string, meta: ProtocolMetaInterface): Promise<NormativeDataInterface[]> {
  let csvString;
  if (meta.server == ProtocolServer.Developer) {
    try {
      const csvFilePath = 'assets/' + meta.path + '/' + normativeDataFilePath;
      const resp = await fetch(csvFilePath);
      if (!resp.ok) {
        throw new Error(`Failed to fetch the file: ${resp.statusText}`);
      }
      csvString = await resp.text();
    } catch (error) {
      console.error('Error fetching or parsing CSV file:', error);
      throw error;
    }
  } else if (meta.server === ProtocolServer.LocalServer) {
    const resp = await TabsintFs.readFile({ rootUri: meta.contentURI, filePath: normativeDataFilePath });
    csvString = resp?.content;
  }

  if (csvString) {
    try {
      const normativeData = await parseCsvString(csvString);
      return normativeData;
    } catch (error) {
      console.log('Error parsing normative data CSV string: ', error);
      throw error;
    }
  } else {
    throw new Error('Error processing normative data: No CSV content found.');
  }
}