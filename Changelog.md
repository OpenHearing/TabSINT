Changelog
=========

v6.0.0
------

Features

- New exams: HINT, Three-Digit, GAP, Hughson-Westlake, Bekesy, Bekesy-like, BHAFT, DP-gram, and MPANL
- Results viewer for reviewing completed exams
- Support for CHA, DuoDose, and Svantek devices
- WAHTS firmware updates from within the application
- New response areas: Checkbox, Button Grid, QR Code, Image, and Custom
- Auto-submit option for response areas
- Protocol flags, pre-process functions, page repeats, randomization, and timeouts
- Exam progress bar
- Faster protocol loading and protocol validation
- Encryption of exam results
- QR code app configuration
- Spanish, French, Japanese, and Swahili translations

Bug Fixes

- Fixed results upload to GitLab
- Fixed responses being lost or overwritten in some response areas
- Fixed protocol audio playback
- Improved device connection reliability
- Fixed exam abort and retry behavior

Maintenance

- Upgraded Capacitor from version 6 to 8
- Removed CSV export and deprecated protocol properties
- Added migration and calibration guides

v5.0.0
------

Feature

- Upgrade to Angular 17 and Typescript
- Re-architected source code
- Connection with a Tympan
- Available exams:
  - Questionnaires
  - Manual Audiometry
  - Calibration
  - Swept DPOAE exam
