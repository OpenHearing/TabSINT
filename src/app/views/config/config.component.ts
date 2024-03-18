import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { DiskModel } from '../../models/disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { FileService } from '../../controllers/file.service';
import { AppState } from '../../utilities/constants';
import { StateModel } from '../../models/state/state.service';
import { DiskInterface } from '../../models/disk/disk.interface';
import { StateInterface } from '../../models/state/state.interface';

@Component({
  selector: 'config-view',
  templateUrl: './config.component.html',
  styleUrl: './config.component.css'
})
export class ConfigComponent {
  disk: DiskInterface;
  state: StateInterface;

  constructor(
    public diskModel: DiskModel, 
    public fileService: FileService,
    public logger: Logger, 
    public stateModel: StateModel,
    public translate: TranslateService
  ) { 
    this.disk = this.diskModel.getDisk();
    this.state = this.stateModel.getState();
  }

  ngOnInit(): void {
    this.stateModel.setAppState(AppState.Admin);
  }

  title = 'config';

  // TEST FUNCTIONS
  logTest() {
    this.logger.debug("diskM: "+JSON.stringify(this.disk));
  }

  writeFileTest(filepath:string, data:string) {
    this.fileService.writeFile(filepath, data).subscribe({
      next: () => {
        this.logger.debug('Wrote data to '+JSON.stringify(filepath));
        console.log("next: observable worked");
      }, 
      error: (err) => {
        console.log("error: observable error (writeFile)");
        console.log(err)
      },
      complete() {
        console.log("complete: observable completed. this will only appear after directory created if there is no error.");
      }
    });
  }

  readFileTest(filepath:string) {
    let fileContents;
    this.fileService.readFile(filepath).subscribe({
      next: (contents) => {
        this.logger.debug('Reading '+JSON.stringify(filepath)+', file contents: '+JSON.stringify(contents));
        fileContents = contents;
        console.log("next: observable worked");
      }, 
      error: (err) => {
        console.log("error: observable error (readFile)");
        console.log(err)
      },
      complete() {
        console.log("complete: observable completed. this will only appear after directory created if there is no error.");
      }
    });
  }

  createDirTest(dir:string) {
    this.fileService.createDirectory(dir).subscribe({
      next: () => {
        this.logger.debug('Directory: '+JSON.stringify(dir)+' created');
        console.log("next: observable worked");
      }, 
      error: (err) => {
        console.log("error: observable error");
        if (err.message=='Directory exists') {
          this.logger.debug('Directory: '+JSON.stringify(dir)+' already exists');
        } else {
          this.logger.debug('Error creating directory '+JSON.stringify(dir));
        }
      },
      complete() {
        console.log("complete: observable completed. this will only appear after directory created if there is no error.");
      }
    });
  }

  readDirTest(dir:string) {
    this.fileService.listDirectory(dir).subscribe({
      next: (files) => {
        this.logger.debug('List of files in dir: '+JSON.stringify(files));
        console.log("next: observable worked");
      }, 
      error: (err) => {
        console.log("error: observable error (listDirectory)");
        console.log(err);
      },
      complete() {
        console.log("complete: observable completed. this will only appear after directory created if there is no error.");
      }
    });
  }  
  
}
