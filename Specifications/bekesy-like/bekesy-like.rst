.. |lu| replace:: **LevelUnits**

.. _bekesy:

Bekesy Like
===========

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
     - 18 August 2026
     - SCranford
     - Initial commit for a Bekesy Like exam.  Imported the `CHA DOCS Bekesy Like exam <https://code.crearecomputing.com/cha/cha-docs/-/blob/master/CHA/protocols/bekesy.rst?ref_type=heads>`_ rev 6.3.1.


References
----------

Related internal documents
^^^^^^^^^^^^^^^^^^^^^^^^^^

.. _chadocs: https://cha.crearecomputing.net/cha-docs/CHA/protocols/bekesy.html

This specification references
"""""""""""""""""""""""""""""
1. `CHA DOCS Bekesy Like <chadocs_>`_

This specification is referenced in the following
"""""""""""""""""""""""""""""""""""""""""""""""""
1. `CHA DOCS Bekesy Like <chadocs_>`_

Literature
^^^^^^^^^^

Implementation
--------------

GUI
^^^

.. list-table::
   :class: longtable
   :header-rows: 1
   :widths: 15 85

   * - ID
     - Requirement
   * - SRS-bekesy-201
     - The test begins with a full page landing page with optional protocol specified page title and instruction text.
   * - SRS-bekesy-202
     - The landing page must contain a Begin button which starts the test.
   * - SRS-bekesy-203
     - Once the test has started, the user is shown one large red button in the middle of the page for the duration of the test. This button should be large to make it easy to press on a touch screen.
   * - SRS-bekesy-204
     - When the user presses the button, the button must visually change again to show the button is being pressed.
   * - SRS-bekesy-205
     - When the user releases the button, the button must visually change again to show the button is no longer being pressed.
   * - SRS-bekesy-206
     - When the test is complete, the view changes to a completion page.
   * - SRS-bekesy-207
     - The completion page must have a Submit button in the button of the page which move the test on to the next page.
   * - SRS-bekesy-208
     - The completion page can optionally display result text or an audiogram showing the current result threshold in addition to other thresholds recorded during the test session. Text results (threshold numbers) must be displayed in a tabular grid with Ear (Left, Right) shown on the abscissa and Frequency shown on the ordinal axis.
   * - SRS-bekesy-209
     - When the completion page is configured to present an audiogram, threshold data must be presented in accordance with `ASHA Guidelines for Audiometric Symbols <chadocs_>`_.

Device Requirements
-------------------

.. list-table::
   :class: longtable
   :header-rows: 1
   :widths: 15 85

   * - ID
     - Requirement
   * - SRS-bekesy-301
     - There is no additional device-specific automated testing required for this exam. Testing of pure tones is covered in the Tone Generation automated device testing.
   * - SRS-bekesy-302
     - This exam does not require device testing because its ability to generate tones is covered by testing BHAFT which uses Tone Generation to generate pure tones at a requested frequency.

.. _bekesy_testing_procedures:

Testing Procedures
------------------

Device Tests
^^^^^^^^^^^^

.. rubric:: HITL

.. list-table::
   :class: longtable
   :header-rows: 1
   :widths: 20 37 37 6

   * - ID
     - Test Case
     - Acceptance
     - Verified
   * - SRS-bekesy-302
     - This exam does not require device testing because its ability to generate tones is covered by testing BHAFT which uses Tone Generation to generate pure tones at a requested frequency.
     - N/A
     - N/A

Software Tests
^^^^^^^^^^^^^^

This HITL testing requires the use of sound room equipment. The nexus amplifier gain should always be set to 1 V/Pa unless stated otherwise.

.. rubric:: HITL

**Algorithm**

 Testing Instructions:

 #. Within the ``wahts-software-test`` protocol, select the "Bekesy Like" exam.
 #. Press "Begin Exam". After 4 presentations, press and hold the button and continue to finish the exam based on your own hearing ability.
 #. After the exam is complete, you can verify links **SRS-bekesy-001** through **SRS-bekesy-007**:

    * **SRS-bekesy-001** - **SRS-bekesy-003**: Can be verified using what you heard during the exam.
    * **SRS-bekesy-004** - **SRS-bekesy-005**: Press "Show Debug Info". Under "Exam Results" navigate to Object>testResults>responses>1>L to see the level array. Verify that the level increments are 4 (**IncrementStart**) for the first four presentations and 2 (**IncrementNominal**) for the remaining presentations.
    * **SRS-bekesy-006**: Using the level array, identify the levels where a reversal occurs (when the level goes from increasing to decreasing or vice versa). There should be 8 total reversals (**ReversalDiscard** + **ReversalKeep**), including the last level in the array. Take the average of the last 6 reversal levels (**ReversalKeep**) and check that it matches the Threshold value (listed above the level array in the Debug Info). An image below shows an example of this process.

      `Bekesy Threshold Calculation Example <chadocs_>`_

    * **SRS-bekesy-007**: Using the level array, verify that the first level (**Lstart**) is 40.

 #. Press "Begin Exam". Hold down the button for ~7 seconds (or as long as necessary to go below **MinimumOutputLevel**-6) without stopping the exam. Then repeatedly release the button for 2 seconds and press the button for 2 seconds until the test ends. Check the level array and confirm that **MinimumOutputLevel**-6 is counted as a reversal. This verifies **SRS-bekesy-008**.
 #. Press "Begin Exam". Respond such that the exam converges on a threshold as quickly as possible (like repeatedly pressing and releasing the button every 1-2 seconds). Below the level array, find the **responseElapTimeMS** variable and check that it is greater than 30000 (30 seconds). This verifies **SRS-bekesy-009**.
 #. **SRS-bekesy-011** is not currently included in automated testing, but will be added in the near future. Currently, this case can be tested by running bekesyLikeTest.m with the input variable "min" set to 1. Because this has been recently verified, this test case can be skipped and marked as "Verified".
 #. **SRS-bekesy-010**, **SRS-bekesy-012**, and **SRS-bekesy-013** are verified by running runSoftwareTestSuite.m and receiving a passing result.

.. list-table::
   :class: longtable
   :header-rows: 1
   :widths: 20 37 37 6

   * - ID
     - Test Case
     - Acceptance
     - Verified
   * - SRS-bekesy-001
     - Start a Bekesy test at a single frequency with default parameters
     - The test must present a tone followed by a quiet pause
     -
   * - SRS-bekesy-002
     - Start a Bekesy test at a single frequency with default parameters. After 4 presentations, press and hold the software button
     - The test must present tones of increasing level until the button is pressed, at which point it will start decreasing the level.

       .. note:: Currently not being tested.
     -
   * - SRS-bekesy-003
     - Perform a Bekesy test at a single frequency with default parameters.
     - The test must present tones of decreasing level until the button is released.

       .. note:: Currently not being tested.
     -
   * - SRS-bekesy-004
     - Perform a Bekesy test at a single frequency with default parameters.
     - Review the level array that is returned and check that the level increment after the first threshold reversal is as specified. The default value for IncrementNominal is 2.
     -
   * - SRS-bekesy-005
     - Perform a Bekesy test at a single frequency with default parameters.
     - Review the level array that is returned and check that the level increment before the first threshold reversal is as specified. The default value for IncrementStart is 4.
     -
   * - SRS-bekesy-006
     - Perform a Bekesy test at a single frequency with default parameters.
     - Review the level array that is returned and check that the specified number of reversals were discarded, and the specified number of reversals were kept. Compute the threshold using the level values at each kept reversal. Compare to reported threshold. See Figure 1. The default values for ReversalDiscard and ReversalKeep are 2 and 6.
     -
   * - SRS-bekesy-007
     - Perform a Bekesy test at a single frequency with default parameters.
     - Review the level array that is returned and check that the starting level is the one specified. The default value for Lstart is 40.
     -
   * - SRS-bekesy-008
     - Perform a Bekesy test at a single frequency with default parameters. Press and hold the response button until the level hits L = MinimumOutputLevel-6. After 3 presentations at this level, release the button. Let the level increase for ~5 presentations, then press and hold the response button until the level hits MinimumOutputLevel-6. Repeat until the test ends.
     - Review the level array that is returned. Compute the threshold using the level values at each kept reversal. Compare to reported threshold.
     -
   * - SRS-bekesy-009
     - The CHA is not an automatic recording audiometer and this requirement doesn't apply to the Bekesy-Like algorithm.
     - N/A
     - N/A
   * - SRS-bekesy-011
     - SOUND ROOM REQUIRED: Perform a Bekesy test at a single frequency with default parameters and record the waveform. Press and hold the response button until the test ends.
     - Analyze the waveform using MATLAB and check that the level stopped decreasing after it reached the MinimumOutputLevel-6.

       .. note:: This was last verified in May 2021 as documented in IM-22-04-077 and should be retested if there are firmware changes that impact minimum output levels. Seek guidance from firmware developer.
     -
   * - SRS-bekesy-014
     - The CHA is not an automatic recording audiometer and this requirement doesn't apply to the Bekesy-Like algorithm.
     - N/A
     - N/A

**Data**

 Testing Instructions:

 #. Within the ``wahts-software-test`` protocol, select the "Bekesy Like" exam.
 #. Press "Begin Exam". Finish the exam based on your own hearing ability so that the exam converges to a threshold. Press "Show Debug Info". Under "Exam Results" navigate to Object>testResults>responses>1 and check that the following parameters are given: **RetSPL**, **L**, **MaximumExcursion**, **Slope**, **Threshold**, **Units**, and **ResultType**.
 #. Press "Begin Exam". Continuously press the button so that the exam does not converge. If prompted to repeat the test, do so. Under "Exam Results" navigate to Object>testResults>responses>2 and check for the same parameters listed in step 2.
 #. Steps 2 and 3 verify **SRS-bekesy-101**.
 #. After finishing the protocol, press submit. Check that **SRS-bekesy-102** is verified.

.. list-table::
   :class: longtable
   :header-rows: 1
   :widths: 20 37 37 6

   * - ID
     - Test Case
     - Acceptance
     - Verified
   * - SRS-bekesy-101
     - Start a Bekesy test with default input parameters and complete the test once with a convergent threshold and once without a convergent threshold
     - The test must return all result fields defined in **TestBekesyLikeResults** with appropriate values.
     -
   * - SRS-bekesy-102
     - Complete a Bekesy exam. Finish the protocol and submit.
     - Verify once you have completed the protocol that the results from the Bekesy exam are in the CSV file in the results folder in the internal storage of the tablet.
     -

**GUI**

.. list-table::
   :class: longtable
   :header-rows: 1
   :widths: 20 37 37 6

   * - ID
     - Test Case
     - Acceptance
     - Verified
   * - SRS-bekesy-201
     - Load a default test protocol and navigate to the start page.
     - The test protocol should begin with a landing page with test protocol title and instructions displayed
     -
   * - SRS-bekesy-202
     - Load a default test protocol and navigate to the start page. Press the Begin button when shown.
     - The landing page must contain Begin button and when pressed, this button must begin the test.
     -
   * - SRS-bekesy-203
     - Load a default test protocol, navigate to the start page and press the Begin button.
     - The page must display a large red button.
     -
   * - SRS-bekesy-204
     - Load a default test protocol, navigate to the start page and press the Begin button. Press the red button while the test is in progress.
     - The red button must visually change when being actively pressed.
     -
   * - SRS-bekesy-205
     - Load a default test protocol, navigate to the start page and press the Begin button. Press the red button while the test is in progress and then release.
     - The red button must visually change when being actively pressed and then go back to the original state when released.
     -
   * - SRS-bekesy-206
     - Load a default test protocol, navigate to the start page and press the Begin button. Let the test run to completion without responding.
     - The display must eventually change to a completion page after the test fails to converge.
     -
   * - SRS-bekesy-207
     - Load a default test protocol, navigate to the start page and press the Begin button. Let the test run to completion without responding. On the completion page, press the Submit button.
     - The display must change from the completion page to the next page in the test.
     -
   * - SRS-bekesy-208
     - Load a test protocol configured to show a results table. Navigate to the start page and press the Begin button. Respond to the test in a way as to converge on a threshold.
     - The completion page must show a table with Ear and Frequency. In the cell of the current test Ear and Frequency, the threshold level value must be filled in.
     -
   * - SRS-bekesy-209
     - Load a test protocol configured to show an audiogram. Navigate to the start page and press the Begin button. Respond to the test in a way as to converge on a threshold.
     - The completion page must show an audiogram automatically generated when the test is complete. The audiogram must be presented in the format as shown in the ASHA Guidelines for Audiometric Symbols. If the test was taken on a left ear it must be represented with a blue X. If the test was taken on the right ear it must be represented with a red O.
     -
