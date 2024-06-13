import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SingleResultModalComponent } from './single-result-modal.component';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { NgxJsonViewerModule } from 'ngx-json-viewer';

describe('SingleResultModalComponent', () => {
  let component: SingleResultModalComponent;
  let fixture: ComponentFixture<SingleResultModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [SingleResultModalComponent],
      imports:[MatDialogModule, NgxJsonViewerModule],
      providers: [
        { provide: MAT_DIALOG_DATA, useValue: {} },
        { provide: MatDialogRef, useValue: {} },
      ]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(SingleResultModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
