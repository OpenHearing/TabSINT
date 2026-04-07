import { inject, Injectable } from '@angular/core';
import { CapacitorHttp, HttpOptions } from '@capacitor/core';
import { DiskModel } from '../models/disk/disk.service';
import { Logger } from '../services/logger.service';
import { ProtocolServer } from '../utilities/constants';
import { ExamResults } from '../models/results/results.interface';
import { Device } from '@capacitor/device';
import { DiskInterface } from '../models/disk/disk.interface';
import { Subscription } from 'rxjs';
import { EncryptResultsService } from '../utilities/encrypt-results.service';

@Injectable({
  providedIn: 'root',
})
export class ResultsUploadService {
  disk: DiskInterface;
  diskSubscription: Subscription | undefined;

  private readonly diskModel = inject(DiskModel);
  private readonly encryptResults = inject(EncryptResultsService);
  private readonly logger = inject(Logger);

  constructor() {
    this.disk = this.diskModel.getDisk();
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

  async ensureResultsRepo(gitlabHost: string, gitlabToken: string, gitlabGroup: string): Promise<{ id: number; default_branch: string }> {
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
    this.logger.debug('results repo found and returning its id and default branch');
    return resultsRepo;
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

      const resultsRepoResponse = await this.ensureResultsRepo(gitlabHost, gitlabToken, gitlabGroup);
      const resultsRepoId = resultsRepoResponse.id;
      const resultsRepoDefaultBranch = resultsRepoResponse.default_branch;

      const folderName = protocol.gitlabConfig?.repository;
      const info = await Device.getId();
      const fileUuid = info.identifier;
      const timeStamp = new Date().toISOString().replace(/[:.]/g, '-');
      const publicKey = protocol.publicKey;

      if (publicKey && singleExamResult.testDateTime) {
        const [encryptedResult, encryptedAESKey] = await this.encryptResults.encryptForUpload(
          singleExamResult.testDateTime,
          fileUuid,
          publicKey,
          JSON.stringify(singleExamResult)
        );
        await this.uploadFileToGitlab(
          gitlabToken,
          gitlabHost,
          resultsRepoId,
          resultsRepoDefaultBranch,
          folderName,
          `${fileUuid}-${timeStamp}.json.enc`,
          encryptedResult,
          singleExamResult
        );
        await this.uploadFileToGitlab(
          gitlabToken,
          gitlabHost,
          resultsRepoId,
          resultsRepoDefaultBranch,
          folderName,
          `${fileUuid}-${timeStamp}.json.key.enc`,
          encryptedAESKey,
          singleExamResult
        );
      } else {
        await this.uploadFileToGitlab(
          gitlabToken,
          gitlabHost,
          resultsRepoId,
          resultsRepoDefaultBranch,
          folderName,
          `${fileUuid}-${timeStamp}.json`,
          JSON.stringify(singleExamResult, null, 2),
          singleExamResult
        );
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
      this.diskModel.updateDiskModel({ uploadSummary: this.disk.uploadSummary });

      this.logger.debug('Successfully uploaded to upload summary in disk ');
      this.logger.debug(`Successfully uploaded exam result to '${folderName}'.`);

      return { success: true, message: `Successfully uploaded result to GitLab at ${gitlabGroup}/results` };
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (error: any) {
      this.logger.error('Upload failed: ' + error);
      return { success: false, message: error.message };
    }
  }

  private async uploadFileToGitlab(
    gitlabToken: string,
    gitlabHost: string,
    resultsRepoId: number,
    branch: string,
    folderName: string | undefined,
    fileName: string,
    content: string,
    singleExamResult: ExamResults
  ): Promise<void> {
    const fullPath = encodeURIComponent(`${folderName}/${fileName}`);
    const fileUrl = `${this.removeTrailingSlashes(gitlabHost)}/api/v4/projects/${resultsRepoId}/repository/files/${fullPath}`;
    const body = {
      branch,
      commit_message: `Add result for exam: ${singleExamResult.protocol.name}`,
      content,
    };
    const resp = await CapacitorHttp.post(this.gitlabHttpOptions(gitlabToken, fileUrl, JSON.stringify(body)));
    if (resp.status < 200 || resp.status >= 300) {
      if (resp.status === 401) {
        throw new Error('Unauthorized: Check your GitLab credentials.');
      }
      throw new Error(`Failed to create file in results repo: ${resp.status}`);
    }
  }
}
