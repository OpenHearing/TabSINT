import { Injectable, inject } from '@angular/core';
import { CapacitorHttp, HttpOptions, HttpResponse } from '@capacitor/core';
import { FileTransfer } from '@capacitor/file-transfer';

import { GitlabConfigInterface } from '../models/disk/disk.interface';
import { FileService } from './file.service';
import { Directory, Filesystem } from '@capacitor/filesystem';
import { Logger } from './logger.service';

@Injectable({
  providedIn: 'root',
})
export class GitlabService {
  private readonly fileService = inject(FileService);
  private readonly logger = inject(Logger);

  /**
   * Fetch a gitlab repository and download the files to a specified local directory.
   * This deletes any existing data at the provided location.
   * @param config Gitlab configuration to access a repository.
   * @param localDirectory The local directory to save the repository.
   * @param saveExternal Whether the download should be saved to internal or external storage.
   * @param tagsOnly Whether only tags should be used or only commits.
   * @returns The content URI for the created local directory.
   */
  async downloadGitlabRepository(
    config: GitlabConfigInterface,
    localDirectory: string,
    saveExternal: boolean,
    tagsOnly: boolean
  ): Promise<string | undefined> {
    let folderUri = undefined;
    const headers = {
      Authorization: `Bearer ${config.token}`,
    };
    const projectId = await this._getGitlabProjectId(config.host, config.repository, config.group, headers);
    const ref = config.tag ? config.tag : await this.getLatestReference(config, tagsOnly);

    if (saveExternal) {
      folderUri = await this.downloadAndSaveFilesExternal(projectId, ref, config.host, headers, localDirectory);
    } else {
      folderUri = await this.downloadAndSaveFilesInternal(projectId, ref, config.host, headers, localDirectory);
    }
    return folderUri;
  }

  /**
   * Determine the latest Gitlab reference for a repository.
   * @param config Gitlab configuration to access a repository.
   * @param tagsOnly Whether only tags should be used or only commits.
   * @returns The latest commit hash.
   */
  async getLatestReference(config: GitlabConfigInterface, tagsOnly: boolean): Promise<string> {
    const headers = {
      Authorization: `Bearer ${config.token}`,
    };
    const projectId = await this._getGitlabProjectId(config.host, config.repository, config.group, headers);

    if (tagsOnly) {
      return await this._getLatestTag(config.host, projectId, headers);
    }

    return await this._getLatestCommitHash(config.host, projectId, headers);
  }

  /**
   * Fetch a single file from a gitlab repository.
   * @param gitlabConfig Gitlab configuration to access a repository.
   * @param relativeFilePath The relative path to the requested file.
   * @param tagsOnly Whether only tags should be used or only commits.
   * @returns The response data if successful.
   */
  async fetchLatestGitlabFile(gitlabConfig: GitlabConfigInterface, relativeFilePath: string, tagsOnly: boolean): Promise<any> {
    const headers = {
      Authorization: `Bearer ${gitlabConfig.token}`,
    };
    const projectId = await this._getGitlabProjectId(gitlabConfig.host, gitlabConfig.repository, gitlabConfig.group, headers);
    const ref = await this.getLatestReference(gitlabConfig, tagsOnly);
    const fileUrl = `${gitlabConfig.host}/api/v4/projects/${projectId}/repository/files/${relativeFilePath}/raw?ref=${ref}`;
    const data = (await this._fetchGitlabResponse({ url: fileUrl, headers: headers }, `Failed to fetch ${relativeFilePath}`)).data;
    return data;
  }

  /**
   * Fetch response from Gitlab using a URL and return the response if successful.
   * @param options The http options for the fetch.
   * @param errorMessagePrefix Message to prefix errors with on failure.
   * @returns The response if successful.
   */
  private async _fetchGitlabResponse(options: HttpOptions, errorMessagePrefix: string): Promise<HttpResponse> {
    const response = await CapacitorHttp.get(options);
    if (response.status < 200 || response.status >= 300) {
      if (response.status === 401) {
        throw new Error('Unauthorized: Check your GitLab credentials.');
      }
      throw new Error(`${errorMessagePrefix} ${response.status}`);
    }

    return response;
  }

  /**
   * Fetch a gitlab repository and download the files to a specified local external directory.
   * This deletes any existing data at the provided location.
   * @param projectId The project identifier for the repository.
   * @param ref The Gitlab pointer/reference in the repository.
   * @param host The host of the Gitlab repository
   * @param headers Authorization headers for the request.
   * @param localDir The local directory to save the repository.
   * @returns The content URI for the created local directory.
   */
  private async downloadAndSaveFilesExternal(
    projectId: number,
    ref: string,
    host: string,
    headers: { Authorization: string },
    localDir: string
  ): Promise<string | undefined> {
    await this.fileService.deleteDirectory(localDir);
    const fileServiceResult = await this.fileService.createDirectory(localDir);

    if (fileServiceResult === null) {
      throw new Error(`Unable to create the external directory`);
    }

    // Internal download for the zip file
    const zipResult = await Filesystem.getUri({ path: 'archive.zip', directory: Directory.Data });
    const downloadResult = await FileTransfer.downloadFile({
      url: `${host}/api/v4/projects/${projectId}/repository/archive.zip?sha=${ref}`,
      headers: headers,
      path: zipResult.uri,
    });

    try {
      const response = await this.fileService.unzip(downloadResult.path as string, fileServiceResult.uri, true);
      if (response === null) {
        throw new Error('Error unzipping the repository.');
      }
    } finally {
      // Cleanup the archive after expanding in desired location
      await Filesystem.deleteFile({ path: 'archive.zip', directory: Directory.Data });
    }

    return fileServiceResult.uri;
  }

  /**
   * Fetch a gitlab repository and download the files to a specified local internal directory.
   * This deletes any existing data at the provided location.
   * @param projectId The project identifier for the repository.
   * @param ref The Gitlab pointer/reference in the repository.
   * @param host The host of the Gitlab repository
   * @param headers Authorization headers for the request.
   * @param localDir The local directory to save the repository.
   * @returns The content URI for the created local directory.
   */
  private async downloadAndSaveFilesInternal(
    projectId: number,
    ref: string,
    host: string,
    headers: { Authorization: string },
    localDir: string
  ): Promise<string | undefined> {
    if (await Filesystem.readdir({ path: localDir, directory: Directory.Data }).catch(() => null)) {
      await Filesystem.rmdir({ path: localDir, directory: Directory.Data, recursive: true });
    }
    await Filesystem.mkdir({ path: localDir, directory: Directory.Data, recursive: true });
    const fileServiceResult = await Filesystem.getUri({ path: localDir, directory: Directory.Data });

    // Internal download for the zip file
    const zipResult = await Filesystem.getUri({ path: 'archive.zip', directory: Directory.Data });
    const downloadResult = await FileTransfer.downloadFile({
      url: `${host}/api/v4/projects/${projectId}/repository/archive.zip?sha=${ref}`,
      headers: headers,
      path: zipResult.uri,
    });

    try {
      const response = await this.fileService.unzip(downloadResult.path as string, fileServiceResult.uri, true);
      if (response === null) {
        throw new Error('Error unzipping the repository.');
      }
    } finally {
      // Cleanup the archive after expanding in desired location
      await Filesystem.deleteFile({ path: 'archive.zip', directory: Directory.Data });
    }

    return fileServiceResult.uri;
  }

  /**
   * Private method for determining the latest Gitlab commit hash for a repository.
   * @param host The host of the Gitlab repository.
   * @param projectId The project identifier for the repository.
   * @param headers Authorization headers for the request.
   * @returns The latest commit hash.
   */
  private async _getLatestCommitHash(host: string, projectId: number, headers: { Authorization: string }): Promise<string> {
    const commits = (
      await this._fetchGitlabResponse(
        { url: `${host}/api/v4/projects/${projectId}/repository/commits?per_page=1`, headers: headers },
        'Failed to fetch latest commit: '
      )
    ).data;

    if (!commits.length) throw new Error('No commits found in repository.');
    return commits[0].id.substring(0, 8);
  }

  /**
   * Private method for determining the latest Gitlab tag for a repository.
   * @param host The host of the Gitlab repository.
   * @param projectId The project identifier for the repository.
   * @param headers Authorization headers for the request.
   * @returns The latest tag.
   */
  private async _getLatestTag(host: string, projectId: number, headers: { Authorization: string }): Promise<string> {
    const tags = (
      await this._fetchGitlabResponse(
        { url: `${host}/api/v4/projects/${projectId}/repository/tags?per_page=1`, headers: headers },
        'Failed to fetch latest tag: '
      )
    ).data;

    if (!tags.length) throw new Error('No tags found in repository.');
    return tags[0].name;
  }

  /**
   * Private method for determining the project identifier for a gitlab reference.
   * @param host The host of the Gitlab repository.
   * @param repository The repository name.
   * @param group The group containing the repository.
   * @param headers Authorization headers for the request.
   * @returns The project identifier for the repository.
   */
  private async _getGitlabProjectId(host: string, repository: string, group: string, headers: { Authorization: string }): Promise<number> {
    let projects: { id: number; name: string; namespace: { full_path: string } }[] = [];

    try {
      // First try the users own repositories to limit the search space on common names.
      projects = (
        await this._fetchGitlabResponse(
          { url: `${host}/api/v4/projects?search=${repository}&membership=true`, headers: headers },
          'Failed to fetch project list: '
        )
      ).data;
    } catch (err) {
      // Fallback on all repositories. If there are too many with similar names this may fail.
      this.logger.error('Failed Gitlab search with membership trying without', err);
      projects = (
        await this._fetchGitlabResponse({ url: `${host}/api/v4/projects?search=${repository}`, headers: headers }, 'Failed to fetch project list: ')
      ).data;
    }

    const matchedProject = projects.find(project => project.name === repository && project.namespace.full_path.toLowerCase() === group.toLowerCase());

    if (!matchedProject) {
      throw new Error('Project not found. Check the repository name and group.');
    }

    return matchedProject.id;
  }
}
