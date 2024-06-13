import { TestBed } from '@angular/core/testing';
import { DiskModel } from './disk.service';
import { DOCUMENT } from '@angular/common';
import { DiskInterface } from './disk.interface';
import { ExamResults } from '../results/results.interface';
import { ProtocolServer } from '../../utilities/constants';
import { PageDefinition } from '../../interfaces/page-definition.interface';

describe('DiskModel', () => {
    let diskModel: DiskModel;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            
        })
        diskModel = new DiskModel(new Document);
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
        let returnedDisk: DiskInterface = diskModel.getDisk();
        expect(returnedDisk.completedExamsResults.length).toBe(0);
        diskModel.updateDiskModel('completedExamsResults', 
            ['result1', 'result2', 'result3']
        );
        returnedDisk = diskModel.getDisk();
        expect(returnedDisk.completedExamsResults.length).toBe(3);
        diskModel.emptyCompletedExamResults();
        returnedDisk = diskModel.getDisk();
        expect(returnedDisk.completedExamsResults.length).toBe(0);
    });

    it('removes one result from completed exam results', () => {         
        let returnedDisk: DiskInterface = diskModel.getDisk();
        expect(returnedDisk.completedExamsResults.length).toBe(0);
        diskModel.updateDiskModel('completedExamsResults', 
            ['result1', 'result2', 'result3']
        );
        returnedDisk = diskModel.getDisk();
        expect(returnedDisk.completedExamsResults.length).toBe(3);
        diskModel.removeResultFromCompletedExamResults(1);
        returnedDisk = diskModel.getDisk();
        expect(returnedDisk.completedExamsResults.length).toBe(2);
        expect(returnedDisk.completedExamsResults[1] as unknown as String==="result3").toBe(true);
     });

    it('updates upload summary', () => {   
        let page: PageDefinition = {
            type: 'test',
            id: 't',
            title: 'test',
            questionMainText: 'questionMainText',
            questionSubText: 'questionSubText',
            helpText: 'helpText',
            responseArea: {
                inputList: function (inputList: any, arg1: (input: any) => void): unknown {
                    throw new Error('Function not implemented.');
                },
                html: undefined,
                image: undefined,
                enableSkip: false,
                type: '',
                responseRequired: false
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
                pages: page,
                protocolId: '',
                group: 'test',
                name: 'test',
                path: 'test',
                id: 't',
                date: '0:0:0',
                version: '0',
                creator: 'test',
                server: ProtocolServer.Developer,
                admin: true,
                contentURI: 'test'
            },
            responses: [1,2,3],
            softwareVersion: 0,
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