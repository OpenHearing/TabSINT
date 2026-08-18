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

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 20, 60
   :file: ../../_build/generated/bekesy-gui.csv
  
Device Requirements
-------------------

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 20, 60
   :file: /_build/generated/bekesy-device.csv

.. _bekesy_testing_procedures:

Testing Procedures
------------------

Device Tests
^^^^^^^^^^^^

.. rubric:: HITL

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: /_build/generated/bekesy-device-test.csv

.. rubric:: CHAMI

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: /_build/generated/bekesy-device-test-chami.csv

Software Tests
^^^^^^^^^^^^^^

This HITL testing requires the use of sound room equipment. The nexus amplifier gain should always be set to 1 V/Pa unless stated otherwise.

.. rubric:: HITL

**Algorithm**

 Testing Instructions:

 #. Within the ``wahts-software-test`` protocol, select the "Bekesy Like" exam.
 #. Press "Begin Exam". After 4 presentations, press and hold the button and continue to finish the exam based on your own hearing ability.
 #. After the exam is complete, you can verify links :envvar:`SRS-bekesy-001` through :envvar:`SRS-bekesy-007`:

    * :envvar:`SRS-bekesy-001`-:envvar:`SRS-bekesy-003`: Can be verified using what you heard during the exam.
    * :envvar:`SRS-bekesy-004`-:envvar:`SRS-bekesy-005`: Press "Show Debug Info". Under "Exam Results" navigate to Object>testResults>responses>1>L to see the level array. Verify that the level increments are 4 (**IncrementStart**) for the first four presentations and 2 (**IncrementNominal**) for the remaining presentations.
    * :envvar:`SRS-bekesy-006`: Using the level array, identify the levels where a reversal occurs (when the level goes from increasing to decreasing or vice versa). There should be 8 total reversals (**ReversalDiscard** + **ReversalKeep**), including the last level in the array. Take the average of the last 6 reversal levels (**ReversalKeep**) and check that it matches the Threshold value (listed above the level array in the Debug Info). An image below shows an example of this process.

      `Bekesy Threshold Calculation Example <chadocs_>`_

    * :envvar:`SRS-bekesy-007`: Using the level array, verify that the first level (**Lstart**) is 40.

 #. Press "Begin Exam". Hold down the button for ~7 seconds (or as long as necessary to go below **MinimumOutputLevel**-6 without stopping the exam. Then repeatedly release the button for 2 seconds and press the button for 2 seconds until the test ends. Check the level array and confirm that **MinimumOutputLevel**-6 is counted as a reversal. This verifies :envvar:`SRS-bekesy-008`.
 #. Press "Begin Exam". Respond such that the exam converges on a threshold as quickly as possible (like repeatedly pressing and releasing the button every 1-2 seconds). Below the level array, find the **responseElapTimeMS** variable and check that it is greater than 30000 (30 seconds). This verifies :envvar:`SRS-bekesy-009`.
 #. :envvar:`SRS-bekesy-011` is not currenly included in automated testing, but will be added in the near future. Currently, this case can be tested by running bekesyLikeTest.m with the input variable "min" set to 1. Because this has been recently verified, this test case can be skipped and marked as "Verified".
 #. :envvar:`SRS-bekesy-010`, :envvar:`SRS-bekesy-012`, and :envvar:`SRS-bekesy-013` are verified by running runSoftwareTestSuite.m and receiving a passing result. 

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/bekesy-algorithm-test.csv

**Data**

 Testing Instructions:

 #. Within the ``wahts-software-test`` protocol, select the "Bekesy Like" exam.
 #. Press "Begin Exam". Finish the exam based on your own hearing ability so that the exam converges to a threshold. Press "Show Debug Info". Under "Exam Results" navigate to Object>testResults>responses>1 and check that the following parameters are given: **RetSPL**, **L**, **MaximumExcursion**, **Slope**, **Threshold**, **Units**, and **ResultType**.
 #. Press "Begin Exam". Continuously press the button so that the exam does not converge. If prompted to repeat the test, do so. Under "Exam Results" natigate to Object>testResults>responses>2 and check for the same parameters listed in step 2.
 #. Steps 2 and 3 verify :envvar:`SRS-bekesy-101`.
 #. After finishing the protocol, press submit. Check that :envvar:`SRS-bekesy-102` is verified. 

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/bekesy-data-test.csv

**GUI**

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/bekesy-gui-test.csv

.. rubric:: CHAMI

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/bekesy-algorithm-test-chami.csv

.. csv-table::
   :class: longtable
   :header-rows: 1
   :widths: 20, 37, 37, 6
   :file: ../../_build/generated/bekesy-data-test-chami.csv
