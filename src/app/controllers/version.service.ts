import { Injectable } from '@angular/core';
import { Logger } from '../utilities/logger.service';
import { DiskModel } from '../models/disk/disk.service';


@Injectable({
    providedIn: 'root',
})

export class VersionService {

    private version:any = {}
    private versionLoaded: Promise<void>;

    constructor(private logger: Logger,private diskModel:DiskModel){
        this.versionLoaded = this.loadVersion()
    }

    private async loadVersion(): Promise<void> {
        try {
            const versionData = await import('../../version.json');
            if (versionData.default) {
                this.version = versionData.default;
                    this.logger.debug("Version Object processed --- " + JSON.stringify(this.version))
            }
        } catch (error) {
            this.version = {}; // Return an empty object if the file is not found
            this.logger.error('version.json file not found or failed to load. Returning empty object --- ' + JSON.stringify(this.version));
        }
    }

    async getVersion(): Promise<any> {
        await this.versionLoaded;
        return this.version;
    }

}