import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';

import { GitlabFormComponent } from './gitlab-form.component';
import { MatMenuModule } from '@angular/material/menu';
import { FormsModule } from '@angular/forms';

describe('GitlabFormComponent', () => {
  let component: GitlabFormComponent;
  let fixture: ComponentFixture<GitlabFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [GitlabFormComponent],
      imports: [
        FormsModule,
        MatMenuModule,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(GitlabFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
