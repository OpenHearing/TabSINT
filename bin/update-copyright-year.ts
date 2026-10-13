const fs = require('fs');
const path = require('path');

// Load current copyright year
const currentCopyrightYearPath = path.join(__dirname, '../copyright-year.md');
const previousCopyrightRange = fs.readFileSync(currentCopyrightYearPath, 'utf-8');

// Get current year
const currentYear = new Date().getFullYear().toString();

// We only need to update the copyright year if current year is different than the copyright year
if (previousCopyrightRange.split('-')[1] === currentYear) {
  console.log('Copyright year does not require updating');
} else {
  // All copyright paths
  const commercialLicensePath = path.join(__dirname, '../COMMERCIAL_LICENSE.md');
  const noticePath = path.join(__dirname, '../NOTICE.md');
  const readmePath = path.join(__dirname, '../README.md');
  const disclaimerPath = path.join(__dirname, '../src/app/views/disclaimer/disclaimer.component.html');

  // Get current year for copyright range
  const currentCopyrightRange = previousCopyrightRange.split('-')[0] + '-' + currentYear;

  // Update the copyright year range for all files
  const filesToChange = [commercialLicensePath, noticePath, readmePath, disclaimerPath, currentCopyrightYearPath];
  for (const path of filesToChange) {
    const contents = fs.readFileSync(path, 'utf-8');
    const updatedContents = contents.replaceAll(previousCopyrightRange, currentCopyrightRange);
    fs.writeFileSync(path, updatedContents, 'utf-8');
    console.log('Updated copyright year for ' + path);
  }
}
