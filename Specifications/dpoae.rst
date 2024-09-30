DPOAE
========
This document describes the Distortion Product Otoacoustic Emissions examination.  The CHA emits tones at two frequencies and listens for a response.

Revision Table
--------------
.. list-table::
   :widths: 12 18 10 60
   :header-rows: 1

   * - No
     - Date
     - Initials
     - Note
   * - 1.0
     - 16 Mar 2012
     - WHF
     - Extracted from CHAPI document.
   * - 2.0
     - 8 May 2012
     - JAN
     - Updated the results to include the actual number of blocks averaged for computing DP and a caveat to the NoiseFloor calculation for low ratios and low frequencies.
   * - 2.1
     - 8 May 2012
     - WHF
     - Made a minor change to the description for MinTestAverages and MaxTestAverages parameters to reflect their usage in the implementation.
   * - 2.2
     - 19 July 2012
     - WHF
     - Added algorithm section.  Added TransientDiscard and DisableSpectrumDownload properties of TestDpoae.
   * - 2.3
     - 14 Jan 2013
     - JAN
     - Added acoustic requirements and first pass at test procedures.
   * - 2.4
     - 11 Feb 2013
     - JCW
     - Fixed a typo to bring in line with actual implementation.
   * - 2.5
     - 2 Sep 2014
     - JAN
     - Added a note on allowable ranges for the frequencies and levels.
   * - 2.6
     - 19 Nov 2014
     - JAN
     - Added **InputChannel** to test definition properties and updated the footnote to explicitly mention that outputs are on HPL0 and HPR0.  Also added the **Reference** section.
   * - 2.6.1
     - 9 Feb 2015
     - JAN
     - Clarified how min/max levels should be checked and used proper names per protocol calibration.rst at r3829.
   * - 2.7
     - 13 Oct 2015
     - LAM
     - Converted to restructured text.
   * - 2.7.1
     - 15 Oct 2015
     - JAN
     - Added a few references and switched to an image for ear simulator testing. Refer to images/DPOAE_EarSimulatorChecks.docx.
   * - 2.7.2
     - 24 Feb 2016
     - JCW
     - Removed restriction on enforcing MaxAverages that was inconsistent with both the rest of the spec and the implementation thereof.
   * - 3.0.0
     - 9 Mar 2016
     - CAB
     - Updated specification to explicitly define units for Averaging with Noise Rejection and Computing Noise Floor
   * - 3.1.0
     - 18 Mar 2016
     - JCW
     - Revised CAB's revision to 3.0.0 as it is a major change. Altered and simplified noise floor calculation. Clarified noise rejection off description. Parameterized noise floor calculation bandwidth. Specified signal level calculation. Haven't touched NR code yet.
   * - 3.1.1
     - 24 Mar 2016
     - CAB
     - Revised signal level calculation to reflect use of calibrated values in calculation. Revised noise level calculation to use calibrated signal magnitudes rather than uncalibrated power magnitudes.
   * - 3.1.2
     - 8 July 2016 
     - TMR
     - Fixed a property name to bring in line with actual implementation. 
   * - 3.1.3
     - 18 Apr 2017
     - TMR
     - Formatted Properties into table
   * - 3.1.4
     - 21 July 2017
     - TMR
     - Replacing bulleted step list for averaging with and without noise rejection with flowcharts
   * - 3.1.5
     - 8 Dec 2017
     - JAN
     - Corrected default L1, L2 levels to 65, 55, respectively.
   * - 3.1.6
     - 18 Jan 2019
     - CAB
     - Changed upper limit on NoiseHalfBandwidth to allow NoiseHalfBandwidth to be up to 7 FFT frequency bins on all platforms.
   * - 3.1.7
     - 4 June 2019
     - JAN
     - Update the ``Testing Procedures`` section to match :doc:`template </CHA/protocols/template>` 
   * - 3.1.8
     - 9 Dec 2019
     - WHF
     - Corrected units of TestDpoaeResults -> FftSpectrum to reflect implementation.
   * - 3.1.9
     - 10 Sept 2021
     - JAN
     - Revise to pull Automated CHAMI Testing from the associated .csv file.
   * - 3.1.10
     - 16 Feb 2023
     - CAB
     - Revise Noise Floor and Noise Rejection algorithm to address excessively low reported noise floor on OAESP and OAE-IPS2 devices.

References
----------
Related internal specifications
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
This specification references
"""""""""""""""""""""""""""""
#. :doc:`../api/index`

#. :doc:`calibration`

#. :doc:`tone generation`

This specification is referenced in the following
"""""""""""""""""""""""""""""""""""""""""""""""""
*No internal documents*

Literature
^^^^^^^^^^
.. [Kemp2002] Kemp, David T. "Otoacoustic emissions, their origin in cochlear function, and use." British medical bulletin 63.1 (2002): 223-241.
.. [Meinke2013] Meinke, Deanna K., et al. "Distortion product otoacoustic emission level maps from normal and noise-damaged cochleae." Noise and Health 15.66 (2013): 315
.. [Robinette2011] Robinette, Martin S., and Theodore J. Glattke, eds. Otoacoustic Emissions: Clinical Applications. Thieme, 2011.

The [Kemp2002]_, [Meinke2013]_, and [Robinette2011]_ provide background on DPOAEs.

Algorithm
---------
The DPOAE exam consists of four phases.

1.	**Lead in**.  The output tones are gradually increased in amplitude from zero to the desired value over 4.5 milliseconds.  Refer to :doc:`tone generation` for details.
2.	**Transient discard**.  During this phase, samples are discarded while the tones continue to be played.  The duration of this phase is configurable.
3.	**Averaging**.  The tones continue to play as microphone samples are taken and averaged.  This phase continues until an exit criteria is met.
4.	**Lead out**.  The tone amplitude is ramped down to zero over 4.5 milliseconds.  Refer to :doc:`tone generation` for details.

The figure below shows the relationship between the tone ramps, packets and test time.  Note that when noise rejection is enabled, the number of packets that will be required is unknown and is computed on the fly.

.. _DPOAE_Ramps:

.. figure:: ../images/DPOAE_Ramps.png
   :alt: Packets to be processed Ramp Up and Ramp Down
   :align: center

   *DPOAE Tone Presentation.  The tones are ramped up and down in volume at the beginning and ending of the test.  These ramp periods are in addition to the desired test time.*

Tone Generation
^^^^^^^^^^^^^^^
Before the exam can begin, the CHA must generate the F1 and F2 tones.  For each, the nearest frequency which can precisely fit into the desired block size is calculated using the formula:

	f_actual_Hz = floor(f_desired_Hz * BlockSize / FS + 0.5) * FS / BlockSize

Averaging without Noise Reduction
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
.. _dpoae-nr-off-flowchart:

.. figure:: ../images/DpoaeNoiseRejectionOff.png
   :align: center

   *DPOAE Logic - Noise Rejection OFF*

Averaging with Noise Reduction
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
With noise reduction active, blocks are included in the average only if they satisfy the noise rejection criteria.

.. _dpoae-nr-on-flowchart:

.. figure:: ../images/DpoaeNoiseRejectionOn.png
   :align: center

   *DPOAE Logic - Noise Rejection ON*

Computing Signal Magnitude and Level
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
A signal magnitude (in Pa) at a given frequency (f) is defined as the square root of the product of the FFT and its complex conjugate at that frequency, all multiplied by the appropriate calibration factor (in Pa per count). The signal level (in dB SPL) is defined as 20 log10 the quotient of the signal magnitude (in Pa) divided by 20 uPa.

Computing Noise Floor and Noise Floor Level
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
The noise floor (in Pa) is defined as the root mean square of the signal magnitude (in Pa) of the FFT over the bins of interest.  The bins of interest are the bins spanning the frequency range from NoiseHalfBandwidth below the frequency of interest to NoiseHalfBandwidth above the frequency of interest, *exclusive* of the freqeuency of interest.  The frequency of interest may be the DpLow frequency, F1, F2, or the DpHigh frequency.  If the DpLow frequency, F1, F2, or the DpHigh frequency lie within the NoiseHalfBandwidth of the current frequency of interest (e.g. F1 may be less than DpLow + NoiseHalfBandwidth), the FFT at that frequency is also excluded from the noise floor calculation.  The noise floor level (in dB SPL) is defined as 20 log10 the quotient of the noise floor (in Pa) divided by 20 uPa.

Implementation
--------------
CHA Interface Class Definitions
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
Defines the parameters that may be passed in and the results returned by CHA.  Refer to :doc:`../api/index` for a description of the higher level methods for executing these tests.

TestDpoae
"""""""""
This class represents the definition of a Distortion Product Otto Acoustic Emissions examination.

+----+-----------------------------------+--------+--------------------------+----------+
|Name                                    | Units  | Range                    | Default  |
+----+-----------------------------------+--------+--------------------------+----------+
|    | Description                       |        |                          |          |
+====+===================================+========+==========================+==========+
| **F1**                                 | Hz     | (See [1]_)               | 833.33   |
+----+-----------------------------------+--------+--------------------------+----------+
|    |  Frequency of F1, output to HPL0.          |                          |          |
+----+-----------------------------------+--------+--------------------------+----------+
| **F2**                                 | Hz     | (See [1]_)               | 1000     |
+----+-----------------------------------+--------+--------------------------+----------+
|    |  Frequency of F2, output to HPR0.          |                          |          |
+----+-----------------------------------+--------+--------------------------+----------+
| **L1** (See [1]_)                      | dB SPL | 0 - 85                   | 65       |
+----+-----------------------------------+--------+--------------------------+----------+
|    |  Amplitude of F1.                          |                          |          |
+----+-----------------------------------+--------+--------------------------+----------+
| **L2** (See [1]_)                      | dB SPL | 0 - 85                   | 55       |
+----+-----------------------------------+--------+--------------------------+----------+
|    |  Amplitude of F2.                          |                          |          |
+----+-----------------------------------+--------+--------------------------+----------+
| **InputChannel**                       | enum   | see :doc:`../api/index`  | 'SMICR0' |
+----+-----------------------------------+--------+--------------------------+----------+
|    |  Channel to measure.                       |                          |          |
+----+-----------------------------------+--------+--------------------------+----------+
| **MinTestAverages**                    | int    | 0 - 96e3*60/8192         | 60       |
+----+-----------------------------------+--------+--------------------------+----------+
|    |  Minimum number of blocks averaged into the|                          |          |
|    |  result before the test can end via the    |                          |          |
|    |  MinDpNoiseFloorThresh criterion.          |                          |          |
+----+-----------------------------------+--------+--------------------------+----------+
| **MaxTestAverages**                    | int    | 0 - 96e3*200/1024        | 120      |
+----+-----------------------------------+--------+--------------------------+----------+
|    |  Maximum number of blocks to consider for  |                          |          |
|    |  averaging; with noise rejection on, since |                          |          |
|    |  not every block is accepted, this may not |                          |          |
|    |  equal the actual number of averages at    |                          |          |
|    |  exam end.                                 |                          |          |
+----+-----------------------------------+--------+--------------------------+----------+
| **MinDpNoiseFloorThresh**              | dB SPL | 0 - 100                  | 10       |
+----+-----------------------------------+--------+--------------------------+----------+
|    |  When the low DP exceeds the noise floor   |                          |          |
|    |  in the surrounding ±NoiseHalfBandwidth Hz |                          |          |
|    |  bins by this amount, the test will        |                          |          |
|    |  conclude (provided the MinTestAverages    |                          |          |
|    |  have been met).                           |                          |          |
+----+-----------------------------------+--------+--------------------------+----------+
| **NoiseRejection**                     | bool   | True/false               | False    |
+----+-----------------------------------+--------+--------------------------+----------+
|    |  If true, the noise rejection algorithm is |                          |          |
|    |  applied to discard noisy data blocks.     |                          |          |
|    |  If false, all data is accepted.           |                          |          |
+----+-----------------------------------+--------+--------------------------+----------+
| **BlockSize**                          | samples| 1024, 2048, 4096,        | 8192     |
|                                        |        | 8192                     |          |
+----+-----------------------------------+--------+--------------------------+----------+
|    |  The number of samples in a block used for |                          |          |
|    |  the FFT.  Must be a power of 2.           |                          |          |
+----+-----------------------------------+--------+--------------------------+----------+
| **TransientDiscard**                   | ms     | 0 - 1000                 | 21.3     |
+----+-----------------------------------+--------+--------------------------+----------+
|    |  Initial period of data discarded at start |                          |          |
|    |  of tone.                                  |                          |          |
+----+-----------------------------------+--------+--------------------------+----------+
| **DisableSpectrum**                    | bool   | True/false               | False    |
+----+-----------------------------------+--------+--------------------------+----------+
|    |  If true, the raw FFT spectrum feature is  |                          |          |
|    |  disabled.  If false,  the spectrum is     |                          |          |
|    |  downloaded automatically.                 |                          |          |
+----+-----------------------------------+--------+--------------------------+----------+
| **NoiseHalfBandwidth**                 | Hz     | 30 -                     | 30       |
|                                        |        | (7*FS/BlockSize)         |          |
+----+-----------------------------------+--------+--------------------------+----------+
|    |  Bandwidth over which to calculate the     |                          |          |
|    |  noise floor.                              |                          |          |
+----+-----------------------------------+--------+--------------------------+----------+

..  [1] The frequencies and levels requested should be checked to ensure the values requested are within the "Frequency Channel Cal" and "MinMaxLevels" defined in the calibration protocol.  Values requested outside these allowable ranges should result in an exception being raised.


TestDpoaeResults
"""""""""""""""""""""
This class is returned from ProbeLink::getTestResults upon successful test completion.

.. rubric:: Properties


+----+----------------------------------------------+---------+---------------------+
|Name                                               | Units   | Range               |
+----+----------------------------------------------+---------+---------------------+
|    | Description                                  |         |                     |
+====+==============================================+=========+=====================+
| **DpLow**                                         |         |                     |
+----+----------------------------------------------+---------+---------------------+
|    |  The Distortion Product response at frequency          |                     |
|    |  2*F1Actual-F2Actual.  Instance of TestDpoaeValues.    |                     |
+----+----------------------------------------------+---------+---------------------+
| **DpHigh**                                        |         |                     |
+----+----------------------------------------------+---------+---------------------+
|    |  The Distortion Product response at frequency          |                     |
|    |  2*F2Actual-F1Actual.  Instance of TestDpoaeValues.    |                     |
+----+----------------------------------------------+---------+---------------------+
| **F1**                                            |         |                     |
+----+----------------------------------------------+---------+---------------------+
|    |  The observed response at F1.  Instance of             |                     |
|    |  TestDpoaeValues.                                      |                     |
+----+----------------------------------------------+---------+---------------------+
| **F2**                                            |         |                     |
+----+----------------------------------------------+---------+---------------------+
|    |  The observed response at F2.  Instance of             |                     |
|    |  TestDpoaeValues.                                      |                     |
+----+----------------------------------------------+---------+---------------------+
| **FftSpectrum**                                   | counts  |                     |
+----+----------------------------------------------+---------+---------------------+
|    |  An array of complex data representing the             |                     |
|    |  averaged, uncalibrated FFT spectrum.                  |                     |
+----+----------------------------------------------+---------+---------------------+
| **TestAverages**                                  | int     | 0 - 96e3*200/1024   |
+----+----------------------------------------------+---------+---------------------+
|    |  The actual number of blocks averaged into             |                     |
|    |  the result (important data for noise                  |                     |
|    |  rejection.)                                           |                     |
+----+----------------------------------------------+---------+---------------------+


TestDpoaeValues
"""""""""""""""
Each entry (excepting FftSpectrum and TestAverages) in the TestDpoaeResults class is an instance of this class.

.. rubric:: Properties

+----+-----------------------------------+--------+---------------------+
|Name                                    | Units  | Range               |
+----+-----------------------------------+--------+---------------------+
|    | Description                       |        |                     |
+====+===================================+========+=====================+
| **Frequency**                          | Hz     |                     |
+----+-----------------------------------+--------+---------------------+
|    |  The actual frequency of the measurement.  |                     |
|    |  This may vary slightly from the desired   |                     |
|    |  frequency due to the implementation of the|                     |
|    |  tone generation.                          |                     |
+----+-----------------------------------+--------+---------------------+
| **Amplitude**                          | dB SPL |                     |
+----+-----------------------------------+--------+---------------------+
|    |  The amplitude measured at the microphone  |                     |
|    |  at the **Frequency**.                     |                     |
+----+-----------------------------------+--------+---------------------+
| **Phase**                              | rad    |                     |
+----+-----------------------------------+--------+---------------------+
|    |  The phase measured at the microphone at   |                     |
|    |  the **Frequency**.                        |                     |
+----+-----------------------------------+--------+---------------------+
| **NoiseFloor**                         | dB SPL |                     |
+----+-----------------------------------+--------+---------------------+
|    |  The amplitude of the noise floor in the   |                     |
|    |  ±**NoiseHalfBandwidth** FFT               |                     |
|    |  frequencies [2]_ around the               |                     |
|    |  measurement frequency.  Only calculated   |                     |
|    |  for Distortion Products; others shall be  |                     |
|    |  zero.                                     |                     |
+----+-----------------------------------+--------+---------------------+

..  [2] The ±**NoiseHalfBandwidth** FFT Frequencies about the DpLow and DpHigh need to be checked to make sure that the bins included in the NoiseFloor average do not include F1 or F2.  This occurs at small ratios of F2/F1 and lower frequencies.

GUI
^^^
Written in a user-manual style (so we can pull it out for a user-manual, which I’m sure we’ll have to do at some point and I'd like to minimize our pain).

Describes parameters that may be changed, how they affect test, etc.

Layout of results (both feedback during test & post-results review).

Layout of test administration.

The layouts may initially be sketches/mock ups, but will be replaced with screen shots.

Mobile Web Application
""""""""""""""""""""""

Desktop
"""""""

Stored Data
-----------
Debugging
^^^^^^^^^
Raw time-series recorded for the microphone.

Release
^^^^^^^
The properties returned from ProbeLink::getTestResults should be stored for each DP.

Acoustic Requirements
---------------------
To measure DPOAEs, the probe and associated electronics used to generate the tones and record the microphone need to meet the requirements in Table 1.  These requirements come from IEC60645-6 and custom probe development on DP Product (Creare project 6428).  The final report from DP Product, TM-3107, describes procedures to evaluate these requirements.

.. rubric:: DPOAE Probe Acoustic Requirements

+-------------------------------------------+-------------------------------------------+
|  **Microphone**                           |  **Value**                                |
+===========================================+===========================================+
|   Linearity                               |   ± 2.0 dB at levels 5 to 75 dB SPL       |
+-------------------------------------------+-------------------------------------------+
|   Noise                                   |   -20 dB SPL @ 2 kHz                      |
|                                           |   -13 dB SPL @ 1 kHz                      |
+-------------------------------------------+-------------------------------------------+
|   Accuracy                                |   ± 2.0 dB over 500 Hz to 6 kHz           |
+-------------------------------------------+-------------------------------------------+

+-------------------------------------------+-------------------------------------------+
|  **Speaker**                              |  **Value**                                |
+===========================================+===========================================+
|   Total Harmonic Distortion [THD]         |   < 0.1% at 65 dB SPL                     |
+-------------------------------------------+-------------------------------------------+
|   Inter Modulation Distortion [IMDLow]    |   < -20 dB SPL for 65/55 dB SPL tones     |
|   (level of distortion 2f1 – f2)          |   < -15 dB SPL for 75/75 dB SPL tones     |
+-------------------------------------------+-------------------------------------------+
|   Inter Modulation Distortion [IMDHigh]   |   same as IMDlow                          |
|   (level of distortion 2f2 – f1)          |                                           |
+-------------------------------------------+-------------------------------------------+
|   Stimulus Level Accuracy (described      |   ± 3.0 dB between 1.0 kHz and 6 kHz      |
|   in calibration section below)           |                                           |
+-------------------------------------------+-------------------------------------------+

.. rubric:: Applicable Documents

+-----------------------+---------------+-------------------------------------------------------------+
|  **Document Number**  |  **Revision** |  **Document Title**                                         |
+=======================+===============+=============================================================+
|   IEC 60645-6         |  2008         |   Electroacoustics Audiometric Equipment – Part 6:          |
|                       |               |   Instruments for the Measurement Of Otoacoustics Emissions |
+-----------------------+---------------+-------------------------------------------------------------+

Testing Procedures
------------------

.. _dpoae-hitl-device-test:

Device Tests
^^^^^^^^^^^^

Two types of checks should be performed: one with the probe in the ear simulator and one listening to the stimuli.  Additionally, a list of general software checks that may be performed with the probe in the simulator or when listening are provided.

.. rubric:: Ear Simulator.

Testing in the ear simulator allows verification of the stimulus levels, the distortion and the noise floor in a consistent cavity with acoustic impedance similar to a human ear.  Additionally, for a more rigorous check, the output of the ear simulator may be connected to a data acquisition system (e.g., LabVIEW) to record and validate levels and the other acoustic requirements listed in :ref:`dpoae-ear-simulator-checks` independently of the software.

.. rubric:: Listening.

Listening to the stimuli provides a chance to check for any other irregularities in the stimuli, transitions between stimuli, etc.  In the future testing, it would be ideal if these checks could be performed in an automated manner, e.g., confirm the FFT for a stimuli after averaging meets an expected response within a defined tolerance.

.. rubric:: Software Procedural Checks.

The following software checks should be performed:

    a)	During both DP gram and DPOAE maps, confirm the following actions work
        -	Start/stop/pause/cancel next/finish plotting etc

    b)	Check that a new DP gram and DPOAE map may be added with the configure module.
        -	Create a new xls protocol for each, add and then run

    c)	Verify that correct results are being saved in the database
        -	Take notes during a few of the tests in Ear Simulator Checks table and check that the data in the database matches.

    d)	Others?


.. _dpoae-ear-simulator-checks:

.. figure:: /CHA/images/DPOAE_EarSimulatorChecks.png
   :alt: Ear simulator checks (see images/DPOAE_EarSimulatorChecks.docx to update).
   :align: center

   *Ear Simulator Checks*  
   
   Set up the probe in the ear simulator, with the probe tip at the reference plane, and inside the sound room.

Software Tests
^^^^^^^^^^^^^^

Refer to the :ref:`Testing in DPOAE <dpoae-hitl-device-test>`
