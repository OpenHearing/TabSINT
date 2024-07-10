import { TestBed } from '@angular/core/testing';
import { ProtocolModel } from '../models/protocol/protocol-model.service';
import { processProtocol } from './process-protocol.function';
import { loadingProtocolDefaults } from './defaults';
import { LoadingProtocolInterface } from '../interfaces/loading-protocol-object.interface';
import { ProtocolServer } from './constants';
import { checkIfCanGoBack } from './exam-helper-functions';
import { ProtocolInterface } from '../models/protocol/protocol.interface';

const followOn1 = {
    conditional: "result.response=='Text Box'",
    target: {
        reference: "TextBox"
    }
};

const followOn2 = {
    conditional: "result.response=='End All'",
    target: {
        reference: "@END_ALL"
    }
};

const testProt1 = {
    protocolId:"MainMenu",
    title:"Main Menu",
    "pages": [
        {
            id: "choose",
            title: "Response Area Testing",
            questionMainText: "Please select a response area to test:",
            responseArea: {
                type: "multipleChoiceResponseArea",
                choices: [
                    {
                        label: "Text Box",
                        value: "Text Box"
                    },
                    {
                        label: "End All",
                        value: "End All"
                    }
                ],
                enableSkip: false,
                responseRequired: false
            },
            followOns: [
            ],
            type: "",
            enableBackButton: false,
            questionSubText: "",
            instructionText: "",
            helpText: "",
            submitText: ""
        }
      ]
  };

const testProt2 = 
{
    protocolId: "TextBox",
    pages: [
        {
            id: "textbox_001",
            title: "Text Box",
            instructionText: "Test Case 001",
            responseArea: {
                type: "textboxResponseArea",
                rows: 5,
                responseRequired: false,
                enableSkip: false
            },
            type: "",
            enableBackButton: false,
            questionMainText: "",
            questionSubText: "",
            helpText: "",
            submitText: "",
            followOns: [
                followOn1,
                followOn2
            ]
        },
        {
            id: "textbox_002",
            title: "Text Box",
            instructionText: "Test Cases 002",
            responseArea: {
                type: "textboxResponseArea",
                exportToCSV: true,
                rows: 3,
                enableSkip: false,
                responseRequired: false
            },
            type: "",
            enableBackButton: false,
            questionMainText: "",
            questionSubText: "",
            helpText: "",
            submitText: "",
            followOns: []
        },
        {
            id: "textbox_003",
            title: "Text Box",
            instructionText: "Test Cases 003",
            responseArea: {
                type: "textboxResponseArea",
                exportToCSV: true,
                enableSkip: false,
                responseRequired: false
            },
            type: "",
            enableBackButton: false,
            questionMainText: "",
            questionSubText: "",
            helpText: "",
            submitText: "",
            followOns: []
        },
        {
          id: "backtomain",
          reference:"MainMenu"
        }
      ]
};

const testProtocol: ProtocolInterface = {
    title: "Test Protocol",
    subtitle: "Developer testing of open-tabsint responseArea's.",
    instructionText: "instructionText goes here",
    hideProgressBar: true,
    navMenu: [
        {
            "text": "Back to Main Menu",
            "target": {
                "reference": "MainMenu"
            },
            "returnHereAfterward": false
        }
    ],
    pages: ([testProt1]) as any,
    subProtocols: [ testProt2 ],
    group: "",
    name: "",
    path: "",
    id: "",
    date: "",
    version: "",
    creator: "",
    server: ProtocolServer.LocalServer,
    admin: false,
    contentURI: "",
    protocolId: ""
}

const loadingProtocol: LoadingProtocolInterface = {
    protocol:  testProtocol,
    calibration: undefined,
    requiresValidation: false,
    meta: {
        group: '',
        name: 'test',
        path: '',
        date: new Date().toJSON(),
        version: '',
        creator: '',
        server: ProtocolServer.LocalServer,
        admin: false,
        contentURI: ''
    },
    overwrite: false,
    notify: false
}
describe('processProtocol', () => {
    let [activeProtocol, 
        activeProtocolDictionary,
        activeProtocolFollowOnsDictionary
    ]  = processProtocol(loadingProtocol);

    console.log('TESTING', activeProtocolDictionary, activeProtocolFollowOnsDictionary);

    beforeEach(async () => {
        await TestBed.configureTestingModule({})
    })

    it('returns active protocol', () => {
        expect(activeProtocol.title).toBe('Test Protocol');
    })
    
    it('returns active protocol dictionary: '+JSON.stringify(activeProtocolDictionary), () => {
        expect(Object.keys(activeProtocolDictionary).length).toEqual(2);
        expect(activeProtocolDictionary['TextBox']).toEqual(testProt2);
    })

    it('returns active protocol follow ons dictionary', () => {
        expect(Object.keys(activeProtocolFollowOnsDictionary).length).toEqual(2);
        expect(activeProtocolFollowOnsDictionary['TextBox']).toEqual(followOn1);
        expect(activeProtocolFollowOnsDictionary['@END_ALL']).toEqual(followOn2);
    })
    
    it('adds image path', () => {
        //unimplemented
    })
    
    it('adds video path', () => {
        //unimplemented
    })
    
    it('adds _requiresCha=true if a cha response area exists', () => {
        //unimplemented
    })
    
    it('adds _exportToCSV if it exits', () => {
        //unimplemented
    })
})