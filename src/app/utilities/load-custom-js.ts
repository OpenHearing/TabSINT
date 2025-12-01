import { ProtocolMetaInterface } from "../models/protocol/protocol.interface";
import { ExternalResponseAreaInterface } from "../views/response-area/response-areas/external-response-area/external-response-area.interface";
import { TabsintFs } from 'tabsintfs';
import { ProtocolServer } from "./constants";


export async function loadCustomJS(responseArea: ExternalResponseAreaInterface, meta: ProtocolMetaInterface): Promise<ExternalResponseAreaInterface> {
  if (responseArea.jsFilePath === undefined || responseArea.htmlFilePath === undefined) {
    throw new Error('Error: A html and js file must be specified for externalResponseArea');
  }
  const js = await loadFile(responseArea.jsFilePath, meta);
  const html = await loadFile(responseArea.htmlFilePath, meta);
  return { ...responseArea, js: js, html: html };
}

export async function loadFile(filePath: string, meta: ProtocolMetaInterface): Promise<string> {
  let contents: string | undefined;
  if (meta.server == ProtocolServer.Developer) {
    const resp = await fetch('assets/' + meta.path + '/' + filePath);
    if (!resp.ok) {
      throw new Error(`Failed to fetch the file: ${resp.statusText}`);
    }
    contents = await resp.text();
  } else if (meta.server === ProtocolServer.LocalServer || meta.server === ProtocolServer.Gitlab) {
    const resp = await TabsintFs.readFile({ rootUri: meta.contentURI, filePath: filePath });
    contents = resp.content;
  }

  if (contents) {
    return contents;
  } else {
    throw new Error('No file found at location: ' + filePath);
  }
}
