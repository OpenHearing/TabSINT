import { checkCalibrationFiles, checkControllers, checkUnresolvedFilePaths, protocolHasWavFiles } from '../protocol-checks.function';
import { ProtocolInterface } from '../../models/protocol/protocol.interface';
import { ProtocolServer } from '../constants';
import { PageDefinition } from '../../interfaces/page-definition.interface';
import { ProtocolSchemaInterface } from '../../interfaces/protocol-schema.interface';

const makeProtocol = (overrides: Partial<ProtocolInterface> = {}): ProtocolInterface =>
  ({
    protocolId: 'test',
    name: 'Test',
    date: '',
    version: '1',
    server: ProtocolServer.LocalServer,
    admin: false,
    pages: [],
    _missingWavCalList: [],
    _missingCommonWavCalList: [],
    _missingControllerList: [],
    _unresolvedFilePathList: [],
    ...overrides,
  }) as ProtocolInterface;

describe('checkCalibrationFiles', () => {
  it('returns undefined when no calibration files are missing', () => {
    expect(checkCalibrationFiles(makeProtocol())).toBeUndefined();
  });

  it('reports missing wav calibrations', () => {
    const protocol = makeProtocol({ _missingWavCalList: ['file1.wav', 'file2.wav'] });
    const msg = checkCalibrationFiles(protocol);
    expect(msg).toContain('2');
    expect(msg).toContain('wav files');
  });

  it('reports missing common wav calibrations', () => {
    const protocol = makeProtocol({ _missingCommonWavCalList: ['common1.wav'] });
    const msg = checkCalibrationFiles(protocol);
    expect(msg).toContain('common media');
  });

  it('reports both when both lists are non-empty', () => {
    const protocol = makeProtocol({
      _missingWavCalList: ['a.wav'],
      _missingCommonWavCalList: ['b.wav'],
    });
    const msg = checkCalibrationFiles(protocol);
    expect(msg).toContain('calibration');
    expect(msg).toContain('common media');
  });
});

describe('checkControllers', () => {
  it('returns empty array when no controllers are missing', () => {
    expect(checkControllers(makeProtocol())).toEqual([]);
  });

  it('returns an error when missing controllers exist', () => {
    const protocol = makeProtocol({ _missingControllerList: ['myCtrl'] });
    const errors = checkControllers(protocol);
    expect(errors.length).toBe(1);
    expect(errors[0].type).toBe('Protocol');
    expect(errors[0].error).toContain('myCtrl');
  });
});

describe('protocolHasWavFiles', () => {
  const makePage = (overrides: Partial<PageDefinition> = {}): PageDefinition =>
    ({
      id: 'page1',
      ...overrides,
    }) as PageDefinition;

  it('returns false when no pages have wav files', () => {
    const protocol = makeProtocol({ pages: [makePage(), makePage()] });
    expect(protocolHasWavFiles(protocol)).toBe(false);
  });

  it('returns true when a page has wavfiles', () => {
    const protocol = makeProtocol({ pages: [makePage({ wavfiles: [{ path: 'a.wav' }] })] });
    expect(protocolHasWavFiles(protocol)).toBe(true);
  });

  it('returns true when a page has chaWavFiles', () => {
    const protocol = makeProtocol({ pages: [makePage({ chaWavFiles: { wavfiles: [{ path: 'a.wav' }] } })] });
    expect(protocolHasWavFiles(protocol)).toBe(true);
  });

  it('returns true when a subProtocol page has wavfiles', () => {
    const subProtocol = {
      protocolId: 'sub',
      pages: [makePage({ wavfiles: [{ path: 'a.wav' }] })],
    } as ProtocolSchemaInterface;
    const protocol = makeProtocol({ pages: [], subProtocols: [subProtocol] });
    expect(protocolHasWavFiles(protocol)).toBe(true);
  });

  it('returns false for an empty wavfiles array', () => {
    const protocol = makeProtocol({ pages: [makePage({ wavfiles: [] })] });
    expect(protocolHasWavFiles(protocol)).toBe(false);
  });
});

describe('checkUnresolvedFilePaths', () => {
  it('returns empty array when no unresolved file paths exist', () => {
    expect(checkControllers(makeProtocol())).toEqual([]);
  });

  it('returns an error when unresolved file paths exist', () => {
    const protocol = makeProtocol({ _unresolvedFilePathList: ['invalid'] });
    const errors = checkUnresolvedFilePaths(protocol);
    expect(errors.length).toBe(1);
    expect(errors[0].type).toBe('Protocol');
    expect(errors[0].error).toContain('invalid');
  });
});
