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

  /**
   * Throw a descriptive error for a failed GitLab response.
   *
   * @param status The HTTP status code of the response.
   * @param action Description of what was being attempted, e.g. "fetch the results repo".
   */
  private throwGitlabError(status: number, action: string): never {
    if (status === 401) {
      throw new Error('Unauthorized: Check your GitLab credentials.');
    }
    if (status === 403) {
      throw new Error(`TabSINT could not ${action} (403): the GitLab token needs the 'api' scope and Developer access to the group.`);
    }
    throw new Error(`TabSINT could not ${action} (${status}).`);
  }

  /**
   * Find the 'results' repository in the protocol's group, creating it if it does not exist.
   *
   * @param gitlabHost The GitLab host.
   * @param gitlabToken The token used for authorization.
   * @param gitlabGroup The group (or subgroup path) containing the protocol repository.
   * @returns The id and default branch of the results repository.
   */
  async ensureResultsRepo(gitlabHost: string, gitlabToken: string, gitlabGroup: string): Promise<{ id: number; default_branch: string }> {
    const apiUrl = `${this.removeTrailingSlashes(gitlabHost)}/api/v4`;
    const repoPath = encodeURIComponent(`${gitlabGroup}/results`);
    const repoResp = await CapacitorHttp.get(this.gitlabHttpOptions(gitlabToken, `${apiUrl}/projects/${repoPath}`));
    if (repoResp.status >= 200 && repoResp.status < 300) {
      return repoResp.data;
    }
    if (repoResp.status !== 404) {
      this.throwGitlabError(repoResp.status, 'fetch the results repository');
    }

    this.logger.debug("No 'results' repo found. Attempting to create...");
    const groupResp = await CapacitorHttp.get(this.gitlabHttpOptions(gitlabToken, `${apiUrl}/groups/${encodeURIComponent(gitlabGroup)}`));
    if (groupResp.status === 404) {
      throw new Error(`Group '${gitlabGroup}' not found or no permission to view it.`);
    }
    if (groupResp.status < 200 || groupResp.status >= 300) {
      this.throwGitlabError(groupResp.status, `fetch group '${gitlabGroup}'`);
    }

    const createProjectBody = { name: 'results', path: 'results', namespace_id: groupResp.data.id, visibility: 'private' };
    const createProjResp = await CapacitorHttp.post(this.gitlabHttpOptions(gitlabToken, `${apiUrl}/projects`, JSON.stringify(createProjectBody)));
    if (createProjResp.status < 200 || createProjResp.status >= 300) {
      this.throwGitlabError(createProjResp.status, "create the 'results' repository");
    }
    return createProjResp.data;
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

      const resultsRepoResponse = await this.ensureResultsRepo(gitlabHost, gitlabToken, gitlabGroup);
      const resultsRepoId = resultsRepoResponse.id;
      const resultsRepoDefaultBranch = resultsRepoResponse.default_branch;

      const folderName = protocol.gitlabConfig?.repository;
      const info = await Device.getId();
      const fileUuid = info.identifier;
      const timeStamp = new Date().toISOString().replaceAll(/[:.]/g, '-');
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
    } catch (error: unknown) {
      this.logger.error('Upload failed: ' + error);
      return { success: false, message: error instanceof Error ? error.message : String(error) };
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
      this.throwGitlabError(resp.status, 'create the file in the results repository');
    }
  }
}
