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
