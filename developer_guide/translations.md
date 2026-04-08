# Translations

TabSINT uses [@jsverse/transloco](https://jsverse.github.io/transloco/) v7 for internationalization. Translation files are JSON key-value maps loaded at runtime via HTTP.

## Supported languages

| Code | Language |
|------|----------|
| `en` | English (default) |
| `fr` | French |
| `ja` | Japanese |
| `es` | Spanish |

## Translation files

Files live in `src/assets/i18n/<lang>.json`. Each file maps a string key to its translation. Keys are the English source strings.

```
src/assets/i18n/
  en.json   ← canonical key list (identity mapping)
  fr.json
  ja.json
  es.json
```

The English file is the source of truth. Every key that exists anywhere in the app must appear in `en.json`. Other language files only need keys they translate — any missing key automatically falls back to the English value (`fallbackLang: 'en'` in `app.module.ts`).

## Using translations in templates

Use the `transloco` pipe:

```html
{{ "Save" | transloco }}
{{ "Select Language:" | transloco }}
```

For `title` / `alt` attributes use interpolation:

```html
<div title="{{ 'Help' | transloco }}">
<img alt="{{ 'QR code logo' | transloco }}" />
```

## Using translations in TypeScript

Inject `TranslocoService` and call `.translate()`:

```typescript
import { TranslocoService } from '@jsverse/transloco';

export class MyComponent {
  private readonly transloco = inject(TranslocoService);

  doSomething() {
    const msg = this.transloco.translate('Protocol did not load properly. Please validate your protocol before trying to load again.');
  }
}
```

> **Important:** Do not call `transloco.translate()` in class-field initializers. Translations load asynchronously, so the value will be an empty string at construction time. Use a `get` accessor instead so it is evaluated lazily after translations have loaded:
>
> ```typescript
> // Wrong — evaluated before translations load
> readonly tooltip = this.transloco.translate('Help text');
>
> // Correct — evaluated lazily when the template renders
> get tooltip() { return this.transloco.translate('Help text'); }
> ```

## Standalone components

Standalone components must declare `TranslocoPipe` (or `TranslocoModule`) in their own `imports` array:

```typescript
import { TranslocoPipe } from '@jsverse/transloco';

@Component({
  standalone: true,
  imports: [CommonModule, FormsModule, TranslocoPipe],
  ...
})
export class MyStandaloneComponent {}
```

Non-standalone components declared in `AppModule` get the pipe automatically via the `TranslocoModule` import in `app.module.ts`.

## Adding a new string

1. Add the key and English value to `src/assets/i18n/en.json`:
   ```json
   "My New String": "My New String"
   ```
2. Add translations to the other language files for any language you can reliably translate. Leave a language file entry out if unsure — it will fall back to English.
3. Use the key in the template or TypeScript as shown above.

## Adding a new language

1. Create `src/assets/i18n/<lang>.json` with key-value pairs.
2. Add the language code to `availableLangs` in `app.module.ts`:
   ```typescript
   provideTransloco({
     config: {
       availableLangs: ['en', 'fr', 'ja', 'es', '<lang>'],
       ...
     },
   }),
   ```
3. Add the language to the `languages` array in `tabsint-config.component.ts`:
   ```typescript
   readonly languages = [
     { code: 'en', label: 'English' },
     { code: 'fr', label: 'French' },
     { code: 'ja', label: 'Japanese' },
     { code: 'es', label: 'Spanish' },
     { code: '<lang>', label: '<Label>' },
   ];
   ```

## Changing the language at runtime

Language selection is persisted in `disk.preferences.language`. The user changes it via the language picker in the TabSINT Config screen. On startup, `app.component.ts` reads the saved preference and calls `transloco.setActiveLang(savedLang)`.

## Testing

Use `TranslocoTestingModule.forRoot(...)` in spec files. Non-standalone component specs configure it in `TestBed`:

```typescript
import { TranslocoTestingModule } from '@jsverse/transloco';

TestBed.configureTestingModule({
  imports: [
    TranslocoTestingModule.forRoot({
      langs: { en: {} },
      translocoConfig: { availableLangs: ['en'], defaultLang: 'en' },
      preloadLangs: true,
    }),
  ],
});
```

Standalone component specs import both the component and the testing module:

```typescript
TestBed.configureTestingModule({
  imports: [
    MyStandaloneComponent,
    TranslocoTestingModule.forRoot({ langs: { en: {} }, translocoConfig: { availableLangs: ['en'], defaultLang: 'en' }, preloadLangs: true }),
  ],
});
```

[PREVIOUS: Result Encryption](encryption.md)

[BACK TO INDEX](developer-guide-index.md)
