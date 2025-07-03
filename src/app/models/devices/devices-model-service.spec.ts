import { TestBed } from '@angular/core/testing';
import { AppModel } from '../app/app.service';
import { DiskModel } from '../disk/disk.service';
import { Logger } from '../../utilities/logger.service';
import { Subscription } from 'rxjs';
import { SqLite } from '../../utilities/sqLite.service';
import { DeviceState } from '../../utilities/constants';
import { DevicesModel } from './devices-model.service';
import { DevicesInterface } from '../../models/devices/devices.interface';
import { ConnectedDevice } from '../../interfaces/connected-device.interface';

const connectedDevices1 = {
    "tympan": [
        {
            "tabsintId": "1",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice1",
            "name": "testName1",
            "state": DeviceState.Disconnected,
            "maxByteLength": 244
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
            "state": DeviceState.Connected,
            "maxByteLength": 244
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
            "state": DeviceState.Connected,
            "maxByteLength": 244
        },
        {
            "tabsintId": "2",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Connected,
            "maxByteLength": 244
        },
        {
            "tabsintId": "3",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice3",
            "name": "testName3",
            "state": DeviceState.Connected,
            "maxByteLength": 244
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
            "state": DeviceState.Connected,
            "maxByteLength": 244
        },
        {
            "tabsintId": "2",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Disconnected,
            "maxByteLength": 244
        },
        {
            "tabsintId": "3",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice3",
            "name": "testName3",
            "state": DeviceState.Connected,
            "maxByteLength": 244
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
            "state": DeviceState.Connected,
            "maxByteLength": 244
        },
        {
            "tabsintId": "2",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Disconnected,
            "maxByteLength": 244
        },
        {
            "tabsintId": "3",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice3",
            "name": "testName3",
            "state": DeviceState.Connected,
            "maxByteLength": 244
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
            "state": DeviceState.Connected,
            "maxByteLength": 244
        },
        {
            "tabsintId": "2",
            "type": "tympan",
            "msgId": 2,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Disconnected,
            "maxByteLength": 244
        },
        {
            "tabsintId": "3",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice3",
            "name": "testName3",
            "state": DeviceState.Connected,
            "maxByteLength": 244
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
            "state": DeviceState.Connected,
            "maxByteLength": 244
        },
        {
            "tabsintId": "2",
            "type": "tympan",
            "msgId": 99,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Disconnected,
            "maxByteLength": 244
        },
        {
            "tabsintId": "3",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice3",
            "name": "testName3",
            "state": DeviceState.Connected,
            "maxByteLength": 244
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
            "state": DeviceState.Connected,
            "maxByteLength": 244
        },
        {
            "tabsintId": "2",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Disconnected,
            "maxByteLength": 244
        },
        {
            "tabsintId": "3",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice3",
            "name": "testName3",
            "state": DeviceState.Connected,
            "maxByteLength": 244
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
            "state": DeviceState.Disconnected,
            "maxByteLength": 244
        },
        {
            "tabsintId": "2",
            "type": "tympan",
            "msgId": 1,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Connected,
            "maxByteLength": 244
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
            "state": DeviceState.Connected,
            "maxByteLength": 244
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
            "serialNumber": "7114",
            "maxByteLength": 244
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
    "msgId": 1,
    "maxByteLength": 244
};

const connection2: ConnectedDevice = {
    "type": "tympan",
    "tabsintId": "4",
    "deviceId": "testDevice4",
    "name": "testName4",
    "state": DeviceState.Connected,
    "msgId": 1,
    "maxByteLength": 244
};

describe('deviceUtil', () => {
    let appModel: AppModel;
    let diskModel: DiskModel;
    let sqLite: SqLite;
    let logger: Logger;
    let devices: DevicesInterface | undefined;
    let devicesModel: DevicesModel;
    let deviceModelSubscription: Subscription;

    beforeEach( async () => {
        TestBed.configureTestingModule({})
        appModel = new AppModel;
        diskModel = new DiskModel(new Document);
        sqLite = new SqLite(appModel, diskModel);
        logger = new Logger(diskModel, sqLite);
        devices = undefined;
        devicesModel = new DevicesModel(logger);
        deviceModelSubscription = devicesModel.devicesModel$.subscribe( (value: DevicesInterface) => {
            devices = value;
        })
    })

    afterEach(() => {
        deviceModelSubscription.unsubscribe();
    });

    it('updating device state but without changing the state', () => {
        connectedDevices1.tympan.forEach(device => {
            devicesModel.addTympanConnectedDevice(device)
        }); 
        let wasDeviceStateUpdated = devicesModel.updateDeviceState("testDevice1", DeviceState.Disconnected);
        expect(wasDeviceStateUpdated).toBe(true);
        expect(devices?.connectedDevices).toEqual(connectedDevices1);
    })

    it('updating device state', () => {
        connectedDevices2.tympan.forEach(device => {
            devicesModel.addTympanConnectedDevice(device)
        }); 
        let wasDeviceStateUpdated = devicesModel.updateDeviceState("testDevice1", DeviceState.Disconnected);
        expect(wasDeviceStateUpdated).toBe(true);
        expect(devices?.connectedDevices).toEqual(connectedDevices1);
    })

    it('updating device state with multiple connections', () => {
        connectedDevices3.tympan.forEach(device => {
            devicesModel.addTympanConnectedDevice(device)
        }); 
        let wasDeviceStateUpdated = devicesModel.updateDeviceState("testDevice2", DeviceState.Disconnected);
        expect(wasDeviceStateUpdated).toBe(true);
        expect(devices?.connectedDevices).toEqual(connectedDevices4);
    })

    it('incrementing tympan msg id', () => {
        connectedDevices5.tympan.forEach(device => {
            devicesModel.addTympanConnectedDevice(device)
        }); 
        devicesModel.incrementDeviceMsgId("testDevice2");
        expect(devices?.connectedDevices).toEqual(connectedDevices6);
    })

    it('incrementing tympan msg id', () => {
        connectedDevices7.tympan.forEach(device => {
            devicesModel.addTympanConnectedDevice(device)
        }); 
        devicesModel.incrementDeviceMsgId("testDevice2");
        expect(devices?.connectedDevices).toEqual(connectedDevices8);
    })

    it('removing device from saved devices', () => {
        let deviceToRemove: ConnectedDevice = {
            "type": "tympan",
            "tabsintId": "2",
            "msgId": 1,
            "deviceId": "testDevice2",
            "name": "testName2",
            "state": DeviceState.Connected,
            "maxByteLength": 244

        };
        connectedDevices9.tympan.forEach(device => {
            devicesModel.addTympanConnectedDevice(device)
        }); 
        let wasDeviceRemoved = devicesModel.removeDevice(deviceToRemove);
        expect(wasDeviceRemoved).toBe(true);
        expect(devices?.connectedDevices).toEqual(connectedDevices1);
    })

    it('updating device info', () => {
        let tabsintId = "1";
        let info = {
            "description": "description would be here",
            "buildDateTime": "this is a datetime",
            "serialNumber": "7114"
        };
        connectedDevices10.tympan.forEach(device => {
            devicesModel.addTympanConnectedDevice(device)
        }); 
        let wasDeviceInfoUpdated = devicesModel.updateDeviceInfo(tabsintId, info);
        expect(wasDeviceInfoUpdated).toBe(true);
        expect(devices?.connectedDevices).toEqual(connectedDevices11);
    })
})