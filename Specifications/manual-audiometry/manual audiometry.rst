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
     - Initial commit for a new manual audiometry exam.  Imported the [CHA DOCS manual audiometry exam](https://cha.crearecomputing.net/cha-docs/CHA/protocols/manual%20audiometry.html). Supports both one- and two-tablet (standard and telehealth) modes, bone conduction, and masking although initially none of these options will be implemented.


References
----------

Related internal documents
^^^^^^^^^^^^^^^^^^^^^^^^^^


This software specification relates to the [firmware specification](https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/blob/main/Specifications/manual_audiometry.rst?ref_type=heads).


Literature
^^^^^^^^^^

ANSI S3.6-2018: Specification for audiometers


GUI
^^^^

The GUI should look like the image below with the following features. Features in *italics* are not supported in the Minimum Viable Product.

* There should be a frequency panel that displays the current frequency. The frequency panel has left and right buttons to adjust frequency. The buttons should continuously scroll, meaning pressing the right arrow from the highest frequency will bring you back to the lowest frequency. Likewise, pressing the left arrow from the lowest frequency will bring you back to the highest frequency.  The test frequency should not auto-proceed.
* There should be a toggle button to change the test ear.  When the test ear is "Left", the play tone button should be colored blue and the play noise button should be colored red (as in the image below).  When the test ear is "Right", the play tone and play noise button colors should switch.
* There should be a tone presentation panel, that displays the current set level, has a play button, and has buttons for adjusting the tone level up and down.
* *There should be a masking noise panel, that displays the current set level of the masking noise, has a play button, and has buttons for adjusting the noise level up and down.  Once the play noise button has been pressed, the button symbol should change to a "stop" symbol to indicate that the noise stays on until stopped.  If masking is not enabled in the protocol, the masking panel should be greyed out.*
* There should be a "Record" button that saves the current threshold and masking level values.
* There should be an audiogram that builds throughout the exam and indicates the running pure tone average (PTA) for both the left and right ears.  The audiogram should also have an delete option so that a threshold that was recorded on accident may be deleted.  The audiogram must use the correct symbols for the transducer type and test ear. For air-conduction thresholds, remove an unmasked result from the plot when a masked threshold has been recorded for same ear and frequency. For bone-conduction, there can be up to three bone-conduction thresholds marked at a single frequency (i. unmasked, ii. masked-left, iii. masked-right). We'll rely on the allowing audiologists to remove unmasked manual thresholds if they'd like.
* When the tone reaches the maximum output level of the headset, the `No Response` button is enabled. If the admin presses the button, the no response is recorded on the audiogram at the maximum output level using the symbols described in ASHA.
* Behavior at the Maximum Output Level.  If the subject doesn't respond at the Maximum Output Level, use the up adjustment button to increase the level.  The level doesn't increase, but the number display updates (i.e. 90 to (+90) )and the play button greyed out.  From here, use the "No Response" button to record a "No Response" at the Maximum Output Level. 
* Behavior at the Minimum Output Level (-10 dB HL).  If the subject responds at the Minimum Output Level, use the up adjustment button to decrease the level.  The level doesn't decrease, but the number display updates (i.e. -10 to (-90) ) and the play button greyed out.  From here, use the "Record Threshol" button to record a threshold at the Minimum Output Level with a result type `Hearing Possibly Better Than Calibrated Range`. 
* If a tone presentation exceeding 105 dB SPL is requested, a popup warning message should be displayed, stating, "You are about to exceed 105 dB SPL.  By confirming, you acknowledge the risk of presenting potentially hazardous tones to the subject."  The popup message can include a "Do Not Show Again" checkbox.  "Do Not Show Again" = "True" is only active for the given exam.  Navigating away from the exam or submitting the results should reset "Do Not Show Again" to "False".
* *Future.*
  * *There should be a toggle button to be able to change the transducer type between air and bone.  If bone conduction testing is not enabled in the protocol, the bone option should be greyed out.*
  * *There should be a masking noise panel, that displays the current set level of the masking noise, has a play button, and has buttons for adjusting the noise level up and down.  Once the play noise button has been pressed, the button symbol should change to a "stop" symbol to indicate that the noise stays on until stopped.  If masking is not enabled in the protocol, the masking panel should be greyed out.*
  * *The response time should be indicated between the audiograms, with green dots indicating tones and dark grey dot indication when the response was recorded relative to the thones (**PollingOffset**).  *If a response isn't received, no grey dot is shown.*
  * *The **FalsePositive** *should be displayed between the audiograms to indicate that the subject was responding during unexpected times. Each red vertical line indicates one false positive, with a maximum of three (three lines indicate three or more false positives)*.
  * *Keyboard shortcuts should map to the following actions:*
    * *Arrow Up: Increase Tone Level*
    * *Arrow Down: Decrease Tone Level*
    * *Arrow Left: Decrease Frequency*
    * *Arrow Right: Increase Frequency*
    * *Space Bar: Present stimuli*
    * *M: Play/pause masking*
    * *,: Decrease masking level*
    * *.: Increase masking level*
    * *T: Set as threshold*
    * *L: Left*
    * *R: Right*
    * *B: Bone*


.. figure:: ../manual-audiometry-GUI-MVP.png
   :align: center
   :width: 6.5in

   **Figure 1**

   *GUI for the MVP*

.. figure:: ../manual-audiometry-GUI-long-term.png
   :align: center
   :width: 6.5in

   **Figure 2**

   *GUI for the long term manual audiometry dashboard*


Software Testing Procedures
---------------------------

Algorithm
^^^^^^^^^^^^^^

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 30, 30, 30, 6
   :file: ../manual-audiometry-algorithm-test.csv

Data
^^^^^^^^^^^^^^

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 30, 30, 30, 6
   :file: ../manual audiometry-data-test.csv

GUI
^^^^^^^^^^^^^^

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 30, 30, 30, 6
   :file: ../manual-audiometry-gui-test.csv
