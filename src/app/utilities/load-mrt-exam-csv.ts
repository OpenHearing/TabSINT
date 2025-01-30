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
      complete: (results) => {
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
      throw new Error(`Header validation failed: Expected "${expectedHeader}" at index ${expectedIndex}, but found "${actualHeaders[expectedIndex]}"`);
    }
  }
}

function getValueByKey(lines: any[][], key: string): any {
  const line = lines.find((subArray) => subArray[0] === key);
  return line ? line[1] : undefined;
}

async function parseCsvString(csvFileContent: string): Promise<any> {
  const trialList: MrtTrialInterface[] = [];
  const lines: any[][] = await parseCSVAsync(csvFileContent) as any[][];

  const numWavChannels = getValueByKey(lines, 'NUMBER OF CHANNELS') ?? mrtSchema.properties.numWavChannels.default;
  const outputChannel = getValueByKey(lines, 'OUTPUT CHANNELS') 
    ? [getValueByKey(lines, 'OUTPUT CHANNELS')]
    : mrtSchema.properties.outputChannel.default;
  const randomizeTrials = getValueByKey(lines, 'RANDOMIZE TRIALS') ?? mrtSchema.properties.randomizeTrials.default;  

  const trialsIndex = lines.findIndex((line) => line[0].startsWith('{TRIALS')) + 1; 
  const header = lines[trialsIndex];
  const expectedHeaderPositions: { [key: string]: number } = {
    'FILENAME': 1,
    'LEVEL DBSPL': 2,
    'USE META RMS': 3,
    'CHOICES': 4,
    'ANSWER': 5,
    'SNR': 6
  };  
  validateHeaders(header, expectedHeaderPositions);

  lines.slice(trialsIndex+1).forEach((line: any[], idx: number) => {  
    if (line.length >= 6) {
      trialList.push({
        filename: line[1].trim(),
        leveldBSpl: line[2],
        useMeta: line[3],
        choices: line[4].trim().split(',').map((choice: string) => choice.trim()),
        answer: line[5],
        SNR: line[6]
      });
    }
  });
    
  return {
    trialList,
    numWavChannels,
    outputChannel,
    randomizeTrials
  };
}

export async function loadMrtExamCsv(responseArea: MrtExamInterface, meta: ProtocolMetaInterface): Promise<MrtExamInterface> {
  let csvString;
  const csvFilePath = '../../protocols/' + meta.name + '/' + responseArea.examDefinitionFilename;
  if (meta.server == ProtocolServer.Developer) {
    try {
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
      const resp = await TabsintFs.readFile({rootUri: meta.contentURI, filePath: responseArea.examDefinitionFilename});
      csvString = resp?.content;
  }
  
  if (csvString) {
    try {
      const mrtExamDefinition = await parseCsvString(csvString);
      return { ...responseArea, ...mrtExamDefinition };
    } catch (error) {
      console.log('Error parsing MRT CSV string: ', error);
      throw error;
    }
  } else {
    throw new Error('Error processing MRT page: No CSV content found.');
  }
}