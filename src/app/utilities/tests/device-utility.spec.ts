import { TestBed } from '@angular/core/testing';
import { DeviceUtil } from '../device-utility';
import { AppModel } from '../../models/app/app.service';
import { DiskModel } from '../../models/disk/disk.service';
import { SqLite } from '../sqLite.service';
import { Logger } from '../logger.service';
import { DevicesModel } from '../../models/devices/devices-model.service';
import { DeviceState } from '../constants';
import { ConnectedDevice, NewConnectedDevice } from '../../interfaces/connected-device.interface';
import { PendingMsgInfo } from '../../controllers/devices/tympan.service';
import { TympanResponse } from '../../models/devices/devices.interface';

const connectedDevices1 = {
    "tympan": [
        {
            "tabsintId": "1",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Disconnected
        }
    ],
    "cha": [],
    "svantek": []
}

const connectedDevices2 = {
    "tympan": [
        {
            "tabsintId": "1",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Connected
        }
    ],
    "cha": [],
    "svantek": []
}

const connectedDevices3 = {
    "tympan": [
        {
            "tabsintId": "1",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Connected
        },
        {
            "tabsintId": "2",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Connected
        },
        {
            "tabsintId": "3",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice3",
            "name": "testName3",
            "state": DeviceState.Connected
        }
    ],
    "cha": [],
    "svantek": []
}

const connectedDevices4 = {
    "tympan": [
        {
            "tabsintId": "1",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Connected
        },
        {
            "tabsintId": "2",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Disconnected
        },
        {
            "tabsintId": "3",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice3",
            "name": "testName3",
            "state": DeviceState.Connected
        }
    ],
    "cha": [],
    "svantek": []
}

const connectedDevices5 = {
    "tympan": [
        {
            "tabsintId": "1",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Connected
        },
        {
            "tabsintId": "2",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Disconnected
        },
        {
            "tabsintId": "3",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice3",
            "name": "testName3",
            "state": DeviceState.Connected
        }
    ],
    "cha": [],
    "svantek": []
}

const connectedDevices6 = {
    "tympan": [
        {
            "tabsintId": "1",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Connected
        },
        {
            "tabsintId": "2",
            "type": "tympan",
            "msgId": 2,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Disconnected
        },
        {
            "tabsintId": "3",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice3",
            "name": "testName3",
            "state": DeviceState.Connected
        }
    ],
    "cha": [],
    "svantek": []
}

const connectedDevices7 = {
    "tympan": [
        {
            "tabsintId": "1",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Connected
        },
        {
            "tabsintId": "2",
            "type": "tympan",
            "msgId": 99,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Disconnected
        },
        {
            "tabsintId": "3",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice3",
            "name": "testName3",
            "state": DeviceState.Connected
        }
    ],
    "cha": [],
    "svantek": []
}

const connectedDevices8 = {
    "tympan": [
        {
            "tabsintId": "1",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Connected
        },
        {
            "tabsintId": "2",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Disconnected
        },
        {
            "tabsintId": "3",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice3",
            "name": "testName3",
            "state": DeviceState.Connected
        }
    ],
    "cha": [],
    "svantek": []
}

const connectedDevices9 = {
    "tympan": [
        {
            "tabsintId": "1",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Disconnected
        },
        {
            "tabsintId": "2",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Connected
        }
    ],
    "cha": [],
    "svantek": []
}

const connectedDevices10 = {
    "tympan": [
        {
            "tabsintId": "1",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Connected
        }
    ],
    "cha": [],
    "svantek": []
}

const connectedDevices11 = {
    "tympan": [
        {
            "tabsintId": "1",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Connected,
            "description": "description would be here",
            "buildDateTime": "this is a datetime",
            "serialNumber": "7114"
        }
    ],
    "cha": [],
    "svantek": []
}

const connection1: ConnectedDevice = {
    "type": "tympan",
    "tabsintId": "2",
    "deviceId": "testDevice2",
    "name": "testName2",
    "state": DeviceState.Connected,
    "msgId": 1
};

const connection2: ConnectedDevice = {
    "type": "tympan",
    "tabsintId": "4",
    "deviceId": "testDevice4",
    "name": "testName4",
    "state": DeviceState.Connected,
    "msgId": 1
};

describe('deviceUtil', () => {
    let deviceUtil: DeviceUtil;
    let appModel: AppModel;
    let diskModel: DiskModel;
    let sqLite: SqLite;
    let logger: Logger;
    let devicesModel: DevicesModel;

    beforeEach( async () => {
        TestBed.configureTestingModule({})
        appModel = new AppModel;
        diskModel = new DiskModel(new Document);
        sqLite = new SqLite(appModel, diskModel);
        logger = new Logger(diskModel, sqLite);
        devicesModel = new DevicesModel(logger);
        deviceUtil = new DeviceUtil(devicesModel, diskModel);
    })

    it('updating device state but without changing the state', () => {
        devicesModel.devicesModel.connectedDevices = connectedDevices1;
        let wasDeviceStateUpdated = deviceUtil.updateDeviceState("testDevice1", DeviceState.Disconnected);
        expect(wasDeviceStateUpdated).toBe(true);
        expect(devicesModel.devicesModel.connectedDevices).toEqual(connectedDevices1);
    })

    it('updating device state', () => {
        devicesModel.devicesModel.connectedDevices = connectedDevices2;
        let wasDeviceStateUpdated = deviceUtil.updateDeviceState("testDevice1", DeviceState.Disconnected);
        expect(wasDeviceStateUpdated).toBe(true);
        expect(devicesModel.devicesModel.connectedDevices).toEqual(connectedDevices1);
    })

    it('updating device state with multiple connections', () => {
        devicesModel.devicesModel.connectedDevices = connectedDevices3;
        let wasDeviceStateUpdated = deviceUtil.updateDeviceState("testDevice2", DeviceState.Disconnected);
        expect(wasDeviceStateUpdated).toBe(true);
        expect(devicesModel.devicesModel.connectedDevices).toEqual(connectedDevices4);
    })

    it('get new tabsint id without multiple connections', () => {
        devicesModel.devicesModel.connectedDevices = connectedDevices1;
        let nextFreeId = deviceUtil.getNextFreeTabsintId();
        expect(nextFreeId).toBe("2");
    })

    it('get new tabsint id with multiple connections', () => {
        devicesModel.devicesModel.connectedDevices = connectedDevices4;
        let nextFreeId = deviceUtil.getNextFreeTabsintId();
        expect(nextFreeId).toBe("4");
    })

    it('create new device connection without existing connections', () => {
        let newConnection: NewConnectedDevice = {
            "type": "tympan"
        };
        newConnection["deviceId"] = "testDevice2";
        newConnection["name"] = "testName2";
        devicesModel.devicesModel.connectedDevices = connectedDevices1;
        let connection = deviceUtil.createDeviceConnection(newConnection);
        expect(connection).toEqual(connection1);
    })

    it('create new device connection with existing connections', () => {
        let newConnection: NewConnectedDevice = {
            "type": "tympan"
        };
        newConnection["deviceId"] = "testDevice4";
        newConnection["name"] = "testName4";
        devicesModel.devicesModel.connectedDevices = connectedDevices4;
        let connection = deviceUtil.createDeviceConnection(newConnection);
        expect(connection).toEqual(connection2);
    })

    it('incrementing tympan msg id', () => {
        devicesModel.devicesModel.connectedDevices = connectedDevices5;
        deviceUtil.incrementDeviceMsgId("testDevice2");
        expect(devicesModel.devicesModel.connectedDevices).toEqual(connectedDevices6);
    })

    it('incrementing tympan msg id', () => {
        devicesModel.devicesModel.connectedDevices = connectedDevices7;
        deviceUtil.incrementDeviceMsgId("testDevice2");
        expect(devicesModel.devicesModel.connectedDevices).toEqual(connectedDevices8);
    })

    it('checking the tympan response', () => {
        let expectedMsgInfo1: PendingMsgInfo = {
            "tabsintId": 1,
            "msgId": "5"
        };
        let expectedMsgInfo2: PendingMsgInfo = {
            "tabsintId": 1,
            "msgId": "2"
        };
        let tympanResponse: TympanResponse = {
            "tabsintId": "1",
            "msg": "[-2,\"OK\"]"
        };
        let resp1 = deviceUtil.checkTympanResponse(expectedMsgInfo1, tympanResponse);
        let resp2 = deviceUtil.checkTympanResponse(expectedMsgInfo2, tympanResponse);
        expect(resp1).toEqual(false);
        expect(resp2).toEqual(true);
    })

    it('removing device from saved devices', () => {
        let deviceToRemove: ConnectedDevice = {
            "type": "tympan",
            "tabsintId": "2",
            "msgId": 1,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Connected

        };
        devicesModel.devicesModel.connectedDevices = connectedDevices9;
        let wasDeviceRemoved = deviceUtil.removeDevice(deviceToRemove);
        expect(wasDeviceRemoved).toBe(true);
        expect(devicesModel.devicesModel.connectedDevices).toEqual(connectedDevices1);
    })

    it('getting tabsint id from device id', () => {
        let deviceID = "testDevice1";
        devicesModel.devicesModel.connectedDevices = connectedDevices1;
        let tabsintId = deviceUtil.getTabsintIdFromDeviceId(deviceID);
        expect(tabsintId).toBe("1");
    })

    it('getting device from device id', () => {
        let deviceID = "testDevice1";
        let expectedDevice: ConnectedDevice = {
            "type": "tympan",
            "tabsintId": "1",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Disconnected

        };
        devicesModel.devicesModel.connectedDevices = connectedDevices1;
        let device = deviceUtil.getDeviceFromDeviceId(deviceID);
        expect(device).toEqual(expectedDevice);
    })

    it('getting device from tabsint id', () => {
        let tabsintId = "1";
        let expectedDevice: ConnectedDevice = {
            "type": "tympan",
            "tabsintId": "1",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Disconnected

        };
        devicesModel.devicesModel.connectedDevices = connectedDevices1;
        let device = deviceUtil.getDeviceFromTabsintId(tabsintId);
        expect(device).toEqual(expectedDevice);
    })

    it('updating device info', () => {
        let tabsintId = "1";
        let info = {
            "description": "description would be here",
            "buildDateTime": "this is a datetime",
            "serialNumber": "7114"
        };
        devicesModel.devicesModel.connectedDevices = connectedDevices10;
        let wasDeviceInfoUpdated = deviceUtil.updateDeviceInfo(tabsintId, info);
        expect(wasDeviceInfoUpdated).toBe(true);
        expect(devicesModel.devicesModel.connectedDevices).toEqual(connectedDevices11);
    })

    it('adding new saved device', () => {
        let newDevice: ConnectedDevice = {
            "type": "tympan",
            "tabsintId": "1",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Disconnected

        };
        let expectedSavedDevices = {
            "tympan": [
                {
                    "tabsintId": "1",
                    "name": "testName1",
                    "deviceId": "testDevice1"
                }
            ], 
            "cha": [], "svantek": []
        };
        deviceUtil.addNewSavedDevice(newDevice);
        expect(diskModel.disk.savedDevices).toEqual(expectedSavedDevices);
    })

    

})