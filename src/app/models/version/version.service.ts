import { Injectable } from '@angular/core';
import { Logger } from '../../utilities/logger.service';
import { VersionInterface } from './version.interface';

@Injectable({
    providedIn: 'root',
})

export class VersionModel {

    version: VersionInterface = {
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

    constructor(private logger: Logger) {
        this.versionLoaded = this.loadVersion()
    }
    /**
     * Load tabsint version information from version.js
     * @summary Imports version.json, loads it into the version model.
     * @models version
     */
    private async loadVersion(): Promise<void> {
        try {
            const versionData = await import('../../../version.json');
            if (versionData.default) {
                this.version = versionData.default as VersionInterface;
                this.logger.debug("Version Object processed --- " + JSON.stringify(this.version))
            }
        } catch (error) {
            this.logger.error('version.json file not found or failed to load. Returning empty object --- ' + JSON.stringify(this.version));
        }
    }
    
    /**
     * Promise to retrieve the version model.
     * @summary Waits for the version to be loaded, then return it.
     * @models version
     * @returns version model:  VersionInterface
     */
    async getVersion(): Promise<VersionInterface> {
        await this.versionLoaded;
        return this.version;
    }

}