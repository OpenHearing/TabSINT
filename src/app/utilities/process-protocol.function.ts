import _ from "lodash";
import { ProtocolSchemaInterface } from "../interfaces/protocol-schema.interface";
import { ProtocolInterface } from "../models/protocol/protocol.interface";
import { PageDefinition, ProtocolReference } from "../interfaces/page-definition.interface";
import { LoadingProtocolInterface } from "../interfaces/loading-protocol-object.interface";
import { ProtocolDictionary } from "../interfaces/protocol-dictionary";
import { FollowOnsDictionary } from "../interfaces/follow-ons-dictionary";
import { doesIdExist, doesProtocolIdExist, doesReferenceExist } from "./protocol-helper-functions";

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
      _.forEach(subProtocol.subProtocols, function(obj) {
        processSubProtocol(obj);
      });
    }
  }

  function iterateThroughPages(pages: PageDefinition | ProtocolReference | ProtocolSchemaInterface | (PageDefinition|ProtocolReference)[]) {
    _.forEach(pages, function(page) {
      if (_.has(page, "pages")) {
        processSubProtocol(page as ProtocolSchemaInterface);
      // } else if ((page as any).reference) {
      //   processPage(page as any);
      } else if (_.has(page, "id")) {
        processPage(page as any);
      }
    });  
  }

  function processPage(
      page: any 
      // PageDefinition | ProtocolReference | ProtocolSchemaInterface
    ) {

    if (page.preProcessFunction) {
      rootProtocol._preProcessFunctionList!.push(page.preProcessFunction);
    }

    if (page.wavfiles) {
      _.forEach(page.wavfiles, function(wavfile) {
        if (wavfile.useCommonRepo) {
          if (rootProtocol.commonRepo && rootProtocol.commonRepo.path) {
            if (calibration) {
              if (calibration[wavfile.path]) {
                wavfile.cal = calibration[wavfile.path];
              } else {
                rootProtocol._missingCommonWavCalList!.push(wavfile.path);
              }
            } else {
                rootProtocol._missingCommonMediaRepo = true;
                rootProtocol._missingCommonWavCalList!.push(wavfile.path);
            }
            wavfile.path = rootProtocol.commonRepo.path + wavfile.path;
          }
        }

        else {
          if (calibration && calibration[wavfile.path]) {
            wavfile.cal = calibration[wavfile.path];
            wavfile.cal.tablet = calibration.tablet;
          } else {
            rootProtocol._missingWavCalList!.push(wavfile.path);
          }

          wavfile.path = prefix + wavfile.path;
        }
      });
    }

    if (page.image) {
      page.image.path = prefix + page.image.path;
    }

    if (page.video) {
      page.video.path = prefix + page.video.path;
    }

    if (page.responseArea) {
      if (page.responseArea.image) {
        page.responseArea.image.path = prefix + page.responseArea.image.path;
      }

      if (page.responseArea.html) {
        var originalHtmlFile = page.responseArea.html;
        page.responseArea.html = prefix + page.responseArea.html;
        rootProtocol._customHtmlList!.push({
          name: originalHtmlFile,
          path: page.responseArea.html,
          id: page.id
        });
      }

      if (page.responseArea.type === "subjectIdResponseArea") {
        rootProtocol._hasSubjectIdResponseArea = true;
      }

      if (page.responseArea.type.startsWith("cha")) {
        rootProtocol._requiresCha = true;
      }

      if (_.has(page.responseArea, "exportToCSV")) {
        if (page.responseArea.exportToCSV === true) {
            rootProtocol._exportCSV = true;
        }
      }

      if (_.has(page, "exportToCSV")) {
        if (page.exportToCSV === true) {
            rootProtocol._exportCSV = true;
        }
      }
    }

    if (_.has(page, "followOns")) {
      _.forEach(page.followOns, function(followOn) {
        let id = getId(followOn.target);
        followOnsDict[id] = followOn;
        iterateThroughPages(followOn.target);
      });
    }

    function getId(target: any): string {
        return  doesIdExist(target.id)
          ? target.id
          : doesProtocolIdExist(target.protocolId)
            ? target.protocolId
            : doesReferenceExist(target.reference)
              ? target.reference
              : 'Should not get here';
    }

    if (_.has(page, "pages")) {
      processSubProtocol(page);
    }
  }

}