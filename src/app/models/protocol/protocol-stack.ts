import { BehaviorSubject, Observable } from 'rxjs';
import { ProtocolSchemaInterface } from '../../interfaces/protocol-schema.interface';
import { PageTypes } from '../../types/custom-types';
import { ProtocolInterface } from './protocol.interface';

/**
 * A single item in the protocol stack.
 * Holds the current index and pages queue for the active protocol or subprotocol.
 */
export interface ProtocolStackItem {
  protocolId: string;
  startTime: Date;
  maxSeconds: number;
  maxPages: number;
  pageQueue: PageTypes[];
  pageIndex: number;
  title?: string;
}

/**
 * Protocol stack to maintain the active state of a protocol during navigation.
 */
export class ProtocolStack {
  private readonly latestProtocol = new BehaviorSubject<ProtocolStackItem | undefined>(undefined);
  readonly latestProtocolObservable: Observable<ProtocolStackItem | undefined> = this.latestProtocol.asObservable();
  private items: ProtocolStackItem[] = [];

  /**
   * Add a protocol to the stack.
   * @param protocol The protocol to be added to the stack.
   */
  addProtocol(protocol: ProtocolInterface | ProtocolSchemaInterface): void {
    const protocolCopy = structuredClone(protocol);
    const item: ProtocolStackItem = {
      protocolId: protocolCopy.protocolId ?? '',
      startTime: new Date(),
      maxSeconds: protocolCopy.timeout?.nMaxSeconds ?? Number.MAX_SAFE_INTEGER,
      maxPages: protocolCopy.timeout?.nMaxPages ?? Number.MAX_SAFE_INTEGER,
      pageQueue: protocolCopy.pages,
      pageIndex: -1,
      title: protocolCopy.title,
    };
    this.items.push(item);
    this.latestProtocol.next(this.peek());
  }

  /**
   * Update the latest protocol in a stack.
   * @param itemPartial The partial to update the latest protocol stack item with.
   */
  updateCurrentProtocol(itemPartial: Partial<ProtocolStackItem>) {
    if (this.items.length > 0) {
      const index = this.items.length - 1;
      this.items[index] = { ...this.items[index], ...itemPartial };
    }
    this.latestProtocol.next(this.peek());
  }

  /**
   * Remove the top item from the stack.
   * @returns Returns the item which was popped.
   */
  pop(): ProtocolStackItem | undefined {
    const removed = this.items.pop();
    this.latestProtocol.next(this.peek());
    return removed;
  }

  /**
   * View the top item in the stack.
   * @returns The top item in the stack.
   */
  peek(): ProtocolStackItem | undefined {
    return structuredClone(this.items.at(-1));
  }

  /**
   * Resolve the title an untitled page should inherit: the title of the nearest ancestor
   * protocol, walking from the current protocol up to the root.
   * @returns The nearest ancestor title, or undefined if no protocol in the stack has one.
   */
  resolveInheritedTitle(): string | undefined {
    for (let i = this.items.length - 1; i >= 0; i--) {
      if (this.items[i].title) {
        return this.items[i].title;
      }
    }
    return undefined;
  }

  /**
   * Whether the stack is empty or not.
   * @returns True if the stack is empty, false otherwise.
   */
  isEmpty(): boolean {
    return this.items.length === 0;
  }

  /**
   * Returns the current length of the stack.
   * @returns Length of the stack.
   */
  size(): number {
    return this.items.length;
  }

  /**
   * Clear the stack of all items.
   */
  clear(): void {
    this.items = [];
    this.latestProtocol.next(undefined);
  }
}
