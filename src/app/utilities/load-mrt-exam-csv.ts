import * as Papa from 'papaparse';
import { TabsintFs } from 'tabsintfs';
import { mrtSchema } from '../../schema/response-areas/mrt.schema';
import { ProtocolMetaInterface } from '../models/protocol/protocol.interface';
import { MrtExamInterface, MrtTrialInterface } from '../views/response-area/response-areas/mrt/mrt-exam/mrt-exam.interface';
import { ProtocolServer } from './constants';

function parseCSVAsync(csvString: string) {
  return new Promise((resolve, reject) => {
    Papa.parse(csvString, {
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

function validateHeaders(actualHeaders: string[], expectedPositions: { [key: string]: number }) {
  for (const [expectedHeader, expectedIndex] of Object.entries(expectedPositions)) {
    if (actualHeaders[expectedIndex] !== expectedHeader) {
      throw new Error(
        `Header validation failed: Expected "${expectedHeader}" at index ${expectedIndex}, but found "${actualHeaders[expectedIndex]}"`
      );
    }
  }
}
function processOutputChannelValue(value: string): string | string[] {
  if (value.includes(',')) {
    return value.split(',').map(item => item.trim());
  }
  return value;
}

function getValueByKey(lines: any[][], key: string): any {
  const line = lines.find(subArray => subArray[0] === key);
  if (!line) return undefined;
  const values = line.slice(1).filter(value => value !== null);
  if (values.length === 1) return values[0];
  if (values.length > 0) return values;
  return undefined;
}

async function parseCsvString(csvFileContent: string): Promise<any> {
  const trialList: MrtTrialInterface[] = [];
  const lines: any[][] = (await parseCSVAsync(csvFileContent)) as any[][];

  const outputChannel = getValueByKey(lines, 'OUTPUT CHANNELS')
    ? processOutputChannelValue(getValueByKey(lines, 'OUTPUT CHANNELS'))
    : mrtSchema.properties.outputChannel.default;
  const randomizeTrials = getValueByKey(lines, 'RANDOMIZE TRIALS') ?? mrtSchema.properties.randomizeTrials.default;
  const randomizeChoices = getValueByKey(lines, 'RANDOMIZE CHOICES') ?? mrtSchema.properties.randomizeChoices.default;

  const trialsIndex = lines.findIndex(line => line[0].startsWith('{TRIALS')) + 1;
  const header = lines[trialsIndex];
  const expectedHeaderPositions: { [key: string]: number } = {
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
        filename: line[1].trim(),
        leveldBSpl: await parseLeveldBSpl(line),
        useMeta: line[3],
        choices: line[4]
          .trim()
          .split(',')
          .map((choice: string) => choice.trim()),
        answer: line[5],
        SNR: line[6],
      });
    }
  }

  return { trialList, outputChannel, randomizeTrials, randomizeChoices };
}

async function parseLeveldBSpl(line: any[]) {
  let level: Array<number>;
  try {
    level = typeof line[2] === 'number' ? [line[2]] : [parseInt(line[2].split(',')[0]), parseInt(line[2].split(',')[1])];
  } catch {
    throw new Error('Failed to parse leveldBSpl from MRT csv');
  }
  return level;
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
