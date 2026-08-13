import { ProtocolStack } from './protocol-stack';
import { ProtocolInterface } from './protocol.interface';
import { ProtocolServer } from '../../utilities/constants';

const makeProtocol = (overrides: Partial<ProtocolInterface> = {}): ProtocolInterface =>
  ({
    protocolId: 'test-protocol',
    pages: [],
    name: 'Test',
    date: '',
    version: '1',
    server: ProtocolServer.Developer,
    admin: false,
    ...overrides,
  }) as ProtocolInterface;

describe('ProtocolStack', () => {
  let stack: ProtocolStack;

  beforeEach(() => {
    stack = new ProtocolStack();
  });

  it('starts empty', () => {
    expect(stack.isEmpty()).toBeTrue();
    expect(stack.size()).toBe(0);
    expect(stack.peek()).toBeUndefined();
  });

  it('adds a protocol and reports correct size', () => {
    stack.addProtocol(makeProtocol());
    expect(stack.isEmpty()).toBeFalse();
    expect(stack.size()).toBe(1);
  });

  it('peek returns the top item without removing it', () => {
    stack.addProtocol(makeProtocol({ protocolId: 'first' }));
    stack.addProtocol(makeProtocol({ protocolId: 'second' }));
    expect(stack.peek()?.protocolId).toBe('second');
    expect(stack.size()).toBe(2);
  });

  it('pop removes and returns the top item', () => {
    stack.addProtocol(makeProtocol({ protocolId: 'first' }));
    stack.addProtocol(makeProtocol({ protocolId: 'second' }));
    const popped = stack.pop();
    expect(popped?.protocolId).toBe('second');
    expect(stack.size()).toBe(1);
  });

  it('pop on empty stack returns undefined', () => {
    expect(stack.pop()).toBeUndefined();
  });

  it('clear empties the stack', () => {
    stack.addProtocol(makeProtocol());
    stack.addProtocol(makeProtocol());
    stack.clear();
    expect(stack.isEmpty()).toBeTrue();
    expect(stack.size()).toBe(0);
  });

  it('updateCurrentProtocol merges partial into top item', () => {
    stack.addProtocol(makeProtocol({ protocolId: 'p1' }));
    stack.updateCurrentProtocol({ pageIndex: 5 });
    const top = stack.peek();
    expect(top?.pageIndex).toBe(5);
    expect(top?.protocolId).toBe('p1');
  });

  it('uses timeout values from protocol when provided', () => {
    stack.addProtocol(makeProtocol({ timeout: { nMaxSeconds: 60, nMaxPages: 10 } }));
    expect(stack.peek()?.maxSeconds).toBe(60);
    expect(stack.peek()?.maxPages).toBe(10);
  });

  it('defaults timeout to MAX_SAFE_INTEGER when not provided', () => {
    stack.addProtocol(makeProtocol());
    expect(stack.peek()?.maxSeconds).toBe(Number.MAX_SAFE_INTEGER);
    expect(stack.peek()?.maxPages).toBe(Number.MAX_SAFE_INTEGER);
  });

  it('uses showAlert from protocol timeout when provided', () => {
    stack.addProtocol(makeProtocol({ timeout: { showAlert: true } }));
    expect(stack.peek()?.showAlert).toBe(true);
  });

  it('uses progress bar visibility from protocol when provided', () => {
    stack.addProtocol(makeProtocol({ showProgressBar: undefined }));
    expect(stack.peek()?.showProgressBar).toBe(undefined);
    stack.addProtocol(makeProtocol({ showProgressBar: false }));
    expect(stack.peek()?.showProgressBar).toBe(false);
    stack.addProtocol(makeProtocol({ showProgressBar: true }));
    expect(stack.peek()?.showProgressBar).toBe(true);
  });

  it('defaults show progress bar to undefined when not provided', () => {
    stack.addProtocol(makeProtocol());
    expect(stack.peek()?.showProgressBar).toBe(undefined);
  });

  it('defaults protocolId to empty string when not provided', () => {
    stack.addProtocol(makeProtocol({ protocolId: undefined }));
    expect(stack.peek()?.protocolId).toBe('');
  });

  it('emits the top item when a protocol is added', done => {
    stack.latestProtocolObservable.subscribe(item => {
      if (item) {
        expect(item.protocolId).toBe('emitted');
        done();
      }
    });
    stack.addProtocol(makeProtocol({ protocolId: 'emitted' }));
  });

  it('emits undefined when cleared', done => {
    stack.addProtocol(makeProtocol());
    let emissionCount = 0;
    stack.latestProtocolObservable.subscribe(item => {
      emissionCount++;
      if (emissionCount === 2) {
        expect(item).toBeUndefined();
        done();
      }
    });
    stack.clear();
  });

  it('peek returns a clone — mutations do not affect the stack', () => {
    stack.addProtocol(makeProtocol({ protocolId: 'original' }));
    const peeked = stack.peek()!;
    peeked.protocolId = 'mutated';
    expect(stack.peek()?.protocolId).toBe('original');
  });

  describe('randomization', () => {
    const makePages = (count: number) => Array.from({ length: count }, (_, i) => ({ id: `page-${i}` })) as ProtocolInterface['pages'];

    it('shuffles pages when randomization is WithoutReplacement', () => {
      const pages = makePages(10);
      stack.addProtocol(makeProtocol({ randomization: 'WithoutReplacement', pages }));
      const pageQueue = stack.peek()?.pageQueue ?? [];
      expect(pageQueue.map(p => (p as { id: string }).id)).not.toEqual(pages.map(p => (p as { id: string }).id));
    });

    it('preserves every page when shuffling', () => {
      const pages = makePages(10);
      stack.addProtocol(makeProtocol({ randomization: 'WithoutReplacement', pages }));
      const pageQueue = stack.peek()?.pageQueue ?? [];
      expect(pageQueue.map(p => (p as { id: string }).id).sort()).toEqual(pages.map(p => (p as { id: string }).id).sort());
    });

    it('preserves original order when randomization is not set', () => {
      const pages = makePages(10);
      stack.addProtocol(makeProtocol({ pages }));
      const pageQueue = stack.peek()?.pageQueue ?? [];
      expect(pageQueue).toEqual(pages);
    });
  });
});
