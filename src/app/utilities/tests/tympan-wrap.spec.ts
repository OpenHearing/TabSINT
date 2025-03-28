import { TestBed } from '@angular/core/testing';
import { TympanWrap } from "../tympan-wrap.service";
import { StateModel } from '../../models/state/state.service';
import { DiskModel } from '../../models/disk/disk.service';
import { AppModel } from '../../models/app/app.service';
import { SqLite } from '../sqLite.service';
import { Logger } from '../logger.service';
import { DevicesModel } from '../../models/devices/devices-model.service';
import { DeviceUtil } from '../device-utility';

const msg: string = '[1,"requestId"]';
const DataView1: DataView = new DataView((new Uint8Array([5,91,49,44,34,114,101,113,117,101,115,116,73,100,34,93,3,143,2])).buffer);
const DataView2: DataView = new DataView((new Uint8Array([91,49,44,34,114,101,113,117,101,115,116,73,100,34,93])).buffer);
const bytes1: Uint8Array = new Uint8Array([15]);
const bytes_1_escaped: Uint8Array = new Uint8Array([3,143]);
const bytes2: Uint8Array = new Uint8Array([3,143]);
const bytes_2_unescaped: Uint8Array = new Uint8Array([15]);

describe('tympanWrap', () => {
    let appModel: AppModel;
    let diskModel: DiskModel;
    let sqLite: SqLite;
    let logger: Logger;
    let devicesModel: DevicesModel;
    let tympanWrap: TympanWrap;

    beforeEach( async () => {
        TestBed.configureTestingModule({})

        appModel = new AppModel;
        diskModel = new DiskModel(new Document);
        sqLite = new SqLite(appModel, diskModel);
        logger = new Logger(diskModel, sqLite);
        devicesModel = new DevicesModel(logger);
        tympanWrap = new TympanWrap(
            new StateModel(),
            window,
            logger,
            new DevicesModel(logger),
            new DeviceUtil(devicesModel, diskModel)
        );
    })

    it('msgToDataView', () => {
        // @ts-expect-error
        let msg_to_write = tympanWrap.msgToDataView(msg);
        expect(new Uint8Array(msg_to_write.buffer)).toEqual(new Uint8Array(DataView1.buffer));
    })

    it('dataViewToString', () => {
        // @ts-expect-error
        let msg_resp = tympanWrap.dataViewToString(DataView2);
        expect(msg_resp).toMatch(msg);
    })

    it('handleEscaping', () => {
        // @ts-expect-error
        let escaped_bytes = tympanWrap.handleEscaping(bytes1);
        expect(escaped_bytes).toEqual(bytes_1_escaped);
    })

    it('handleUnescaping', () => {
        // @ts-expect-error
        let unescaped_bytes = tympanWrap.handleUnescaping(bytes2);
        expect(unescaped_bytes).toEqual(bytes_2_unescaped);
    })

    it('genCRC8Checksum', () => {
        // @ts-expect-error
        let crc = tympanWrap.genCRC8Checksum(new Uint8Array(DataView2.buffer));
        expect(crc).toEqual(new Uint8Array([15]));
    })

})