import { TestBed } from '@angular/core/testing';
import { Subject } from 'rxjs';

import { DiskModel } from '../models/disk/disk.service';
import { Logger } from '../services/logger.service';
import { EncryptResultsService } from '../utilities/encrypt-results.service';
import { ResultsUploadService } from './results-upload.service';

describe('ResultsUploadService.ensureResultsRepo', () => {
  let service: ResultsUploadService;
  let getSpy: jasmine.Spy;
  let postSpy: jasmine.Spy;

  const resp = (status: number, data: unknown = {}) => Promise.resolve({ status, data, headers: {}, url: '' });

  beforeEach(() => {
    const diskModel = jasmine.createSpyObj('DiskModel', ['getDisk', 'updateDiskModel'], { diskSubject: new Subject() });
    diskModel.getDisk.and.returnValue({ uploadSummary: [] });
    TestBed.configureTestingModule({
      providers: [
        { provide: DiskModel, useValue: diskModel },
        { provide: EncryptResultsService, useValue: {} },
        { provide: Logger, useValue: jasmine.createSpyObj('Logger', ['debug', 'error']) },
      ],
    });
    service = TestBed.inject(ResultsUploadService);
    getSpy = jasmine.createSpy('get');
    postSpy = jasmine.createSpy('post');
    // CapacitorHttp is a plugin proxy that can't be spied on, so stub the fetch its web implementation uses.
    spyOn(window, 'fetch').and.callFake(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = input.toString();
      const isPost = init?.method?.toUpperCase() === 'POST';
      const { status, data } = await (isPost ? postSpy({ url, data: init?.body }) : getSpy({ url }));
      return new Response(JSON.stringify(data), { status, headers: { 'Content-Type': 'application/json' } });
    });
  });

  it('returns the existing results repo looked up by path, including for subgroups', async () => {
    getSpy.and.returnValue(resp(200, { id: 7, default_branch: 'main' }));

    const repo = await service.ensureResultsRepo('https://gl.test/', 'tok', 'parent/AMV-Practice');

    expect(repo).toEqual({ id: 7, default_branch: 'main' });
    expect(getSpy.calls.mostRecent().args[0].url).toBe('https://gl.test/api/v4/projects/parent%2FAMV-Practice%2Fresults');
    expect(postSpy).not.toHaveBeenCalled();
  });

  it('creates the results repo in the group when it does not exist', async () => {
    getSpy.and.returnValues(resp(404), resp(200, { id: 3 }));
    postSpy.and.returnValue(resp(201, { id: 9, default_branch: 'main' }));

    const repo = await service.ensureResultsRepo('https://gl.test', 'tok', 'AMV-Practice');

    expect(repo.id).toBe(9);
    expect(JSON.parse(postSpy.calls.mostRecent().args[0].data).namespace_id).toBe(3);
  });

  it('reports a missing group when neither the repo nor the group exists', async () => {
    getSpy.and.returnValues(resp(404), resp(404));

    await expectAsync(service.ensureResultsRepo('https://gl.test', 'tok', 'nope')).toBeRejectedWithError(/Group 'nope' not found/);
  });

  it('reports unauthorized on 401', async () => {
    getSpy.and.returnValue(resp(401));

    await expectAsync(service.ensureResultsRepo('https://gl.test', 'tok', 'g')).toBeRejectedWithError(/Unauthorized/);
  });

  it('explains the token scope requirement on 403', async () => {
    getSpy.and.returnValue(resp(403));

    await expectAsync(service.ensureResultsRepo('https://gl.test', 'tok', 'g')).toBeRejectedWithError(/'api' scope/);
  });
});
