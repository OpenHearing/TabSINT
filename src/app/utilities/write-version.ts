const fs = require('fs');
const path = require('path');
const simpleGit = require('simple-git');
const versionJsonPath = path.join(__dirname, '../../version.json');
const packageJsonPath = path.join(__dirname, '../../../package.json');
const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf-8'));
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

async function incrementRev(rev:string) {
  const regex = /(v\d+\.\d+\.\d+)-(\d+)-g([a-f0-9]+)/;
  const match = regex.exec(rev);
  if (match) {
    const baseVersion = match[1];
    const qualifier = parseInt(match[2], 10) + 1;
    const commitHash = await getCurrentCommitHash();
    return `${baseVersion}-${qualifier}-g${commitHash}`;
  }
  return rev;
}

function getNodeVersion() {
  return process.version;
}

async function generateVersionJson() {
  const updatedRev = await incrementRev('v4.6.0-119-gfee19e2f');
  const newVersionJson = {
    tabsint: packageJson.version,
    date: new Date().toISOString(),
    rev: updatedRev,
    version_code: "289",
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