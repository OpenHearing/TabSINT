import { TestBed } from '@angular/core/testing';
import { Notifications } from './notifications.service';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { DialogDataInterface } from '../interfaces/dialog-data.interface';
import { DialogType } from '../utilities/constants';
import { of } from 'rxjs';

describe('Notifications', () => {
  let notifications: Notifications;
  let mockDialog: jasmine.SpyObj<MatDialog>;
  let mockDialogRef: jasmine.SpyObj<MatDialogRef<unknown>>;

  beforeEach(() => {
    mockDialogRef = jasmine.createSpyObj('MatDialogRef', ['afterClosed']);
    mockDialogRef.afterClosed.and.returnValue(of('OK'));

    mockDialog = jasmine.createSpyObj('MatDialog', ['open']);
    mockDialog.open.and.returnValue(mockDialogRef as MatDialogRef<unknown>);

    TestBed.configureTestingModule({
      providers: [Notifications, { provide: MatDialog, useValue: mockDialog }],
    });

    notifications = TestBed.inject(Notifications);
  });

  it('should be created', () => {
    expect(notifications).toBeTruthy();
  });

  it('opens a dialog with the provided data', () => {
    const data: DialogDataInterface = { title: 'Test', content: 'Hello', type: DialogType.Alert };
    notifications.alert(data);
    expect(mockDialog.open).toHaveBeenCalledWith(jasmine.any(Function), { data });
  });

  it('returns an observable that emits the dialog result', done => {
    const data: DialogDataInterface = { title: 'Test', content: 'Hello', type: DialogType.Alert };
    notifications.alert(data).subscribe(result => {
      expect(result).toBe('OK');
      done();
    });
  });
});
