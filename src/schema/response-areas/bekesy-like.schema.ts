import { JSONSchemaType } from 'ajv';
import { BekesyLikeResponseAreaInterface } from '../../app/views/response-area/response-areas/bekesy-like/bekesy-like.interface';
import {
  AudiometryDevForm,
  AudiometryHideExamProps,
  AudiometryLevelUnits,
  AudiometryMaskingShape,
  AudiometryOutputChannel,
} from '../../app/views/response-area/response-areas/shared/audiometry/audiometry.interface';

export const bekesyLikeSchema: JSONSchemaType<BekesyLikeResponseAreaInterface> = {
  type: 'object',
  description: 'CHA - Bekesy Like Level Audiometry',
  properties: {
    type: { type: 'string', enum: ['bekesyLikeResponseArea'] },
    enableSkip: { type: 'boolean', nullable: true, default: false },
    responseRequired: { type: 'boolean', nullable: true, default: false },
    tabsintId: { type: 'string', nullable: true },
    autoSubmit: {
      type: 'boolean',
      nullable: true,
      default: false,
      description: 'Go straight to next page once this page is complete',
    },
    autoBegin: {
      type: 'boolean',
      nullable: true,
      default: false,
      description: "Go straight into the exam, without having to press the 'Begin' button.",
    },
    exportToCSV: {
      type: 'boolean',
      nullable: true,
      default: false,
      description: 'Whether result should be exported to CSV upon submitting exam results.',
    },
    examInstructions: {
      type: 'string',
      nullable: true,
      description: 'Replaces the top-level instruction text on the CHA exam pages.',
    },
    resultMainText: {
      type: 'string',
      nullable: true,
      default: 'Exam complete, press submit.',
      description: 'Replaces the questionMainText text while presenting results.',
    },
    resultSubText: {
      type: 'string',
      nullable: true,
      default: '',
      description: 'Replaces the questionSubText text while presenting results.',
    },
    examProperties: {
      type: 'object',
      nullable: true,
      properties: {
        // BekesyLike-specific level tracking
        ReversalDiscard: {
          type: 'integer',
          nullable: true,
          default: 2,
          minimum: 0,
          maximum: 10,
          description: 'Reversals to discard.',
        },
        ReversalKeep: {
          type: 'integer',
          nullable: true,
          default: 6,
          minimum: 2,
          maximum: 10,
          multipleOf: 2,
          description: 'Reversals to keep. Must be even.',
        },
        IncrementStart: {
          type: 'number',
          nullable: true,
          default: 4,
          minimum: 1,
          maximum: 20,
          description: 'Increment between presentations until first reversal, in dB.',
        },
        IncrementNominal: {
          type: 'number',
          nullable: true,
          default: 2,
          minimum: 0.01,
          maximum: 20,
          description: 'Increment after first reversal, in dB.',
        },

        // Audiometry Level
        F: { type: 'number', nullable: true, default: 1000, minimum: 1, maximum: 32000, description: 'Tone frequency, in Hz.' },
        Lstart: { type: 'number', nullable: true, default: 40, description: 'Starting presentation level, in LevelUnits.' },
        MaximumOutputLevel: {
          type: 'number',
          nullable: true,
          description: 'Maximum level that could be presented during exam (set by calibration).',
        },
        MinimumOutputLevel: {
          type: 'number',
          nullable: true,
          description: 'Minimum reportable threshold that can be measured during exam (set by calibration).',
        },

        // Audiometry
        LevelUnits: {
          type: 'string',
          enum: Object.values(AudiometryLevelUnits),
          nullable: true,
          default: AudiometryLevelUnits.dbHl,
          description: 'Units the presentation level is expressed in.',
        },
        ToneRepetitionInterval: {
          type: 'number',
          nullable: true,
          default: 450,
          minimum: 450,
          maximum: 2000,
          description: 'Rate tones are presented, in ms.',
        },
        PresentationMax: {
          type: 'number',
          nullable: true,
          default: 20,
          minimum: 1,
          maximum: 200,
          description: 'Max number of presentations.',
        },
        UnresponsiveMax: {
          type: 'number',
          nullable: true,
          default: 5,
          minimum: 1,
          maximum: 200,
          description:
            'Number of repeated presentations at either the minimum presentation level or MaximumOutputLevel (or the min/max frequencies for the frequency exams) that will halt an exam.',
        },
        UseSoftwareButton: {
          type: 'boolean',
          nullable: true,
          default: false,
          description: 'Uses the on-screen software response button instead of a mechanical button.',
        },
        BypassCalibrationLimit: {
          type: 'boolean',
          nullable: true,
          default: false,
          description: 'Ignores calibration-specified maximum output level when TRUE.',
        },

        // Tone Generation
        OutputChannel: {
          type: 'string',
          enum: Object.values(AudiometryOutputChannel),
          nullable: true,
          default: AudiometryOutputChannel.HPL0,
          description: 'Channel to play tone on.',
        },
        ToneDuration: {
          type: 'number',
          nullable: true,
          default: 225,
          minimum: 0,
          maximum: 680,
          description: 'Length of tone.',
        },
        ToneRamp: {
          type: 'number',
          nullable: true,
          default: 25,
          minimum: 20,
          maximum: 50,
          description: 'Duration of tone ramp up and down.',
        },
        UseWavFile: {
          type: 'boolean',
          nullable: true,
          default: false,
          description: 'If True, determine if a wav file exists for the requested OutputChannel and other parameters.',
        },
        UseNthOctave: {
          type: 'boolean',
          nullable: true,
          default: false,
          description: 'Test with pure/warble tones (False) or octave band noise (True).',
        },
        OctaveBandSize: {
          type: 'number',
          nullable: true,
          default: 8,
          minimum: 1,
          maximum: 12,
          description: 'Width of noise to generate if UseNthOctave is True. This is denominator.',
        },
        FDev: {
          type: 'number',
          nullable: true,
          default: 5.7,
          minimum: 1.5,
          maximum: 60,
          description: 'Frequency modulation deviation about nominal frequency.',
        },
        FDevForm: {
          type: 'string',
          enum: Object.values(AudiometryDevForm),
          nullable: true,
          default: AudiometryDevForm.None,
          description: 'Frequency modulation functional form.',
        },
        FDevRate: {
          type: 'number',
          nullable: true,
          default: 20,
          minimum: 4,
          maximum: 20,
          description: 'Frequency modulation rate.',
        },
      },
      required: [],
    },

    // Audiometry Response Area
    repeatIfFailedOnce: {
      type: 'boolean',
      nullable: true,
      description: 'Repeat frequency if fails to converge',
      default: false,
    },
    getNotesIfFailedTwice: {
      type: 'boolean',
      nullable: true,
      description: 'Ask for researcher notes if repeat fails to converge',
      default: false,
    },
    showMessageIfNoResponse: {
      type: 'boolean',
      nullable: true,
      description:
        'If true, if the listener did not press the software button ONCE during an audiometry exam, show them a message about it.  The message is noButtonPressMessage.',
      default: false,
    },
    noResponseCustomMessage: {
      type: 'string',
      nullable: true,
      description: 'The Message to show the user if they did not press the software button ONCE during an audiometry exam.',
      default: 'It looks like you did not press the button at all during the last test. Please make sure to press the button if you hear any sound.',
    },
    hideExamProperties: {
      type: 'string',
      nullable: true,
      enum: Object.values(AudiometryHideExamProps),
      description: 'Hide the parameters of the audiometry test (i.e. Frequency, Level, Ear) before and/or during a test.',
      default: AudiometryHideExamProps.Always,
    },
    plotProperties: {
      type: 'object',
      nullable: true,
      properties: {
        displayAudiogram: {
          type: 'array',
          items: { type: 'string' },
          nullable: true,
          default: [],
          description: 'An array of strings, used to match page ids, to select which results are plotted on a combined audiogram.',
        },
        displayLevelProgression: {
          type: 'boolean',
          nullable: true,
          default: false,
          description: 'If true, turn on plotting of the level progression for an individual exam.',
        },
        displayFrequencyProgression: {
          type: 'boolean',
          enum: [false],
          nullable: true,
          default: false,
          description:
            'Unused by Bekesy Like (a single fixed frequency is tested, so always false); present for type compatibility with the shared PlotProperties interface.',
        },
      },
      required: [],
    },

    // Masking Noise Properties
    maskingNoise: {
      type: 'object',
      nullable: true,
      properties: {
        Type: {
          type: 'string',
          nullable: true,
          description: 'Base shape of noise spectrum.',
          enum: Object.values(AudiometryMaskingShape),
          default: AudiometryMaskingShape.White,
        },
        BandpassCenterFrequency: {
          type: 'number',
          nullable: true,
          description: 'Center frequency for the noises bandpass filter, if zero no filtering is applied.',
          default: 0,
        },
        BandpassOctaveWidth: {
          type: 'number',
          nullable: true,
          description: 'Width of the pass-band in octaves.  Range 1/24 - 6',
          default: 1,
          maximum: 6,
          minimum: 0.04166,
        },
        Ear: {
          type: 'integer',
          nullable: true,
          description: 'Channel to be used for the noise 0=Left, 1=Right, 2=Both',
          enum: [0, 1, 2],
          default: 2,
        },
        Level: {
          type: 'array',
          nullable: true,
          description: 'Level in dB SPL of the noise [Left_Ear Right_Ear], ignored for non-specified Ear.  dB SPL',
          items: {
            type: 'integer',
            default: 30,
          },
          minItems: 2,
          maxItems: 2,
        },
      },
      required: [],
    },
  },
  required: ['type'],
};
