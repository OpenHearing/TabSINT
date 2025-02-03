import { Injectable } from '@angular/core';
import { DiskModel } from '../models/disk/disk.service';
import { Logger } from '../utilities/logger.service';
import { ProtocolServer } from '../utilities/constants';
import { ExamResults } from '../models/results/results.interface';
import { Device } from '@capacitor/device';
import { DiskInterface } from '../models/disk/disk.interface';

@Injectable({
  providedIn: 'root'
})


export class ResultsUploadService {
    disk: DiskInterface;
  constructor(
    private readonly diskModel: DiskModel,
    private readonly logger: Logger,
  ) {
    this.disk = diskModel.getDisk();
  }

  async ensureResultsRepo(gitlabHost: string, gitlabToken: string, gitlabGroup: string): Promise<number> {
    const headers = new Headers({
        'PRIVATE-TOKEN': gitlabToken,
        'Content-Type': 'application/json'
      });
      const groupResp = await fetch(`${gitlabHost}/api/v4/groups?search=${gitlabGroup}`, { headers });
      if (groupResp.status === 401) {
        throw new Error("Unauthorized: Check your GitLab credentials.");
      }
      if (!groupResp.ok) {
        throw new Error(`Failed to fetch group info: ${groupResp.statusText}`);
      }
      const groups = await groupResp.json();
      const groupObj = groups.find((g: { full_path: string }) => g.full_path === gitlabGroup);
      if (!groupObj) {
        throw new Error(`Group '${gitlabGroup}' not found or no permission to view it.`);
      }
      const groupId = groupObj.id;
      const projectsUrl = `${gitlabHost}/api/v4/groups/${groupId}/projects?search=results`;
      const projectsResp = await fetch(projectsUrl, { headers });
      if (projectsResp.status === 401) {
        throw new Error("Unauthorized: Check your GitLab credentials.");
      }
      if (!projectsResp.ok) {
        throw new Error(`Failed to fetch group projects: ${projectsResp.statusText}`);
      }
      const projects = await projectsResp.json();
      let resultsRepo = projects.find((p: { name: string }) => p.name === 'results');
      if (!resultsRepo) {
        this.logger.debug("No 'results' repo found. Attempting to create...");
        const createProjectUrl = `${gitlabHost}/api/v4/projects`;
        const createProjectBody = {
          name: "results",
          path: "results",
          namespace_id: groupId,
          visibility: "private"
        };
  
        const createProjResp = await fetch(createProjectUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(createProjectBody)
        });
  
        if (createProjResp.status === 401) {
          throw new Error("Unauthorized: Check your GitLab credentials.");
        }
        if (!createProjResp.ok) {
          const errText = await createProjResp.text();
          throw new Error(`Failed to create 'results' project. ${createProjResp.status} ${errText}`);
        }
        resultsRepo = await createProjResp.json();
      }
      this.logger.debug("results repo found and returning its id")
      return resultsRepo.id;
  }

  async uploadResult(singleExamResult: ExamResults): Promise<{ success: boolean, message: string }> {
    try {
      if (!singleExamResult?.protocol) {
        throw new Error("Invalid exam result.");
      }

      const protocol = singleExamResult.protocol;
        if (!protocol.gitlabHost || !protocol.gitlabToken || !protocol.gitlabGroup) {
          throw new Error("Missing required GitLab configuration. Please specify a gitlab host, token, group and repository");
        }
        const gitlabHost = protocol.gitlabHost;
        const gitlabToken = protocol.gitlabToken;
        const gitlabGroup = protocol.gitlabGroup;
        this.logger.debug(`{gitlabHost} ${gitlabToken} ${gitlabGroup}`)

        const resultsRepoId = await this.ensureResultsRepo(gitlabHost, gitlabToken, gitlabGroup);
        const folderName = protocol.gitlabRepository;
        const info = await Device.getId();
        const fileUuid = info.identifier
        const timeStamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `${fileUuid}-${timeStamp}.json`;
        const fullPath = encodeURIComponent(`${folderName}/${fileName}`);
        const fileUrl = `${gitlabHost}/api/v4/projects/${resultsRepoId}/repository/files/${fullPath}`;
        const commitMessage = `Add result for exam: ${singleExamResult.protocolName}`;
        const body = {
          branch: 'master', // or 'main', depending on your repo
          commit_message: commitMessage,
          content: JSON.stringify(singleExamResult, null, 2) // pretty-print JSON
        };
        const headers = new Headers({
          'PRIVATE-TOKEN': gitlabToken,
          'Content-Type': 'application/json'
        });
        const createFileResp = await fetch(fileUrl, {
          method: 'POST',
          headers,
          body: JSON.stringify(body)
        });

        if (createFileResp.status === 401) {
          throw new Error("Unauthorized: Check your GitLab credentials.");
        }

        if (!createFileResp.ok) {
            const errText = await createFileResp.text();
            throw new Error(`Failed to create file in results repo. ${createFileResp.status} ${errText}`);
        }
        
        const uploadSummaryEntry = {
          protocolId: singleExamResult.protocolId,
          protocolName: singleExamResult.protocolName,
          testDateTime: singleExamResult.testDateTime ?? new Date().toISOString(),
          nResponses: singleExamResult.responses ? Object.keys(singleExamResult.responses).length : 0,
          source: ProtocolServer.Gitlab,
          uploadedOn: new Date().toISOString(),
          output: ProtocolServer.Gitlab
        };
    
        this.disk.uploadSummary.push(uploadSummaryEntry);
        this.diskModel.updateDiskModel("uploadSummary", this.disk.uploadSummary);
        this.disk = this.diskModel.getDisk();

        this.logger.debug("Successfully uploaded to upload summary in disk ");

        this.logger.debug(`Successfully uploaded exam result to '${folderName}' as ${fileName}.`);
      
        return { success: true, message: `Successfully uploaded ${fileName} to GitLab at ${gitlabGroup}/results` };
    } catch (error: any) {
      this.logger.error("Upload failed: " + error);
      return { success: false, message: error.message };
    }
  }
}
