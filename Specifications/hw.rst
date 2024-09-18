.. |lu| replace:: **LevelUnits**

.. _hw:

Hughson-Westlake
=================

This test measures hearing thresholds.

Revision Table
--------------

.. list-table::
   :widths: 12 18 10 60
   :header-rows: 1

   * - No
     - Date
     - Initials
     - Note
   * - 1
     - 3 Sept 2014
     - OHC
     - Create HW audiometry-specific specification from former Audiometry spec
   * - 2
     - 5 Sept 2014
     - OHC
     - Added notes on min/max allowable ranges for level and frequencies
   * - 3
     - 12 Sept 2014
     - OHC
     - Corrected algorithm flowchart, and defined StepSize parameter
   * - 4
     - 15 Sept 2014
     - OHC
     - Updated example figures
   * - 5
     - 17 Sept 2014
     - JAN
     - Changed capitalization of StepSize and tried to clarify a couple points on the definitions related to the pulse train.  Also updated the property table.
   * - 6
     - 19 Sept 2014
     - JAN
     - Added footnote to clarify how min/max output levels are used. Updated algorithm figure. Proposed property changes to work with the updated TestAudiometry and TestAudiometryResults base classes (see :doc:`audiometry`)
   * - 7
     - 21 Sept 2014
     - OHC
     - Added (external) references and comments
   * - 8
     - 23 Sept 2014
     - JAN
     - Added **PollingOffset** property and updated figure 1 legend to define **ToneRepetitionInterval**, which is now part of :ref:`TestAudiometry`.
   * - 8.0.1
     - 3 Dec 2014
     - JAN
     - Updated this specification to build on the :doc:`tone generation` and the :doc:`audiometry` classes.
   * - 8.0.2
     - 9 Dec 2014
     - JAN
     - Per WHF suggestion, moved some common properties of Bekesy and Hughson-Westlake level exams into ref:`TestAudiometryLevel` class. Removed references to tone generation.
   * - 9
     - 13 May 2015
     - LVA
     - Added screening option, which included adding several input parameters to HughsonWestlakeTest, modifying the definitions of other parameters in HughsonWestlakeTest, and adding some parameters to HughsonWestlakeResult.	 
   * - 9.0.1
     - 15 June 2015
     - LVA
     - In the discussion of the polling time, added mention of a possible Polling Ignore parameter that we may want to implement in the future.
   * - 9.1.0
     - 20 July 2015
     - JAN
     - Clarify threshold calculation per NHANES procedure. 
   * - 9.2.0
     - 27 July 2015
     - JAN
     - Added **FalsePositive** to properties.
   * - 10.0.0
     - 27 Aug 2015
     - JAN
     - Modified algorithm to begin next presentation immediately after user response.
   * - 10.0.1
     - 31 Aug 2015
     - JAN
     - Updated defaults to be consistent with definitions of **PollingOffset** and the interstimulus interval (ISI).
   * - 10.0.2
     - 10 Sept 2015
     - JAN
     - Revised wording of how algorithm advances when a valid response is received to match implementation.
   * - 10.0.3
     - 15 Sept 2015
     - JCW
     - Proposed change to subject-responds-during-pulse train logic.
   * - 10.0.4
     - 20 June 2017
     - TMR
     - Added Automated CHAMI Test Coverage.
   * - 10.1.0
     - 16 Apr 2018
     - MLS
     - Add **ResponseTime** to TestResults
   * - 10.1.1
     - 11 Jul 2018
     - JAN
     - Added **QA Testing** per Vero TabSINT issue #217 and :doc:`DOEHRS Audiometer Requirements</References/docs/Occupational HW Specs>`
   * - 10.1.2
     - 24 August 2018
     - JCW
     - Updated algorithm flow chart to reflect possibility of other than 2 out of 3 threshold determination
   * - 10.1.3
     - 20 November 2018
     - ATS
     - Increased PollingOffset maximum from 1000 ms to 2000 ms.
   * - 10.1.4
     - 4 June 2019
     - JAN
     - Update the ``Testing Procedures`` section to match :doc:`template </CHA/protocols/template>` 
   * - 10.2.0
     - 27 June 2019
     - VAL
     - Add **SemiAutomaticMode** to input parameters 
   * - 10.2.1
     - 11 Mar 2021
     - JAN
     - Add diagram for **ResponseTime** measure and references to relevant IMs and report from gitlab/tabsint-admin.
   * - 10.3.0
     - 4 May 2021
     - TMR
     - Update threshold determination to allow for a minimum of 2 peaks in agreement to end the exam.
   * - 10.4.0
     - 26 July 2021
     - AFrazier
     - Add testing instructions for Human-in-the-Loop Software Tests
   * - 10.4.1
     - 10 Sept 2021
     - JAN
     - Revise to pull Automated CHAMI Testing from the associated .csv file.
   * - 10.4.2
     - 23 Nov 2021
     - HGeithner
     - Add device testing tables.
   * - 10.5.0
     - 1 Nov 2022
     - VAL
     - Add **UseReducedInitialIncrement** flag.

References
----------

Related internal documents
^^^^^^^^^^^^^^^^^^^^^^^^^^

This specification references
"""""""""""""""""""""""""""""
1. :doc:`../api/index`
2. :doc:`audiometry`
3. :doc:`calibration`

This specification is referenced in the following
"""""""""""""""""""""""""""""""""""""""""""""""""
1. :doc:`audiometry`

Literature
^^^^^^^^^^

.. [Jerlvall1983] Jerlvall, L., H. Dryselius, and S. Arlinger. "Comparison of manual and computer-controlled audiometry using identical procedures." Scandinavian audiology 12, no. 3 (1983): 209-213.
.. [Robertson1979] Robertson, Ronald M., James W. Greene, Donald W. Maxwell, and Carl E. Williams. Exploratory Assessment of Automated Hearing Test Systems. No. NAMRL-1263. NAVAL AEROSPACE MEDICAL RESEARCH LAB, PENSACOLA, FL, 1979.
.. [Franks2001] Franks JR. Hearing measurement. Dortmund, Germany: World Health Organization, Federal Institute for Occupational Safety and Health. 2001:183-232.

Inspiration for the design of this algorithm and some of the settings came from the three references: [Jerlvall1983]_, [Robertson1979]_, and [Franks2001]_.

.. _HWAlgorithm:

Algorithm
---------

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 20, 60
   :file: ../../_build/generated/hw-algorithm.csv

Threshold Determination
^^^^^^^^^^^^^^^^^^^^^^^

.. todo::
   Edit or remove this section?

The fundamental stimulus of the Hughson-Westlake algorithm is a sequence of short tone presentations referred to as a pulse train (:ref:`Pulse Train <hw_figure_1>`).  Following the last tone of the pulse train there is a period of silence referred to as the inter-stimulus interval (ISI).  The *level* of the next pulse train is calculated based on whether or not the subject responds.  The ISI is randomly selected based on a uniform distribution between **MinISI** and **MaxISI** milliseconds.

The presentation *level* logic is shown in the flowchart below (:ref:`Flowchart <hw_figure_2>`).  Starting *level* may be selectable by the user. All increments and decrements to *level* may be derived from a single parameter, **StepSize**.  The **StepSize** defines the smallest change in *level* during the entire algorithm.

Polling time: patient response is polled from the onset of the pulse train stimulus, until a Polling Offset period has elapsed beyond the last tone in the pulse train.  After the subject’s first response, the ISI should be modified by adding a random pause that can vary between a minimum of the PollingOffset time and a maximum of 3 seconds :ref:`See Note <isi-note>`.  This is done to ensure the subject does not simply press the button at regular intervals.

Patient responses received during the polling time are considered valid and should be used when evaluating the *Response?* conditional statements in the :ref:`flowchart <hw_figure_2>`.  If a response is received outside the polling time, it is considered a **FalsePositive** (see `TestHughsonWestlakeResults`_).  Upon receiving a valid response, the algorithm should immediately proceed to the end of the **PulseTrain** (ramping down the tone if necessary).  The **PollingOffset** will remain (meaning there will still be a minimum of the **MinISI** before the beginning of the next **PulseTrain**).  However, responses received during this **PollingOffset** period that follow valid responses should be ignored (i.e., neither counted as **FalsePositives** nor considered valid responses; this could occur if someone taps a button twice in response to a **PulseTrain**).  

The response time to each presentation should be recorded in test results (see `TestHughsonWestlakeResults`_). The response time is measured as the time between the onset of the pulse train and when the response is registered by the headset in milliseconds. The response time should be measured and recorded even if it is outside the **PollingOffset** during the inter-stimulus interval. If the user does not provide a response before the onset of the next pulse train, the response time should be recorded in the array as 0.

If *SemiAutomaticMode* is True, the exam pauses after each pulse train, the *PollingOffset* is ignored, and the CHA waits for an answer on whether the patient heard the pulse train or not. When an answer is received the exam resumes.

.. _polling_offset-note:

.. note::
   We may wish to consider adding a parameter in the future called Polling Ignore (not shown, not currently implemented on CHA).  This parameter would specify a duration at the start of each pulse train during which patient responses are ignored because they occur too soon to be valid.

.. _falsepositive-note:

.. note::
   In the future, we may define some logic that would halt the algorithm based on number of **FalsePositive** responses. Lots of **FalsePositives** may indicate the patient either did not understand or is unable to follow the directions.

.. _hw-threshold-determination:

As described in section 3.5.3.3 of the [NhanesAudiometryManual]_, the "threshold is defined as the lowest intensity at which the tone has been heard by the examinee".  50% of all *ascending presentations* must agree (minimum 2 in agreement).  Note that the first time a subject responds, which may occur on the first or subsequent presentations, should be discarded and not counted as a response to an *ascending presentation.* The reason is that the starting level is intended to be significantly above the subject's threshold and this initial response just alerts the subject to the fact a test has started.  

Following a test, results should show each presentation *level* versus presentation number.

:ref:`Examples of Hughson-Westlake Responses <hw_figure_3>` show threshold calculation according to the 50 percent of responses logic.

.. _isi-note:

.. note::
   The inter-stimulus interval (ISI) cannot be less than Polling Offset.

.. _hw_figure_1:

.. figure:: ../images/TonePulseTrainExample.png
   :alt: Example presentation with two pulse trains
   :align: center
   :scale: 70%

   **Figure 1**

   *Example Presentation with Two Pulse Trains*

AB is the ramp rise time, AD is the tone duration, CD is the ramp fall time, and AE is the tone repetition interval. Polling Offset is the time after the end of the pulse train during which the patient response is still polled. The inter stimulus interval is the time between the end of one pulse train and the beginning of another.  It has a variable random length except for the first few presentations.

.. _hw_figure_2:

.. figure:: ../images/HughsonWestlakeAlgorithm.png
   :alt: Hughson Westlake Algorithm
   :align: center
   :scale: 70%

   **Figure 2**

   *Modified Hughson-Westlake Logic*

.. _hw_figure_3:

.. figure:: ../images/HughsonWestlakeThresholdExamples.png
   :alt: Hughson Westlake Threshold Examples
   :align: center

   **Figure 3**

   *Examples of Hughson-Westlake Algorithm for Audiometry*

Filled points are when user responds (hears tones), and red-filled points are the two points that meet the 2-for-3 logic required for identifying a threshold.

Threshold Verification
^^^^^^^^^^^^^^^^^^^^^^

.. todo::
   Edit, rename, or remove this section?

In some cases, thresholds only need to be verified, not determined.  This screener variation of the Hughson-Westlake audiometry exam is intended to check that the patient has at least a specified threshold or better (lower), without taking as much time as the standard exam.

The logic for the screener is shown in the flowchart below (:ref:`Screener Flowchart <hw-level-screener-flowchart>`).  It is like the threshold determination version, except: 

1. The level does not change (**StepSize** = 0)
2. The protocol specifies the number of correct presentations required (**NumCorrectReq**) to consider "pass" and the maximum number of presentations (**PresentationMax**), instead of 2-for-3
3. The result includes the number of correct responses (**NumCorrectResp**)
4. **ResultType** is interpreted differently, with "Threshold" meaning "Pass" and "Failed to Converge" meaning "Fail".

Use of the screener version is indicated with the boolean **Screener** as an input parameter in TestHughsonWestlake.  When this input is True, the screener algorithm is used, and that includes slightly different definitions/uses of some of the input (HughsonWestlakeTest) and output (HughsonWestlakeResult) parameters, discussed above.

.. _hw-level-screener-flowchart:

.. figure:: ../images/HughsonWestlakeScreenerAlgorithm.png
   :alt: Hughson Westlake Screener Algorithm
   :align: center
   :scale: 70%

   *Modified Hughson-Westlake Screener Logic*
   
Implementation
--------------

Data Interface
^^^^^^^^^^^^^^

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 20, 60
   :file: ../../_build/generated/hw-data.csv

.. _hw_inputs:

TestHughsonWestlake
"""""""""""""""""""
This class represents the definition of a Hughson-Westlake threshold examination.  The Hughson-Westlake test includes testing multiple frequencies, but the order and number of frequencies will be controlled at the GUI level.  The conversion between dB SPL and dB HL is stored as part of the probe specific calibration (see :doc:`calibration`).

+----+-----------------------------------+--------+---------------------+---------+
| Name                                   | Units  | Range               | Default |
+----+-----------------------------------+--------+---------------------+---------+
|    | Description                       |        |                     |         |
+====+===================================+========+=====================+=========+
| **TestAudiometryLevel**                |        |                     |         |
+----+-----------------------------------+--------+---------------------+---------+
|    |  See :ref:`TestAudiometryLevel`            |                     |         |
+----+-----------------------------------+--------+---------------------+---------+
| **Screener**                           | Bool   | True/False          | False   |
+----+-----------------------------------+--------+---------------------+---------+
|    |  Whether to use screener version of        |                     |         |
|    |  Hughson-Westlake level exam.              |                     |         |
+----+-----------------------------------+--------+---------------------+---------+
| **StepSize**                           | dB     | 2 - 10              | 5       |
+----+-----------------------------------+--------+---------------------+---------+
|    |  Smallest level increment. Default is 5 dB |                     |         |
|    |  but in some cases can be as low as 2 dB   |                     |         |
|    |  for threshold determination; ignored for  |                     |         |
|    |  screener (**Screener** = True).           |                     |         |
+----+-----------------------------------+--------+---------------------+---------+
| **TonePulseNumber**                    | int    | 1 - 5               | 3       |
+----+-----------------------------------+--------+---------------------+---------+
|    |  Total number of tones played for each     |                     |         |
|    |  pulse train. Each 'pulse' consists of a   |                     |         |
|    |  **ToneRamp** (AB), a **ToneDuration**     |                     |         |
|    |  (BC), a **ToneRamp** (CD), and pulses are |                     |         |
|    |  repeated at **ToneRepetitionInterval**    |                     |         |
|    |  (AE).  See:                               |                     |         |
|    |  :ref:`tone-duration-ramp-interval`        |                     |         |
+----+-----------------------------------+--------+---------------------+---------+
| **PollingOffset** (see [1]_, [3]_)     | ms     | 0 - 2000            | 600     |
+----+-----------------------------------+--------+---------------------+---------+
|    |  Period beyond last pulse where subject    |                     |         |
|    |  response still accepted.                  |                     |         |
|    |                                            |                     |         |
|    |  .. important::                            |                     |         |
|    |                                            |                     |         |
|    |     It is important to consider the        |                     |         |
|    |     variable latency introduced by tablet  |                     |         |
|    |     OS and Bluetooth communication when    |                     |         |
|    |     setting **PollingOffset** (see [3]_).  |                     |         |
+----+-----------------------------------+--------+---------------------+---------+
| **MinISI**  (see [1]_)                 | ms     | 0 - 2000            | 600     |
+----+-----------------------------------+--------+---------------------+---------+
|    |  Minimum value for inter-stimulus interval |                     |         |
|    |  (ISI).                                    |                     |         |
+----+-----------------------------------+--------+---------------------+---------+
| **MaxISI** (see [1]_)                  | ms     | 1000 - 5000         | 1000    |
+----+-----------------------------------+--------+---------------------+---------+
|    |  Maximum value for inter-stimulus interval |                     |         |
|    |  (ISI).                                    |                     |         |
+----+-----------------------------------+--------+---------------------+---------+
| **NumCorrectReq**                      | int    | 0 -                 | 2       |
|                                        |        | **PresentationMax** |         |
+----+-----------------------------------+--------+---------------------+---------+
|    |  Number of correct responses required to   |                     |         |
|    |  pass, and end the exam early (if          |                     |         |
|    |  applicable). Only used when **Screener**  |                     |         |
|    |  = True.                                   |                     |         |
+----+-----------------------------------+--------+---------------------+---------+
| **SemiAutomaticMode**                  | Bool   | True/False          | False   |
+----+-----------------------------------+--------+---------------------+---------+
|    |  Whether to pause after each pulse train   |                     |         |
|    |  to wait for a response (True) or proceed  |                     |         |
|    |  in a fully automated fashion (False).     |                     |         |
+----+-----------------------------------+--------+---------------------+---------+
+----+-----------------------------------+--------+---------------------+---------+
| **UseReducedInitialIncrement**         | Bool   | True/False          | False   |
+----+-----------------------------------+--------+---------------------+---------+
|    |  If True, the initial factor if            |                     |         |
|    |  no response is 2 instead of 4.            |                     |         |
+----+-----------------------------------+--------+---------------------+---------+

.. rubric:: *Notes*
..  [1] The following check on these parameters is enforced on the CHA: **PollingOffset** <= **MinISI** <= **MaxISI**

.. _hw_stored_data:

TestHughsonWestlakeResults
""""""""""""""""""""""""""
This class is returned from ProbeLink::getTestResults upon successful test completion.  In the event the maximum number of presentations is exceeded, both the Threshold and MaximumExcursion will be undefined and should be returned as not-a-number (NaN).  The array of presentation levels, L, should be initialized to NaNs.  This array should then be populated with the levels presented to the subject.  At the conclusion of a test, this array of levels should be returned regardless of whether the test is successful or not – this array of levels may be useful for post-analysis even if the subject fails to reach a Threshold.

+----+-----------------------------------------------------+------------+
| Name                                                     |     Units  |
+----+-----------------------------------------------------+------------+
|    | Description                                         |            |
+====+=====================================================+============+
| **TestAudiometryResults**                                |            |
+----+-----------------------------------------------------+------------+
|    |  See :ref:`TestAudiometryResults`                   |            |
+----+-----------------------------------------------------+------------+
| **RetSPL**                                               |     dB SPL |
+----+-----------------------------------------------------+------------+
|    |  Reference equivalent threshold sound pressure      |            |
|    |  level at test frequency, **F**                     |            |
+----+-----------------------------------------------------+------------+
| **L** (see [2]_)                                         | [|lu|]     |
+----+-----------------------------------------------------+------------+
|    |  Array of presentation levels presented during test |            |
+----+-----------------------------------------------------+------------+
| **FalsePositive**                                        |  [enum]    |
+----+-----------------------------------------------------+------------+
|    |  Array of number of responses to each presentation  |            |
|    |  that occurred outside the polling time window.     |            |
|    |  Each array element represented with 2-bits, i.e.,  |            |
|    |  values may be 0, 1, 2, or 3 (where 3 indicates     |            |
|    |  3 or more)                                         |            |
+----+-----------------------------------------------------+------------+
| **ResponseTime** (see [3]_)                              |  [ms]      |
+----+-----------------------------------------------------+------------+
|    |  Array recording the response time in ``ms`` to     |            |
|    |  each presentation. Response time is measured as    |            |
|    |  the time between the start of the pulse train and  |            |
|    |  when the response is registered. No response is    |            |
|    |  recorded as 0.                                     |            |
+----+-----------------------------------------------------+------------+
| **NumCorrectResp**                                       | (int)      |
+----+-----------------------------------------------------+------------+
|    |  Number of presentations correctly answered. Only   |            |
|    |  used when **Screener** = True.                     |            |
+----+-----------------------------------------------------+------------+

.. rubric:: *Notes*
..  [2] These units should match the |lu| requested. See :ref:`TestAudiometry`
..  [3] The response time of interest from a clinical perspective is from (2) to (4) in the figure below. The **ResponseTime** result, however, includes a latency that is due to the tablet OS, hardware, and Bluetooth radio [steps (4) to (6) in the figure below]. For the Samsung Tab-E tablet, this latency is ``250 +/- 50 ms``. **ResponseTime** should be referenced only when the tablet hardware is characterized and controlled throughout data collection. See IM-21-11-201 for a summary of timing studies.

        When setting and discussing **PollingOffset** with collaborators, it is important to consider this latency. As an example, setting **PollingOffset** to ``600 ms`` means response times at (4) that are greater than ``350 ms`` (``600 - 250``) after the pulse train would be characterized as **FalsePositive**. This is likely not intuitive. As a simple rule of thumb, add ``300 ms`` (``average latency + one standard deviation``) to the clinically desired response time.

        .. figure:: ../images/response-time.png
           :alt: Hughson Westlake ResponseTime
           :align: center
           :width: 6.5 in

           The **ResponseTime** result returned from the CHA is from (2) to (6). The response time of interest from a clinical perspective is from (2) to (4).

        It is also important to consider how the length of the ISI relative to the stimulis and polling offset. As shown below, the time when a response is accepted versus rejected can be highly weighted toward *accept* when the ISI is short relative to the stimulus and polling offset.

        .. figure:: ../images/HughsonWestlakeAcceptReject.png
           :alt: Hughson Westlake Accept and Reject Periods
           :align: center
           :width: 6.5 in

           The length of the ISI should be considered carefully with respect to the length of the stimulus and polling offset.

GUI
^^^^

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 20, 60
   :file: ../../_build/generated/hw-gui.csv

Device Requirements
-------------------

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 20, 60
   :file: /_build/generated/hw-device.csv

.. _hw_testing_procedures:

Testing Procedures
------------------

Device Tests
^^^^^^^^^^^^

.. rubric:: HITL

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: /_build/generated/hw-device-test.csv

.. rubric:: CHAMI

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: /_build/generated/hw-device-test-chami.csv

Software Tests
^^^^^^^^^^^^^^

This HITL testing requires the use of sound room equipment. 

.. rubric:: HITL

**Algorithm**

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/hw-algorithm-test.csv

+------------------------------+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
| Test                         |  1  |  2  |  3  |  4  |  5  |  6  |  7  |  8  |  9  |  10 |  11 |
+==============================+=====+=====+=====+=====+=====+=====+=====+=====+=====+=====+=====+
| 1 *(2 out of 3)*             |  N  |  Y  |  N  |  Y  |  N  |  N  |  Y  | END | N/A | N/A | N/A |
+------------------------------+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
| 2 *(2 out of 4)*             |  N  |  Y  |  N  |  Y  |  N  |  N  |  N  |  Y  |  N  |  Y  | END |
+------------------------------+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+
| 3 *(ignore first response)*  |  N  |  Y  |  N  |  N  |  N  |  Y  |  N  |  N  |  Y  | END | N/A |
+------------------------------+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+-----+

**Data**

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/hw-data-test.csv

**GUI**

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/hw-gui-test.csv

.. rubric:: CHAMI

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/hw-algorithm-test-chami.csv

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/hw-data-test-chami.csv
