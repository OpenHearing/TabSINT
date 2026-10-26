import { TestBed } from '@angular/core/testing';
import { processProtocol, resolveVideoPath } from '../process-protocol.function';
import { TabsintFsWeb } from 'tabsintfs/dist/esm/web';
import { Capacitor } from '@capacitor/core';
import { LoadingProtocolInterface } from '../../interfaces/loading-protocol-object.interface';
import { ProtocolServer } from '../constants';
import { ProtocolInterface } from '../../models/protocol/protocol.interface';
import { ProtocolDictionary } from '../../interfaces/protocol-dictionary';
import { FollowOnsDictionary } from '../../interfaces/follow-ons-dictionary';

const followOn1 = {
  conditional: "result.response=='Text Box'",
  target: {
    reference: 'TextBox',
  },
};

const followOn2 = {
  conditional: "result.response=='End All'",
  target: {
    reference: '@END_ALL',
  },
};

const testProt1 = {
  protocolId: 'MainMenu',
  title: 'Main Menu',
  pages: [
    {
      id: 'choose',
      title: 'Response Area Testing',
      questionMainText: 'Please select a response area to test:',
      responseArea: {
        type: 'multipleChoiceResponseArea',
        choices: [
          {
            id: '1',
            label: 'Text Box',
            value: 'Text Box',
          },
          {
            id: '2',
            label: 'End All',
            value: 'End All',
          },
        ],
        enableSkip: false,
        responseRequired: false,
      },
      followOns: [],
      type: '',
      enableBackButton: false,
      questionSubText: '',
      instructionText: '',
      helpText: '',
      submitText: '',
    },
  ],
};

const testProt2 = {
  protocolId: 'TextBox',
  pages: [
    {
      id: 'textbox_001',
      title: 'Text Box',
      instructionText: 'Test Case 001',
      responseArea: {
        type: 'textboxResponseArea',
        rows: 5,
        responseRequired: false,
        enableSkip: false,
      },
      type: '',
      enableBackButton: false,
      questionMainText: '',
      questionSubText: '',
      helpText: '',
      submitText: '',
      followOns: [followOn1, followOn2],
    },
    {
      id: 'textbox_002',
      title: 'Text Box',
      instructionText: 'Test Cases 002',
      responseArea: {
        type: 'textboxResponseArea',
        rows: 3,
        enableSkip: false,
        responseRequired: false,
      },
      type: '',
      enableBackButton: false,
      questionMainText: '',
      questionSubText: '',
      helpText: '',
      submitText: '',
      followOns: [],
    },
    {
      id: 'textbox_003',
      title: 'Text Box',
      instructionText: 'Test Cases 003',
      responseArea: {
        type: 'textboxResponseArea',
        enableSkip: false,
        responseRequired: false,
      },
      type: '',
      enableBackButton: false,
      questionMainText: '',
      questionSubText: '',
      helpText: '',
      submitText: '',
      followOns: [],
    },
    {
      id: 'backtomain',
      reference: 'MainMenu',
    },
  ],
};

const testProtocol: ProtocolInterface = {
  title: 'Test Protocol',
  subtitle: "Developer testing of open-tabsint responseArea's.",
  instructionText: 'instructionText goes here',
  navMenu: [
    {
      text: 'Back to Main Menu',
      target: {
        reference: 'MainMenu',
      },
      returnHereAfterward: false,
    },
  ],
  pages: [testProt1],
  subProtocols: [testProt2],
  group: '',
  name: '',
  path: '',
  date: '',
  version: '',
  creator: '',
  server: ProtocolServer.LocalServer,
  admin: false,
  contentURI: '',
  protocolId: '',
};

const loadingProtocol: LoadingProtocolInterface = {
  protocol: testProtocol,
  calibration: undefined,
  meta: {
    group: '',
    name: 'test',
    path: '',
    date: new Date().toJSON(),
    version: '',
    creator: '',
    server: ProtocolServer.LocalServer,
    admin: false,
    contentURI: '',
  },
  overwrite: false,
  notify: false,
};

describe('processProtocol', () => {
  let activeProtocol: ProtocolInterface;
  let activeProtocolDictionary: ProtocolDictionary;
  let activeProtocolFollowOnsDictionary: FollowOnsDictionary;

  beforeEach(async () => {
    TestBed.configureTestingModule({});
    [activeProtocol, activeProtocolDictionary, activeProtocolFollowOnsDictionary] = await processProtocol(loadingProtocol);
  });

  it('returns active protocol', () => {
    expect(activeProtocol.title).toBe('Test Protocol');
  });

  it('returns active protocol dictionary', () => {
    expect(Object.keys(activeProtocolDictionary).length).toEqual(2);
    expect(activeProtocolDictionary['TextBox']).toEqual(testProt2);
  });

  it('returns active protocol follow ons dictionary', () => {
    expect(Object.keys(activeProtocolFollowOnsDictionary).length).toEqual(2);
    expect(activeProtocolFollowOnsDictionary['TextBox']).toEqual(followOn1);
    expect(activeProtocolFollowOnsDictionary['@END_ALL']).toEqual(followOn2);
  });

  it('adds image path', () => {
    //unimplemented
  });

  describe('resolveVideoPath', () => {
    it('resolves a Developer-server video to a web-view asset path', async () => {
      const resolved = await resolveVideoPath('intro.mp4', { server: ProtocolServer.Developer, metaPath: 'protocols/develop' });

      expect(resolved).toBe('assets/protocols/develop/intro.mp4');
    });

    it('converts a content:// URI from a GitLab or local-folder protocol into a URL the web view can load', async () => {
      const contentUri = 'content://com.android.externalstorage.documents/tree/primary%3Atabsint/document/primary%3Atabsint%2Fintro.mp4';
      spyOn(TabsintFsWeb.prototype, 'getFileContentURI').and.resolveTo({ contentUri });
      spyOn(Capacitor, 'convertFileSrc').and.callFake(path => 'https://localhost/_capacitor_content_/' + path.replace('content://', ''));

      const resolved = await resolveVideoPath('intro.mp4', { server: ProtocolServer.Gitlab, contentURI: 'content://root' });

      expect(TabsintFsWeb.prototype.getFileContentURI).toHaveBeenCalledWith({ rootUri: 'content://root', filePath: 'intro.mp4' });
      expect(Capacitor.convertFileSrc).toHaveBeenCalledWith(contentUri);
      expect(resolved).toBe('https://localhost/_capacitor_content_/' + contentUri.replace('content://', ''));
    });

    it('returns undefined when the video file cannot be found in the protocol folder', async () => {
      spyOn(TabsintFsWeb.prototype, 'getFileContentURI').and.rejectWith(new Error('File not found or is not a regular file'));
      spyOn(Capacitor, 'convertFileSrc').and.callThrough();

      const resolved = await resolveVideoPath('missing.mp4', { server: ProtocolServer.Gitlab, contentURI: 'content://root' });

      expect(resolved).toBeUndefined();
      expect(Capacitor.convertFileSrc).not.toHaveBeenCalled();
    });

    it('returns undefined when there is no media source to resolve against', async () => {
      const resolved = await resolveVideoPath('intro.mp4', { server: ProtocolServer.Gitlab, contentURI: null });

      expect(resolved).toBeUndefined();
    });
  });

  describe('onPageProcessed', () => {
    it('reports one call per actual page (root pages + subProtocol pages), with a stable total', async () => {
      const onPageProcessed = jasmine.createSpy('onPageProcessed');

      await processProtocol(loadingProtocol, onPageProcessed);

      // 1 page in the root's MainMenu subProtocol ('choose') + 3 pages in the TextBox subProtocol
      // (textbox_001/002/003); 'backtomain' is a bare protocol reference, not a page, and the
      // followOn targets are references too, so neither contributes a call.
      expect(onPageProcessed).toHaveBeenCalledTimes(4);
      const doneValues = onPageProcessed.calls.allArgs().map(args => args[0]);
      const totalValues = onPageProcessed.calls.allArgs().map(args => args[1]);
      expect(doneValues.sort()).toEqual([1, 2, 3, 4]);
      expect(totalValues).toEqual([4, 4, 4, 4]);
    });
  });
});
