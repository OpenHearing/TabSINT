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
* [`deletePath(...)`](#deletepath)
* [`listFilesInDirectory(...)`](#listfilesindirectory)

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
createPath(options: { rootUri: string | undefined; path: string; content?: string; }) => Promise<{ uri: string; }>
```

| Param         | Type                                                              |
| ------------- | ----------------------------------------------------------------- |
| **`options`** | <code>{ rootUri: string; path: string; content?: string; }</code> |

**Returns:** <code>Promise&lt;{ uri: string; }&gt;</code>

--------------------


### getDirectoryStructure(...)

```typescript
getDirectoryStructure(options: { rootUri: string | undefined; path?: string; }) => Promise<{ structure: any; }>
```

| Param         | Type                                             |
| ------------- | ------------------------------------------------ |
| **`options`** | <code>{ rootUri: string; path?: string; }</code> |

**Returns:** <code>Promise&lt;{ structure: any; }&gt;</code>

--------------------


### copyFileOrFolder(...)

```typescript
copyFileOrFolder(options: { rootUri: string | undefined; sourcePath: string; destinationPath: string; }) => Promise<{ success: boolean; message: string; }>
```

| Param         | Type                                                                           |
| ------------- | ------------------------------------------------------------------------------ |
| **`options`** | <code>{ rootUri: string; sourcePath: string; destinationPath: string; }</code> |

**Returns:** <code>Promise&lt;{ success: boolean; message: string; }&gt;</code>

--------------------


### readFile(...)

```typescript
readFile(options: { rootUri?: string | undefined; fileUri?: string | undefined; filePath?: string | undefined; }) => Promise<{ contentUri: string; mimeType: string; name: string; size: number; content: string; }>
```

| Param         | Type                                                                    |
| ------------- | ----------------------------------------------------------------------- |
| **`options`** | <code>{ rootUri?: string; fileUri?: string; filePath?: string; }</code> |

**Returns:** <code>Promise&lt;{ contentUri: string; mimeType: string; name: string; size: number; content: string; }&gt;</code>

--------------------


### deletePath(...)

```typescript
deletePath(options: { rootUri: string | undefined; path: string; }) => Promise<{ success: boolean; message: string; }>
```

| Param         | Type                                            |
| ------------- | ----------------------------------------------- |
| **`options`** | <code>{ rootUri: string; path: string; }</code> |

**Returns:** <code>Promise&lt;{ success: boolean; message: string; }&gt;</code>

--------------------


### listFilesInDirectory(...)

```typescript
listFilesInDirectory(options: { rootUri?: string | undefined; folderPath?: string | undefined; contentUri?: string | undefined; }) => Promise<{ files: { name: string; uri: string; mimeType: string; size: number; content: string; }[]; }>
```

| Param         | Type                                                                         |
| ------------- | ---------------------------------------------------------------------------- |
| **`options`** | <code>{ rootUri?: string; folderPath?: string; contentUri?: string; }</code> |

**Returns:** <code>Promise&lt;{ files: { name: string; uri: string; mimeType: string; size: number; content: string; }[]; }&gt;</code>

--------------------

</docgen-api>
