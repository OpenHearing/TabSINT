export interface AudiometryResultsInterface {
    frequencies: number[],
    thresholds: (number|null)[],
    channels: string[],
    resultTypes: string[],
    masking: boolean[],
    levelUnits: string
  }
  
export interface AudiogramDatumNoNullInterface {
    frequency: number,
    threshold: number,
    channel: string,
    resultType: string,
    masking: boolean
  }
  
export interface RetsplsInterface {
  [key: string]: number
}
