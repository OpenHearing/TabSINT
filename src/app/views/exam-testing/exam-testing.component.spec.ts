import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { ExamTestingComponent } from './exam-testing.component';
import { ResponseAreaComponent } from '../response-area/response-area.component';
import { PageModel } from '../../models/page/page.service';
import { StateModel } from '../../models/state/state.service';

describe('ExamTestingComponent', () => {
  let component: ExamTestingComponent;
  let fixture: ComponentFixture<ExamTestingComponent>;
  let pageModel: PageModel;
  let stateModel: StateModel;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ExamTestingComponent, ResponseAreaComponent],
      imports: [
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ExamTestingComponent);
    component = fixture.componentInstance;
    pageModel = TestBed.inject(PageModel);
    stateModel = TestBed.inject(StateModel);
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('populates video state from the current page and renders a video element', () => {
    pageModel.updatePage({
      ...pageModel.getPage(),
      video: { path: 'example_video.mp4', width: '50%', autoplay: true, noSkip: false, _resolvedPath: 'assets/protocols/develop/example_video.mp4' },
    });
    fixture.detectChanges();

    expect(component.videoSrc).toBe('assets/protocols/develop/example_video.mp4');
    expect(component.videoWidth).toBe('50%');
    expect(component.videoAutoplay).toBeTrue();
    const videoEl = fixture.nativeElement.querySelector('video');
    expect(videoEl).toBeTruthy();
    expect(videoEl.getAttribute('src')).toBe('assets/protocols/develop/example_video.mp4');
  });

  it('disables submit for a noSkip video until it ends', () => {
    pageModel.updatePage({
      ...pageModel.getPage(),
      video: { path: 'example_video.mp4', noSkip: true, _resolvedPath: 'assets/protocols/develop/example_video.mp4' },
    });
    fixture.detectChanges();

    expect(stateModel.getState().isSubmittable).toBeFalse();

    component.onVideoEnded();

    expect(stateModel.getState().isSubmittable).toBeTrue();
  });
});
