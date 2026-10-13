# tabsintfs

Native file system access plugin

## Install

```bash
npm install tabsintfs
npx cap sync
```

## API

<docgen-index>

* [`chooseFolder()`](#choosefolder)
* [`createPath(...)`](#createpath)
* [`getDirectoryStructure(...)`](#getdirectorystructure)
* [`copyFileOrFolder(...)`](#copyfileorfolder)
* [`readFile(...)`](#readfile)
* [`getFileContentURI(...)`](#getfilecontenturi)
* [`deletePath(...)`](#deletepath)
* [`listFilesInDirectory(...)`](#listfilesindirectory)
* [`unzip(...)`](#unzip)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### chooseFolder()

```typescript
chooseFolder() => Promise<{ uri: string; name: string; }>
```

**Returns:** <code>Promise&lt;{ uri: string; name: string; }&gt;</code>

--------------------


### createPath(...)

```typescript
createPath(options: { rootUri: string | null | undefined; path: string; content?: string; asBase64?: boolean; }) => Promise<{ uri: string; }>
```

| Param         | Type                                                                                          |
| ------------- | --------------------------------------------------------------------------------------------- |
| **`options`** | <code>{ rootUri: string \| null; path: string; content?: string; asBase64?: boolean; }</code> |

**Returns:** <code>Promise&lt;{ uri: string; }&gt;</code>

--------------------


### getDirectoryStructure(...)

```typescript
getDirectoryStructure(options: { rootUri: string | null | undefined; path?: string; }) => Promise<{ structure: any; }>
```

| Param         | Type                                                     |
| ------------- | -------------------------------------------------------- |
| **`options`** | <code>{ rootUri: string \| null; path?: string; }</code> |

**Returns:** <code>Promise&lt;{ structure: any; }&gt;</code>

--------------------


### copyFileOrFolder(...)

```typescript
copyFileOrFolder(options: { rootUri: string | null | undefined; sourcePath: string; destinationPath: string; }) => Promise<{ success: boolean; message: string; }>
```

| Param         | Type                                                                                   |
| ------------- | -------------------------------------------------------------------------------------- |
| **`options`** | <code>{ rootUri: string \| null; sourcePath: string; destinationPath: string; }</code> |

**Returns:** <code>Promise&lt;{ success: boolean; message: string; }&gt;</code>

--------------------


### readFile(...)

```typescript
readFile(options: { rootUri?: string | null; filePath?: string | null; fileUri?: string | null; asBase64?: boolean | null; }) => Promise<{ contentUri: string; mimeType: string; name: string; size: number; content: string; }>
```

| Param         | Type                                                                                                                        |
| ------------- | --------------------------------------------------------------------------------------------------------------------------- |
| **`options`** | <code>{ rootUri?: string \| null; filePath?: string \| null; fileUri?: string \| null; asBase64?: boolean \| null; }</code> |

**Returns:** <code>Promise&lt;{ contentUri: string; mimeType: string; name: string; size: number; content: string; }&gt;</code>

--------------------


### getFileContentURI(...)

```typescript
getFileContentURI(options: { rootUri: string; filePath: string; }) => Promise<{ contentUri: string; }>
```

| Param         | Type                                                |
| ------------- | --------------------------------------------------- |
| **`options`** | <code>{ rootUri: string; filePath: string; }</code> |

**Returns:** <code>Promise&lt;{ contentUri: string; }&gt;</code>

--------------------


### deletePath(...)

```typescript
deletePath(options: { rootUri: string | null | undefined; path: string; }) => Promise<{ success: boolean; message: string; }>
```

| Param         | Type                                                    |
| ------------- | ------------------------------------------------------- |
| **`options`** | <code>{ rootUri: string \| null; path: string; }</code> |

**Returns:** <code>Promise&lt;{ success: boolean; message: string; }&gt;</code>

--------------------


### listFilesInDirectory(...)

```typescript
listFilesInDirectory(options: { rootUri?: string | null; folderPath?: string | null; folderUri?: string | null; }) => Promise<{ files: { name: string; uri: string; mimeType: string; size: number; content: string; }[]; }>
```

| Param         | Type                                                                                                |
| ------------- | --------------------------------------------------------------------------------------------------- |
| **`options`** | <code>{ rootUri?: string \| null; folderPath?: string \| null; folderUri?: string \| null; }</code> |

**Returns:** <code>Promise&lt;{ files: { name: string; uri: string; mimeType: string; size: number; content: string; }[]; }&gt;</code>

--------------------


### unzip(...)

```typescript
unzip(options: { sourcePath: string; destinationPath: string; ignoreRoot: boolean; }) => Promise<{ success: boolean; message: string; }>
```

| Param         | Type                                                                               |
| ------------- | ---------------------------------------------------------------------------------- |
| **`options`** | <code>{ sourcePath: string; destinationPath: string; ignoreRoot: boolean; }</code> |

**Returns:** <code>Promise&lt;{ success: boolean; message: string; }&gt;</code>

--------------------

</docgen-api>
