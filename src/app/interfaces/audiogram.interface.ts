export interface AudiogramDataStructInterface {
    frequencies: number[],
    thresholds: (number|null)[],
    channels: string[],
    resultTypes: string[],
    masking: boolean[]
  }
  
export interface AudiogramDataNoNullInterface {
    frequency: number,
    threshold: number,
    channel: string,
    resultType: string,
    masking: boolean
  }
  