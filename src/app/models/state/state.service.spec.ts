import { TestBed } from '@angular/core/testing';
import { StateModel } from './state.service';

describe('StateModel', () => {
  let stateModel: StateModel;

  beforeEach(() => {
    TestBed.configureTestingModule({ providers: [StateModel] });
    stateModel = TestBed.inject(StateModel);
  });

  it('returns the current state', () => {
    expect(stateModel.getState()).toBeDefined();
  });

  it('updateState merges partial updates', () => {
    stateModel.updateState({ wifiConnected: true });
    expect(stateModel.getState().wifiConnected).toBeTrue();
  });

  it('updateState emits via subject', (done) => {
    stateModel.stateSubject.subscribe(state => {
      if (state.wifiConnected) {
        expect(state.wifiConnected).toBeTrue();
        done();
      }
    });
    stateModel.updateState({ wifiConnected: true });
  });

  it('updateWifiStatus updates wifiConnected', () => {
    stateModel.updateWifiStatus(true);
    expect(stateModel.getState().wifiConnected).toBeTrue();
    stateModel.updateWifiStatus(false);
    expect(stateModel.getState().wifiConnected).toBeFalse();
  });

  describe('setPageSubmittable', () => {
    it('is submittable when response is not required', () => {
      stateModel.updateState({ isResponseRequired: false, doesResponseExist: false });
      stateModel.setPageSubmittable();
      expect(stateModel.getState().isSubmittable).toBeTrue();
    });

    it('is submittable when response is required and exists', () => {
      stateModel.updateState({ isResponseRequired: true, doesResponseExist: true });
      stateModel.setPageSubmittable();
      expect(stateModel.getState().isSubmittable).toBeTrue();
    });

    it('is not submittable when response is required but does not exist', () => {
      stateModel.updateState({ isResponseRequired: true, doesResponseExist: false });
      stateModel.setPageSubmittable();
      expect(stateModel.getState().isSubmittable).toBeFalse();
    });
  });

  it('updatePaneOpen merges pane updates without affecting other panes', () => {
    const before = stateModel.getState().isPaneOpen.general;
    stateModel.updatePaneOpen({ appLog: true });
    const state = stateModel.getState();
    expect(state.isPaneOpen.appLog).toBeTrue();
    expect(state.isPaneOpen.general).toBe(before);
  });
});
