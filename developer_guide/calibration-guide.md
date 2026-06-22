# Introduction

All sound files used in exams with non-WAHTS devices, or streamed to the WAHTS via Bluetooth, must be calibrated for the tablet and headset hardware. This enables high-quality playback with flat frequency response at a known absolute or relative level on any TabSINT device.

During calibration, the waveform in each sound file is:

1. Analyzed so that it may be played back at a specified absolute or relative level.
2. Resampled to the hardware optimal sampling rate (48 kHz).
3. Scaled to maximize the available dynamic range on playback (16 bit).
4. Filtered to compensate for the hardware frequency response.

Because the calibration is hardware-specific, each hardware combination (headset and tablet) must use protocol sound files calibrated specifically for that hardware combination.

# Generation

To generate a calibrated protocol, a protocol developer would:

1. Write the protocol.json file for TabSINT, including the calibration block that defines the calibration to be completed.
2. Pass the protocol.json along with the raw wav files in a zip format to the MATLAB processor and specify hardware arguments.

- Hardware options (tablet and headset) should no longer be defined in the protocol.json and instead should be passed as arguments to the calibration function.

3. Generate the calibrated protocol. The response will contain the original protocol.json file, calibrated wav files, and a new calibration.json file that contains scale and playback information for each of the wav files.

The MATLAB processor can be found in the Calibration repository in the MATLAB Server branch. The repository provides a detailed instruction set for calibration generation in the README.txt file.

# Protocol Specifications

## Calibration Block

Before calibration can be defined for a given sound file, you must consider how the file will be played back. TabSINT can play sound files at a specified level, either absolute or relative to a reference file and possibly modified by a standard audiometric weighting function.
There are two distinct playback modes:

1. Arbitrary. In this case a sound file is played with a volume such that the A, C, or Z weighted LEQ of the output is equal to a specified target.
2. As-Recorded. In this case, a reference sound file with a known, fixed LEQ (specified at upload time) must accompany the target sound file. The playback volume is calculated such that the output LEQ of the reference file would be equal to the known value, then the target sound file is played at that volume. This allows playback at real world recorded levels.

Every protocol.json file that includes sound files must include exactly one calibration block that lists all the sound files which are to be used. The calibration block is an array of one or more “wavfiles” blocks with different categories of accompanying data, but each individual wav file may only be included once. Note that TabSINT only accepts sound files in the wav format. These files must be included in the protocol zip archive, either in the root directory or sub-directories.

The way a sound file is calibrated is inferred from the accompanying data in the calibration block at upload time. The two categories of accompanying data and their valid playback modes (set in the exam pages) are:

### Calibration Methods and Required Accompanying Data

| Calibration Mode | Required Accompanying Data             | Allowable Playback Mode(s) |
| ---------------- | -------------------------------------- | -------------------------- |
| 1                | None                                   | arbitrary                  |
| 2                | referenceFile, referenceLevel (db SPL) | arbitrary, as-recorded     |

### Example Calibration Block

```
"calibration": [
   {
     "wavfiles": ["arbitrarySound1.wav"]
   },
   {
     "wavfiles": [
      "soundfiles/asRec/sound1.wav",
      "soundfiles/asRec/sound2.wav" ],
     "referenceFile": "soundfiles/asRec/referenceSound.wav",
     "referenceLevel": 70
   }
]
```

## Playback Block

Playback is defined by “wavfiles” blocks within the exam pages in which the files are used. Different information is required at playback time for the two playback modes. The table below summarizes the required, optional, and disallowed inputs for each mode. To play multiple files simultaneously, simply list them together as shown in the “asRec1” page example below.

### Input Fields Allowed for Each Playback Method

For arbitrary playback, targetSPL and weighting apply directly to the audio output. For as-recorded, they apply to the reference file.

| Input Field    | Default | Arbitrary | As-recorded |
| -------------- | ------- | --------- | ----------- |
| path           | --      | Required  | Required    |
| playbackMethod | --      | Required  | Required    |
| targetSPL      | --      | Required  | Disallowed  |
| weighting      | Z       | Optional  | Disallowed  |
| startTime      | 0       | Optional  | Optional    |
| endTime        | inf     | Optional  | Optional    |

### Example Wavfile Blocks

```
"pages": [
   {
     "id":"arb1",
     "title":"Playback arbitrary 1",
     "questionMainText":"Playing arbitrary 1.",
     "wavfiles": [
      {
        "path":"arbitrarySound1.wav",
        "playbackMethod":"arbitrary",
        "targetSPL":"94",
        "weighting":"A"
      }
     ]
   },
   {
     "id":"asRec1",
     "title":"Playback as-recorded mix",
     "questionMainText":"Playing as-recorded mix.",
     "wavfiles": [
      {
        "path":"soundfiles/asRec/sound1.wav",
        "playbackMethod":"as-recorded"
      },
      {
        "path":"soundfiles/asRec/sound2.wav",
        "playbackMethod":"as-recorded"
      }
     ]
   }
]
```

# Calibration Specifications

The generated calibration file is made up of two main parts: general calibration metadata and wavfile specific calibration information. Each wavfile will have a wavfile specific calibration portion which uses the relative wavfile path as a key.

## General Calibration Metadata

The general calibration metadata portion of the file contains the following properties.

### Properties

- tablet: The tablet for which the calibration was generated.

- headset: The headset for which the calibration was generated.

- calibrationPySVNRevision: The SVN revision number, or Git commit hash, associated with the calibration repository.

- calibrationPyManualReleaseDate: The release date of the calibration repository following major code changes.

- audioProfileVersion: The release date of the hardware (tablet and headset) profile used to generate the calibration.

## Wavfile Specific Information

The wavfile specific portions of the file contain the following properties depending on playback method.

### Properties

- refType: The reference type for the wavfile. The reference type of 'as-recorded' can be used for as-recorded or arbitrary playback, while the reference type of 'none' can only be used for arbitrary playback.

- calibrationFilter: The filtering mode which the calibration used. In a "full" calibration, the sound file is filtered for the frequency response of the specified headset. In a “flat” calibration, the sound file is not filtered, and levels are calculated based on the hardware response at 1 kHz. The default calibration filter is "full".

- normFactor: The cumulative normalization factor for all scaling.

- scaleFactor: RMS output for a 1 kHz full scale input (Pa^-1).

- RMSA: A-weighted RMS of input signal.

- RMSC: C-weighted RMS of input signal.

- RMSZ: Z-weighted RMS of input signal.

- wavRMSA: A-weighted RMS of input signal multiplied by the norm factor.

- wavRMSC: C-weighted RMS of input signal multiplied by the norm factor.

- wavRMSZ: Z-weighted RMS of input signal multiplied by the norm factor.

- realWorldRMSA: A-weighted RMS of input signal multiplied by a calibration factor based on the reference file.

- realWorldRMSC: C-weighted RMS of input signal multiplied by a calibration factor based on the reference file.

- realWorldRMSZ: Z-weighted RMS of input signal multiplied by a calibration factor based on the reference file.

### Output Properties for each Playback Method

| Output Property   | Arbitrary                        | As-recorded               |
| ----------------- | -------------------------------- | ------------------------- |
| refType           | String ('none' or 'as-recorded') | String ('as-recorded')    |
| calibrationFilter | String ('full' or 'flat')        | String ('full' or 'flat') |
| normFactor        | Number                           | Number                    |
| scaleFactor       | Number                           | Number                    |
| RMSA              | Number                           | Number                    |
| RMSC              | Number                           | Number                    |
| RMSZ              | Number                           | Number                    |
| wavRMSA           | Number                           | Number                    |
| wavRMSC           | Number                           | Number                    |
| wavRMSZ           | Number                           | Number                    |
| realWorldRMSA     | --                               | Number                    |
| realWorldRMSC     | --                               | Number                    |
| realWorldRMSZ     | --                               | Number                    |

## Example Calibration File

```
{
  "tablet": "TabE",
  "headset": "VicFirth",
  "calibrationPySVNRevision": "unavailable",
  "calibrationPyManualReleaseDate": 20150702,
  "audioProfileVersion": "07-Feb-2017 12:49:51",
  "arbitrarySound1.wav": {
    "refType": "none",
    "RMSC": 0.007071481196889967,
    "calibrationFilter": "full",
    "wavRMSC": 0.7324163161077805,
    "wavRMSA": 0.7316058261454568,
    "RMSA": 0.0070636559144613914,
    "wavRMSZ": 0.7324048259020318,
    "RMSZ": 0.007071370258927345,
    "normFactor": 103.57325370954769,
    "scaleFactor": 0.6002726824369483
  },
  "soundfiles/asRec/sound1.wav": {
    "refType": "as-recorded",
    "RMSC": 0.004632523322653096,
    "realWorldRMSA": 0.04818818618743877,
    "RMSA": 0.0042850703538235635,
    "wavRMSC": 0.10563137909380696,
    "wavRMSA": 0.09770871282503113,
    "calibrationFilter": "full",
    "wavRMSZ": 0.11098459357806292,
    "normFactor": 22.802125696220077,
    "RMSZ": 0.004867291543632746,
    "realWorldRMSZ": 0.05473561266592412,
    "realWorldRMSC": 0.05209550321395992,
    "scaleFactor": 0.13519823071552697
  },
  "soundfiles/asRec/sound2.wav": {
    "refType": "as-recorded",
    "RMSC": 0.017235183834142038,
    "realWorldRMSA": 0.15586262558051883,
    "RMSA": 0.013859876641679463,
    "wavRMSC": 0.09837269415436932,
    "wavRMSA": 0.07910756386527934,
    "calibrationFilter": "full",
    "wavRMSZ": 0.10403545692222917,
    "normFactor": 5.7076672405140192,
    "RMSZ": 0.018227316439151764,
    "realWorldRMSZ": 0.2049771055645482,
    "realWorldRMSC": 0.19381997936936746,
    "scaleFactor": 0.13519823071552697
  }
}
```

# Tabsint Calculation

At playback, TabSINT interprets the information given in the wav files object on the protocol page and the corresponding scaling information in the calibration.json file in order to calculate the correct playback volume to achieve the desired output level.
