.. _bhaft:

Bekesy Highest Audible Frequency Threshold
==========================================

This test measures the highest audible frequency for a given level, or the level threshold at the maximum output frequency, using a Bekesy-type tracking algorithm.

.. important::

   In practice, this exam has always been used with the `masking noise feature <chadocs_>`_.

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
     - 17 August 2026
     - SCranford
     - Initial commit for a Bekesy Highest Audible Frequency (BHAFT) exam.  Imported the `CHA DOCS Bekesy Highest Audible Frequency exam <https://code.crearecomputing.com/cha/cha-docs/-/blob/master/CHA/protocols/bekesy%20highest%20audible%20frequency.rst?ref_type=heads>`_ rev 1.5.1.

References
----------

Related internal documents
^^^^^^^^^^^^^^^^^^^^^^^^^^

.. _chadocs: https://cha.crearecomputing.net/cha-docs/CHA/protocols/bekesy%20highest%20audible%20frequency.html

This specification references
"""""""""""""""""""""""""""""
1. `CHA DOCS Bekesy Highest Audible Frequency <chadocs_>`_

This specification is referenced in the following
"""""""""""""""""""""""""""""""""""""""""""""""""
1. `CHA DOCS Bekesy Highest Audible Frequency <chadocs_>`_

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
   * - SRS-bhaft-201
     - The exam begins with a full page landing page with optional protocol specified page title and instruction text.
   * - SRS-bhaft-202
     - The landing page must contain a Begin button which starts the exam.
   * - SRS-bhaft-203
     - Once the exam has started, the user is shown one large red button in the middle of the page for the duration of the exam. This button should be large to make it easy to press on a touch screen.
   * - SRS-bhaft-204
     - When the user presses the button, the button must visually change again to show the button is being pressed.
   * - SRS-bhaft-205
     - When the user releases the button, the button must visually change again to show the button is no longer being pressed.
   * - SRS-bhaft-206
     - When the exam is complete, the view changes to a completion page.
   * - SRS-bhaft-207
     - The completion page must have a Submit button in the button of the page which move the exam on to the next page.
   * - SRS-bhaft-208
     - The completion page can optionally display result text or an audiogram showing the current result threshold in addition to other thresholds recorded during the exam session. Text results (threshold numbers) must be displayed in a tabular grid with Ear (Left, Right) shown on the abscissa and Frequency shown on the ordinal axis.

Device Requirements
-------------------

.. list-table::
   :class: longtable
   :header-rows: 1
   :widths: 15 85

   * - ID
     - Requirement
   * - SRS-bhaft-301
     - The BHAFT exam should only present pure tones when initialized without masking. Tones should be generated in both ears.
   * - SRS-bhaft-302
     - The software button must control the output level of the pure tones.
   * - SRS-bhaft-303
     - The headset must run a BHAFT exam without producing distortion.
   * - SRS-bhaft-304
     - The exam must present pure tones with masking noise at the requested level.
   * - SRS-bhaft-305
     - If there is distortion present, 30 dB of masking must mask the distortion.
   * - SRS-bhaft-306
     - There is no additional device-specific automated testing required for this exam. Testing of pure tones is covered in the Tone Generation automated device testing.

.. _bhaft_testing_procedures:

Testing Procedures
------------------

.. _bhaft_hitl_device_tests:

Device Tests
^^^^^^^^^^^^

The ``wahts-example`` protocol in TabSINT includes a Bekesy Highest Audible Frequency exam to test for tone-generation in each ear, software-button functionality and distortion coincident with tone generation.

.. rubric:: HITL

.. list-table::
   :class: longtable
   :header-rows: 1
   :widths: 20 37 37 6

   * - ID
     - Test Case
     - Acceptance
     - Verified
   * - SRS-bhaft-301
     - Complete a BHAFT exam without masking.
     - Verify that tones are played in both ears.
     -
   * - SRS-bhaft-302
     - Complete a BHAFT exam without masking.
     - Verify that the sound level decreases when you press and hold the response button and increases when you release.
     -
   * - SRS-bhaft-303
     - Complete a BHAFT exam without masking.
     - Verify that distortion is not present. The distortion sounds like a faint brushing coincident with the tone, and is sometimes audible even when tone is out of audible range.
     -
   * - SRS-bhaft-304
     - If distortion is not present, make note and proceed to a BHAFT exam with 30 dB masking.
     - Verify the exam produces audible masking while successfully playing tones
     -
   * - SRS-bhaft-305
     - If distortion is present, proceed with BHAFT exams with masking until the distortion is no longer audible.
     - Make note of masking level that successfully masks the distortion on the checklist. If the distortion is not masked by 30 dB the headset should be flagged.
     -

Software Tests
^^^^^^^^^^^^^^

.. rubric:: HITL

**Algorithm**

 Testing Instructions:

 #. Within the ``wahts-software-test`` protocol, select the "BHAFT" exam.
 #. Press "Begin Exam". Complete the exam according to your hearing ability such that it converges on a threshold.
 #. Use your observations about the presentations during the exam to verify **SRS-bhaft-001**, **SRS-bhaft-002**, and **SRS-bhaft-003**.
 #. Press "Show Debug Info" and look at the frequency array (**F**). Check that the frequency step size before the first reversal and after the first reversal is correct (see figure below). This verifies **SRS-bhaft-004** and **SRS-bhaft-005**.

    `BHAFT Frequency Increments Example <chadocs_>`_

 #. Review the frequency array (**F**) and confirm that the correct number of reversals were kept/discarded. The default value for **ReversalDiscard** is 2 and for **ReversalKeep** is 6. Also confirm that the threshold was correctly calculated (see figure below). This verifies **SRS-bhaft-005**.

    `BHAFT Threshold Calculation Example <chadocs_>`_

 #. Review the frequency array (**F**) and confirm that the starting frequency in the array is equal to **Fstart**. This verifies **SRS-bhaft-007**.
 #. Begin another BHAFT exam. Hold the response button such that the frequency stops increasing and the level starts to decrease. Review the frequency and level arrays (**F** and **L**) and confirm that when the maximum output frequency the exam switches from fixed level to fixed frequency. This verifies **SRS-bhaft-008** and **SRS-bhaft-009**. The Test Case and Acceptance Criteria for **SRS-bhaft-009** will be improved at a later time.

.. list-table::
   :class: longtable
   :header-rows: 1
   :widths: 20 37 37 6

   * - ID
     - Test Case
     - Acceptance
     - Verified
   * - SRS-bhaft-001
     - Start a BHAFT exam at a single level with default parameters
     - The exam must present a tone followed by a quiet pause
     -
   * - SRS-bhaft-002
     - Start a BHAFT exam at a target level with default parameters. After 2 presentations, press and hold the software button
     - The exam must present tones of decreasing frequency until the button is pressed, at which point it will start increasing the frequency. See Figure 1.
     -
   * - SRS-bhaft-003
     - Perform a BHAFT exam at a single target level with default parameters.
     - The exam must present tones of increasing frequency until the button is released
     -
   * - SRS-bhaft-004
     - Perform a BHAFT exam at a single target level with default parameters.
     - Review the frequency array that is returned and check that the frequency step size after the first threshold reversal is as specified. The default value for IncrementNominalFrequency is 1/12 octave.
     -
   * - SRS-bhaft-005
     - Perform a BHAFT exam at a single target level with default parameters.
     - Review the frequency array that is returned and check that the frequency step size before the first threshold reversal is as specified. The default value for IncrementStartMultiplierFrequency is 2.
     -
   * - SRS-bhaft-006
     - Perform a BHAFT exam at a single frequency with default parameters.
     - Review the frequency array that is returned and check that the specified number of reversals were discarded, and the specified number of reversals were kept. Compute the threshold using the frequency values at each kept reversal. Compare to reported threshold. See Figure 2 for an example. The default value for ReversalDiscard is 2 and for ReversalKeep is 6.
     -
   * - SRS-bhaft-007
     - Perform a BHAFT exam at a single level with default parameters.
     - Review the frequency array that is returned and check that the starting level is the one specified. The default value for Fstart is 1000 Hz.
     -
   * - SRS-bhaft-008
     - Perform a BHAFT exam at a single level with default parameters. Hold the response button until the frequency stops increasing and the level starts to decrease.
     - Review the frequency and level arrays that are returned and check that the response switches from fixed level to fixed frequency after the maximum output frequency is reached. See Figure 3 for an example.
     -
   * - SRS-bhaft-009
     - Start a BHAFT exam. Simulate a user with a frequency threshold at the maximum output frequency.
     - The frequency should first increase, then remain constant while the level changes between the users' threshold and the maximum level at the maximum output frequency. Then the frequency should decrease until the user responds. This behavior may happen more than once until at least n reversals have occurred in either mode. See Figure 4.
     -
   * - SRS-bhaft-011
     - The CHA is not an automatic recording audiometer and this requirement doesn't apply to the BHAFT algorithm.
     - N/A
     - N/A

**Data**

 Testing Instructions:

 #. Within the ``wahts-software-test`` protocol, select the "BHAFT" exam.
 #. Perform two tests: once with a convergent threshold and once without a convergent threshold. After each exam, check that the following parameters are given: **ThresholdLevel**, **ThresholdFrequency**, **F**, **L**, **ResultType**. This verifies **SRS-bhaft-101**.
 #. After finishing the protocol, press submit. Check that **SRS-bhaft-102** is verified.

.. list-table::
   :class: longtable
   :header-rows: 1
   :widths: 20 37 37 6

   * - ID
     - Test Case
     - Acceptance
     - Verified
   * - SRS-bhaft-101
     - Start a BHAFT exam with default input parameters and complete the exam once with a convergent threshold and once without a convergent threshold
     - The exam must return all result fields defined in **TestBekesyHighestAudibleFrequencyResults** with appropriate values.
     -
   * - SRS-bhaft-102
     - Complete a BHAFT exam. Finish the protocol and submit.
     - Verify once you have completed the protocol that the results from the BHAFT exam are in the CSV file found in the results folder in the internal storage of the tablet.
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
   * - SRS-bhaft-201
     - Load a default exam protocol and navigate to the start page.
     - The exam protocol should begin with a landing page with exam protocol title and instructions displayed
     -
   * - SRS-bhaft-202
     - Load a default exam protocol and navigate to the start page. Press the Begin button when shown.
     - The landing page must contain Begin button and when pressed, this button must begin the exam.
     -
   * - SRS-bhaft-203
     - Load a default exam protocol, navigate to the start page and press the Begin button.
     - The page must display a large red button.
     -
   * - SRS-bhaft-204
     - Load a BHAFT exam with default parameters, navigate to the start page and press the Begin button. Press the red button while the exam is in progress.
     - The red button must visually change when being actively pressed.
     -
   * - SRS-bhaft-205
     - Load a BHAFT exam with default parameters, navigate to the start page and press the Begin button. Press the red button while the exam is in progress and then release.
     - The red button must visually change when being actively pressed and then go back to the original state when released.
     -
   * - SRS-bhaft-206
     - Load a default exam protocol, navigate to the start page and press the Begin button. Let the exam run to completion without responding.
     - The display must eventually change to a completion page after the exam fails to converge.
     -
   * - SRS-bhaft-207
     - Load a BHAFT exam with default parameters, navigate to the start page and press the Begin button. Let the exam run to completion without responding. On the completion page, press the Submit button.
     - The display must change from the completion page to the next page in the exam.
     -
   * - SRS-bhaft-208
     - Load a BHAFT exam configured to show a results table. Navigate to the start page and press the Begin button. Respond to the exam in a way as to converge on a threshold.
     - The completion page must show a table with Ear and Frequency. In the cell of the current exam Ear and Frequency, the threshold level value must be filled in.
     -
