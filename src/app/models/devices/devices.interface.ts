import { ConnectedDevices } from "../../interfaces/connected-devices.interface"

export interface DevicesInterface {
    build: string,
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

export interface TympanResponse {
    tabsintId: string,
    msg: string
}