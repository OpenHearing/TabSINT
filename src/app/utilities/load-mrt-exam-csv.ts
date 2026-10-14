import * as Papa from 'papaparse';
import { TabsintFs } from 'tabsintfs';
import { mrtSchema } from '../../schema/response-areas/mrt.schema';
import { ProtocolMetaInterface } from '../models/protocol/protocol.interface';
import {
  MrtExamDefinitionInterface,
  MrtExamInterface,
  MrtTrialInterface,
} from '../views/response-area/response-areas/mrt/mrt-exam/mrt-exam.interface';
import { ProtocolServer } from './constants';

function parseCSVAsync(csvString: string): Promise<unknown[][]> {
  return new Promise((resolve, reject) => {
    Papa.parse<unknown[]>(csvString, {
      header: false,
      dynamicTyping: true,
      complete: results => {
        resolve(results.data);
      },
      error: (error: Error) => {
        reject(error);
      },
    });
  });
}

function validateHeaders(actualHeaders: unknown[], expectedPositions: Record<string, number>) {
  for (const [expectedHeader, expectedIndex] of Object.entries(expectedPositions)) {
    if (actualHeaders[expectedIndex] !== expectedHeader) {
      throw new Error(
        `Header validation failed: Expected "${expectedHeader}" at index ${expectedIndex}, but found "${actualHeaders[expectedIndex]}"`
      );
    }
  }
}
function processOutputChannelValue(value: unknown): string | string[] {
  if (Array.isArray(value)) {
    return value.map(String);
  }
  const text = String(value);
  if (text.includes(',')) {
    return text.split(',').map(item => item.trim());
  }
  return text;
}

/**
 * Convert a CSV cell to a number, keeping cells that were already parsed as numbers.
 * @param cell The CSV cell value.
 * @returns The numeric value, or NaN when the cell is not numeric.
 */
function cellToNumber(cell: unknown): number {
  return typeof cell === 'number' ? cell : Number.parseFloat(String(cell));
}

function getValueByKey(lines: unknown[][], key: string): unknown {
  const line = lines.find(subArray => subArray[0] === key);
  if (!line) return undefined;
  const values = line.slice(1).filter(value => value !== null);
  if (values.length === 1) return values[0];
  if (values.length > 0) return values;
  return undefined;
}

async function parseCsvString(csvFileContent: string): Promise<MrtExamDefinitionInterface> {
  const trialList: MrtTrialInterface[] = [];
  const lines = await parseCSVAsync(csvFileContent);

  const outputChannelValue = getValueByKey(lines, 'OUTPUT CHANNELS');
  const outputChannel = outputChannelValue ? processOutputChannelValue(outputChannelValue) : mrtSchema.properties.outputChannel.default;
  const randomizeTrials = Boolean(getValueByKey(lines, 'RANDOMIZE TRIALS') ?? mrtSchema.properties.randomizeTrials.default);
  const randomizeChoices = Boolean(getValueByKey(lines, 'RANDOMIZE CHOICES') ?? mrtSchema.properties.randomizeChoices.default);

  const trialsIndex = lines.findIndex(line => String(line[0]).startsWith('{TRIALS')) + 1;
  const header = lines[trialsIndex];
  const expectedHeaderPositions: Record<string, number> = {
    FILENAME: 1,
    'LEVEL DBSPL': 2,
    'USE META RMS': 3,
    CHOICES: 4,
    ANSWER: 5,
    SNR: 6,
  };
  validateHeaders(header, expectedHeaderPositions);
  for (const line of lines.slice(trialsIndex + 1)) {
    if (line.length >= 6) {
      trialList.push({
        filename: String(line[1]).trim(),
        leveldBSpl: await parseLeveldBSpl(line),
        useMeta: Boolean(line[3]),
        choices: String(line[4])
          .trim()
          .split(',')
          .map((choice: string) => choice.trim()),
        answer: cellToNumber(line[5]),
        SNR: cellToNumber(line[6]),
      });
    }
  }

  return { trialList, outputChannel, randomizeTrials, randomizeChoices };
}

async function parseLeveldBSpl(line: unknown[]) {
  const cell = line[2];
  if (typeof cell === 'number') {
    return [cell];
  }
  if (typeof cell === 'string') {
    return [Number.parseInt(cell.split(',')[0]), Number.parseInt(cell.split(',')[1])];
  }
  throw new Error('Failed to parse leveldBSpl from MRT csv');
}

export async function loadMrtExamCsv(responseArea: MrtExamInterface, meta: ProtocolMetaInterface): Promise<MrtExamInterface> {
  let csvString;
  if (meta.server == ProtocolServer.Developer) {
    const csvFilePath = 'assets/' + meta.path + '/' + responseArea.examDefinitionFilename;
    const resp = await fetch(csvFilePath);
    if (!resp.ok) {
      throw new Error(`Failed to fetch the file: ${resp.statusText}`);
    }
    csvString = await resp.text();
  } else if (meta.server === ProtocolServer.LocalServer || meta.server === ProtocolServer.Gitlab) {
    const resp = await TabsintFs.readFile({ rootUri: meta.contentURI, filePath: responseArea.examDefinitionFilename });
    csvString = resp?.content;
  }

  if (csvString) {
    const mrtExamDefinition = await parseCsvString(csvString);
    return { ...responseArea, ...mrtExamDefinition };
  } else {
    throw new Error('Error processing MRT page: No CSV content found.');
  }
}
