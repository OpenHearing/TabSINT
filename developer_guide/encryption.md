# Result Encryption

TabSINT supports optional hybrid encryption of exam results. When enabled, results are encrypted before being written to SQLite storage and to exported files. Decryption of exported files is performed offline using the `tools/TabsintResults.m` MATLAB class.

## Overview

Encryption is opt-in and configured per-protocol via the `publicKey` field in the protocol meta. When present, encryption is applied automatically throughout the results lifecycle:

| Stage | What happens |
|---|---|
| Save to SQLite | AES-256-CBC encrypted with PBKDF2-derived key |
| Read from SQLite | Transparently decrypted before use |
| Export / upload | Hybrid encrypted: AES data + RSA-wrapped key |

## Encryption Scheme

### Storage encryption (SQLite)

Results at rest in SQLite use symmetric AES-256-CBC. The key is derived deterministically from the result's `testDateTime` and the device UUID using PBKDF2-SHA-256 (100,000 iterations), so no key material is stored separately. Encrypted values are stored as a base64 string of `[16-byte random IV | AES ciphertext]`.

### Export encryption (files / upload)

Exported results use hybrid encryption:

1. **AES-256-CBC** encrypts the JSON result. A random 16-byte IV is prepended to the ciphertext; the combined bytes are base64-encoded and written to `<filename>.json.enc`.
2. **RSA-OAEP (SHA-256)** encrypts the raw 32-byte AES key using the protocol's RSA-2048 public key. The result is base64-encoded and written to `<filename>.json.key.enc`.

The private key never leaves the researcher's machine. The app only needs the public key.

## Setup

### 1. Generate a key pair

Use `tools/TabsintResults.m` in MATLAB:

```matlab
tr = TabsintResults;
publickey = tr.generatekey();   % saves tabsint.pem (private) and tabsint.pub
```

This saves `tabsint.pem` (keep this secure — it is your decryption key) and prints the public key string.

### 2. Add the public key to your protocol

Copy the public key string into the protocol's `meta` object:

```json
{
  "title": "My Protocol",
  "publicKey": "-----BEGIN PUBLIC KEY-----\nMIIBIj...\n-----END PUBLIC KEY-----",
  ...
}
```

The value must be a valid PEM-encoded RSA-2048 public key. Newlines should be encoded as `\n` in JSON.

From this point on, all results collected by devices running this protocol will be encrypted automatically.

## Decrypting exported results

Copy the encrypted result files (`*.json.enc` and `*.json.key.enc`) and your private key (`tabsint.pem`) into the same directory, then run in MATLAB:

```matlab
cd('/path/to/results');
tr = TabsintResults;
tr.decrypt();           % auto-detects *.pem in current directory
```

Or if the key file has a custom name:

```matlab
tr.decrypt('mykey.pem');
```

Each `*.json.enc` / `*.json.key.enc` pair is decrypted to a plain `*.json` file. Temporary files are cleaned up automatically.

**Requirement:** `openssl` must be on the system PATH. On Windows, install [OpenSSL for Windows](https://slproweb.com/products/Win32OpenSSL.html) and add it to PATH.

## Implementation details

The encryption logic lives in [`src/app/utilities/encrypt-results.service.ts`](../src/app/utilities/encrypt-results.service.ts) and uses the browser's built-in [Web Crypto API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Crypto_API) — no third-party crypto dependencies.

Key derivation parameters:
- Algorithm: PBKDF2
- Hash: SHA-256
- Iterations: 100,000
- Password: `testDateTime` (ISO string)
- Salt: device UUID

File naming follows the same `constructFilename` convention as plain JSON exports, with `.json.enc` and `.json.key.enc` suffixes.

[PREVIOUS: Conventions](conventions.md)

[BACK TO INDEX](developer-guide-index.md)
