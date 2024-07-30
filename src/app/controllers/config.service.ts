import { Injectable } from '@angular/core';
import { TabsintFs } from 'tabsintfs';
import { DiskModel } from '../models/disk/disk.service';
import { DiskInterface } from '../models/disk/disk.interface';

@Injectable({
    providedIn: 'root',
})



export class ConfigService {
  disk: DiskInterface;
  constructor(private diskModel: DiskModel) {
    this.disk = this.diskModel.getDisk();
  }

    qRCodeUrl = false;

    // generateQRCode() {
    //     console.log("generateQRCode button pressed");
    // }

    async chooseLocalResultsDirectory(): Promise<void>{
      try {
        const result = await TabsintFs.chooseFolder();
        let servers = this.diskModel.disk.servers
        servers.localServer.resultsDir = result.name
        servers.localServer.resultsDirUri = result.uri
        this.diskModel.updateDiskModel('servers', servers);
        this.disk = this.diskModel.getDisk();
      } catch (error) {
        console.error('Error choosing folder:', error);
      }
    }

    async writeTestResult(fileName:string,fileContent:string){
      try {
        const rootUri = this.diskModel.disk.servers.localServer.resultsDirUri
        const result = await TabsintFs.createPath({rootUri:rootUri,path:fileName,content:fileContent})
      } catch(error){
        console.log("Error Writing test result -- ", error)
      }
    }
  }