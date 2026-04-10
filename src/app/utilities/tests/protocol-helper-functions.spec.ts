import { findDuplicateProtocols, getProtocolMetaData } from '../protocol-helper-functions';
import { ProtocolInterface } from '../../models/protocol/protocol.interface';
import { ProtocolServer } from '../constants';

const makeProtocol = (overrides: Partial<ProtocolInterface> = {}): ProtocolInterface =>
  ({
    name: 'Protocol A',
    path: '/path/a',
    date: '2024-01-01',
    contentURI: null,
    version: '1',
    server: ProtocolServer.LocalServer,
    admin: false,
    pages: [],
    ...overrides,
  }) as unknown as ProtocolInterface;

describe('findDuplicateProtocols', () => {
  it('returns an empty array when no duplicates exist', () => {
    const p = makeProtocol();
    const loaded = [makeProtocol({ name: 'Protocol B' })];
    expect(findDuplicateProtocols(p, loaded)).toEqual([]);
  });

  it('returns matching protocols when a duplicate exists', () => {
    const p = makeProtocol();
    const loaded = [makeProtocol(), makeProtocol({ name: 'Other' })];
    expect(findDuplicateProtocols(p, loaded).length).toBe(1);
  });

  it('matches on all four fields: name, path, date, contentURI', () => {
    const p = makeProtocol({ date: '2024-06-01' });
    const loaded = [makeProtocol({ date: '2024-01-01' }), makeProtocol({ date: '2024-06-01' })];
    expect(findDuplicateProtocols(p, loaded).length).toBe(1);
  });
});

describe('getProtocolMetaData', () => {
  it('extracts only the meta fields', () => {
    const protocol = makeProtocol({ name: 'Meta Test', version: '2.0', creator: 'Alice' } as Partial<ProtocolInterface>);
    const meta = getProtocolMetaData(protocol);
    expect(meta.name).toBe('Meta Test');
    expect(meta.version).toBe('2.0');
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    expect((meta as any).pages).toBeUndefined();
  });
});
