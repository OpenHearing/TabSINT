import { Injectable } from '@angular/core';

import { ProtocolModelInterface } from './protocol.interface';
import { ProtocolStack } from './protocol-stack';
@Injectable({
  providedIn: 'root',
})
export class ProtocolModel {
  protocolModel: ProtocolModelInterface = {
    activeProtocol: undefined,
    activeProtocolStack: new ProtocolStack(),
  };

  getProtocolModel(): ProtocolModelInterface {
    return this.protocolModel;
  }

  /**
   * Get a clone of the current protocol stack.
   * @returns The cloned protocol stack.
   */
  getProtocolStack(): ProtocolStack {
    return structuredClone(this.protocolModel.activeProtocolStack);
  }
}
