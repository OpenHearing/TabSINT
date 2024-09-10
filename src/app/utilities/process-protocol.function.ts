import _ from "lodash";
import { ProtocolSchemaInterface } from "../interfaces/protocol-schema.interface";
import { ProtocolInterface } from "../models/protocol/protocol.interface";
import { FollowOnInterface, PageDefinition, ProtocolReferenceInterface } from "../interfaces/page-definition.interface";
import { LoadingProtocolInterface } from "../interfaces/loading-protocol-object.interface";
import { ProtocolDictionary } from "../interfaces/protocol-dictionary";
import { FollowOnsDictionary } from "../interfaces/follow-ons-dictionary";
import { isPageDefinition, isProtocolReferenceInterface, isProtocolSchemaInterface } from "../guards/type.guard";
import { PageTypes } from "../types/custom-types";

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
export function processProtocol(loading: LoadingProtocolInterface):
  [ProtocolInterface, ProtocolDictionary, FollowOnsDictionary]
{
  let rootProtocol = loading.protocol;
  let calibration = loading.calibration;
  let protocolDict: ProtocolDictionary = {};
  let followOnsDict: FollowOnsDictionary = {};
  let prefix = loading.meta.path!;

  iterateThroughPages(rootProtocol.pages);

  if (_.has(rootProtocol, "subProtocols")) {
    _.forEach(rootProtocol.subProtocols, (obj) => {
      processSubProtocol(obj);
    });
  }
  
  return [rootProtocol, protocolDict, followOnsDict];

  function processSubProtocol(
    subProtocol: ProtocolSchemaInterface
  ) {

    iterateThroughPages(subProtocol.pages);

    if (_.has(subProtocol, "protocolId")) {
      protocolDict[subProtocol.protocolId!] = subProtocol;
    }

    if (_.has(subProtocol, "subProtocols")) {
      _.forEach(subProtocol.subProtocols, (obj) => {
        processSubProtocol(obj);
      });
    }
  }

  function iterateThroughPages(pages: PageTypes | (PageTypes)[]) {
    _.forEach(pages, (page) => {
      if (isProtocolSchemaInterface(page)) {
        processSubProtocol(page as ProtocolSchemaInterface);
      // } else if (isProtocolReferenceInterface(page)) {
      //   processPage(page as ProtocolReferenceInterface);
      } else if (isPageDefinition(page)) {
        processPage(page as PageDefinition);
      }
    });  
  }

  function processPage(
      page: PageDefinition
    ) {

    if (page.preProcessFunction) {
      rootProtocol._preProcessFunctionList!.push(page.preProcessFunction);
    }

    if (page.wavfiles) {
      _.forEach(page.wavfiles, (wavfile) => {
        //TODO: deal with calibration and common repo
      });
    }

    if (isPageDefinition(page) && page.image) {
      page.image.path = prefix + page.image.path;
    }

    if (page.video) {
      page.video.path = prefix + page.video.path;
    }

    if (page.responseArea) {
      // TODO: deal with specific response area processing here
    }

    if (_.has(page, "followOns")) {
      processFollowOns(page.followOns!);
    }


    if (isProtocolSchemaInterface(page)) {
      processSubProtocol(page);
    }
  }

  function processFollowOns(followOns: FollowOnInterface[]) {
    _.forEach(followOns, (followOn) => {
      let id = getId(followOn.target);
      followOnsDict[id] = followOn;
      iterateThroughPages(followOn.target);
    });
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