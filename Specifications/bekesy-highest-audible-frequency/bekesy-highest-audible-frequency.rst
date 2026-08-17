.. _bhaft:

Bekesy Highest Audible Frequency Threshold
==========================================

This test measures the highest audible frequency for a given level, or the level threshold at the maximum output frequency, using a Bekesy-type tracking algorithm.

.. important::

   In practice, this exam has always been used with the :doc:`masking noise feature<../features/noise>`.

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
     - Initial commit for a Bekesy Highest Audible Frequency (BHAFT) exam.  Imported the `CHA DOCS Bekesy Highest Audible Frequency exam <https://code.crearecomputing.com/cha/cha-docs/-/blob/master/CHA/protocols/bekesy%20highest%20audible%20frequency.rst?ref_type=heads>`_ rev 1.5.0. 

References
----------

This specification references
"""""""""""""""""""""""""""""
1. :doc:`../api/index`
2. :doc:`audiometry`
3. :doc:`bekesy`
4. :doc:`calibration`
5. :doc:`tone generation`

This specification is referenced in the following
"""""""""""""""""""""""""""""""""""""""""""""""""
1. :doc:`audiometry`

Literature
^^^^^^^^^^

Algorithm
---------

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 20, 60
   :file: ../../_build/generated/bekesy highest audible frequency-algorithm.csv


.. _bhaft_figure_1:

.. figure:: ../images/HAF_Algorithm.png
   :alt: Bekesy Highest Audible Frequency
   :align: center

   **Figure 1**

   *Bekesy Highest Audible Frequency Threshold Algorithm Schematic. "i" is the relevant increment*
   
.. todo::
   should the following statement be in the SRS or removed?

The exam ends successfully if *ReversalsKeep* reversals are observed enforcing the :doc:`bekesy` "peaks and valleys" criterion. 
   
.. todo::
   Do we need the following "Behavior..." block?

Behavior at Min/Max Levels
^^^^^^^^^^^^^^^^^^^^^^^^^^   
Levels or frequencies should stop decreasing and the unresponsive logic should be followed if they reach their minimum allowed values (exam or calibration setting). If a level/frequency pair is requested that violates any of maximum output level rules (either what's stored in calibration or the - 1 dB FS rule), the exam should error out with the "parameter inconsistent with calibration" error.*


Example Cases
^^^^^^^^^^^^^

The three examples below have the following parameters:

- *Fstart* = 8000
- *L0* = 80
- *MaximumOutputFrequency* = 16000

Threshold Below MaximumOutputFrequency
""""""""""""""""""""""""""""""""""""""
If the subject's threshold frequency at *L0* is less than *MaximumOutputFrequency* then the traditional fixed-level frequency threshold (FLFT) behavior is observed:

.. _bhaft_figure_2:

.. figure:: ../images/HAF_Freq.png
   :alt: Example Behavior for Threshold Below MaximumOutputFrequency
   :align: center

   **Figure 2**

Threshold Above MaximumOutputFrequency
""""""""""""""""""""""""""""""""""""""
If the subject's threshold is significantly less than *L0* at the *MaximumOutputFrequency* then traditional fixed-frequency level threshold (FFLT)-like behavior is observed following the FLFT portion of the exam:

.. _bhaft_figure_3:

.. figure:: ../images/HAF_Level.png
   :alt: Example Behavior for Threshold Above MaximumOutputFrequency
   :align: center

   **Figure 3**

Threshold Near MaximumOutputFrequency
"""""""""""""""""""""""""""""""""""""
If the subject's threshold is close to *L0* at the *MaximumOutputFrequency* then both FLFT and FFLT behavior is observed:

.. _bhaft_figure_4:

.. figure:: ../images/HAF_FreqLevel.png
   :alt: Example Behavior for Threshold Near MaximumOutputFrequency
   :align: center

   **Figure 4**

SemiAutomatic Mode
^^^^^^^^^^^^^^^^^^
If *SemiAutomaticMode* is True, the exam pauses after each presentation, and the CHA waits for an answer on whether the patient heard the tone or not. When an answer is received the exam resumes.

Stopping Criteria
^^^^^^^^^^^^^^^^^
The exam ends after *ReversalDiscard* plus *ReversalKeep* presentations and, for the last *ReversalKeep* presentations, when the minimum value of all the level  "peaks" at any reversal is greater than *or equal to* the maximum value of all the level  "valleys" at any reversal and the minimum value of all the frequency "peaks"  at any reversal is greater than *or equal to* the maximum value of all the frequency "valleys" at any reversal. Here the values at the "reversals" are taken whenever there is a reversal in the frequency or level domains.

Threshold Calculation
^^^^^^^^^^^^^^^^^^^^^
If an exam completes successfully, there will be two thresholds returned: one for frequency and one for level.  The level threshold is the mean of the level (in dB) at each reversal. The frequency threshold is the log mean (i.e., :math:`2^{mean(log_2(reversalFrequenciesHz))}`) of the frequency at each reversal.

Implementation
--------------

Data Interface
^^^^^^^^^^^^^^

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 20, 60
   :file: ../../_build/generated/bekesy highest audible frequency-data.csv

.. _bhaft_inputs:

TestBekesyHighestAudibleFrequency
"""""""""""""""""""""""""""""""""

This class represents the definition of a Bekesy-like threshold examination.  The Bekesy-like test includes testing multiple frequencies, but the order and number of frequencies will be controlled at the GUI level.  The conversion between dB SPL and dB HL is stored as part of the probe specific calibration (see :doc:`calibration`).

+----+-----------------------------------+-------+-------------+-------+
|Name                                    | Units | Range       |Default|
+----+-----------------------------------+-------+-------------+-------+
|    | Description                       |       |             |       |
+====+===================================+=======+=============+=======+
| **TestAudiometry**                     |       |             |       |
+----+-----------------------------------+-------+-------------+-------+
|    |  See :ref:`TestAudiometry`                              |       |
+----+-----------------------------------+-------+-------------+-------+
| **ToneGeneration**                     |       |             |       |
+----+-----------------------------------+-------+-------------+-------+
|    |  See :ref:`ToneGeneration`                              |       |
+----+-----------------------------------+-------+-------------+-------+
| **ToneRepetitionInterval**             |       |             | 700   |
+----+-----------------------------------+-------+-------------+-------+
|    |  Overrides default inherited from         |             |       |
|    |  :ref:`TestAudiometry`                    |             |       |
+----+-----------------------------------+-------+-------------+-------+
| **Fstart**                             | Hz    | See [3]_    | 1000  |
+----+-----------------------------------+-------+-------------+-------+
|    |  Start frequency. Constrain to nearest octave.          |       |
+----+-----------------------------------+-------+-------------+-------+
| **MaximumOutputFrequncy**              | Hz    | See [4]_    | Set by|
|                                        |       |             | cal   |
+----+-----------------------------------+-------+-------------+-------+
|    |  Maximum frequency that could be presented during exam  |       |
+----+-----------------------------------+-------+-------------+-------+
| **MinimumOutputFrequency**             | Hz    | See [4]_    | Set by|
|                                        |       |             | cal   |
+----+-----------------------------------+-------+-------------+-------+
|    |  Minimum frequency that could be presented during exam  |       |
+----+-----------------------------------+-------+-------------+-------+
| **L0**                                 | dB    | See [2]_    | 80    |
+----+-----------------------------------+-------+-------------+-------+
|    |  Nominal Test Level in dB SPL                           |       |
+----+-----------------------------------+-------+-------------+-------+
| **ReversalDiscard**                    | int   | 0 - 10      | 2     |
+----+-----------------------------------+-------+-------------+-------+
|    |  Reversals to discard                                   |       |
+----+-----------------------------------+-------+-------------+-------+
| **ReversalKeep**                       | int   | 2 - 10      | 6     |
+----+-----------------------------------+-------+-------------+-------+
|    |  Reversals to keep. *Must be even.*                     |       |
+----+-----------------------------------+-------+-------------+-------+
| **IncrementStartMultiplierFrequency**  | int   | 1 - 10      | 2     |
+----+-----------------------------------+-------+-------------+-------+
|    |  Increment until *ReversalDiscard*: multiply this by    |       |
|    |  **IncrementNominalFrequency**                          |       |
+----+-----------------------------------+-------+-------------+-------+
| **IncrementNominalFrequency**          | Octave| 1/24 - 1    | 1/12  |
|                                        | [1]_  |             |       |
+----+-----------------------------------+-------+-------------+-------+
|    |  Frequency increment after first reversal               |       |
+----+-----------------------------------+-------+-------------+-------+
| **IncrementStartMultiplierLevel**      | int   | 1 - 10      | 2     |
+----+-----------------------------------+-------+-------------+-------+
|    |  Increment until *ReversalDiscard*: multiply this by    |       |
|    |  **IncrementNominalLevel**                              |       |
+----+-----------------------------------+-------+-------------+-------+
| **IncrementNominalLevel**              | dB    | 0.5 - 10    | 4     |
+----+-----------------------------------+-------+-------------+-------+
|    |  Level increment after first reversal                   |       |
+----+-----------------------------------+-------+-------------+-------+
| **MinimumOutputLevel**                 | dB SPL| See [2]_    | Set by|
|                                        |       |             | cal   |
+----+-----------------------------------+-------+-------------+-------+
|    |  Minimum level that could be presented during exam      |       |
+----+-----------------------------------+-------+-------------+-------+
| **SemiAutomaticMode**                  | Bool  | True/False  | False |
+----+-----------------------------------+-------+-------------+-------+
|    |  Whether to pause after each presentation               |       |
|    |  to wait for a response (True) or proceed               |       |
|    |  in a fully automated fashion (False).                  |       |
+----+-----------------------------------+-------+-------------+-------+

.. rubric:: *Notes*
.. [1] If the next presentation frequency, p+1, will be increased, multiply current frequency by 2 raised to the increment, :math:`F_{p+1}=F_p \cdot 2^{increment}`.  Conversely, when decreasing frequency, multiply current frequency by 2 to the negative of the increment.
.. [2] The allowable range for test level should be from the minimum to the maximum of the levels defined in the calibration table.  Also, this exam is only defined for dB SPL, and CHA shall not allow other units. 
.. [3] The range allowed for start frequency should be based on the **MinimumOutputFrequency** and **MaximumOutputFrequency**.
.. [4] The upper and lower limits should be derived from the data in the calibration table (see :doc:`calibration`).  These will likely also be dependent on the level, **L**, requested since we’re now defining Min/Max output levels based on speaker linearity.  A starting value requested outside of this range should raise an exception to alert the user the frequency is outside the allowable range.

.. _bhaft_stored_data:

TestBekesyHighestAudibleFrequencyResults
""""""""""""""""""""""""""""""""""""""""
This class is returned from ProbeLink::getTestResults upon successful test completion.  In the event the maximum number of presentations is exceeded, both Threshold values will be undefined and should be returned as not-a-number (NaN).  The array of presentation frequencies, F, and levels, L, should be initialized to NaNs.  This array should then be populated with the frequencies presented to the subject.  At the conclusion of a test, these arrays should be returned regardless of whether the test is successful or not – they may be useful for post-analysis even if the subject fails to reach a Threshold.

+----+----------------------------------------------------+---------------+
|Name                                                     |     Units     |
+----+----------------------------------------------------+---------------+
|    | Description                                        |               |
+====+====================================================+===============+
| **ThresholdLevel**                                      |    dB SPL     |
+----+----------------------------------------------------+---------------+
|    |  See "Threshold Calculation" above                 |               |
+----+----------------------------------------------------+---------------+
| **ThresholdFrequency**                                  |    Hz         |
+----+----------------------------------------------------+---------------+
|    |  See "Threshold Calculation" above                 |               |
+----+----------------------------------------------------+---------------+
| **F**                                                   |    Hz         |
+----+----------------------------------------------------+---------------+
|    |  Array of frequencies presented                    |               |
+----+----------------------------------------------------+---------------+
| **L**                                                   |    dB SPL     |
+----+----------------------------------------------------+---------------+
|    |  Array of presentation levels presented during test|               |
+----+----------------------------------------------------+---------------+
| **ResultType**                                          |               |
+----+----------------------------------------------------+---------------+
|    |  See :ref:`TestAudiometryResults`                  |               |
+----+----------------------------------------------------+---------------+

GUI
^^^

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 20, 60
   :file: ../../_build/generated/bekesy highest audible frequency-gui.csv

Device Requirements
-------------------

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 20, 60
   :file: /_build/generated/bekesy highest audible frequency-device.csv

.. _bhaft_testing_procedures:

Testing Procedures
------------------

.. _bhaft_hitl_device_tests:

Device Tests
^^^^^^^^^^^^

The ``wahts-device-test`` protocol in TabSINT includes a Bekesy Highest Audible Frequency exam to test for tone-generation in each ear, software-button functionality and distortion coincident with tone generation.

.. rubric:: HITL

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: /_build/generated/bekesy highest audible frequency-device-test.csv

.. rubric:: CHAMI

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: /_build/generated/bekesy highest audible frequency-device-test-chami.csv

Software Tests
^^^^^^^^^^^^^^

.. rubric:: HITL

**Algorithm**

 Testing Instructions: 

 #. Within the ``wahts-software-test`` protocol, select the "BHAFT" exam. 
 #. Press "Begin Exam". Complete the exam according to your hearing ability such that it converges on a threshold. 
 #. Use your observations about the presentations during the exam to verify :envvar:`SRS-bhaft-001`, :envvar:`SRS-bhaft-002`, and :envvar:`SRS-bhaft-003`.
 #. Press "Show Debug Info" and look at the frequency array (**F**). Check that the frequency step size before the first reversal and after the first reversal is correct (see figure below). This verifies :envvar:`SRS-bhaft-004` and :envvar:`SRS-bhaft-005`.

   .. figure:: /CHA/images/BHAFTIncrementNominalFrequency.png
      :alt: BHAFT Frequency Increments Example
      :align: center
      :scale: 60

 #. Review the frequency array (**F**) and confirm that the correct number of reversals were kept/discarded. The default value for **ReversalDiscard** is 2 and for **ReversalKeep** is 6. Also confirm that the threshold was correctly calculated (see figure below). This verifies :envvar:`SRS-bhaft-005`. 
  
   .. figure:: /CHA/images/BHAFTFrequencyThresholdExample.png
      :alt: BHAFT Threshold Calculation Example
      :align: center
      :scale: 60

 #. Review the frequency array (**F**) and confirm that the starting frequency in the array is equal to **Fstart**. This verifies :envvar:`SRS-bhaft-007`.
 #. Begin another BHAFT exam. Hold the response button such that the frequency stops increasing and the level starts to decrease. Review the frequency and level arrays (**F** and **L**) and confirm that when the maximum output frequency the exam switches from fixed level to fixed frequency. This verifies :envvar:`SRS-bhaft-008` and :envvar:`SRS-bhaft-009`. The Test Case and Acceptance Criteria for :envvar:`SRS-bhaft-009` will be improved at a later time. 

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/bekesy highest audible frequency-algorithm-test.csv

**Data**
 
 Testing Instructions: 

 #. Within the ``wahts-software-test`` protocol, select the "BHAFT" exam. 
 #. Perform two tests: once with a convergent threshold and once without a convergent threshold. After each exam, check that the following parameters are given: **ThresholdLevel**, **ThresholdFrequency**, **F**, **L**, **ResultType**. This verifies :envvar:`SRS-bhaft-101`. 
 #. After finishing the protocol, press submit. Check that :envvar:`SRS-bhaft-102` is verified. 

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/bekesy highest audible frequency-data-test.csv

**GUI**

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/bekesy highest audible frequency-gui-test.csv

.. rubric:: CHAMI

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/bekesy highest audible frequency-algorithm-test-chami.csv

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/bekesy highest audible frequency-data-test-chami.csv
