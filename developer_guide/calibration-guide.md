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
2. Add the correct hardware options (tablet and headset) to the protocol.json file.
3. Pass the protocol.json along with the raw wav files to the MATLAB processor in a zip format.
4. Generate the calibrated protocol. The response will contain the original protocol.json file, calibrated wav files, and a new calibration.json file that contains scale and playback information for each of the wav files.

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

### Example Calibration Block with Headset and Tablet

```
"Tablet": "TabE",
"headset": "VicFirth",
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

# Tabsint Calulcation

At playback, TabSINT interprets the information given in the wav files object on the protocol page and the corresponding scaling information in the calibration.json file in order to calculate the correct playback volume to achieve the desired output level.
