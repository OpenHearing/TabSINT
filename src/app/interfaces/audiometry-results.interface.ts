export enum EarChannel {
  Left = 'left',
  Right = 'right',
  BoneLeft = 'bone_left',
  BoneRight = 'bone_right',
  Mono = 'mono',
}

export interface AudiometryResultsInterface {
  frequencies: number[];
  thresholds: (number | null)[];
  channels: EarChannel[];
  resultTypes: string[];
  masking: boolean[];
  levelUnits: string;
}

export interface AudiogramDatumNoNullInterface {
  frequency: number;
  threshold: number;
  channel: EarChannel;
  resultType: string;
  masking: boolean;
}

export type RetsplsInterface = Record<string, number>;
