import * as fs from 'fs';
import { MrtPresentationInterface } from '../views/response-area/response-areas/mrt/mrt-exam/mrt-exam.interface';

export async function loadMrtExamCsv(csvFilePath: string): Promise<any> {
    const examData: any = {};
    const presentationList: MrtPresentationInterface[] = [];
  
    const lines = fs.readFileSync(csvFilePath, 'utf-8').split('\n').map(line => line.trim());
    const trialsIndex = lines.findIndex(line => line.startsWith('{TRIALS')) + 1;
  
    lines.slice(1, trialsIndex - 1).forEach(line => {
      const [key, value] = line.split('\t');
      if (key && value) {
        examData[key.trim()] = value.trim();
      }
    });
  
    lines.slice(trialsIndex).forEach((line, idx) => {
      if (idx === 0) return; // Skip the header row
  
      const columns = line.split('\t');
      if (columns.length >= 6) {
        presentationList.push({
          filename: columns[1].trim(),
          leveldBSpl: parseInt(columns[2].trim(), 10),
          useMeta: columns[3].trim().toLowerCase() === 'true',
          responseChoices: columns[4].trim().split(',').map(choice => choice.trim()),
          correctResponseIndex: parseInt(columns[5].trim(), 10),
        });
      }
    });
  
    return {
      presentationList,
      numWavChannels: parseInt(examData['NUMBER OF CHANNELS'], 10),
      outputChannel: examData['OUTPUT CHANNELS'].split(',').map((channel: string) => channel.trim()),
    };
  }
  