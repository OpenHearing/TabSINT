import { ConnectedDevices } from "../../interfaces/connected-devices.interface"

export interface DevicesInterface {
    build: string,
    protocolId: string,
    uuid: string,
    // tabsintUUID: string,
    version: string,
    platform: string,
    model: string,
    os: string,
    other: string,
    diskspace: string,
    connectedDevices: ConnectedDevices
}

export interface DeviceResponse {
    tabsintId: string,
    msg: string
}