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
     - 23 Sept 2024
     - VAL
     - Initial commit for a Hughson-Westlake exam.  Imported the `CHA DOCS Hughson-Westlake exam <https://code.crearecomputing.com/cha/cha-docs/-/blob/master/CHA/protocols/hw.rst?ref_type=heads>`_ rev 10.5.0. 


References
----------

Related internal documents
^^^^^^^^^^^^^^^^^^^^^^^^^^

This specification references
"""""""""""""""""""""""""""""
1. `CHA DOCS audiometry <https://cha.crearecomputing.net/cha-docs/CHA/protocols/audiometry.html>`_
2. `CHA DOCS calibration <https://cha.crearecomputing.net/cha-docs/CHA/protocols/calibration.html>`_

This specification is referenced in the following
"""""""""""""""""""""""""""""""""""""""""""""""""
1. `Hughson-Westlake Firmware Specification <https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/blob/main/Specifications/hw.rst?ref_type=heads>`_
   
Implementation
--------------

GUI
^^^^

The GUI should look like the image below with the following features.

* The exam begins with a full page landing page with optional protocol specified page title and instruction text.
* The landing page must contain a **Begin** button which starts the exam.
* Once the exam has started, the user is shown one large button in the middle of the page for the duration of the exam. The button should have a color that contrasts from the background. This button should be large to make it easy to press on a touch screen.
* When the user presses the button, the button must visually change again to show the button is being pressed.
* When the user releases the button, the button must visually change again to show the button is no longer being pressed.
* When the exam is complete, the view changes to a completion page.
* The completion page must have a **Submit** or **Save** button in the bottom of the page which move the exam on to the next page.
* The completion page can optionally display result text or an audiogram showing the current result threshold in addition to other thresholds recorded during the exam session. Text results (threshold numbers) must be displayed in a tabular grid with **Ear** (Left, Right) shown on the abscissa and **Frequency** shown on the ordinal axis. (See `CHA DOC Specification <https://cha.crearecomputing.net/cha-docs/CHA/protocols/audiometry.html#results-table-presentation>`_)
* When the completion page is configured to present an audiogram, threshold data must be presented in accordance with `ASHA Guidelines for Audiometric Symbols <https://cha.crearecomputing.net/cha-docs/_downloads/bd4e1776d97d2b13903145ed5334c580/Audiometric%20Symbols.pdf>`_.

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
