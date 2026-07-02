# Release Procedure

## Overview

The TabSINT release procedure is largely automated using GitLab CI. The pipeline for releasing a new APK/AAB is run automatically when a tag is created and can additionally be run manually on the tagged commit. Although the process can be run automatically, the final steps of the release stage in the pipeline require manual actions to be started. This ensures no accidental releases are added to the GitLab Package Registry or Release page. The public GitHub mirror release process is automatically handled when the mirror is updated with a new tag. It uses the GitLab package registry to find the files needed. The Google Play Store is a manual process.

## CI Build System

The CI build system for TabSINT handles multiple stages before a release is made. This includes linting, creating a base build environment using Docker, testing, and two releases (including a beta and production release). The release stage of the pipeline includes manual actions to publish the release in the GitLab Package Registry and Release page of GitLab.

Additionally, the public GitHub mirror uses an automated process triggered by a new tag. This creates a new release and retrieves the necessary files from the GitLab Package Registry. See the `.github/workflows` directory for more information.

## Steps

1. [Release](#release)
2. [Publish](#publish)

### Release

This procedure releases an APK/AAB for Android usage.

1.  Merge in features to `develop` branch
2.  Start a new release branch (This release branch should be titled release/4.5.0 NOT release/v4.5.0)
    - If you start the release with git-flow, make sure you name the release with the right semantic naming convention for that release (`X.X.X`, i.e. `1.6.0`)
    - If you start your own release branch, you will tag the release on the master branch when you are done
    - Confirm that all unit tests are passing and code is linted
3.  Increase the semantic version number manually in `package.json`. This should be the same as the release tag, except without the `v` prefix (this is just a tag convention).
4.  Edit the [Changelog](https://GitHub.com/OpenHearing/TabSINT/blob/main/Changelog.md) to describe the changes in this release.
5.  Commit all the changed files to the release branch. This will start the GitLab pipeline and generate a beta release for testing.
6.  Test the beta release
    - Download and install the output .apk from the CI job.
    - Write up a specific test plan based on the Changelog.
7.  Merge the release branch back into the `master` branch. Tag the master branch with the release tag/version in `package.json`, prefixed by a `v` (i.e. `v1.1.0`)
    - Once tagged, the GitLab pipeline will run with the release stage included. This will create a release APK/AAB and will show two manual steps to archive and release the tagged application on GitLab.
    - Note: If the release requires a specific tag/version of SVN code, the pipeline should be run manually and the tag should be provided as an input before running the pipeline.
8.  Run the manual archive and release actions in the pipeline. This will push the zip file containing the APK/AAB to the GitLab Package Registry and Release pages of GitLab and the public GitHub mirror.
9.  Make sure also to merge the changes back into the `develop` branch to avoid regression.
10. Run the publish process below.

## Publish

To publish the release requires manual intervention on Google Console.

### Publish on Google Play

**Note: Check with the client before releasing to Google Play. They may want that release to happen at a later date.**

**Note**: you will need a Google account that has been granted access in order to complete this section.

1. From the [Play Store Console](https://play.google.com/console/developers), navigate to the TabSINT dashboard and select the "Production" section under "Test and Release".
2. Select "Create New Release"/"Edit Release".
3. Select the APK from library, click "Copy from a previous release", then replace the bullet points with those from the TabSINT changelog.
4. Click "Save" to enable and then click "Review Release". Then click "Start Rollout to Production".
5. Note the submission was successful and a new release is being reviewed.
