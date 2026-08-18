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

   `BHAFT Frequency Increments Example <chadocs_>`_

 #. Review the frequency array (**F**) and confirm that the correct number of reversals were kept/discarded. The default value for **ReversalDiscard** is 2 and for **ReversalKeep** is 6. Also confirm that the threshold was correctly calculated (see figure below). This verifies :envvar:`SRS-bhaft-005`. 
  
   `BHAFT Threshold Calculation Example <chadocs_>`_

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
