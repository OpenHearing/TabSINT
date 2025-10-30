import { Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { DiskModel } from '../models/disk/disk.service';
import { Logger } from '../services/logger.service';
import { ProtocolServer } from '../utilities/constants';
import { ExamResults } from '../models/results/results.interface';
import { Device } from '@capacitor/device';
import { DiskInterface } from '../models/disk/disk.interface';
import { Subscription } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ResultsUploadService {
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;
  constructor(
    private readonly diskModel: DiskModel,
    private readonly logger: Logger
  ) {
    this.disk = diskModel.getDisk();
    this.diskSubscription = this.diskModel.diskSubject.subscribe((updatedDisk: DiskInterface) => {
      this.disk = updatedDisk;
    });
  }

  /**
   * Get the HTTP options for a Capacitor HTTP request.
   *
   * @param gitlabToken The token used for authorization.
   * @param url The URL of the request.
   * @param data The optional data for the request.
   * @param contentType The content type for request.
   * @returns The HttpOptions to be used with a Capacitor HTTP request.
   */
  private gitlabHttpOptions(
    gitlabToken: string,
    url: string,
    data: string | undefined = undefined,
    contentType: string = 'application/json'
  ): HttpOptions {
    const headers: { Authorization: string; 'Content-Type': string } = {
      Authorization: `Bearer ${gitlabToken}`,
      'Content-Type': contentType,
    };
    const options = {
      url: url,
      headers: headers,
      ...(data && { data: data }),
    };
    return options;
  }

  /**
   * Remove trailing slashes from the string.
   *
   * @param originalString String to remove trailing slashes from.
   * @returns The new string with trailing slashes removed.
   */
  private removeTrailingSlashes(originalString: string) {
    return originalString.replace(/\/+$/, '');
  }

  async ensureResultsRepo(gitlabHost: string, gitlabToken: string, gitlabGroup: string): Promise<number> {
    const groupUrl = `${this.removeTrailingSlashes(gitlabHost)}/api/v4/groups?search=${gitlabGroup}`;
    const groupOptions = this.gitlabHttpOptions(gitlabToken, groupUrl);
    const groupResp = await CapacitorHttp.get(groupOptions);
    if (groupResp.status < 200 || groupResp.status >= 300) {
      if (groupResp.status === 401) {
        throw new Error('Unauthorized: Check your GitLab credentials.');
      }
      throw new Error(`Failed to fetch group info: ${groupResp.status}`);
    }
    const groups = await groupResp.data;
    const groupObj = groups.find((g: { full_path: string }) => g.full_path === gitlabGroup);
    if (!groupObj) {
      throw new Error(`Group '${gitlabGroup}' not found or no permission to view it.`);
    }
    const groupId = groupObj.id;
    const projectsUrl = `${this.removeTrailingSlashes(gitlabHost)}/api/v4/groups/${groupId}/projects?search=results`;
    const projectsOptions = this.gitlabHttpOptions(gitlabToken, projectsUrl);
    const projectsResp = await CapacitorHttp.get(projectsOptions);
    if (projectsResp.status < 200 || projectsResp.status >= 300) {
      if (groupResp.status === 401) {
        throw new Error('Unauthorized: Check your GitLab credentials.');
      }
      throw new Error(`Failed to fetch group projects: ${projectsResp.status}`);
    }
    const projects = await projectsResp.data;
    let resultsRepo = projects.find((p: { name: string }) => p.name === 'results');
    if (!resultsRepo) {
      this.logger.debug("No 'results' repo found. Attempting to create...");
      const createProjectBody = {
        name: 'results',
        path: 'results',
        namespace_id: groupId,
        visibility: 'private',
      };
      const createProjectsUrl = `${this.removeTrailingSlashes(gitlabHost)}/api/v4/projects`;
      const createProjectOptions = this.gitlabHttpOptions(gitlabToken, createProjectsUrl, JSON.stringify(createProjectBody));
      const createProjResp = await CapacitorHttp.post(createProjectOptions);
      if (createProjResp.status < 200 || createProjResp.status >= 300) {
        if (groupResp.status === 401) {
          throw new Error('Unauthorized: Check your GitLab credentials.');
        }
        throw new Error(`Failed to create 'results' project: ${createProjResp.status}`);
      }
      resultsRepo = await createProjResp.data;
    }
    this.logger.debug('results repo found and returning its id');
    return resultsRepo.id;
  }

  async uploadResult(singleExamResult: ExamResults): Promise<{ success: boolean; message: string }> {
    try {
      if (!singleExamResult?.protocol) {
        throw new Error('Invalid exam result.');
      }

      const protocol = singleExamResult.protocol;
      if (!protocol.gitlabConfig?.host || !protocol.gitlabConfig?.token || !protocol.gitlabConfig?.group) {
        throw new Error('Missing required GitLab configuration. Please specify a gitlab host, token, group and repository');
      }
      const gitlabHost = protocol.gitlabConfig?.host;
      const gitlabToken = protocol.gitlabConfig?.token;
      const gitlabGroup = protocol.gitlabConfig?.group;
      this.logger.debug(`${gitlabHost} ${gitlabToken} ${gitlabGroup}`);

      const resultsRepoId = await this.ensureResultsRepo(gitlabHost, gitlabToken, gitlabGroup);
      const folderName = protocol.gitlabConfig?.repository;
      const info = await Device.getId();
      const fileUuid = info.identifier;
      const timeStamp = new Date().toISOString().replace(/[:.]/g, '-');
      const fileName = `${fileUuid}-${timeStamp}.json`;
      const fullPath = encodeURIComponent(`${folderName}/${fileName}`);
      const fileUrl = `${this.removeTrailingSlashes(gitlabHost)}/api/v4/projects/${resultsRepoId}/repository/files/${fullPath}`;
      const commitMessage = `Add result for exam: ${singleExamResult.protocol.name}`;
      const body = {
        branch: 'master', // or 'main', depending on your repo
        commit_message: commitMessage,
        content: JSON.stringify(singleExamResult, null, 2), // pretty-print JSON
      };
      const createFileOptions = this.gitlabHttpOptions(gitlabToken, fileUrl, JSON.stringify(body));
      const createFileResp = await CapacitorHttp.post(createFileOptions);
      if (createFileResp.status < 200 || createFileResp.status >= 300) {
        if (createFileResp.status === 401) {
          throw new Error('Unauthorized: Check your GitLab credentials.');
        }
        throw new Error(`Failed to create file in results repo: ${createFileResp.status}`);
      }
      const uploadSummaryEntry = {
        protocolId: singleExamResult.protocol.protocolId,
        protocolName: singleExamResult.protocol.name,
        testDateTime: singleExamResult.testDateTime ?? new Date().toISOString(),
        nResponses: singleExamResult.responses ? Object.keys(singleExamResult.responses).length : 0,
        source: ProtocolServer.Gitlab,
        uploadedOn: new Date().toISOString(),
        output: ProtocolServer.Gitlab,
      };

      this.disk.uploadSummary.push(uploadSummaryEntry);
      this.diskModel.updateDiskModel('uploadSummary', this.disk.uploadSummary);

      this.logger.debug('Successfully uploaded to upload summary in disk ');

      this.logger.debug(`Successfully uploaded exam result to '${folderName}' as ${fileName}.`);

      return { success: true, message: `Successfully uploaded ${fileName} to GitLab at ${gitlabGroup}/results` };
    } catch (error: any) {
      this.logger.error('Upload failed: ' + error);
      return { success: false, message: error.message };
    }
  }
}
