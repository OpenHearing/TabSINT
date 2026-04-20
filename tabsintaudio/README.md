# tabsintaudio

This plugin is based on the Capacitor Community Native Audio Plugin V6.
https://github.com/capacitor-community/native-audio

## Install

```bash
npm install tabsintaudio
npx cap sync
```

## API

<docgen-index>

* [`configure(...)`](#configure)
* [`preload(...)`](#preload)
* [`play(...)`](#play)
* [`pause(...)`](#pause)
* [`resume(...)`](#resume)
* [`loop(...)`](#loop)
* [`stop(...)`](#stop)
* [`unload(...)`](#unload)
* [`setVolume(...)`](#setvolume)
* [`setSystemVolume(...)`](#setsystemvolume)
* [`seekTo(...)`](#seekto)
* [`getCurrentTime(...)`](#getcurrenttime)
* [`getDuration(...)`](#getduration)
* [`isPlaying(...)`](#isplaying)
* [`addListener('complete', ...)`](#addlistenercomplete-)
* [Interfaces](#interfaces)

</docgen-index>

<docgen-api>
<!--Update the source file JSDoc comments and rerun docgen to update the docs below-->

### configure(...)

```typescript
configure(options: ConfigureOptions) => Promise<void>
```

| Param         | Type                                                          |
| ------------- | ------------------------------------------------------------- |
| **`options`** | <code><a href="#configureoptions">ConfigureOptions</a></code> |

--------------------


### preload(...)

```typescript
preload(options: PreloadOptions) => Promise<void>
```

| Param         | Type                                                      |
| ------------- | --------------------------------------------------------- |
| **`options`** | <code><a href="#preloadoptions">PreloadOptions</a></code> |

--------------------


### play(...)

```typescript
play(options: { assetId: string; time?: number; }) => Promise<void>
```

| Param         | Type                                             |
| ------------- | ------------------------------------------------ |
| **`options`** | <code>{ assetId: string; time?: number; }</code> |

--------------------


### pause(...)

```typescript
pause(options: { assetId: string; }) => Promise<void>
```

| Param         | Type                              |
| ------------- | --------------------------------- |
| **`options`** | <code>{ assetId: string; }</code> |

--------------------


### resume(...)

```typescript
resume(options: { assetId: string; }) => Promise<void>
```

| Param         | Type                              |
| ------------- | --------------------------------- |
| **`options`** | <code>{ assetId: string; }</code> |

--------------------


### loop(...)

```typescript
loop(options: { assetId: string; }) => Promise<void>
```

| Param         | Type                              |
| ------------- | --------------------------------- |
| **`options`** | <code>{ assetId: string; }</code> |

--------------------


### stop(...)

```typescript
stop(options: { assetId: string; }) => Promise<void>
```

| Param         | Type                              |
| ------------- | --------------------------------- |
| **`options`** | <code>{ assetId: string; }</code> |

--------------------


### unload(...)

```typescript
unload(options: { assetId: string; }) => Promise<void>
```

| Param         | Type                              |
| ------------- | --------------------------------- |
| **`options`** | <code>{ assetId: string; }</code> |

--------------------


### setVolume(...)

```typescript
setVolume(options: { assetId: string; volume: number | number[]; }) => Promise<void>
```

| Param         | Type                                                          |
| ------------- | ------------------------------------------------------------- |
| **`options`** | <code>{ assetId: string; volume: number \| number[]; }</code> |

--------------------


### setSystemVolume(...)

```typescript
setSystemVolume(options: { volume: number; }) => Promise<void>
```

| Param         | Type                             |
| ------------- | -------------------------------- |
| **`options`** | <code>{ volume: number; }</code> |

--------------------


### seekTo(...)

```typescript
seekTo(options: { assetId: string; time: number; }) => Promise<void>
```

| Param         | Type                                            |
| ------------- | ----------------------------------------------- |
| **`options`** | <code>{ assetId: string; time: number; }</code> |

--------------------


### getCurrentTime(...)

```typescript
getCurrentTime(options: { assetId: string; }) => Promise<{ currentTime: number; }>
```

| Param         | Type                              |
| ------------- | --------------------------------- |
| **`options`** | <code>{ assetId: string; }</code> |

**Returns:** <code>Promise&lt;{ currentTime: number; }&gt;</code>

--------------------


### getDuration(...)

```typescript
getDuration(options: { assetId: string; }) => Promise<{ duration: number; }>
```

| Param         | Type                              |
| ------------- | --------------------------------- |
| **`options`** | <code>{ assetId: string; }</code> |

**Returns:** <code>Promise&lt;{ duration: number; }&gt;</code>

--------------------


### isPlaying(...)

```typescript
isPlaying(options: { assetId: string; }) => Promise<{ isPlaying: boolean; }>
```

| Param         | Type                              |
| ------------- | --------------------------------- |
| **`options`** | <code>{ assetId: string; }</code> |

**Returns:** <code>Promise&lt;{ isPlaying: boolean; }&gt;</code>

--------------------


### addListener('complete', ...)

```typescript
addListener(eventName: 'complete', listenerFunc: (event: { assetId: string; }) => void) => Promise<PluginListenerHandle>
```

Listen for asset completed playing event

| Param              | Type                                                  |
| ------------------ | ----------------------------------------------------- |
| **`eventName`**    | <code>'complete'</code>                               |
| **`listenerFunc`** | <code>(event: { assetId: string; }) =&gt; void</code> |

**Returns:** <code>Promise&lt;<a href="#pluginlistenerhandle">PluginListenerHandle</a>&gt;</code>

**Since:** 5.0.1

--------------------


### Interfaces


#### ConfigureOptions

| Prop        | Type                 | Description                                       | Default            |
| ----------- | -------------------- | ------------------------------------------------- | ------------------ |
| **`fade`**  | <code>boolean</code> | Indicating whether or not to fade audio.          | <code>false</code> |
| **`focus`** | <code>boolean</code> | Indicating whether or not to disable mixed audio. | <code>false</code> |


#### PreloadOptions

| Prop                  | Type                            |
| --------------------- | ------------------------------- |
| **`assetPath`**       | <code>string</code>             |
| **`assetId`**         | <code>string</code>             |
| **`volume`**          | <code>number \| number[]</code> |
| **`audioChannelNum`** | <code>number</code>             |
| **`isUrl`**           | <code>boolean</code>            |


#### PluginListenerHandle

| Prop         | Type                                      |
| ------------ | ----------------------------------------- |
| **`remove`** | <code>() =&gt; Promise&lt;void&gt;</code> |

</docgen-api>
