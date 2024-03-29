import _ from "lodash";
import { ProtocolSchema } from "../interfaces/protocol-schema.interface";
import { ProtocolInterface } from "../models/protocol/protocol.interface";

export function processProtocol(
    subProtocol: ProtocolSchema, 
    dict: _.Dictionary<ProtocolSchema>, 
    rootProtocol: ProtocolInterface, 
    calibration: any, 
    commonCalibration: any, 
    prefix: string
  ) {
    _.forEach(subProtocol.pages, function(page) {
      processPage(page, dict, rootProtocol, calibration, commonCalibration, prefix);
    });

    if (_.has(subProtocol, "protocolId")) {
      dict[subProtocol.protocolId!] = subProtocol;
    }

    if (_.has(subProtocol, "subProtocols")) {
      _.forEach(subProtocol.subProtocols, function(obj) {
        processProtocol(obj, dict, rootProtocol, calibration, commonCalibration, prefix);
      });
    }
  }

  function processPage(
      page: any, 
      dict: _.Dictionary<ProtocolSchema>, 
      rootProtocol: ProtocolInterface, 
      calibration: any, 
      commonCalibration: any, 
      prefix: string
    ) {
    if (page.preProcessFunction) {
      rootProtocol._preProcessFunctionList!.push(page.preProcessFunction);
    }

    if (page.wavfiles) {
      _.forEach(page.wavfiles, function(wavfile) {
        if (wavfile.useCommonRepo) {
          if (rootProtocol.commonRepo && rootProtocol.commonRepo.path) {
            if (commonCalibration) {
              if (commonCalibration[wavfile.path]) {
                wavfile.cal = commonCalibration[wavfile.path];
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

      if (page.responseArea.type === "multipleInputResponseArea") {
        _.forEach(page.responseArea.inputList, function(input) {
          if (_.has(input, "exportToCSV")) {
            if (input.exportToCSV === true) {
                rootProtocol._exportCSV = true;
              return;
            }
          }
        });
      }

      // load callbacks if response area has one -- will be performed at the end of the load cycle
    //   var respAreas = responseAreas.all();
    //   if (_.has(respAreas[page.responseArea.type], "loadCallback")) {
    //     var name = respAreas[page.responseArea.type].loadCallback.name;
    //     if (name === "") {
    //       name = page.responseArea.type;
    //     }
    //     callbackQueue.add(name, respAreas[page.responseArea.type].loadCallback);
    //   }
    }

    if (_.has(page, "followOns")) {
      _.forEach(page.followOns, function(followOn) {
        if (_.has(followOn.target, "id") && !_.has(followOn.target, "reference")) {
          processPage(followOn.target, dict, rootProtocol, calibration, commonCalibration, prefix);
        } else if (_.has(followOn.target, "pages")) {
          processProtocol(followOn.target, dict, rootProtocol, calibration, commonCalibration, prefix);
        }
      });
    }

    if (_.has(page, "pages")) {
      processProtocol(page, dict, rootProtocol, calibration, commonCalibration, prefix);
    }
  }