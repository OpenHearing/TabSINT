import { BluetoothType, ChaDeviceType, DialogType } from '../../utilities/constants';
import { Logger } from '../logger.service';
import { IDeviceResponse } from '../../interfaces/devices/device-response.interface';
import { isValidDeviceResponse } from '../../guards/type.guard';
import { inject } from '@angular/core';
import { Directory, FileInfo, Filesystem } from '@capacitor/filesystem';
import { ChaAdapter } from './cha-adapter';
import { calculateCRC32, str2arr } from '../../utilities/checksums';
import { Notifications } from '../notifications.service';
import { TranslocoService } from '@jsverse/transloco';
import { DiskModel } from '../../models/disk/disk.service';
import { Tasks } from '../tasks.service';

/**
 * CHA supporting class which handles logic for media transferring device adapter.
 */
export class ChaMediaHandler {
  private readonly logger = inject(Logger);
  private readonly notifications = inject(Notifications);
  private readonly transloco = inject(TranslocoService);
  private readonly diskModel = inject(DiskModel);
  private readonly tasks = inject(Tasks);
  private readonly adapter: ChaAdapter;

  constructor(adapter: ChaAdapter) {
    this.adapter = adapter;
  }

  /**
   * Set of device identifiers which are conducting a file transfer, if a device is not in this set it should not be transferring.
   */
  protected readonly fileTransferDevices: Set<string> = new Set<string>();

  /**
   * Sync a remote directory to match a local directory.
   * This function syncs a remote directory to match a local directory handling deletes, additions, etc.
   *
   * @param device The device to transfer files to.
   * @param localDirectory The directory to sync from.
   * @param remoteDirectory The directory to sync to.
   * @returns The device response for the request or undefined.
   */
  async syncRemoteToLocalDirectory(device: ChaDeviceType, localDirectory: string, remoteDirectory: string): Promise<IDeviceResponse> {
    const mutableLists = {
      equalDirList: [] as string[],
      equalFileList: [] as string[],
      deleteList: [] as string[],
      deleteDirectoryList: [] as string[],
      transferList: [] as {
        remotePath: string;
        localPath: string;
        fileSize: number;
      }[],
    };

    let deviceResponse = this.adapter.defaultInvalidResponse(device);
    this.fileTransferDevices.add(device.deviceId);
    try {
      const syncSuccess = await this.recursivelySync(device, localDirectory, localDirectory, remoteDirectory, mutableLists);
      if (syncSuccess) {
        this.logger.debug('Cha Media Repo File Sync Ready for File Operations!');
        this.logger.debug('Files to Delete from CHA:');
        this.logger.debug(JSON.stringify(mutableLists.deleteList));
        this.logger.debug('Directories to Delete from CHA:');
        this.logger.debug(JSON.stringify(mutableLists.deleteDirectoryList));
        this.logger.debug('Files to transfer to CHA:');
        this.logger.debug(JSON.stringify(mutableLists.transferList));
        this.logger.debug('Files equivalent on CHA:');
        this.logger.debug(JSON.stringify(mutableLists.equalFileList));
        this.logger.debug('Directories equivalent on CHA:');
        this.logger.debug(JSON.stringify(mutableLists.equalDirList));

        const deleteFilesSuccess = await this.deleteFiles(device, mutableLists.deleteList);
        const deleteSuccess = deleteFilesSuccess && (await this.deleteDirectories(device, mutableLists.deleteDirectoryList));
        const transferSuccess = deleteSuccess && (await this.writeFiles(device, mutableLists.transferList));

        if (transferSuccess) {
          deviceResponse = { deviceId: device.deviceId, msg: ['SyncRemote', 'success'] };
        } else if (!deleteSuccess) {
          this.logger.error('Transfer failed, unable to delete the expected files/directories.');
        } else {
          this.logger.error('Transfer failed, unable to write the expected files.');
        }
      }
    } finally {
      this.fileTransferDevices.delete(device.deviceId);
    }
    return deviceResponse;
  }

  /**
   * Recursively transfer files to a directory.
   * @param device The device to transfer files to.
   * @param currentPath The current file path.
   * @param localDirectory The directory to sync from.
   * @param remoteDirectory The directory to sync to.
   * @param mutableLists The mutable lists to change during recursion.
   * @returns True if successful, false otherwise.
   */
  private async recursivelySync(
    device: ChaDeviceType,
    currentPath: string,
    localDirectory: string,
    remoteDirectory: string,
    mutableLists: {
      equalDirList: string[];
      equalFileList: string[];
      deleteList: string[];
      deleteDirectoryList: string[];
      transferList: {
        remotePath: string;
        localPath: string;
        fileSize: number;
      }[];
    }
  ): Promise<boolean> {
    if (!this.fileTransferDevices.has(device.deviceId)) {
      // File transfer was cancelled do not continue to recurse
      this.logger.debug('CHA media sync breaking recursion chain because sync has been cancelled, probably by the user.');
      return false;
    }

    const isAdmin = !remoteDirectory.toUpperCase().includes('USER');
    let chaDirectories: { path: string; attributes: number }[] = [];
    let chaFiles: { path: string; attributes: number }[] = [];
    let chaDirCrcs: { path: string; attributes: number }[] = [];
    let chaCrcs: { path: string; attributes: number }[] = [];
    const tabletDirectories = [];

    // Replace the tablet portion of path with the remote portion, transition to upper case so everything matches the cha directory structure
    const chaDirectoryName = currentPath.replace(localDirectory, remoteDirectory).toUpperCase().replace(/\/+/g, '/');
    const userRelativeDirectory = chaDirectoryName.replace(/^USER\//i, '');

    const response = await this.adapter.getDirectory(device, chaDirectoryName, 0x6000); // root level, CRC flags

    if (!isValidDeviceResponse(response)) {
      this.logger.debug('Failed to get the current directory.');
      return false;
    }

    // Make the directories and file CRC lists at the current level
    const entries: { path: string; attributes: number }[] = (response as any)['msg'][1];
    if (entries.length > 0) {
      chaCrcs = entries.filter(function (entry) {
        return entry.attributes !== undefined && !(entry.attributes & 16);
      });
      chaDirCrcs = entries.filter(function (entry) {
        return entry.attributes !== undefined && entry.attributes & 16;
      });
    } else {
      const response = await this.adapter.makeDirectory(device, chaDirectoryName, 0x2000);
      if (!isValidDeviceResponse(response)) {
        this.logger.debug('Failed to make the directory for the current level on the device.');
        return false;
      }
    }

    // Grab all directories and files which aren't in the media repository for deletion. We need names not CRCs for this.
    // These should be deleted unless at the USER level or ROOT level.
    const isUserDirectory = chaDirectoryName.toUpperCase().endsWith('USER') || chaDirectoryName.toUpperCase().endsWith('USER/');
    const isAdminDirectory = isAdmin && !chaDirectoryName.toUpperCase().includes('USER');
    if (!isAdminDirectory && !isUserDirectory) {
      const response = await this.adapter.getDirectory(device, userRelativeDirectory); // user level
      if (isValidDeviceResponse(response)) {
        const entries: { path: string; attributes: number }[] = (response as any)['msg'][1];
        if (entries.length > 0) {
          chaFiles = entries.filter(function (entry) {
            return entry.attributes !== undefined && !(entry.attributes & 16);
          });
          chaDirectories = entries.filter(function (entry) {
            return entry.attributes !== undefined && entry.attributes & 16;
          });
        } else {
          chaDirectories = [];
          chaFiles = [];
        }
      } else {
        this.logger.debug('Failed to get the directory to delete at current level.');
        return false;
      }
    }

    const fileInfos = await this.getDirectoryShallow(currentPath);
    for (const info of fileInfos) {
      // this is why we needed the root definition
      const chaTarget = this.joinPath(chaDirectoryName, info.name);
      if (info.type === 'directory') {
        const targetBuffer = str2arr(chaTarget.toUpperCase());
        const dirCrc = calculateCRC32(targetBuffer).toString(16).toUpperCase();
        this.logger.error('DIR CRC ' + dirCrc);
        this.logger.error('DIR CRCS ' + JSON.stringify(chaDirCrcs));
        tabletDirectories.push(info.uri); // save this for recursion later

        // is the directory already on the cha?
        const tmpIndCrc = chaDirCrcs.findIndex(function (chaDirCrc) {
          return chaDirCrc.path === dirCrc;
        });
        if (tmpIndCrc >= 0) {
          mutableLists.equalDirList.push(chaTarget); // for debugging
          // remove from the directories list.
          chaDirCrcs.splice(tmpIndCrc, 1); // any remaining should be deleted if deleting non-empty directories by crc ever becomes possible

          // messy, but have to build a human-readable path list separately - can't recurse into a dir to delete files using the crc because we don't know the actual name!
          const tmpIndDir = chaDirectories.findIndex(function (chaDir) {
            return chaDir.path === info.name.toUpperCase();
          });
          if (tmpIndDir >= 0) {
            chaDirectories.splice(tmpIndDir, 1); // remove from the list it is already on device
          }
        } else {
          const response = await this.adapter.makeDirectory(device, chaTarget, 0x2000); // it's not on the cha. create this directory - fine if it already exists.
          if (!isValidDeviceResponse(response)) {
            this.logger.debug('Failed to make the new directory on the device.');
            return false;
          }
        }
      } else if (info.type === 'file') {
        const nameUpper = info.name.toUpperCase(); // convert to all upper case for uniformity
        const nameArray = str2arr(nameUpper);
        const fileData = await this.getFileData(this.joinPath(currentPath, info.name));
        const dataArray = str2arr(fileData);
        const combinedArray = new Uint8Array(dataArray.byteLength + nameArray.byteLength);
        combinedArray.set(nameArray);
        combinedArray.set(dataArray, nameArray.byteLength);
        const fileCrc = calculateCRC32(combinedArray).toString(16).toUpperCase();
        this.logger.error('FILE CRC ' + fileCrc);
        this.logger.error('FILE CRCS ' + JSON.stringify(chaCrcs));
        const fileSize = await this.getFileSize(this.joinPath(currentPath, info.name));
        // Find out if this file is on the cha already
        const tmpInd = chaCrcs.findIndex(function (chaCrc) {
          return chaCrc.path === fileCrc;
        });
        if (tmpInd >= 0) {
          mutableLists.equalFileList.push(chaTarget); // for debugging
          chaCrcs.splice(tmpInd, 1); // remove from the chaCrcs list.  any remaining after this entries.forEach loop should be deleted.

          // messy, but have to build a human-readable path list separately
          const tmpIndFile = chaFiles.findIndex(function (chaFile) {
            return chaFile.path === info.name.toUpperCase();
          });
          if (tmpIndFile >= 0) {
            chaFiles.splice(tmpIndFile, 1); // remove from the list it is already on device
          }
        } else {
          mutableLists.transferList.push({
            localPath: info.uri,
            remotePath: chaTarget,
            fileSize: fileSize,
          }); // it's not on the cha - add to transfer list
        }
      }
      // Build delete action lists - any remaining crcs/dirCrcs/directories should be deleted
      if (isAdminDirectory || isUserDirectory) {
        this.logger.debug('CHA media sync: not deleting - this is a user directory: ' + chaDirectoryName);
        // don't delete files here - they are in the main user directory - things like mediaver.txt and cha_prog.dat, plus users can have more than one media repo, and they'd all go in USER!
      } else {
        for (const chaFile of chaFiles) {
          // all remaining chaFiles did not match a file in the tablet-based repo.  delete these files
          mutableLists.deleteList.push(this.joinPath(userRelativeDirectory, chaFile.path));
        }
        for (const chaDir of chaDirectories) {
          // all remaining chaDirs did not match a dir in the tablet-based repo.  delete these dirs
          mutableLists.deleteDirectoryList.push(this.joinPath(userRelativeDirectory, chaDir.path));
        }
      }
    }
    // recurse using the saved tabletDirectories
    let success = true;
    for (const recurseDir of tabletDirectories) {
      success = success && (await this.recursivelySync(device, recurseDir, localDirectory, remoteDirectory, mutableLists));
    }
    return success;
  }

  /**
   * Delete files from a device using a deletion list.
   * @param device The device to delete files on.
   * @param deleteList The list of files to delete.
   * @returns True if successful, false otherwise.
   */
  private async deleteFiles(device: ChaDeviceType, deleteList: string[]): Promise<boolean> {
    let success = true;
    for (const file of deleteList) {
      if (!this.fileTransferDevices.has(device.deviceId)) {
        // File transfer was cancelled do not continue to recurse
        this.logger.debug('CHA media sync has been cancelled, probably by the user.');
        return false;
      }

      const response = await this.adapter.deleteFile(device, file);
      success = success && isValidDeviceResponse(response);
    }
    return success;
  }

  /**
   * Delete directories from a device using a deletion list.
   * @param device The device to delete directories on.
   * @param deleteDirectoryList The list of directories to delete.
   *  @returns True if successful, false otherwise.
   */
  private async deleteDirectories(device: ChaDeviceType, deleteDirectoryList: string[]): Promise<boolean> {
    let success = true;
    for (const directory of deleteDirectoryList) {
      if (!this.fileTransferDevices.has(device.deviceId)) {
        // File transfer was cancelled do not continue
        this.logger.debug('CHA media sync has been cancelled, probably by the user.');
        return false;
      }

      const response = await this.deleteDirectory(device, directory);
      success = success && isValidDeviceResponse(response);
    }
    return success;
  }

  /**
   * Write files to a device using a transfer list.
   * @param device The device to transfer files to.
   * @param transferList The list of transfer objects.
   * @returns True if successful, false otherwise.
   */
  private async writeFiles(
    device: ChaDeviceType,
    transferList: {
      remotePath: string;
      localPath: string;
      fileSize: number;
    }[]
  ): Promise<boolean> {
    let bytesToTransfer = 0;
    let bytesTransferred = 0;
    let previousFileBytes = 0;
    transferList.forEach(function (singleFile) {
      bytesToTransfer += singleFile.fileSize;
    });
    const kBytesToTransfer = Math.round(bytesToTransfer / 1024);
    const FILE_TRANSFER_SPEEDS: Record<BluetoothType, number> = {
      [BluetoothType.BLUETOOTH_LE]: 800,
      [BluetoothType.USB]: 75000,
    };
    const connectionType = this.diskModel.disk.preferences.wahtsConnectionType;
    const speed = FILE_TRANSFER_SPEEDS[connectionType];
    if (bytesToTransfer !== 0) {
      const estimateM = Math.round(bytesToTransfer / speed / 60);
      this.notifications.alert({
        title: 'Alert',
        content: this.transloco.translate(
          'Beginning to transfer media files to the headset.  Time estimate: ' +
            estimateM +
            ' minutes.  Please make sure tablet and headset remain plugged in to avoid battery issues and ensure complete transfer!'
        ),
        type: DialogType.Alert,
      });
    }

    const deviceTransferTask = this.getTransferTaskIdentifier(device);
    let success = true;

    try {
      for (const [index, transferObject] of transferList.entries()) {
        if (!this.fileTransferDevices.has(device.deviceId)) {
          // File transfer was cancelled do not continue
          this.logger.debug('CHA media sync has been cancelled, probably by the user.');
          success = false;
          break;
        }

        let fileURL = transferObject.localPath;
        const targetURL = transferObject.remotePath;
        bytesTransferred += previousFileBytes;
        const kBytesTransferred = Math.round(bytesTransferred / 1024);
        previousFileBytes = transferObject.fileSize;
        const fileName = targetURL.slice(targetURL.lastIndexOf('/') + 1);
        const subMessage =
          '  Total progress: ' +
          (index + 1) +
          '/' +
          transferList.length +
          ' files, ' +
          kBytesTransferred +
          '/' +
          kBytesToTransfer +
          'kB. ' +
          'Filename: ' +
          fileName +
          '.';

        const mainMsg = 'Transferring Media Files to CHA.';
        this.tasks.register(deviceTransferTask, mainMsg + ' ' + subMessage);

        if (fileURL.indexOf('file://') > -1) {
          fileURL = fileURL.slice(7);
        }
        this.logger.debug('CHA - Transferring media file: ' + fileURL + ' to ' + targetURL);

        const response = await this.adapter.fileWrite(device, fileURL, targetURL, 0x2000); // root level
        success = success && isValidDeviceResponse(response);
      }
    } finally {
      this.tasks.deregister(deviceTransferTask);
    }
    return success;
  }

  /**
   * Delete a directory from the device.
   * @param device The device to delete the directory from.
   * @param directory The directory to delete.
   * @returns The device response for the request or undefined.
   */
  private async deleteDirectory(device: ChaDeviceType, directory: string): Promise<IDeviceResponse | undefined> {
    const deleteRecursively = async (currentDirectory: string): Promise<IDeviceResponse | undefined> => {
      if (!this.fileTransferDevices.has(device.deviceId)) {
        // File transfer was cancelled do not continue to recurse
        this.logger.debug('CHA media sync has been cancelled, probably by the user.');
        return;
      }

      const response = await this.adapter.getDirectory(device, currentDirectory);
      if (isValidDeviceResponse(response)) {
        const entries: { path: string; attributes: number }[] = (response as any)['msg'][1];
        if (entries.length > 0) {
          const files = entries.filter(function (entry) {
            return entry.attributes !== undefined && !(entry.attributes & 16);
          });
          for (const file of files) {
            const fullFilePath = this.joinPath(currentDirectory, file.path);
            await this.adapter.deleteFile(device, fullFilePath);
          }
          const dirs = entries.filter(function (entry) {
            return entry.attributes !== undefined && entry.attributes & 16;
          });
          for (const dir of dirs) {
            const fullDirectoryPath = this.joinPath(currentDirectory, dir.path);
            await deleteRecursively(fullDirectoryPath);
          }
        }

        // now that every child file and directory has been deleted/removed, delete this dir
        // we only care about the current directory deletion response as it would fail if internal deletions failed
        return await this.adapter.deleteFile(device, currentDirectory);
      } else {
        // directory is empty - just delete it
        // we only care about the current directory deletion response as it would fail if internal deletions failed
        return await this.adapter.deleteFile(device, currentDirectory);
      }
    };

    return await deleteRecursively(directory);
  }

  /**
   * Get a transfer task identifier for a device.
   * @param device The device to get an identifier for.
   * @returns The transfer task identifier.
   */
  private getTransferTaskIdentifier(device: ChaDeviceType): string {
    return `cha-media-transfer-${device.deviceId}`;
  }

  /**
   * Get a shallow list of files/directories from the directory path.
   * @param path The directory path to get files/directories form.
   * @returns The file/directory list from the directory.
   */
  private async getDirectoryShallow(path: string): Promise<FileInfo[]> {
    // Handle relative and absolute path
    const dataFolderInfo = await Filesystem.getUri({
      path: '',
      directory: Directory.Data,
    });
    const dataFolderRoot = dataFolderInfo.uri;
    let relativePath = path;
    if (path.startsWith(dataFolderRoot)) {
      relativePath = path.replace(dataFolderRoot, '');
    }

    const result = await Filesystem.readdir({
      path: relativePath,
      directory: Directory.Data,
    });

    return result.files;
  }

  /**
   * Get the size of a file/directory.
   * @param path The file/directory path.
   * @returns The size of the file/directory in bytes.
   */
  private async getFileSize(path: string): Promise<number> {
    // Handle relative and absolute path
    const dataFolderInfo = await Filesystem.getUri({
      path: '',
      directory: Directory.Data,
    });
    const dataFolderRoot = dataFolderInfo.uri;
    let relativePath = path;
    if (path.startsWith(dataFolderRoot)) {
      relativePath = path.replace(dataFolderRoot, '');
    }

    const stat = await Filesystem.stat({
      path: relativePath,
      directory: Directory.Data,
    });

    return stat.size;
  }

  /**
   * Get the data of a file.
   * @param path The file path.
   * @returns The file data as base64.
   */
  private async getFileData(path: string): Promise<string> {
    // Handle relative and absolute path
    const dataFolderInfo = await Filesystem.getUri({
      path: '',
      directory: Directory.Data,
    });
    const dataFolderRoot = dataFolderInfo.uri;
    let relativePath = path;
    if (path.startsWith(dataFolderRoot)) {
      relativePath = path.replace(dataFolderRoot, '');
    }

    const file = await Filesystem.readFile({
      path: relativePath,
      directory: Directory.Data,
    });

    return file.data as string;
  }

  /**
   * Join strings with a single slash removing duplicates between items.
   * @param parts The string parts to join.
   * @returns The joined string.
   */
  private joinPath(...parts: string[]): string {
    return parts
      .filter(part => part.length > 0)
      .map((part, i, arr) => {
        if (i === 0) return part.replace(/\/+$/, '');
        if (i === arr.length - 1) return part.replace(/^\/+/, '');
        return part.replace(/^\/+|\/+$/g, '');
      })
      .join('/');
  }
}
