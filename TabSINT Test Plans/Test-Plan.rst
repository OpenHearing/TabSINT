5.0.0 beta apk: [app-debug.apk](/uploads/7ca06fdcfbd554531f9223a347cc0d02/app-debug.apk)
- This apk includes everything listed below, but excludes a few things we will need for the final 5.0.0 release (WAI exam, new manual audiometry GUI, MRT).

Prerequesite:

- Tympan has the firmware: https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/tree/feature/tympan-dummy-short-swept-dpoae/Sandbox/TabSINTTympanComms/TympanDummy/bin/tympan_revF_develop?ref_type=heads
- Tympan has an SD Card
- Uninstall previous tabsint
- When first installing the app, select the `Documents` folder when prompted.

Welcome Screen

- [ ] Click Documentation and confirm it brings you to tabsint.org
- [ ] Click Exam View and confirm it brings you to exam view
- [ ] Click Admin view and confirms it brings you to admin view
- [ ] Confirm PIN is required to navigate to admin view when admin view is not checked, but not required when it is checked.

Setup Tab

- [ ] Click through each sections, confirm you can open and close each panels.
- [ ] Click to a different tab and back to the setup tab. Confirm the open/close state of the panels was retained.
- [ ] Try out each setting. Confirm you can change the setting and when you click to a different tab and back the settings are retained. Close out of the app and re-start it, confirm the settings are retained (please check all settings).
- [ ] Tap each of the blue help circles. Read the text and confirm it is readable and makes senses. Note any typo.
- [ ] Leave the `Automatically output test results` setting unchecked.
- [ ] Review Software and Hardware details, Confirm they look reasonable.
- [ ] Review the Application Log section. Confirm the Display/Hide functionality works. Confirm you can export and view logs at Documents/tabsint-logs.
- [ ] Confirm logs are cleared after they are exported.

Protocol Tab

- [ ] Click through each sections, confirm you can open and close each panels.
- [ ] Click to a different tab and back to the protocols tab. Confirm the open/close state of the panels was retained.
- [ ] Select protocol `develop`. Click `Load` and confirm it loads successfully.
- [ ] Close out of the app and re-start it, confirm the protocol is still loaded.
- [ ] Connect the tablet to your computer via USB. Add this protocol to the Documents/tabsint-protocols/ folder: [protocol.json](/uploads/655bd753e42aab7e970b5247f4891638/protocol.json)
- [ ] Click the `Add` button to select which protocol folder to add from the tablet.
- [ ] Confirm the protocol is added to the protocols table above.
- [ ] Make sure the develop protocol is loaded (row is highlighted yellow).

Exam View

- [ ] Switch to exam view and proceed with exam (click begin).
- [ ] Choose `Text Box`. Proceed with each page, entering text in the text box or not. Submit each page.
- [ ] Select `End All`. Confirm you see the Exam Complete page with correct details.
- [ ] Click "New Exam" and select begin, textbox, and complete the exam.
- [ ] Press "Submit" and confirm it behaves the same as "End All".
- [ ] Start a new exam and then submit before selecting any options. Confirm it shows the correct details.
- [ ] Confirm `Reset Exam and Discard Results` and `Reset Exam and Save Partial Results` are available options from the hamburger menu in exam view while the exam is ongoing. These options are not available in admin view or in exam view when the exam has not begun or is already finalized.
- [ ] Select `Reset Exam and Discard Results` and confirm you are re-directed to the initial exam page (before you click begin). Verify results were not saved (on the Admin \> protocols tab).
- [ ] Start a new exam and advance a couple pages. Select `Reset Exam and Save Partial Results` and confirm you are re-directed to the initial exam page (before you click begin). Verify results were saved and accurate (on the Admin \> protocols tab).

Results Tab

- [ ] Switch to Admin View and navigate to the Results tab.
- [ ] Confirm you results are in the `Completed Exam` table.
- [ ] Click Export. Confirm your test is removed from the `Completed Exam` table and is now in the `Recently Exported or Uploaded` table as well as in the Documents/tabsint-results folder.
- [ ] Go back to exam view and complete another exam. Go back to admin view \> results tab, click on the completed result. Confirm a window pops up where you can view your exam results. Click 'Export' and verify the result is now in the `Recently Exported or Uploaded` table as well as in the Documents/tabsint-results folder.
- [ ] Go back to exam view and complete another exam. Go back to admin view \> results tab, click on the completed result. Confirm a window pops up where you can view your exam results. Click 'Close' and confirm the window closes. Click on the result again. Click 'Export' and verify the result is removed from the `Completed Exam` table and added to the `Recently Exported or Uploaded` table.

Devices (Tympan)

- [ ] Under the Admin View setup tab go to the connected devices accordion. Confirm you can connect and disconnect freely with a tympan.
- [ ] After device is connected, exit out of TabSINT and re-open. Confirm the previously connected device persists and you can reconnect to that device.
- [ ] Confirm device error handling is working. This is likely best done during manual audiometry and other exams.
  * [ ] Disconnect tympan during a manual audiometry exam and confirm the device error page pops up when you try to play a tone
  * [ ] try to run manual audiometry exam without a calibration and confirm the device error page pops up


Likert/Multiple-Input/Textbox

- [ ] Load the `develop` built-in protocol.
- [ ] Run through each likert, textbox and multiple input exams. 
  - [ ] Multiple-input: confirm text, number, drop-down, date and multi-dropdown inputs work as expected. Confirm review and edit buttons work as expected. Confirm responses are saved correctly.
  - [ ] Textbox: confirm all three pages work as expected, that the response can be viewed in the "TExt Box Result Viewer", and that responses are saved correctly.
  - [ ] Likert: Confirm emoticon, slider/ruler, 'Not Applicable' checkbox, numbered buttons work as expected. Confirm results are saved correctly.


Manual Audiometry

- [ ] Load the `develop` built-in protocol.
- [ ] Start a manual audiometry exam after connecting to a Tympan using an HDA 200.
- [ ] Ensure that the left and right ear buttons work correctly:
  - [ ] Click on the left ear button and confirm that the corresponding graph border is outlined in blue.
  - [ ] Click on the right ear button and confirm that the corresponding graph border is outlined in red.
- [ ] In the Tone Control box:
  - [ ] Click the Play button and confirm that a tone is playing.
  - [ ] Adjust different tones and frequencies to verify that the tone plays at the correct frequency and intensity.
- [ ] Click on Record Threshold and confirm that:
  - [ ] A circle is drawn on the right ear graph at the current tone and frequency.
  - [ ] An "X" is drawn on the left ear graph at the current tone and frequency.
- [ ] Try adjusting the tone above 110 dB or below -10 dB, and confirm:
  - [ ] It is not possible to exceed these limits.
  - [ ] Brackets are drawn around 110 dB or -10 dB when attempting to go beyond these values.
- [ ] Ensure that No Response can only be activated when the upper or lower limits are hit.
- [ ] Click on No Response and confirm that:
  - [ ] A circle with a tiny arrow appears on the right ear graph.
  - [ ] An "X" with a tiny arrow appears on the left ear graph.
- [ ] Click Delete Threshold and verify that:
  - [ ] The corresponding point for the current tone and frequency is removed from the graph.
- [ ] Record multiple thresholds and no response points, and confirm that:
  - [ ] Lines are drawn between the points on the graph.
  - [ ] The graph properly plots all recorded data.
- [ ] Ensure that the Masking Control box:
  - [ ] Is disabled.
  - [ ] Has no functionality and cannot be interacted with.
- [ ] Click Submit Results and verify that:
  - [ ] If a results page is included in the protocol, it appears after submission.
  - [ ] The results page contains one big plot summarizing all thresholds and plots for both the ears.
  - [ ] Tables for left and right ears accurately reflect the values recorded during the exam.



Calibration Exam

- [ ] Load the `develop` protocol and open the calibration exam. Ensure the calibration exam runs smoothly.
- [ ] Verify that tones are played correctly.
- [ ] Adjust the cal factor and confirm the tone output reflects these changes.
- [ ] Confirm the calibration, measurement, and max output screens appear in the correct sequence.
- [ ] Ensure the max output tones are played accurately when testing max output.
- [ ] Test the back button functionality:
  - [ ] Confirm it allows moving backward in the exam flow.
  - [ ] Verify that previously entered values remain visible when navigating back.
- [ ] Ensure the results table is visible at the end of the exam if `showResults` is set to `true`.
- [ ] If `showResults` is set to `false`, confirm the results table is not displayed.
- [ ] Click an entry in the results table and verify it takes you to the corresponding part of the exam.
- [ ] Confirm you can toggle through the entire sequence of the exam from that point or use the "Skip to Results" button to return to the results table.
- [ ] Validate that the "Skip to Results" button redirects back to the results table seamlessly.

Swept DPOAE exam.
- [ ] Load the `develop` protocol and open the swept DPOAE exam.
- [ ] Confirm that the exam parameters match those listed as defaults here: https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-firmware/-/blob/main/Specifications/swept_dpoae.rst?ref_type=heads.
- [ ] Run the exam. 
- [ ] Confirm the progress bar makes sense. 
- [ ] Confirm the data transfers sucessfully, then press Next.
- [ ] Confirm the results display.
- [ ] Finish the exam and submit the protocol. Confirm you can view the results in the Admin View Results viewer.
- [ ] Confirm you can abort the exam.

Purdue Surveys
- [ ] Load the built-in `PurdueShakedown`
- [ ] Run through the surveys listed below and confirm they match the associated links. Check for typos, check the the various input types are displayed correctly without funky/bad styling.
  - [ ] Subject Information Sheet: https://crearellc.sharepoint.com/:w:/r/sites/OpenHearingProposal/_layouts/15/Doc.aspx?sourcedoc=%7B85A0449C-7AD6-4C11-99EC-A5F76F749AC4%7D&file=ARDC_Initial_Quesitons.docx&action=default&mobileredirect=true
  - The following are all on https://crearellc.sharepoint.com/:w:/r/sites/OpenHearingProposal/_layouts/15/Doc.aspx?sourcedoc=%7BF7FE365D-C285-405A-BBA4-1A740FB80EC8%7D&file=ARDC%20Surveys.docx&action=default&mobileredirect=true
  - [ ] ARDC Main Survey: https://purdue.ca1.qualtrics.com/jfe/form/SV_8weRWyCqMZrzP5c 
  - [ ] ARDC Loudness and Annoyance Survey: https://purdue.ca1.qualtrics.com/jfe/form/SV_eJvR9hmx23lHAQB
  - [ ] ARDC Noise Exposure History Survey: https://purdue.ca1.qualtrics.com/jfe/form/SV_9Mk7qqq6LzPu7FX

Page Submittable logic:
- Load the built-in develop protocol and run all the exams available in the main menu. For each ensure the page submittable logic is as expected.
  - For textbox/likert/multiple-input, whether the page should be submittable is written in the page instruction text.
  - For manual audiometry, the page should always be submittable.
  - For calibration, swept DPOAE and WAI, the page should be submittable according to specs.
    - https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-tabsint/-/blob/spec-writing/Specifications/headphones_narrowband_calibration/headphones-narrowband-calibration.rst?ref_type=heads
    -  https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-tabsint/-/blob/spec-writing/Specifications/swept-oae/swept-oae.rst?ref_type=heads
    - https://code.crearecomputing.com/hearingproducts/open-hearing-group/open-hearing-tabsint/-/blob/spec-writing/Specifications/wideband-acoustic-immittance/wideband-acoustic-immittance.rst?ref_type=heads