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
import { loadSweptDPOAENormativeData, loadWAINormativeData } from './load-normative-data-xlsx';
import { MrtExamInterface } from '../views/response-area/response-areas/mrt/mrt-exam/mrt-exam.interface';
import { WAIInterface } from '../views/response-area/response-areas/wideband-acoustic-immittance/wai-exam/wai-exam.interface';
import { SweptDpoaeInterface } from '../views/response-area/response-areas/swept-dpoae/swept-dpoae-exam/swept-dpoae-exam.interface';

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
  let rootProtocol = loading.protocol;
  let calibration = loading.calibration;
  let protocolDict: ProtocolDictionary = {};
  let followOnsDict: FollowOnsDictionary = {};
  let prefix = loading.meta.path!;

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

  async function processPage(page: PageDefinition) {
    if (page.preProcessFunction) {
      rootProtocol._preProcessFunctionList!.push(page.preProcessFunction);
    }

    // if (page.wavfiles) {
    // for (const wavfile of page.wavfiles) {
    //TODO: deal with calibration and common repo
    // }
    // }

    if (isPageDefinition(page) && page.image) {
      page.image.path = prefix + page.image.path;
    }

    if (page.video) {
      page.video.path = prefix + page.video.path;
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
          page.responseArea = await loadSweptDPOAENormativeData(responseArea, loading.meta);
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
      let id = getId(followOn.target);
      followOnsDict[id] = followOn;
      await iterateThroughPages(followOn.target);
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
}
