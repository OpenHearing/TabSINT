import { MrtResultsInterface, MrtTrialResultInterface } from './mrt-exam.interface';

/**
 * Group a flat per-trial result list by SNR into per-condition aggregate stats.
 * @param trialListResults The raw per-trial results accumulated during the exam.
 */
export function gradeMrtExam(trialListResults: MrtTrialResultInterface[]): MrtResultsInterface[] {
  return Object.values(
    trialListResults.reduce(
      (acc, trial) => {
        const snr = trial.SNR;
        if (!acc[snr]) {
          acc[snr] = { snr, nbTrials: 0, nbTrialsCorrect: 0, pctCorrect: 0, trialList: [] };
        }
        acc[snr].trialList.push(trial);
        acc[snr].nbTrials++;
        if (trial.isCorrect) {
          acc[snr].nbTrialsCorrect++;
        }
        acc[snr].pctCorrect = parseFloat(((acc[snr].nbTrialsCorrect / acc[snr].nbTrials) * 100).toFixed(1));
        return acc;
      },
      {} as Record<number, MrtResultsInterface>
    )
  );
}
