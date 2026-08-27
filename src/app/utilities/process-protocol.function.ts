import _ from 'lodash';
import { ProtocolSchemaInterface } from '../interfaces/protocol-schema.interface';
import { ProtocolInterface } from '../models/protocol/protocol.interface';
import { FollowOnInterface, PageDefinition } from '../interfaces/page-definition.interface';
import { LoadingProtocolInterface } from '../interfaces/loading-protocol-object.interface';
import { ProtocolDictionary } from '../interfaces/protocol-dictionary';
import { FollowOnsDictionary } from '../interfaces/follow-ons-dictionary';
import { isPageDefinition, isProtocolReferenceInterface, isProtocolSchemaInterface } from '../guards/type.guard';
import { PageTypes } from '../types/custom-types';
import { loadMrtExamCsv } from './load-mrt-exam-csv';
import { loadDPOAENormativeData, loadWAINormativeData } from './load-normative-data-xlsx';
import { MrtExamInterface } from '../views/response-area/response-areas/mrt/mrt-exam/mrt-exam.interface';
import { WAIInterface } from '../views/response-area/response-areas/wideband-acoustic-immittance/wai-exam/wai-exam.interface';
import { SweptDpoaeInterface } from '../views/response-area/response-areas/swept-dpoae/swept-dpoae-exam/swept-dpoae-exam.interface';
import { DpGramInterface } from '../views/response-area/response-areas/dp-gram/dp-gram-exam/dp-gram-exam.interface';
import { CustomResponseAreaInterface } from '../views/response-area/response-areas/custom-response-area/custom-response-area.interface';
import { ProtocolServer } from './constants';
import { TabsintFs } from 'tabsintfs';
import { loadCustomJS, loadFile } from './load-custom-js';
import { CalibrationFileWavProperties } from '../interfaces/calibration-file.interface';

/** Media-source configuration needed to resolve a wavfile's raw protocol-relative path to an on-device path. */
export interface WavfileResolutionContext {
  commonRepoPath?: string;
  server?: ProtocolServer;
  metaPath?: string;
  contentURI?: string | null;
}

async function resolveFilePath(rootUri: string, filePath: string): Promise<string | undefined> {
  return (await TabsintFs.getFileContentURI({ rootUri: rootUri, filePath: filePath }).catch(() => undefined))?.contentUri;
}

/**
 * Resolve the on-device path for a wavfile's raw protocol-relative path, given the protocol's
 * media-source configuration. Used both when a protocol is first loaded and by preprocess
 * functions (via `window.tabsint.resolveWavfilePath`) that swap a wavfile's path at runtime.
 * @param rawPath The wavfile's protocol-relative path (i.e. `wavfile.path`).
 * @param useCommonRepo Whether this wavfile is sourced from the protocol's common media repo.
 * @param context The active protocol's media-source configuration.
 * @returns The resolved path, or undefined if it could not be resolved.
 */
export async function resolveWavfilePath(
  rawPath: string,
  useCommonRepo: boolean | undefined,
  context: WavfileResolutionContext
): Promise<string | undefined> {
  if (useCommonRepo) {
    return context.commonRepoPath ? await resolveFilePath(context.commonRepoPath, rawPath) : undefined;
  } else if (context.server === ProtocolServer.Developer) {
    return 'public/assets/' + context.metaPath! + '/' + rawPath;
  } else if (context.contentURI) {
    return await resolveFilePath(context.contentURI, rawPath);
  }
  return undefined;
}

/**
 * Adds variables to the active protocol and generates a stack of pages.
 * @summary Loops through each page and subprotocol, adds variables to the
 * active protocol based on parameters on each page, and creates a page stack.
 * @param loading: LoadingProtocolInterface containing the protocol JSON,
 * its calibration if it exists, its meta data, whether to notify the user about
 * progress, whether to validate the protocol, and whether to overwrite local protocol files
 * @returns the active protocol, the stack of pages, a dictionary of all subprotocols,
 * a dictionary of all pages, and a dictionary of all followOns
 */
export async function processProtocol(loading: LoadingProtocolInterface): Promise<[ProtocolInterface, ProtocolDictionary, FollowOnsDictionary]> {
  const rootProtocol = loading.protocol;
  const protocolDict: ProtocolDictionary = {};
  const followOnsDict: FollowOnsDictionary = {};

  await iterateThroughPages(rootProtocol.pages);

  if (_.has(rootProtocol, 'subProtocols')) {
    for (const obj of rootProtocol.subProtocols!) {
      await processSubProtocol(obj);
    }
  }

  return [rootProtocol, protocolDict, followOnsDict];

  async function processSubProtocol(subProtocol: ProtocolSchemaInterface) {
    await iterateThroughPages(subProtocol.pages);

    if (_.has(subProtocol, 'protocolId')) {
      protocolDict[subProtocol.protocolId!] = subProtocol;
    }

    if (_.has(subProtocol, 'subProtocols')) {
      for (const obj of subProtocol.subProtocols!) {
        await processSubProtocol(obj);
      }
    }
  }

  async function iterateThroughPages(pages: PageTypes | PageTypes[]) {
    pages = !Array.isArray(pages) ? [pages] : pages;
    for (const page of pages) {
      if (isProtocolSchemaInterface(page)) {
        await processSubProtocol(page);
        // } else if (isProtocolReferenceInterface(page)) {
        // processPage(page as ProtocolReferenceInterface);
      } else if (isPageDefinition(page)) {
        await processPage(page);
      }
    }
  }

  /**
   * Check whether an asset exists.
   * @param assetPath The path to check.
   * @returns True if the asset exists, False otherwise.
   */
  async function assetPathExists(assetPath: string): Promise<boolean> {
    return await fetch(assetPath, { method: 'HEAD' })
      .then(response => response.ok)
      .catch(() => false);
  }

  async function processPage(page: PageDefinition) {
    if (page.preProcessFunction) {
      page.preProcessFunction.js = await loadFile(page.preProcessFunction.filepath, loading.meta);
    }

    await updatePageWavProperties(page);
    await updatePageVideoProperties(page);

    if (isPageDefinition(page) && page.image) {
      page.image.b64 = await readImageFileAsBytes(loading, page.image.path);
    }

    if (page.responseArea) {
      // TODO: deal with specific response area processing here
      switch (page.responseArea.type) {
        case 'mrtResponseArea': {
          const responseArea = page.responseArea as MrtExamInterface;
          page.responseArea = await loadMrtExamCsv(responseArea, loading.meta);
          break;
        }
        case 'WAIResponseArea': {
          const responseArea = page.responseArea as WAIInterface;
          page.responseArea = await loadWAINormativeData(responseArea, loading.meta);
          break;
        }
        case 'sweptDPOAEResponseArea': {
          const responseArea = page.responseArea as SweptDpoaeInterface;
          page.responseArea = await loadDPOAENormativeData(responseArea, loading.meta);
          break;
        }
        case 'dpGramResponseArea': {
          const responseArea = page.responseArea as DpGramInterface;
          page.responseArea = await loadDPOAENormativeData(responseArea, loading.meta);
          break;
        }
        case 'customResponseArea': {
          const responseArea = page.responseArea as CustomResponseAreaInterface;
          page.responseArea = await loadCustomJS(responseArea, loading.meta);
          break;
        }
        default:
          break;
      }
    }

    if (_.has(page, 'followOns')) {
      await processFollowOns(page.followOns!);
    }

    if (isProtocolSchemaInterface(page)) {
      await processSubProtocol(page);
    }
  }

  async function processFollowOns(followOns: FollowOnInterface[]) {
    for (const followOn of followOns) {
      const id = getId(followOn.target);
      followOnsDict[id] = followOn;
      await iterateThroughPages(followOn.target);
    }
  }

  /**
   * Process the data from a calibration file add properties to the wav file object held in the page.
   * @param page The page with wav files to be processed and updated.
   */
  async function updatePageWavProperties(page: PageDefinition): Promise<void> {
    for (const wavfile of page.wavfiles ?? []) {
      // Determine if a common calibration is available or if a custom calibration is available
      const missingCommonMediaRepo = !rootProtocol.commonRepo || !rootProtocol.cCommon;
      const missingCommonWavCalList = missingCommonMediaRepo || !rootProtocol.cCommon?.[wavfile.path];

      // Update the page wav files with calibration data if possible, otherwise update error messaging
      if (wavfile.useCommonRepo) {
        if (!missingCommonMediaRepo && !missingCommonWavCalList) {
          const wavProperties = rootProtocol.cCommon?.[wavfile.path] as CalibrationFileWavProperties;
          wavfile.cal = wavProperties;
          rootProtocol._missingCommonMediaRepo = missingCommonMediaRepo;
        } else if (missingCommonWavCalList) {
          rootProtocol._missingCommonWavCalList?.push(wavfile.path);
        }
        rootProtocol._missingCommonMediaRepo = missingCommonMediaRepo;
      } else if (loading.calibration) {
        const wavCalibrationProperties = loading.calibration[wavfile.path] as CalibrationFileWavProperties;
        wavfile.cal = { ...wavCalibrationProperties, _tablet: loading.calibration?.tablet, _headset: loading.calibration?.headset };
      } else {
        rootProtocol._missingWavCalList?.push(wavfile.path);
      }
    }

    const resolutionContext: WavfileResolutionContext = {
      commonRepoPath: rootProtocol.commonRepo?.path,
      server: loading.meta.server,
      metaPath: loading.meta.path,
      contentURI: loading.meta.contentURI,
    };

    await Promise.all(
      (page.wavfiles ?? []).map(async wavfile => {
        if (wavfile.useCommonRepo) {
          if (rootProtocol.commonRepo?.path) {
            wavfile._resolvedPath = await resolveWavfilePath(wavfile.path, true, resolutionContext);
            if (wavfile._resolvedPath === undefined) {
              rootProtocol._unresolvedFilePathList?.push(wavfile.path);
            }
          }
        } else if (loading.meta.server == ProtocolServer.Developer) {
          wavfile._resolvedPath = await resolveWavfilePath(wavfile.path, false, resolutionContext);
          // The asset path check needs to check a different path than the resolved path, as the resolved path is for Java use.
          if (!(await assetPathExists('assets/' + loading.meta.path! + '/' + wavfile.path))) {
            rootProtocol._unresolvedFilePathList?.push(wavfile.path);
          }
        } else if (loading.meta.contentURI) {
          wavfile._resolvedPath = await resolveWavfilePath(wavfile.path, false, resolutionContext);
          if (wavfile._resolvedPath === undefined) {
            rootProtocol._unresolvedFilePathList?.push(wavfile.path);
          }
        }
      })
    );
  }

  /**
   * Update the page video properties with resolved paths.
   * @param page The page with video to be processed and updated.
   */
  async function updatePageVideoProperties(page: PageDefinition): Promise<void> {
    if (page.video) {
      if (loading.meta.server == ProtocolServer.Developer) {
        page.video._resolvedPath = 'assets/' + loading.meta.path! + '/' + page.video.path;
        if (!(await assetPathExists(page.video._resolvedPath))) {
          rootProtocol._unresolvedFilePathList?.push(page.video.path);
        }
      } else if (loading.meta.contentURI) {
        page.video._resolvedPath = await resolveFilePath(loading.meta.contentURI, page.video.path);
        if (page.video._resolvedPath === undefined) {
          rootProtocol._unresolvedFilePathList?.push(page.video.path);
        }
      }
    }
  }

  function getId(target: PageTypes): string {
    if (isPageDefinition(target)) {
      return target.id;
    } else if (isProtocolSchemaInterface(target)) {
      return target.protocolId!;
    } else if (isProtocolReferenceInterface(target)) {
      return target.reference;
    } else {
      return 'Should not get here';
    }
  }

  async function readImageFileAsBytes(loading: LoadingProtocolInterface, imagePath: string): Promise<string | undefined> {
    let imageBytes: string | undefined;
    if (loading.meta.server == ProtocolServer.Developer) {
      const resp = await fetch('assets/' + loading.meta.path + '/' + imagePath);
      if (!resp.ok) {
        throw new Error(`Failed to fetch the file: ${resp.statusText}`);
      }
      const blob = await resp.blob();
      imageBytes = await blobToBase64DataURL(blob);
    } else if (loading.meta.server === ProtocolServer.LocalServer || loading.meta.server === ProtocolServer.Gitlab) {
      const resp = await TabsintFs.readFile({ rootUri: loading.meta.contentURI, filePath: imagePath, asBase64: true });
      imageBytes = 'data:' + resp.mimeType + ';base64,' + resp.content;
    }
    return imageBytes;
  }

  async function blobToBase64DataURL(blob: Blob): Promise<string | undefined> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        resolve(reader.result as string);
      };
      reader.onerror = () => {
        reject(reader.error);
      };
      reader.readAsDataURL(blob);
    });
  }
}
