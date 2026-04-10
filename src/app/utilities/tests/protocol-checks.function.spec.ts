import { checkCalibrationFiles, checkControllers } from '../protocol-checks.function';
import { ProtocolInterface } from '../../models/protocol/protocol.interface';
import { ProtocolServer } from '../constants';

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
