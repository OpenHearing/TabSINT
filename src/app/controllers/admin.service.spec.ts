import { TestBed } from '@angular/core/testing';
import { Router } from '@angular/router';
import { MatDialog, MatDialogRef } from '@angular/material/dialog';
import { Subject } from 'rxjs';
import { AdminService } from './admin.service';
import { DiskModel } from '../models/disk/disk.service';

describe('AdminService', () => {
  let adminService: AdminService;
  let dialogSpy: jasmine.SpyObj<MatDialog>;
  let routerSpy: jasmine.SpyObj<Router>;
  let diskModel: DiskModel;
  let pinValidated$: Subject<boolean>;

  beforeEach(() => {
    pinValidated$ = new Subject<boolean>();

    const mockDialogRef = {
      componentInstance: {
        setValidationMode: jasmine.createSpy('setValidationMode'),
        pinValidated: pinValidated$,
      },
    } as unknown as MatDialogRef<unknown>;

    dialogSpy = jasmine.createSpyObj('MatDialog', ['open']);
    dialogSpy.open.and.returnValue(mockDialogRef);
    routerSpy = jasmine.createSpyObj('Router', ['navigate']);

    TestBed.configureTestingModule({
      providers: [AdminService, DiskModel, { provide: MatDialog, useValue: dialogSpy }, { provide: Router, useValue: routerSpy }],
    });

    adminService = TestBed.inject(AdminService);
    diskModel = TestBed.inject(DiskModel);
  });

  it('opens PIN dialog when debug mode is off', () => {
    diskModel.updatePreferences({ debugMode: false });
    adminService.onAdminViewClick();
    expect(dialogSpy.open).toHaveBeenCalled();
  });

  it('sets PIN dialog to validation mode', () => {
    diskModel.updatePreferences({ debugMode: false });
    adminService.onAdminViewClick();
    const componentInstance = dialogSpy.open.calls.mostRecent().returnValue.componentInstance as {
      setValidationMode: jasmine.Spy;
    };
    expect(componentInstance.setValidationMode).toHaveBeenCalledWith(true);
  });

  it('navigates to /admin after PIN is validated', () => {
    diskModel.updatePreferences({ debugMode: false });
    adminService.onAdminViewClick();
    pinValidated$.next(true);
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
  });

  it('does not navigate when PIN validation fails', () => {
    diskModel.updatePreferences({ debugMode: false });
    adminService.onAdminViewClick();
    pinValidated$.next(false);
    expect(routerSpy.navigate).not.toHaveBeenCalled();
  });

  it('navigates directly to /admin when debug mode is on', () => {
    diskModel.updatePreferences({ debugMode: true });
    adminService.onAdminViewClick();
    expect(dialogSpy.open).not.toHaveBeenCalled();
    expect(routerSpy.navigate).toHaveBeenCalledWith(['/admin']);
  });
});
