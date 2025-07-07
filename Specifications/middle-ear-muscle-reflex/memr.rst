MEMR
=================================

This test is to perform a MEMR (Middle Ear Muscle Reflex).

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
     - 3 July 2025
     - BGraybill
     - Initial commit for a MEMR exam.


References
----------

Related internal documents
^^^^^^^^^^^^^^^^^^^^^^^^^^


This software specification relates to the `firmware specification <https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/blob/feeature/MEMR/Specifications/play_record_exam.rst>`_.



Algorithm
--------------

See `firmware specification <https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/blob/feeature/MEMR/Specifications/play_record_exam.rst>`_.

Implementation
--------------

GUI
^^^^

The GUI should look like the image below with the following features.

* The following parameters should be configurable in the protocol: name of the sound (WAV) file, a boolean flag for using the metascalar, the number of trials to play, a 2D array of sound levels (specified in dB SP), the name of the recorded file (to be post-processed for results), and the submission interval
* The GUI should display parameters from the protocol in a table similar to the one shown below
* There should be a `Submit` button to initiate the exam. The `Submit` button becomes inactive after initating the exam.
* After initiating the exam, a progress bar appears along with a reported numerical value for the number of trials played. The `Submit` button is replaced with an `Abort` button (See screen 2 image below) should early termination of the exam be required.
* After the MEMR exam concludes, a Results page is displayed with a message indicating the exam is complete. The displayed `Finish` button returns the user to the admin page.

.. list-table::
   :widths: 50, 50
   :header-rows: 1

   * - Parameter
     - Value
   * - Subject Type
     - [Chinchilla/Human]
   * - Sound File Name
     - [SoundFileName]
   * - Gain Scale
     - [metaDataScalar]
   * - Number of Trials
     - [NumTrials]
   * - Min Level [dB SPL] 
     - [min([Level_dbSPL])]
   * - Max Level [dB SPL] 
     - [max([Level_dbSPL])]
   * - Results File Name
     - [RecordFileName]

.. figure:: memr-GUI-Screen1.png
   :align: center
   :width: 400px

   **Figure 1.** *GUI for the MEMR exam prior to submission. Screen 1*

.. figure:: memr-GUI-Screen2.png
   :align: center
   :width: 400px

   **Figure 2.** *GUI for the MEMR exam while the exam is in progress. Screen 2*

Results-View
^^^^^^^^^^^^^

The GUI should display the concluding page after the MEMR exam:

.. figure:: memr-GUI-Screen3.png
   :align: center
   :width: 400px

   **Figure 3.** *GUI for the MEMR Results screen. Results Screen*

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
   * - The exam presents interspersed probe and elicitor stimuli for the number of repetitions specified in the protocol.
     - Initiate a MEMR exam using the Submit button.
     - Verify that the emitted sound is repeated the correct number of times.
     - 
   * - The elicitor level increases between repetitions for a human subject.
     - Load a MEMR protocol for a human subject.
     - Initiate a MEMR exam using the Submit button.
     - Verify that the elictor level increases between repetitions.
     - 
   * - The elicitor level increases within a single repetition for a chinchilla subject.
     - Load a MEMR protocol for a chinchilla subject.
     - Initiate a MEMR exam using the Submit button.
     - Verify that the elicitor level increases within a single repetition.
     - 
   * - The exam can be aborted.
     - Initiate an exam normally. Once the exam is active, click `Abort`.
     - Verify that the exam aborts successfully and proceeds to the results-view.
     - 
   * - The exam correctly exports the recorded WAV file.
     - Complete an exam normally. Then click the `Finish` button. Proceed to the results-view page.
     - Verify that the recorded result is saved in the specified location and with the name specified in the exam protocol.
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
   * - The exam must return all fields defined in `firmware specification <https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/blob/feeature/MEMR/Specifications/play_record_exam.rst>`_. 
     - Start a Swept OAE exam and complete the exam successfully. 
     - Verify the exam returns all result fields defined in `firmware specification <https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/blob/feeature/MEMR/Specifications/play_record_exam.rst>`_ with appropriate values.
     - 
   * - The exam must export all `MEMRResults` fields defined in `firmware specification <https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/blob/feeature/MEMR/Specifications/play_record_exam.rst>`_.
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
     - Load a MEMR exam protocol. Then, click `Submit`.
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
