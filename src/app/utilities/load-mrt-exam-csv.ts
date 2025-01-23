import * as fs from 'fs';
import { MrtTrialInterface } from '../views/response-area/response-areas/mrt/mrt-exam/mrt-exam.interface';

export async function loadMrtExamCsv(csvFilePath: string): Promise<any> {
    const examData: any = {};
    const trialList: MrtTrialInterface[] = [];

    const temp = [
      {
        "filename": "F1_b01_w1.wav",
        "leveldBSpl": 88,
        "useMeta": true,
        "choices": ["bar", "tar", "car", "far", "gar", "par"],
        "answer": 1,
        "SNR": -2
      },
      {
        "filename": "F1_b01_w2.wav",
        "leveldBSpl": 88,
        "useMeta": true,
        "choices": ["bar", "tar", "car", "far", "gar", "par"],
        "answer": 2,
        "SNR": 1
      },
      {
        "filename": "F1_b02_w1.wav",
        "leveldBSpl": 88,
        "useMeta": true,
        "choices": ["slip", "trip", "lip", "nip", "blib", "ship"],
        "answer": 1,
        "SNR": -5
      },
      {
        "filename": "F1_b02_w2.wav",
        "leveldBSpl": 88,
        "useMeta": true,
        "choices": ["slip", "trip", "lip", "nip", "blib", "ship"],
        "answer": 2,
        "SNR": -8
      },
      {
        "filename": "M1_b01_w1.wav",
        "leveldBSpl": 88,
        "useMeta": true,
        "choices": ["bar", "tar", "car", "far", "gar", "par"],
        "answer": 1,
        "SNR": -11
      }
    ];
    
  
    // const lines = fs.readFileSync(csvFilePath, 'utf-8').split('\n').map(line => line.trim());
    // const trialsIndex = lines.findIndex(line => line.startsWith('{TRIALS')) + 1;
  
    // lines.slice(1, trialsIndex - 1).forEach(line => {
    //   const [key, value] = line.split('\t');
    //   if (key && value) {
    //     examData[key.trim()] = value.trim();
    //   }
    // });

    // // Extract the header row and validate column names
    // const header = lines[trialsIndex].split('\t').map(column => column.trim().toUpperCase());
    // const expectedHeaders = ["FILENAME", "LEVEL DBSPL", "USE META", "CHOICES", "ANSWER", "SNR"];
    
    // if (!expectedHeaders.every((expected, i) => header[i] === expected)) {
    //   throw new Error(`Invalid header row. Expected: ${expectedHeaders.join(', ')}, but got: ${header.join(', ')}`);
    // }
    
    // lines.slice(trialsIndex).forEach((line, idx) => {  
    //   const columns = line.split('\t');
    //   if (columns.length >= 6) {
    //     trialList.push({
    //       filename: columns[1].trim(),
    //       leveldBSpl: parseInt(columns[2].trim(), 10),
    //       useMeta: columns[3].trim().toLowerCase() === 'true',
    //       choices: columns[4].trim().split(',').map(choice => choice.trim()),
    //       answer: parseInt(columns[5].trim(), 10),
    //       SNR: parseInt(columns[6].trim(), 10),
    //     });
    //   }
    // });
  
    return {
      trialList: temp, //trialList,
      numWavChannels: 2, //parseInt(examData['NUMBER OF CHANNELS'], 10) ?? 1,
      outputChannel: 'HPL0', //examData['OUTPUT CHANNELS'].split(',').map((channel: string) => channel.trim()) ?? 'HPL0',
    };
  }
  