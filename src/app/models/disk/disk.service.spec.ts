import { TestBed } from '@angular/core/testing';
import { DiskModel } from './disk.service';
import { DOCUMENT } from '@angular/common';
import { DiskInterface } from './disk.interface';
import { ExamResults } from '../results/results.interface';
import { ProtocolServer } from '../../utilities/constants';
import { PageDefinition } from '../../interfaces/page-definition.interface';
import { DevicesModel } from '../devices/devices-model.service';
import { VersionModel } from '../version/version.service';
import { Logger } from '../../utilities/logger.service';
import { SqLite } from '../../utilities/sqLite.service';
import { AppModel } from '../app/app.service';

describe('DiskModel', () => {
    let diskModel: DiskModel;
    let appModel: AppModel;
    let sqLite: SqLite;
    let logger: Logger;
    let devicesModel: DevicesModel;
    let versionModel: VersionModel;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            
        })
        diskModel = new DiskModel(new Document);
        appModel = new AppModel;
        sqLite = new SqLite(appModel, diskModel);
        logger = new Logger(diskModel, sqLite);
        devicesModel = new DevicesModel(logger);
        versionModel = new VersionModel(logger);
    })

    it('gets disk model from local storage', () => { 
        let returnedDisk: DiskInterface = diskModel.getDisk();
        expect(returnedDisk).toBeDefined();
    });

    it('updates and stores disk model', () => { 
        let returnedDisk: DiskInterface = diskModel.getDisk();
        expect(returnedDisk.pin).toBe('7114');
        diskModel.updateDiskModel('pin', '0000');
        returnedDisk = diskModel.getDisk();
        expect(returnedDisk.pin).toBe('0000');
    });

    it('empties completed exam results', () => { 
        // let returnedDisk: DiskInterface = diskModel.getDisk();
        // expect(returnedDisk.completedExamsResults.length).toBe(0);
        // diskModel.updateDiskModel('completedExamsResults', 
        //     ['result1', 'result2', 'result3']
        // );
        // returnedDisk = diskModel.getDisk();
        // expect(returnedDisk.completedExamsResults.length).toBe(3);
        // diskModel.emptyCompletedExamResults();
        // returnedDisk = diskModel.getDisk();
        // expect(returnedDisk.completedExamsResults.length).toBe(0);
    });

    it('removes one result from completed exam results', () => {         
        // let returnedDisk: DiskInterface = diskModel.getDisk();
        // expect(returnedDisk.completedExamsResults.length).toBe(0);
        // diskModel.updateDiskModel('completedExamsResults', 
        //     ['result1', 'result2', 'result3']
        // );
        // returnedDisk = diskModel.getDisk();
        // expect(returnedDisk.completedExamsResults.length).toBe(3);
        // diskModel.removeResultFromCompletedExamResults(1);
        // returnedDisk = diskModel.getDisk();
        // expect(returnedDisk.completedExamsResults.length).toBe(2);
        // expect(returnedDisk.completedExamsResults[1] as unknown as String==="result3").toBe(true);
     });

    it('updates upload summary', () => {   
        let page: PageDefinition = {
            id: 't',
            title: 'test',
            questionMainText: 'questionMainText',
            questionSubText: 'questionSubText',
            helpText: 'helpText',
            responseArea: {
                type: 'textboxResponseArea'
            },
            submitText: 'Submit',
            followOns: [],
            enableBackButton: false,
            instructionText: 'instructionText'
        };  
        let examResult: ExamResults = {
            protocolName: 'test',
            protocolId: 't',
            protocol: {
                pages: [page],
                protocolId: '',
                group: 'test',
                name: 'test',
                path: 'test',
                date: '0:0:0',
                version: '0',
                creator: 'test',
                server: ProtocolServer.Developer,
                admin: true,
                contentURI: 'test'
            },
            responses: [1,2,3],
            softwareVersion: versionModel.version,
            devices: devicesModel.getDevices(),
            tabletLocation: {},
            headset: 'mock',
            calibrationVersion: 0
        };
        let returnedDisk: DiskInterface = diskModel.getDisk();
        expect(returnedDisk.uploadSummary.length).toBe(0);
        diskModel.updateSummary(examResult);
        returnedDisk = diskModel.getDisk();
        expect(returnedDisk.uploadSummary.length).toBe(1);
     });
})