import { JSONSchemaType } from 'ajv';
import { DiskInterface } from '../../app/models/disk/disk.interface';
import { protocolMetaSchema } from './protocol-meta.schema';
import { ProtocolServer } from '../../app/utilities/constants';
import { uploadSummarySchema } from './upload-summary.schema';
import { mediaReposSchema } from './media-repos.schema';
import { nullable } from '../../app/utilities/safe-parsing';
import { savedDeviceSchema } from './saved-device.schema';
import { preferencesSchema } from './preferences.schema';

export const diskSchema: JSONSchemaType<DiskInterface> = {
  type: 'object',
  properties: {
    activeProtocolMeta: nullable(protocolMetaSchema),
    appDeveloperModeCount: { type: 'integer', default: 0 },
    audhere: { type: 'string', default: '' },
    availableProtocolsMeta: {
      type: 'object',
      additionalProperties: protocolMetaSchema,
      properties: {
        develop: protocolMetaSchema,
        mini_pcc: protocolMetaSchema,
      },
      default: {
        develop: {
          date: new Date().toJSON(),
          version: '0.0',
          server: ProtocolServer.Developer,
          admin: true,
          creator: 'Creare',
          name: 'develop',
          path: 'protocols/develop',
        },
        mini_pcc: {
          date: new Date().toJSON(),
          version: '0.0',
          server: ProtocolServer.Developer,
          admin: true,
          creator: 'Creare',
          name: 'mini_pcc',
          path: 'protocols/mini_pcc',
        },
      },
      required: ['develop', 'mini_pcc'],
    },
    contentURI: { type: 'string', default: null },
    downloadInProgress: { type: 'boolean', default: false },
    extStorageRootDir: nullable({ type: 'string' }),
    extStorageUuidDir: nullable({ type: 'string' }),
    interApp: {
      type: 'object',
      properties: {
        appName: { type: 'string', default: '' },
        dataIn: { type: 'string', default: '' },
        dataOut: { type: 'string', default: '' },
      },
      default: { appName: '', dataIn: '', dataOut: '' },
      required: ['appName', 'dataIn', 'dataOut'],
    },
    lastReleaseCheck: { type: 'string', default: '' },
    mediaRepos: { type: 'array', items: mediaReposSchema, default: [] },
    numLogRows: { type: 'integer', default: 0 },
    reloadingBrowser: { type: 'boolean', default: false },
    tabletLocation: {
      type: 'object',
      properties: {
        latitude: nullable({ type: 'number' }),
        longitude: nullable({ type: 'number' }),
        accuracy: nullable({ type: 'number' }),
      },
      default: {},
      required: [],
    },
    uploadSummary: { type: 'array', items: uploadSummarySchema, default: [] },
    savedDevices: { type: 'array', items: savedDeviceSchema, default: [] },
    showDisclaimer: { type: 'boolean', default: true },
    preferences: {
      ...preferencesSchema,
      default: {
        adminSkipMode: preferencesSchema.properties.adminSkipMode.default,
        appDeveloperMode: preferencesSchema.properties.appDeveloperMode.default,
        autoUpload: preferencesSchema.properties.autoUpload.default,
        disableAudioStreaming: preferencesSchema.properties.disableAudioStreaming.default,
        debugMode: preferencesSchema.properties.debugMode.default,
        disableLogs: preferencesSchema.properties.disableLogs.default,
        externalMode: preferencesSchema.properties.externalMode.default,
        gitlab: preferencesSchema.properties.gitlab.default,
        gitlabConfig: preferencesSchema.properties.gitlabConfig.default,
        headset: preferencesSchema.properties.headset.default,
        language: preferencesSchema.properties.language.default,
        maxLogRows: preferencesSchema.properties.maxLogRows.default,
        pin: preferencesSchema.properties.pin.default,
        preventExports: preferencesSchema.properties.preventExports.default,
        preventUploads: preferencesSchema.properties.preventUploads.default,
        requireEncryptedResults: preferencesSchema.properties.requireEncryptedResults.default,
        resultsMode: preferencesSchema.properties.resultsMode.default,
        server: preferencesSchema.properties.server.default,
        servers: preferencesSchema.properties.servers.default,
        showUploadSummary: preferencesSchema.properties.showUploadSummary.default,
        suppressAlerts: preferencesSchema.properties.suppressAlerts.default,
        tabletGain: preferencesSchema.properties.tabletGain.default,
        validateProtocols: preferencesSchema.properties.validateProtocols.default,
        versionCheck: preferencesSchema.properties.versionCheck.default,
        wahtsConnectionType: preferencesSchema.properties.wahtsConnectionType.default,
      },
    },
  },
  required: [
    'appDeveloperModeCount',
    'audhere',
    'availableProtocolsMeta',
    'contentURI',
    'downloadInProgress',
    'interApp',
    'lastReleaseCheck',
    'mediaRepos',
    'numLogRows',
    'reloadingBrowser',
    'tabletLocation',
    'uploadSummary',
    'savedDevices',
    'showDisclaimer',
    'preferences',
  ],
};
