import { TestBed } from '@angular/core/testing';
import { Paths } from './paths.service';
import { AppModel } from '../models/app/app.service';
import { AppInterface } from '../models/app/app.interface';

describe('Paths', () => {
  let paths: Paths;
  let mockApp: AppInterface;
  let mockAppModel: jasmine.SpyObj<AppModel>;

  beforeEach(() => {
    mockApp = { tablet: false, test: false, browser: true };
    mockAppModel = jasmine.createSpyObj('AppModel', ['getApp']);
    mockAppModel.getApp.and.returnValue(mockApp);

    TestBed.configureTestingModule({
      providers: [Paths, { provide: AppModel, useValue: mockAppModel }],
    });

    paths = TestBed.inject(Paths);
  });

  it('should be created', () => {
    expect(paths).toBeTruthy();
  });

  describe('www', () => {
    it('returns the path as-is in browser mode', () => {
      expect(paths.www('assets/audio.wav')).toBe('assets/audio.wav');
    });

    it('prepends www/ in tablet mode', () => {
      paths.app.tablet = true;
      expect(paths.www('assets/audio.wav')).toBe('www/assets/audio.wav');
    });

    it('prepends base/www/ in test mode', () => {
      paths.app.test = true;
      expect(paths.www('assets/audio.wav')).toBe('base/www/assets/audio.wav');
    });
  });

  describe('join', () => {
    it('joins path segments with a slash', () => {
      expect(paths.join('a', 'b', 'c')).toBe('a/b/c');
    });

    it('strips leading and trailing slashes from segments', () => {
      expect(paths.join('/a/', '/b/', '/c/')).toBe('a/b/c');
    });

    it('filters out empty or whitespace-only segments', () => {
      expect(paths.join('a', '', '  ', 'b')).toBe('a/b');
    });

    it('handles a single segment', () => {
      expect(paths.join('only')).toBe('only');
    });
  });
});
