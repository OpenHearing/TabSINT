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
import android.provider.DocumentsContract;
import java.nio.charset.StandardCharsets;


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
            final int takeFlags = data.getFlags() & (Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);
            getContext().getContentResolver().takePersistableUriPermission(uri, takeFlags);
            DocumentFile pickedDir = DocumentFile.fromTreeUri(getContext(), uri);
            if (pickedDir != null) {
                String folderName = pickedDir.getName();
                JSObject ret = new JSObject();
                ret.put("uri", uri.toString());
                ret.put("name", folderName);
                call.resolve(ret);
            } else {
                call.reject("Failed to get the selected folder");
            }
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
            requestPermissionForAlias("writeStorage", call, "writeStoragePermissionCallback");
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
      String fileUri = call.getString("fileUri");
      String rootUri = call.getString("rootUri");
      String filePath = call.getString("filePath");
  
      DocumentFile file = null;
  
      if (fileUri != null) {
        Log.d(TAG,"Reading via content uri");
          // Handle the case where fileUri is provided
          Uri uri = Uri.parse(fileUri);
          file = DocumentFile.fromTreeUri(getContext(), uri);
      } else if (rootUri != null && filePath != null) {
        Log.d(TAG,"Reading via file path");
          // Handle the case where rootUri and filePath are provided
          filePath = filePath.replaceAll("^/+|/+$", "");
          Uri uri = Uri.parse(rootUri);
          DocumentFile rootDir = DocumentFile.fromTreeUri(getContext(), uri);
          if (rootDir == null) {
              call.reject("Invalid root URI");
              return;
          }
          file = getFileFromPath(rootDir, filePath);
      } else {
          call.reject("Must provide either fileUri or both rootUri and filePath");
          return;
      }
  
      if (file == null || !file.isFile()) {
          call.reject("File not found or is not a regular file");
          return;
      }
  
      String content = readFileContent(file);
  
      if (content == null) {
          call.reject("Failed to read content from the file");
          return;
      }
  
      JSObject result = new JSObject();
      result.put("contentUri", file.getUri().toString());
      result.put("mimeType", file.getType());
      result.put("name", file.getName());
      result.put("size", file.length());
      result.put("content", content);
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
    if (android.os.Build.VERSION.SDK_INT < android.os.Build.VERSION_CODES.Q) {
        if (getPermissionState("writeStorage") != PermissionState.GRANTED) {
            requestPermissionForAlias("writeStorage", call, "writeStoragePermissionCallback");
            return;
        }
    }

    // Get parameters from the call
    String rootUri = call.getString("rootUri");
    String path = call.getString("path");
    // Remove leading and trailing slashes if present
    path = path.replaceAll("^/+|/+$", "");
    String content = call.getString("content");

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
    DocumentFile currentDir = createPathHelper(path, rootDir,content);
    if(currentDir==null){
        call.reject("Failed to create or access file/directory");
    }
    JSObject ret = new JSObject();
    ret.put("uri", currentDir.getUri().toString());
    call.resolve(ret);
}

private DocumentFile createPathHelper(String path,DocumentFile rootDir,String content){
    if(path==null || path.isEmpty() || rootDir==null){
        return null;
    }
    // Split the path into components
    String[] pathComponents = path.split("/");
    DocumentFile currentDir = rootDir;
    
    // Iterate through path components
    for (int i = 0; i < pathComponents.length; i++) {
        String component = pathComponents[i];
        boolean isLastComponent = (i == pathComponents.length - 1);
        boolean isFile = isLastComponent && hasFileExtension(component);

        if (isFile) {
            // Create file
            currentDir = createFile(currentDir, component, content);
        } else {
            // Create or navigate to directory
            currentDir = createOrGetDirectory(currentDir, component);
        }
        if (currentDir == null) {
            return null;
        }
    }
    return currentDir;
}

private boolean hasFileExtension(String component) {
    String[] fileExtensions = { "txt", "pdf", "docx", "jpg", "png", "xlsx", "csv", "json", "xml", "html" };
    for (String extension : fileExtensions) {
        if (component.toLowerCase().endsWith("." + extension)) {
            return true;
        }
    }
    return false;
}

private DocumentFile createFile(DocumentFile parentDir, String fileName, String content) {
    String extension = fileName.substring(fileName.lastIndexOf(".") + 1);
    String mimeType = MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);

    if (mimeType == null) {
        mimeType = "application/octet-stream";
    }

    DocumentFile newFile = parentDir.createFile(mimeType, fileName);
    if (newFile == null) {
        return null;
    }

    if (content != null) {
        if (!writeFileContent(newFile, content)) {
            return null;
        }
    }
    return newFile;
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

    if(destinationPath.substring(destinationPath.lastIndexOf("/")+1).contains(".")) {
        call.reject("Destination path specified is a file path, please specify a valid destination path");
    }

    DocumentFile destinationFolder = createPathHelper(destinationPath, rootDir,null);
    if (destinationFolder==null){
        call.reject("Error creating destination path");
    }

    if (sourceFile == null) {
        call.reject("Source file/folder not found");
        return;
    }

    try {
        boolean success = copyRecursively(sourceFile, destinationFolder,0);
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

private boolean copyRecursively(DocumentFile source, DocumentFile destinationFolder, int layer) throws IOException {
    if (source.isDirectory()) {
        DocumentFile newDir = layer==0 ? destinationFolder : destinationFolder.createDirectory(source.getName()); 
        if (newDir == null) return false;

        for (DocumentFile child : source.listFiles()) {
            if (!copyRecursively(child, newDir,layer+1)) return false;
        }
    } else {
        DocumentFile newFile = destinationFolder.createFile(source.getType(), source.getName());
        if (newFile == null) return false;
        String content = readFileContent(source);
        if (content == null) return false;
        if (!writeFileContent(newFile, content)) return false;
    }
    return true;
}

@PluginMethod
public void deletePath(PluginCall call) {
    String rootUri = call.getString("rootUri");
    String path = call.getString("path");

    if (rootUri == null || path == null) {
        call.reject("Must provide rootUri and path");
        return;
    }

    path = path.replaceAll("^/+|/+$", "");

    Uri uri = Uri.parse(rootUri);
    DocumentFile rootDir = DocumentFile.fromTreeUri(getContext(), uri);

    if (rootDir == null) {
        call.reject("Invalid root URI");
        return;
    }

    DocumentFile targetFile = getFileFromPath(rootDir, path);

    if (targetFile == null) {
        call.reject("Path not found");
        return;
    }

    // Use DocumentsContract.deleteDocument to delete the file or directory
    try {
        boolean deleted = DocumentsContract.deleteDocument(
            getContext().getContentResolver(), targetFile.getUri());
        
        if (deleted) {
            JSObject result = new JSObject();
            result.put("success", true);
            result.put("message", (targetFile.isFile() ? "File" : "Directory") + " deleted successfully");
            call.resolve(result);
        } else {
            call.reject("Failed to delete the " + (targetFile.isFile() ? "file" : "directory") + ": " + path);
        }
    } catch (Exception e) {
        call.reject("Error deleting " + (targetFile.isFile() ? "file" : "directory") + ": " + e.getMessage());
    }
}

private boolean writeFileContent(DocumentFile file, String content) {
    try (ParcelFileDescriptor pfd = getContext().getContentResolver().openFileDescriptor(file.getUri(), "w");
         FileOutputStream fos = new FileOutputStream(pfd.getFileDescriptor())) {

        fos.write(content.getBytes());
        return true;

    } catch (IOException e) {
        Log.e(TAG, "Failed to write content to the file: " + file.getName(), e);
        return false;
    }
}

private String readFileContent(DocumentFile file) {
    try (ParcelFileDescriptor pfd = getContext().getContentResolver().openFileDescriptor(file.getUri(), "r");
         FileInputStream fis = new FileInputStream(pfd.getFileDescriptor())) {

        byte[] contentBytes = new byte[(int) file.length()];
        fis.read(contentBytes);
        return new String(contentBytes, StandardCharsets.UTF_8);

    } catch (IOException e) {
        // Handle the IOException here and return null or an appropriate value
        Log.e("TabsintFsPlugin", "Failed to read content from the file: " + file.getName(), e);
        return null; // Or you could return an empty string or some error message
    }
}

@PluginMethod
public void listFilesInDirectory(PluginCall call) {
    String rootUri = call.getString("rootUri");
    String folderPath = call.getString("folderPath");
    String contentUri = call.getString("folderUri");

    DocumentFile targetDir = null;

    if (contentUri != null) {
        // Handle the case where contentUri is provided
        Uri uri = Uri.parse(contentUri);
        targetDir = DocumentFile.fromTreeUri(getContext(), uri);
    } else if (rootUri != null && folderPath != null) {
        // Handle the case where rootUri and folderPath are provided
        folderPath = folderPath.replaceAll("^/+|/+$", "");

        Uri uri = Uri.parse(rootUri);
        DocumentFile rootDir = DocumentFile.fromTreeUri(getContext(), uri);

        if (rootDir == null) {
            call.reject("Invalid root URI");
            return;
        }

        targetDir = getFileFromPath(rootDir, folderPath);
    } else {
        call.reject("Must provide either contentUri or both rootUri and folderPath");
        return;
    }

    if (targetDir == null || !targetDir.isDirectory()) {
        call.reject("Specified path is not a directory or does not exist");
        return;
    }

    DocumentFile[] files = targetDir.listFiles();
    JSArray fileList = new JSArray();

    if (files != null) {
        for (DocumentFile file : files) {
            if (file.isFile()) {
                JSObject fileInfo = new JSObject();
                fileInfo.put("name", file.getName());
                fileInfo.put("uri", file.getUri().toString());
                fileInfo.put("mimeType", file.getType());
                fileInfo.put("size", file.length());

                // Optionally, you can read the content of the file (depends on your use case)
                String content = readFileContent(file);
                if (content != null) {
                    fileInfo.put("content", content);
                } else {
                    fileInfo.put("content", "Failed to read file content");
                }

                fileList.put(fileInfo);
            }
        }
    }

    JSObject result = new JSObject();
    result.put("files", fileList);
    call.resolve(result);
}

}