import { mrtSchema } from '../../schema/response-areas/mrt.schema';
import { MrtTrialInterface } from '../views/response-area/response-areas/mrt/mrt-exam/mrt-exam.interface';
import * as Papa from 'papaparse';

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

function validateHeaderPositions(actualHeaders: string[], expectedPositions: { [key: string]: number }) {
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

export async function parseMrtExamCsv(csvFileContent: string): Promise<any> {
  const trialList: MrtTrialInterface[] = [];

    // const resp = await TabsintFs.readFile({rootUri:filePath,filePath:csvFileName}); //fs.readFileSync(csvFilePath, 'utf-8').split('\n').map(line => line.trim());
    // const lines = csvFileContent.split('\n').map(line => line.trim()); //JSON.parse(csvFileContent);

  const lines: any[][] = await parseCSVAsync(csvFileContent) as any[][];

  const numWavChannels = getValueByKey(lines, 'NUMBER OF CHANNELS') ?? mrtSchema.properties.numWavChannels.default;
  const outputChannel = getValueByKey(lines, 'OUTPUT CHANNELS') 
    ? [getValueByKey(lines, 'OUTPUT CHANNELS')]
    : mrtSchema.properties.outputChannel.default;
  const randomizeTrials = getValueByKey(lines, 'RANDOMIZE TRIALS') ?? mrtSchema.properties.randomizeTrials.default;  

  const trialsIndex = lines.findIndex((line) => line[0].startsWith('{TRIALS')) + 1;
 
  const header = lines[trialsIndex]; // Extract the header row
  const expectedHeaderPositions: { [key: string]: number } = {
    'FILENAME': 1,
    'LEVEL DBSPL': 2,
    'USE META RMS': 3,
    'CHOICES': 4,
    'ANSWER': 5,
    'SNR': 6
  };  
  validateHeaderPositions(header, expectedHeaderPositions);

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