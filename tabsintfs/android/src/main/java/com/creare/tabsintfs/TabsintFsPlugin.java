package com.creare.tabsintfs;

import android.app.Activity;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;
import androidx.annotation.Nullable;
import com.getcapacitor.JSObject;
import com.getcapacitor.JSArray;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import com.getcapacitor.NativePlugin;
import com.getcapacitor.annotation.Permission;
import com.getcapacitor.annotation.PermissionCallback;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.PermissionState;
import com.getcapacitor.annotation.ActivityCallback;
import androidx.activity.result.ActivityResult;
import android.net.Uri;
import androidx.documentfile.provider.DocumentFile;
import android.webkit.MimeTypeMap;
import java.io.FileInputStream;
import android.os.ParcelFileDescriptor;
import java.io.FileOutputStream;
import java.io.IOException;


@CapacitorPlugin(
  name = "TabsintFs",
  permissions = {
    @Permission(strings = { android.Manifest.permission.READ_EXTERNAL_STORAGE }, alias = "readStorage"),
    @Permission(strings = { android.Manifest.permission.WRITE_EXTERNAL_STORAGE }, alias = "writeStorage")
  }
)
public class TabsintFsPlugin extends Plugin {
  public static final int REQUEST_CODE = 1234;
  private static final String TAG = "TabsintFsPlugin";

  @ActivityCallback
  private void onFolderPicked(PluginCall call, ActivityResult result) {
      Log.d(TAG, "Intent result being handle");
      if (result.getResultCode() == Activity.RESULT_OK) {
          Intent data = result.getData();
          if (data != null) {
              Uri uri = data.getData();
              JSObject ret = new JSObject();
              ret.put("uri", uri.toString());
              call.resolve(ret);
          } else {
              call.reject("Folder not chosen");
          }
      } else {
          call.reject("Folder chooser canceled");
      }
  }

  @PermissionCallback
  private void storagePermissionCallback(PluginCall call) {
    Log.d(TAG, "storagePermissionCallback called");
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.Q) {
        if (getPermissionState("readStorage") == PermissionState.GRANTED) {
            openFileChooser();
        } else {
            call.reject("Permission is required to access the file system");
        }
    } else {
        openFileChooser();
    }
  }

  private void openFileChooser() {
    Log.d(TAG, "openFileChooser called");
    Intent intent = new Intent(Intent.ACTION_OPEN_DOCUMENT_TREE);
    startActivityForResult(getSavedCall(), intent, "onFolderPicked");
  }

  @PluginMethod
  public void chooseFolder(PluginCall call) {
    Log.d(TAG, "chooseFile called");
    Log.d(TAG, "Android SDK Version: " + android.os.Build.VERSION.SDK_INT);
    saveCall(call);
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.Q) {
        // For Android 9 and below
        if (getPermissionState("readStorage") != PermissionState.GRANTED) {
            Log.d(TAG, "Requesting read storage permission");
            requestPermissionForAlias("readStorage", call, "storagePermissionCallback");
        } else {
            openFileChooser();
        }
    } else {
        // For Android 10 and above
        openFileChooser();
    }
  }

    @PluginMethod
    public void readFile(PluginCall call) {
        String rootUri = call.getString("rootUri");
        String filePath = call.getString("filePath");

        if (rootUri == null || filePath == null) {
            call.reject("Must provide rootUri and filePath");
            return;
        }

        filePath = filePath.replaceAll("^/+|/+$", "");

        Uri uri = Uri.parse(rootUri);
        DocumentFile rootDir = DocumentFile.fromTreeUri(getContext(), uri);

        if (rootDir == null) {
            call.reject("Invalid root URI");
            return;
        }

        DocumentFile file = getFileFromPath(rootDir, filePath);

        if (file == null || !file.isFile()) {
            call.reject("File not found or is not a regular file");
            return;
        }

        JSObject result = new JSObject();
        result.put("contentUri", file.getUri().toString());
        result.put("mimeType", file.getType());
        result.put("name", file.getName());
        result.put("size", file.length());
        call.resolve(result);
    }

  @PermissionCallback
  private void writeStoragePermissionCallback(PluginCall call) {
    Log.d(TAG, "writeStoragePermissionCallback called");
    if (getPermissionState("writeStorage") == PermissionState.GRANTED) {
      createPath(call);
    } else {
      call.reject("Write permission is required to modify the file system");
    }
  }

  @PluginMethod
public void createPath(PluginCall call) {
    Log.d(TAG, "createPath called");
    
    // Check for write permission
    if (getPermissionState("writeStorage") != PermissionState.GRANTED) {
        Log.d(TAG, "Requesting write storage permission");
        saveCall(call);
        requestPermissionForAlias("writeStorage", call, "writeStoragePermissionCallback");
        return;
    }

    // Get parameters from the call
    String rootUri = call.getString("rootUri");
    String path = call.getString("path");
    // Remove leading and trailing slashes if present
    path = path.replaceAll("^/+|/+$", "");
    String content = call.getString("content"); // Optional, only for files

    if (rootUri == null || path == null) {
        call.reject("Must provide rootUri and path");
        return;
    }

    Uri uri = Uri.parse(rootUri);
    DocumentFile rootDir = DocumentFile.fromTreeUri(getContext(), uri);

    if (rootDir == null || !rootDir.canWrite()) {
        call.reject("Cannot write to the specified root directory");
        return;
    }

    // Split the path into components
    String[] pathComponents = path.split("/");
    DocumentFile currentDir = rootDir;
    
    // Iterate through path components
    for (int i = 0; i < pathComponents.length; i++) {
        String component = pathComponents[i];
        boolean isLastComponent = (i == pathComponents.length - 1);
        boolean isFile = isLastComponent && component.contains(".");

        if (isFile) {
            // Create file
            createFile(currentDir, component, content, call);
        } else {
            // Create or navigate to directory
            currentDir = createOrGetDirectory(currentDir, component);
            if (currentDir == null) {
                call.reject("Failed to create or access directory: " + component);
                return;
            }
        }
    }
    JSObject ret = new JSObject();
    ret.put("uri", currentDir.getUri().toString());
    call.resolve(ret);
}

private void createFile(DocumentFile parentDir, String fileName, String content, PluginCall call) {
    String extension = fileName.substring(fileName.lastIndexOf(".") + 1);
    String mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);

    if (mimeType == null) {
        mimeType = "application/octet-stream";
    }

    DocumentFile newFile = parentDir.createFile(mimeType, fileName);
    if (newFile == null) {
        call.reject("Failed to create the file: " + fileName);
        return;
    }

    if (content != null) {
        try (ParcelFileDescriptor pfd = getContext().getContentResolver().openFileDescriptor(newFile.getUri(), "w");
             FileOutputStream fos = new FileOutputStream(pfd.getFileDescriptor())) {
            fos.write(content.getBytes());
        } catch (IOException e) {
            call.reject("Failed to write content to the file: " + fileName, e);
            return;
        }
    }
}

private DocumentFile createOrGetDirectory(DocumentFile parentDir, String dirName) {
    DocumentFile dir = parentDir.findFile(dirName);
    if (dir != null && dir.isDirectory()) {
        return dir;
    }
    return parentDir.createDirectory(dirName);
}

@PluginMethod
public void getDirectoryStructure(PluginCall call) {
    String rootUri = call.getString("rootUri");
    String path = call.getString("path");

    if (path != null) {
      path = path.replaceAll("^/+|/+$", "");
    }

    if (rootUri == null) {
      call.reject("Must provide rootUri");
      return;
    } 

    Uri uri = Uri.parse(rootUri);
    DocumentFile rootDir = DocumentFile.fromTreeUri(getContext(), uri);

    if (rootDir == null) {
        call.reject("Invalid root URI");
        return;
    }

    DocumentFile targetFile = (path == null || path.isEmpty()) ? rootDir : getFileFromPath(rootDir, path);
    if (targetFile == null) {
        call.reject("Path not found");
        return;
    }

    JSObject result = new JSObject();
    result.put("structure", getStructureRecursively(targetFile));
    call.resolve(result);
}

private DocumentFile getFileFromPath(DocumentFile root, String path) {
    String[] components = path.split("/");
    DocumentFile current = root;
    for (String component : components) {
        if (component.isEmpty()) continue;
        DocumentFile next = current.findFile(component);
        if (next == null) return null;
        current = next;
    }
    return current;
}

private JSObject getStructureRecursively(DocumentFile file) {
    JSObject item = new JSObject();
    item.put("name", file.getName());
    item.put("isDirectory", file.isDirectory());
    
    if (file.isDirectory()) {
        JSArray children = new JSArray();
        DocumentFile[] childFiles = file.listFiles();
        if (childFiles != null) {
            for (DocumentFile child : childFiles) {
                children.put(getStructureRecursively(child));
            }
        }
        item.put("children", children);
    }

    item.put("lastModified", file.lastModified());
    item.put("size", file.length());
    item.put("type", file.getType());
    
    return item;
}

@PluginMethod
public void copyFileOrFolder(PluginCall call) {
    String rootUri = call.getString("rootUri");
    String sourcePath = call.getString("sourcePath");
    String destinationPath = call.getString("destinationPath");

    if (rootUri == null || sourcePath == null || destinationPath == null) {
        call.reject("Must provide rootUri, sourcePath, and destinationPath");
        return;
    }

    sourcePath = sourcePath.replaceAll("^/+|/+$", "");
    destinationPath = destinationPath.replaceAll("^/+|/+$", "");

    Uri uri = Uri.parse(rootUri);
    DocumentFile rootDir = DocumentFile.fromTreeUri(getContext(), uri);

    if (rootDir == null) {
        call.reject("Invalid root URI");
        return;
    }

    DocumentFile sourceFile = getFileFromPath(rootDir, sourcePath);
    DocumentFile destinationFolder = getFileFromPath(rootDir, destinationPath);

    if (sourceFile == null) {
        call.reject("Source file/folder not found");
        return;
    }

    if (destinationFolder == null || !destinationFolder.isDirectory()) {
        call.reject("Destination folder not found or is not a directory");
        return;
    }

    try {
        boolean success = copyRecursively(sourceFile, destinationFolder);
        if (success) {
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", "Copy operation completed successfully");
            call.resolve(result);
        } else {
            call.reject("Copy operation failed");
        }
    } catch (IOException e) {
        call.reject("Error during copy operation: " + e.getMessage());
    }
}

private boolean copyRecursively(DocumentFile source, DocumentFile destinationFolder) throws IOException {
    if (source.isDirectory()) {
        DocumentFile newDir = destinationFolder.createDirectory(source.getName());
        if (newDir == null) return false;

        for (DocumentFile child : source.listFiles()) {
            if (!copyRecursively(child, newDir)) return false;
        }
    } else {
        DocumentFile newFile = destinationFolder.createFile(source.getType(), source.getName());
        if (newFile == null) return false;

        ParcelFileDescriptor sourceDescriptor = getContext().getContentResolver().openFileDescriptor(source.getUri(), "r");
        ParcelFileDescriptor destDescriptor = getContext().getContentResolver().openFileDescriptor(newFile.getUri(), "w");

        if (sourceDescriptor == null || destDescriptor == null) return false;

        try (FileInputStream in = new FileInputStream(sourceDescriptor.getFileDescriptor());
             FileOutputStream out = new FileOutputStream(destDescriptor.getFileDescriptor())) {

            byte[] buffer = new byte[1024];
            int read;
            while ((read = in.read(buffer)) != -1) {
                out.write(buffer, 0, read);
            }
        } finally {
            sourceDescriptor.close();
            destDescriptor.close();
        }
    }
    return true;
}

}
