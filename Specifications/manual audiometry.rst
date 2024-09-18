Manual Audiometry
=================

This test is to administer a manual audiometry exam.

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
     - 9 Sept 2024
     - VAL
     - Initial commit for a new manual audiometry exam.  Based on the CHA DOCS manual audiometry exam and supports both one- and two-tablet (standard and telehealth) modes, bone conduction, and masking.
   * - 1.0.1
     - 17 Nov 2021
     - TMR
     - Use a 3 tone pulse train.
   * - 1.0.2
     - 18 Nov 2021
     - TMR
     - Address questions from WHF.  Remove unnecessary **StepSize** parameter and clarify units for **MaskerLevel**.
   * - 1.0.3
     - 2 Dec 2021
     - TMR
     - Add **TestEar** parameter.  **TestEar** cannot be determined by **OutputChannel** since the bone oscillator output channel is used for both ears.
   * - 1.0.4
     - 10 Dec 2021
     - TMR
     - Add GUI information.
   * - 1.0.5
     - 28 Feb 2022
     - JAN
     - Add footnote to document that we considered making **RecordThreshold** an enumeration. Concluded we'll stick with boolean. Clarified the **Results** should only contain channel/frequency/masking combinations were **RecordThreshold** was *True*.
   * - 2.0.0
     - 4 Mar 2022
     - JAN
     - Limit level units to dB HL, remove the requirement that the firmware maintains an array of presentations (in the future, we may attempt to just populate the HW arrays with presentations for a given frequency, output channel, and masking level), add a flag to the submission object so it is possible to change masking *without* playing a tone, add note to submission object regarding potential future support for different stimulus (for pediatrics they often switch stimulus types, e.g., warble tones, to keep kids engaged), and eliminated **RecordThreshold** and **ExamComplete** as they're no longer required.
   * - 3.0.0
     - 10 Mar 2022
     - JAN
     - Revise to use :ref:`TestAudiometryLevel` so that we'd have flexibility to support warble and other tone types.
   * - 4.0.0
     - 21 Mar 2022
     - JAN
     - Simplify :ref:`TestManualAudiometryResults <manual_stored_data>` to reduce time it takes to transfer. As part of the simplification, chatted with WHF to define how **FalsePositive** should work for this exam.
   * - 4.0.1
     - 22 Mar 2022
     - JAN
     - Add note to clarify **TeleMode** implies **UseSoftwareButton** is *true*.
   * - 4.1.0
     - 6 Apr 2022
     - JAN
     - Define **PollingOffset** and revise the figures to keep insync with implementation.
   * - 4.2.0
     - 10 May 2022
     - BGraybill
     - Add safety warning popup message to presentations exceeding 105 dB SPL
   * - 4.2.1
     - 31 August 2022
     - VAL
     - Add plotting threshold requirements, frequency scrolling and define keyboard mapping.
   * - 4.2.2
     - 27 September 2022
     - VAL
     - Add no response GUI requirements.
   * - 4.2.3
     - 26 January 2023
     - VAL
     - Tweak logic for response after the masker is started or stopped (i.e. exam submission when PlayStimulus is false).


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

[AnsiAudiometerSpec2018]_

.. _ManualAlgorithm:

Algorithm
---------

The manual audiometry exam can be run in two different modes: one-tablet ("standard mode") and two-tablet ("telehealth mode").

In the standard mode where the examiner and subject are in the same location, the examiner will hold the control tablet and the subject will indicate whether they heard the tones by indicating to the examiner.  An example of two level presentations at two difference frequencies is indicated in the figure below.

.. _manual_figure_1:

.. figure:: ../images/manual-one-tablet.png
   :alt: One-tablet manual audiometry.
   :align: center
   :width: 4.5in

   *Simplified example of testing at two frequencies where only two different levels are presented before the threshold is recorded using the standard mode.*


In the telehealth mode where the examiner and subject are in different locations, the examiner will hold the control tablet and the subject will indicate whether they heard the tones by indicating on their tablet.  An example of two level presentations at two difference frequencies is indicated in the figure below.  The green arrows indicate the loop that allows for the response time to be accurately measured and shared with the examiner.

.. _manual_figure_2:

.. figure:: ../images/manual-two-tablet.png
   :alt: Two-tablet manual audiometry.
   :align: center
   :width: 4.5in

   *Simplified example of testing at two frequencies where only two different levels are presented before the threshold is recorded using the telehealth mode.*



.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 20, 60
   :file: ../../_build/generated/manual audiometry-algorithm.csv

Threshold Determination
^^^^^^^^^^^^^^^^^^^^^^^

The stimulus of the manual audiometry exam is a sequence of 3 short tone presentations referred to as a pulse train.  Following the pulse train, the subject indicates whether they heard the tones or not (by signaling to the examiner in the standard mode or by indicating on their tablet in the telehealth mode) and then, given that response, the test administrator uses the GUI to increase or decrease the level of the tone or the masker for the next presentation, or record the threshold.

Implementation
--------------

Data Interface
^^^^^^^^^^^^^^

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 20, 60
   :file: ../../_build/generated/manual audiometry-data.csv

.. _manual_inputs:

TestManualAudiometry
""""""""""""""""""""
This class represents the definition of a manual threshold examination.  The manual audiometry test includes testing multiple frequencies, but the order of frequencies and level progression will be controlled at the GUI level. The **LevelUnits** for manual audiometry will be ``dB HL``.

+----+-----------------------------------+--------+-------------+-------------------+
| Name                                   | Units  | Range       | Default           |
+----+-----------------------------------+--------+-------------+-------------------+
|    | Description                       |        |             |                   |
+====+===================================+========+=============+===================+
| **BoneConduction**                     | bool   |             |  false            |
+----+-----------------------------------+--------+-------------+-------------------+
|    |  If true, allow for output channels to be  |             |                   |
|    |  bone conduction.  Else, only allow output |             |                   |
|    |  channels to be HPL0 and HPR0.             |             |                   |
+----+-----------------------------------+--------+-------------+-------------------+
| **Masking**                            | bool   |             |  false            |
+----+-----------------------------------+--------+-------------+-------------------+
|    |  If true, show masking in the UI and allow |             |                   |
|    |  the examiner to present 1/3rd masking     |             |                   |
|    |  noise around the test frequency to the    |             |                   |
|    |  non-test ear.                             |             |                   |
+----+-----------------------------------+--------+-------------+-------------------+
| **TeleMode** (See [1]_)                | bool   |             |  false            |
+----+-----------------------------------+--------+-------------+-------------------+
|    |  If true, present the telehealth mode with |             |                   |
|    |  two tablets, where the test taker's       |             |                   |
|    |  tablet submits responses.  If false,      |             |                   |
|    |  present the original one tablet mode.     |             |                   |
+----+-----------------------------------+--------+-------------+-------------------+

.. _manual_stored_data:

TestManualAudiometryResults
"""""""""""""""""""""""""""
This class is returned from ProbeLink::getTestResults upon successful test completion. The :ref:`TestHughsonWestlakeResults:ResponseTime <hw_stored_data>` is essential following every presentation as it will be presented in the GUI.

+----+-----------------------------------------------------+---------------------+
| Name                                                     |     Units           |
+----+-----------------------------------------------------+---------------------+
|    | Description                                         |                     |
+====+=====================================================+=====================+
| **State**                                                | PLAYING,            |
|                                                          | WAITING_FOR_RESULT, |
|                                                          | or DONE             |
+----+-----------------------------------------------------+---------------------+
|    |  Current Exam State.                                |                     |
+----+-----------------------------------------------------+---------------------+
| **FalsePositive** [2]_                                   | [enum]              |
+----+-----------------------------------------------------+---------------------+
|    |  Number of responses that occurred following the    |                     |
|    |  *previous* presentation. This provides that        |                     |
|    |  audiologist with feedback if the listener is       |                     |
|    |  tapping the response button when not expected.     |                     |
|    |  Each array element represented with 2-bits, i.e.,  |                     |
|    |  values may be 0, 1, 2, or 3 (where 3 indicates     |                     |
|    |  3 or more). Refer to :ref:`hw_stored_data` as that |                     |
|    |  exam uses this same enumeration.                   |                     |
+----+-----------------------------------------------------+---------------------+
| **ResponseTime** [2]_                                    |  [ms]               |
+----+-----------------------------------------------------+---------------------+
|    |  Refer to :ref:`hw_stored_data`.                    |                     |
+----+-----------------------------------------------------+---------------------+
| **L**                                                    |  dB HL              |
+----+-----------------------------------------------------+---------------------+
|    | Level presented.                                    |                     |
+----+-----------------------------------------------------+---------------------+
| **ML**                                                   |  dB EM              |
+----+-----------------------------------------------------+---------------------+
|    | If **Masking** is true, return the masking level,   |                     |
|    | otherwise, set to NaN to indicate no masking. This  |                     |
|    | should be an array of length that matches the       |                     |
|    | the length of arrays in the                         |                     |
|    | **TestHughsonWestlakeResults**                      |                     |
+----+-----------------------------------------------------+---------------------+

Manual Audiometry Exam Submission
^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^

+----+----------------------------------------------------+-------+
| Name                                                    | Units |
+----+----------------------------------------------------+-------+
|    | Description                                        |       |
+====+====================================================+=======+
| **TestAudiometryLevel**                                 |       |
+----+----------------------------------------------------+-------+
|    | See :ref:`TestAudiometryLevel`. See [1]_           |       |
+----+----------------------------------------------------+-------+
| **TestEar**                                             | enum  |
+----+----------------------------------------------------+-------+
|    | Ear to test, only used for bone conduction with    |       |
|    | masking. Use **OutputChannel** for stimulus        |       |
|    | presentation. See [3]_                             |       |
+----+----------------------------------------------------+-------+
| **PlayStimulus**                                        | bool  |
+----+----------------------------------------------------+-------+
|    | If true, the tone pulses described in              |       |
|    | **TestAudiometryLevel** will be presented to the   |       | 
|    | user. Otherwise, only the masker (if any) will be  |       | 
|    | presented to the user.  If false, there will be no |       |
|    | response window, meaning any response after the    |       |
|    | submission will be recorded as a false positive and|       |
|    | there will be no ResponseTime result. A submission |       |
|    | of *False* where the **MaskerLevel** is the same   |       | 
|    | as previous masking level should not be detectable |       |
|    | by the listener.                                   |       | 
+----+----------------------------------------------------+-------+
| **MaskerLevel**                                         | dB EM |
+----+----------------------------------------------------+-------+
|    | If **Masking** is true, start masking noise at     |       |
|    | this level.  If NaN, stop the masker.              |       |
+----+----------------------------------------------------+-------+

.. rubric:: *Notes*
..  [1] When **TeleMode** is *true*, it assumes that **UseSoftwareButton** of the :ref:`TestAudiometryLevel <TestAudiometry>` is *true*.
..  [2] The concept of **ResponseTime** and **FalsePositives** requires some bound on the period of time a reponse is considered valid. This exam will use the concept of the **PollingOffset** as defined in the :ref:`hw` exam. For initial implmentation, the **PollingOffset** will be hard-coded at 1000 ms. This is the value that has been used successfully during the validation studies for the automated :ref:`hw` exam. In the future, it may be added as a paramter to this exam so that it could be increased for certain patient's that may take longer to respond.
..  [3] **TestEar** cannot be determined by **OutputChannel** since the bone oscillator output channel is used for both ears.  When **TestEar** = 'Left', **OutputChannel** may be 'HPL0' or the bone oscillator, but not 'HPR0'.  Similarly, when **TestEar** = 'Right', **OutputChannel** may be 'HPR0' or the bone oscillator, but not 'HPL0'.

GUI
^^^^

The GUI should look like the image below with the following features:

* There should be a frequency panel that displays the current frequency. The frequency panel has left and right buttons to adjust frequency. The buttons should continuasly scroll, meaning pressing the right arrow from the highest frequency will bring you back to the lowest frequency. Likewise, pressing the left arrow from the lowest frequency will bring you back to the highest frequency.  The test frequency should not auto-proceed.
* There should be a toggle button to be able to change the transducer type between air and bone.  If bone conduction testing is not enabled in the protocol, the bone option should be greyed out.
* There should be a toggle button to change the test ear.  When the test ear is "Left", the play tone button should be colored blue and the play noise button should be colored red (as in the image below).  When the test ear is "Right", the play tone and play noise button colors should switch.
* There should be a tone presentation panel, that displays the current set level, has a play button, and has buttons for adjusting the tone level up and down.
* There should be a masking noise panel, that displays the current set level of the masking noise, has a play button, and has buttons for adjusting the noise level up and down.  Once the play noise button has been pressed, the button symbol should change to a "stop" symbol to indicate that the noise stays on until stopped.  If masking is not enabled in the protocol, the masking panel should be greyed out.
* There should be a "Record" button that saves the current threshold and masking level values.
* There should be an audiogram that builds throughout the exam and indicates the running pure tone average (PTA) for both the left and right ears.  The audiogram should also have an delete option so that a threshold that was recorded on accident may be deleted.  The audiogram must use the correct symbols for the transducer type and test ear. For air-conduction thresholds, remove an unmasked result from the plot when a masked threshold has been recorded for same ear and frequency. For bone-conduction, there can be up to three bone-conduction thresholds marked at a single frequency (i. unmasked, ii. masked-left, iii. masked-right). We'll rely on the allowing audiologists to remove unmasked manual thresholds if they'd like.
* The audiogram should have tabs that allow for either the full audiogram to be viewed, or just the left or right ear values.
* In the two-tablet mode, the response time should be indicated below the audiogram, with a downward pointing arrow indicating when the response occurred and a labeled value on the x-axis indicating the maximum allowable response time (**PollingOffset**).  If a response isn't received, the downward arrow should not be displayed and text should state that no response/an invalid response was received.
* In the two-tablet mode, the **FalsePositive** should be displayed to indicate that test taker was responding during unexpected times. *More to do here on how this should be displayed*.
* If the admin requests a tone presentation exceeding 105 dB SPL, a popup warning message should be displayed, stating, "You are about to exceed 105 dB SPL.  By confirming, you acknowledge the risk of presenting potentially hazardous tones to the subject."  The popup message can include a "Do Not Show Again" checkbox.  "Do Not Show Again" = "True" is only active for the given exam.  Navigating away from the exam or submitting the results should reset "Do Not Show Again" to "False".
* When the tone reaches the maximum output level of the headset, the `No Response` button is enabled. If the admin presses the button, the no response is recorded on the audiogram at the maximum output level using the symbols described in ASHA.
* __Future__. Keyboard shortcuts should map to the following actions:
  * Arrow Up: Increase Tone Level
  * Arrow Down: Decrease Tone Level
  * Arrow Left: Decrease Frequency
  * Arrow Right: Increase Frequency
  * Space Bar: Present stimuli
  * M: Play/pause masking
  * ,: Decrease masking level
  * .: Increase masking level
  * T: Set as threshold
  * L: Left
  * R: Right
  * B: Bone

.. _manual_GUI:

.. figure:: ../images/manual-GUI.png
   :alt: Manual audiometry GUI.
   :align: center
   :width: 6.5in

   **Figure 3**

   *GUI for the standard mode (and the Admin tablet in the two-tablet mode)*

.. _manual_GUI_max_output:

.. figure:: ../images/manual-GUI-max-output.png
   :alt: Manual audiometry GUI - maximum output.
   :align: center
   :width: 4in

   **Figure 4**

   *Behavior at the Maximum Output Level.  (Top panel) At 85 dB HL, the tone can be played.  If the subject didn't respond, use the up adjustment button to increase the level.  (Middle panel) At 90 dB HL, the tone can be played.  If the subject did respond, use the "Record" button to record a threshold of 90 dB HL.  If the subject didn't respond, use the up adjustment button to increase the level.  (Bottom panel) Since 90 dB HL is the maximum output level at this test frequency, the level didn't increase, the number display updated and the play button greyed out.  From here, use the "Record" button to record a "No Response" at 90 dB HL.  The behavior is similar at the lower end of the output range.*

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 20, 60
   :file: ../../_build/generated/manual audiometry-gui.csv

Device Requirements
-------------------
.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 20, 60
   :file: /_build/generated/manual audiometry-device.csv

.. _manual_testing_procedures:

Testing Procedures
------------------

Device Tests
^^^^^^^^^^^^

.. rubric:: HITL

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: /_build/generated/manual audiometry-device-test.csv

.. rubric:: CHAMI

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: /_build/generated/manual audiometry-device-test-chami.csv


Software Tests
^^^^^^^^^^^^^^

.. rubric:: HITL

**Algorithm**

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/manual audiometry-algorithm-test.csv

**Data**

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/manual audiometry-data-test.csv

**GUI**

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/manual audiometry-gui-test.csv

.. rubric:: CHAMI

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/manual audiometry-algorithm-test-chami.csv

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/manual audiometry-data-test-chami.csv
