DPGRAM
=================================

This test is to perform a DPGRAM exam.

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
     - 7 August 2026
     - VAL
     - Initial commit for a DPGRAM exam, a software implementation which is a variation of the Swept DPOAE exam and runs a Swept DPOAE firmware exam.


References
----------

Related internal documents
^^^^^^^^^^^^^^^^^^^^^^^^^^


This software specification relates to the `firmware specification <https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/blob/main/Specifications/swept_dpoae.rst?ref_type=heads>`_.



Algorithm
--------------

See `firmware specification <https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/blob/main/Specifications/swept_dpoae.rst?ref_type=heads>`_. The DPGRAM exam runs a series of firmware DPGRAM exams, where each step in the series runs a single frequency (same start and end frequency for each step). This exam specifies which frequencies to run.

Implementation
--------------

GUI
^^^^

The GUI should look like the image below with the following features.

* The following parameters should be configurable in the protocol: Frequency array, frequency ratio, sweep duration, window duration, minimum number of sweeps, maximum number of sweeps, and the minimum noise floor threshold (i.e., the termination condition)
* The GUI should display the parameters from the protocol in a table similar to the one shown below
* There should be a `Submit` button to initiate the exam. The `Submit` button becomes inactive after initating the exam.
* After initiating the exam, a progress bar appears and the `Submit` button is replaced with an inactive `Next` button (See screen 2 image below).
* While the exam progresses, live results are plotted for the individual frequencies specfied in the `FrequencyArray`. The exam progresses automatically through each frequency. The DPOAE value is plotted as a blue circle and the noise value is plotted as a red 'x'. The normative background plotting is displayed as background.
* The `Next` button becomes active after all of the frequencies of the DPGRAM exam are completed.

.. list-table::
   :widths: 50, 50
   :header-rows: 1

   * - Parameter
     - Value
   * - Frequency Array [Hz[]]
     - [frequencyArray]
   * - Ratio
     - [frequencyRatio]
   * - Sweep Duration [s]
     - [sweepDuration]
   * - Window Duration [s] 
     - [windowDuration]
   * - Minimum Number of Sweeps
     - [minSweeps]
   * - Maximum Number of Sweeps
     - [maxSweeps]
   * - Noise Floor Threshold
     - [noiseFloorThreshold]

.. figure:: dpgram-GUI-Screen1a.png
   :align: center
   :width: 400px

   **Figure 1.** *GUI for the DPGRAM exam prior to submission. Screen 1a*

.. figure:: dpgram-GUI-Screen1b.png
   :align: center
   :width: 400px

   **Figure 2.** *GUI for the DPGRAM exam while the exam is in progress. Screen 1b*

Results-View
^^^^^^^^^^^^^

The GUI should display the results of the DPGRAM exam:
* Results are plotted in a manner similar to the plot shown below.
* Below the plot, a table similar to the one shown below should summarize the results saved for the DPGRAM exam.

.. figure:: dpgram-GUI-Results.png
   :align: center
   :width: 400px

   **Figure 3.** *GUI for the DPGRAM Results screen. Results Screen*

Software Testing Procedures
---------------------------

Algorithm
^^^^^^^^^^^

.. list-table::
   :widths: 30, 30, 30, 6
   :header-rows: 1

   * - Requirement
     - Test Case
     - Acceptance
     - Verified
   * - The exam presents chirps with an array of frequencies, frequency ratio, output levels for each frequency, sweep duration, and window duration.
     - Initiate a DPGRAM exam using the Submit button.
     - Verify that the emitted chirp is the correct frequency for each step of the sequence, frequency ratio, output levels for each frequency, sweep duration, and window duration.
     - 
   * - The exam presents a number of chirps greater than or equal to the Minimum Number of Sweeps and less than or equal to the Maximum Number of Sweeps.
     - Initiate a DPGRAM exam using the Submit button. Intentionally prevent the exam from meeting the threshold criterion. 
     - Verify that the exam plays at least the Minimum Number of Sweeps and no more than the Maximum Number of Sweeps, then concludes.
     - 
   * - The exam can be aborted.
     - Initiate an exam normally. Once the exam is active, click `Abort`.
     - Verify that the exam aborts successfully and proceeds to the results-view.
     - 
   * - Live results are plotted while the exam progresses.
     - Initiate and complete an exam normally.
     - Verify that DPOAE and noise values are plotted for the frequencies specified while the exam progresses.
     - 
   * - The exam results are displayed.
     - Complete an exam normally. Then click the `Finish` button. Proceed to the results-view page.
     - Verify that the DPOAE, noise floor, F1 and F2 are plotted in dB SPL as a function of F2. Verify that DpLow, DpHigh, F1, and F2 are displayed in table format.
     - 

Data
^^^^^^^^^^^^^

.. list-table::
   :widths: 30, 30, 30, 6
   :header-rows: 1

   * - Requirement
     - Test Case
     - Acceptance
     - Verified
   * - The exam must return all fields defined in `firmware specification <https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/blob/main/Specifications/swept_dpoae.rst?ref_type=heads>`_. 
     - Start a DPGRAM exam and complete the exam successfully. 
     - Verify the exam returns all result fields defined in `firmware specification <https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/blob/main/Specifications/swept_dpoae.rst?ref_type=heads>`_ with appropriate values.
     - 
   * - The exam must display all `SweptDpoaeResults` fields defined  in `firmware specification <https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/blob/main/Specifications/swept_dpoae.rst?ref_type=heads>`_.
     - Start a DPGRAM exam, complete the exam. 
     - Verify that all results are accurately displayed both during and after the exam.
     - 
   * - The exam must export all `SweptDpoaeResults` fields defined in `firmware specification <https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/blob/main/Specifications/swept_dpoae.rst?ref_type=heads>`_.
     - Submit the exam and export results.
     - Verify that all results are accurately exported.
     - 

GUI
^^^^

.. list-table::
   :widths: 30, 30, 30, 6
   :header-rows: 1

   * - Requirement
     - Test Case
     - Acceptance
     - Verified
   * - The user can initiate the exam specified in the protocol.
     - Load a DPGRAM exam protocol. Then, click `Submit`.
     - Verify that the GUI displays the parameters in the exam protocol and that the exam is initiated after `Submit` is pressed.
     - 
   * - The user can abort the exam.
     - During an active exam, press `Abort`.
     - Verify that the exam aborted.
     -
   * - The user can submit results.
     - After a successful exam, press `Submit`.
     - Verify that the exam results were saved and/or exported to the repository, as specified in the protocol.
     - 
