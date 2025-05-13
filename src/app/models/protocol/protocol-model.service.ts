import { Injectable } from '@angular/core';

import { GitlabConfigInterface, ProtocolModelInterface } from './protocol.interface';

@Injectable({
    providedIn: 'root',
})

export class ProtocolModel {

    protocolModel: ProtocolModelInterface = {
        activeProtocol: undefined
    }

    gitlabConfigModel: GitlabConfigInterface = {
        repository: '',
        tag: '',
        host: 'https://gitlab.com/',
        token: '',
        group: ''
      }

    getProtocolModel(): ProtocolModelInterface {
        return this.protocolModel;
    }

    getGitlabConfigModel(): GitlabConfigInterface {
        return this.gitlabConfigModel;
    }
}
