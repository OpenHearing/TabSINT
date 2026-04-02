import { TestBed } from '@angular/core/testing';
import { AppComponent } from './app.component';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { RouterOutlet } from '@angular/router';
import { TasksBannerComponent } from './views/tasks-banner/tasks-banner.component';

describe('AppComponent', () => {
  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AppComponent, TasksBannerComponent],
      imports: [
        RouterOutlet,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it(`should have the 'tabsint' title`, () => {
    const fixture = TestBed.createComponent(AppComponent);
    const app = fixture.componentInstance;
    expect(app.title).toEqual('tabsint');
  });
});
