import { TestBed } from '@angular/core/testing';
import { GitlabService } from './gitlab.service';
import { FileService } from './file.service';

describe('GitlabService', () => {
  let gitlabService: GitlabService;
  let mockFileService: jasmine.SpyObj<FileService>;

  const host = 'https://gitlab.example.com';
  const headers = { Authorization: 'Bearer token' };

  function mockFetchResponse(status: number, data: unknown): void {
    spyOn(globalThis, 'fetch').and.resolveTo(new Response(JSON.stringify(data), { status, headers: { 'content-type': 'application/json' } }));
  }

  beforeEach(() => {
    mockFileService = jasmine.createSpyObj('FileService', ['dummyMethod']);

    TestBed.configureTestingModule({
      providers: [GitlabService, { provide: FileService, useValue: mockFileService }],
    });

    gitlabService = TestBed.inject(GitlabService);
  });

  it('should be created', () => {
    expect(gitlabService).toBeTruthy();
  });

  describe('_getGitlabProjectId', () => {
    it('should resolve the project id via the group/repository path, ignoring the display name', async () => {
      const encodedPath = encodeURIComponent('my-group/my-repo');
      mockFetchResponse(200, { id: 42, name: 'Unique Display Name', path: 'my-repo' });

      const projectId = await gitlabService['_getGitlabProjectId'](host, 'my-repo', 'my-group', headers);

      expect(projectId).toBe(42);
      expect(globalThis.fetch).toHaveBeenCalledWith(`${host}/api/v4/projects/${encodedPath}`, jasmine.anything());
    });

    it('should url-encode nested subgroup paths', async () => {
      const encodedPath = encodeURIComponent('parent-group/sub-group/my-repo');
      mockFetchResponse(200, { id: 7 });

      const projectId = await gitlabService['_getGitlabProjectId'](host, 'my-repo', 'parent-group/sub-group', headers);

      expect(projectId).toBe(7);
      expect(globalThis.fetch).toHaveBeenCalledWith(`${host}/api/v4/projects/${encodedPath}`, jasmine.anything());
    });

    it('should throw when the project cannot be found', async () => {
      const encodedPath = encodeURIComponent('my-group/missing-repo');
      mockFetchResponse(404, {});

      await expectAsync(gitlabService['_getGitlabProjectId'](host, 'missing-repo', 'my-group', headers)).toBeRejectedWithError(
        'Project not found. Check the repository path name and group: 404'
      );
      expect(globalThis.fetch).toHaveBeenCalledWith(`${host}/api/v4/projects/${encodedPath}`, jasmine.anything());
    });

    it('should throw an unauthorized error on a 401 response', async () => {
      const encodedPath = encodeURIComponent('my-group/my-repo');
      mockFetchResponse(401, {});

      await expectAsync(gitlabService['_getGitlabProjectId'](host, 'my-repo', 'my-group', headers)).toBeRejectedWithError(
        'Unauthorized: Check your GitLab credentials.'
      );
      expect(globalThis.fetch).toHaveBeenCalledWith(`${host}/api/v4/projects/${encodedPath}`, jasmine.anything());
    });
  });
});
