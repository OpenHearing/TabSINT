export interface DosimeterResultsInterface {
  time: string;
  status: string;
  Leq: unknown;
  Frequencies: number[];
  LeqA: unknown;
  LeqB: unknown;
  LeqC: unknown;
}

export type DosimetryResultsInterface = DosimeterResultsInterface[];

export interface DosimeterDeviceResultsInterface {
  State: string;
  Channel_2: unknown;
  Channel_3: unknown;
  Channel_4: unknown;
}
