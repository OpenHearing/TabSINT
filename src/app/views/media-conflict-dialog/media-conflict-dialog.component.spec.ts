import { ComponentFixture, TestBed } from '@angular/core/testing';
import { TranslocoTestingModule } from '@jsverse/transloco';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';

import { MediaConflictDialog, MediaConflictDialogData } from './media-conflict-dialog.component';

describe('MediaConflictDialog', () => {
  let component: MediaConflictDialog;
  let fixture: ComponentFixture<MediaConflictDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<MediaConflictDialog>>;
  const data: MediaConflictDialogData = { repository: 'my-media-repo' };

  beforeEach(async () => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    await TestBed.configureTestingModule({
      imports: [
        MediaConflictDialog,
        TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
      ],
      providers: [
        { provide: MatDialogRef, useValue: mockDialogRef },
        { provide: MAT_DIALOG_DATA, useValue: data },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(MediaConflictDialog);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });

  it('exposes the repository name for message interpolation', () => {
    expect(component.messageParams).toEqual({ repository: 'my-media-repo' });
  });

  it('closes with the skip option', () => {
    component.skip();

    expect(mockDialogRef.close).toHaveBeenCalledWith(MediaConflictDialog.OPTION_SKIP);
  });

  it('closes with the override option', () => {
    component.override();

    expect(mockDialogRef.close).toHaveBeenCalledWith(MediaConflictDialog.OPTION_OVERRIDE);
  });
});
