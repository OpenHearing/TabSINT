const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const versionJsonPath = path.join(__dirname, '../src/version.json');
const versionJson = JSON.parse(fs.readFileSync(versionJsonPath, 'utf-8'));
const packageJsonPath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
const androidmanifeststring = fs.readFileSync('android/app/src/main/AndroidManifest.xml', "utf-8"); 
const git = simpleGit();

async function getCurrentCommitHash() {
  try {
    const commitHash = await git.revparse(['--short', 'HEAD']);
    return commitHash.trim();
  } catch (error) {
    console.error('Error getting git commit hash:', error);
    return 'unknown';
  }
}

async function incrementRev() {
  const baseVersion = 'v'+packageJson.version;
  let revNumber;
  const previousRevNumber = versionJson.rev.match(/v\d+\.\d+\.\d+-(\d+)-/)[1];
  if (packageJson.version !== versionJson.tabsint) {
    revNumber = '1';
  } else if (previousRevNumber) {
    revNumber = (parseInt(previousRevNumber, 10) + 1).toString();
  } else {
    revNumber = '1';
  }  
  const commitHash = await getCurrentCommitHash();
  return `${baseVersion}-${revNumber}-${commitHash}`;
}

function getNodeVersion() {
  return process.version;
}

async function generateVersionJson() {
  const updatedRev = await incrementRev();
  const suffix = process.argv.slice(2) ? "-"+process.argv.slice(2) : "";
  const newVersionJson = {
    tabsint: packageJson.version+suffix,
    date: new Date().toISOString(),
    rev: updatedRev,
    version_code: (parseInt(versionJson.version_code, 10) + 1).toString(),
    deps: {
      user_agent: 'angular/' + packageJson.devDependencies['@angular/cli'],
      node: 'node/' + getNodeVersion(),
      capacitor: 'capacitor/' + packageJson.devDependencies['@capacitor/cli']
    },
    plugins: []
  };

  console.log('New version.json content:', JSON.stringify(newVersionJson, null, 2));

  try {
    fs.writeFileSync(versionJsonPath, JSON.stringify(newVersionJson, null, 2), 'utf-8');
    console.log('version.json has been created and updated successfully!');
  } catch (error) {
    console.error('Error writing to version.json:', error);
  }
}

generateVersionJson();