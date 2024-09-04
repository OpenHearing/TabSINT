import { Injectable } from '@angular/core';
import { Logger } from '../utilities/logger.service';
import { DiskModel } from '../models/disk/disk.service';
import { VersionInterface } from '../interfaces/version.interface';


@Injectable({
    providedIn: 'root',
})

export class VersionService {

    private version: VersionInterface = {
        tabsint: '',
        date: '',
        rev: '',
        version_code: '',
        deps: {
            user_agent: '',
            node: '',
            capacitor: ''
        },
        plugins: []
    }; 
    private versionLoaded: Promise<void>;

    constructor(private logger: Logger,private diskModel:DiskModel) {
        this.versionLoaded = this.loadVersion()
    }

    private async loadVersion(): Promise<void> {
        try {
            const versionData = await import('../../version.json');
            if (versionData.default) {
                this.version = versionData.default as VersionInterface;
                this.logger.debug("Version Object processed --- " + JSON.stringify(this.version))
            }
        } catch (error) {
            this.logger.error('version.json file not found or failed to load. Returning empty object --- ' + JSON.stringify(this.version));
        }
    }

    async getVersion(): Promise<VersionInterface> {
        await this.versionLoaded;
        return this.version;
    }

}