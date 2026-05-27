# rn-wrap — SmileID React Native Setup Guide

A step-by-step guide for integrating the `rn-wrap` SmileID library into a React Native **New Architecture** (Fabric + TurboModules) app on iOS.

---

## Prerequisites

| Requirement | Version |
|---|---|
| React Native | 0.73 or later (New Architecture enabled) |
| Node.js | 18 or later |
| Xcode | 15 or later |
| CocoaPods | 1.14 or later |
| iOS Deployment Target | 13.0 or later |

> **New Architecture must be enabled** — this library uses Fabric components and TurboModules. Add `RCTNewArchEnabled=1` to `ios/.xcode.env.local` or ensure your `Info.plist` contains `<key>RCTNewArchEnabled</key><true/>`.

---

## Step 1 — Copy the library into your workspace

Because `rn-wrap` is a local library (not published to npm), place it as a sibling of your app folder:

```
your-workspace/
├── MyApp/          ← your React Native app
└── rn-wrap/        ← this library
```

Build the library's JS output before linking it:

```bash
cd rn-wrap
yarn install
npx react-native-builder-bob build
```

This produces `rn-wrap/lib/module/` (the ESM output Metro uses).

---

## Step 2 — Configure Metro (critical dual-module fix)

This is the most important step. Without it you will see:

```
View config getter callback for component `BiometricKycView` must be a function (received `undefined`)
```

**Why this happens:** `rn-wrap` has its own `node_modules/react-native`. Metro's normal resolver finds it first, creating a *second* copy of `ReactNativeViewConfigRegistry`. The component registers in rn-wrap's copy, but the Fabric renderer reads the app's copy — they are separate Maps, so the component appears unregistered.

`extraNodeModules` alone does **not** fix this — it is only a fallback checked *after* normal resolution succeeds. The fix is `resolver.resolveRequest`, which intercepts *before* normal resolution.

Replace (or create) `metro.config.js` in your app root:

```js
const path = require('path');
const { getDefaultConfig, mergeConfig } = require('@react-native/metro-config');

const rnWrapPath = path.resolve(__dirname, '../rn-wrap');

const config = {
  watchFolders: [rnWrapPath],
  resolver: {
    // Use react-native > browser > main field order.
    // This loads rn-wrap from src/index.tsx (the react-native field)
    // rather than lib/module/index.js (the exports.default field).
    unstable_enablePackageExports: false,
    resolverMainFields: ['react-native', 'browser', 'main'],
    extraNodeModules: {
      'rn-wrap': rnWrapPath,
    },
    // resolveRequest intercepts BEFORE normal resolution and redirects
    // all react-native/* and react/* imports from rn-wrap files to
    // the app's copies, preventing the dual-module split.
    resolveRequest: (context, moduleName, platform) => {
      if (
        context.originModulePath.startsWith(rnWrapPath + path.sep) &&
        (moduleName === 'react-native' ||
          moduleName.startsWith('react-native/') ||
          moduleName === 'react' ||
          moduleName.startsWith('react/'))
      ) {
        return context.resolveRequest(
          { ...context, originModulePath: path.join(__dirname, 'index.js') },
          moduleName,
          platform,
        );
      }
      return context.resolveRequest(context, moduleName, platform);
    },
  },
};

module.exports = mergeConfig(getDefaultConfig(__dirname), config);
```

---

## Step 3 — Link the pod

In `ios/Podfile`, ensure the SmileID pod and the local library are linked:

```ruby
target 'MyApp' do
  # ... existing config ...

  pod 'RnWrap', :path => '../../rn-wrap'
  pod 'SmileID', '~> 10.0'   # use the version your rn-wrap targets
end
```

Then install pods:

```bash
cd ios && pod install && cd ..
```

---

## Step 4 — Add iOS privacy usage descriptions

SmileID's biometric flows require camera and microphone access. Without these keys in `Info.plist` the app will crash immediately when the SDK opens the camera:

```
This app has crashed because it attempted to access privacy-sensitive data
without a usage description. The app's Info.plist must contain an
NSCameraUsageDescription key.
```

Open `ios/MyApp/Info.plist` and add:

```xml
<key>NSCameraUsageDescription</key>
<string>This app uses your camera to verify your identity via selfie and liveness detection.</string>
<key>NSMicrophoneUsageDescription</key>
<string>This app uses your microphone during identity verification.</string>
```

---

## Step 5 — Initialize SmileID

Initialize the SDK once, early in your app (e.g. inside a `useEffect` at the root):

```tsx
import { SmileID } from 'rn-wrap';

useEffect(() => {
  SmileID.initialize(
    true,   // useSandbox — set false for production
    false,  // enableCrashReporting
    {
      partner_id: 'YOUR_PARTNER_ID',
      auth_token: 'YOUR_AUTH_TOKEN',
      prod_lambda_url: 'https://api.smileidentity.com/v1',
      test_lambda_url: 'https://testapi.smileidentity.com/v1',
    },
  ).then(() => setSdkReady(true))
   .catch((e: Error) => setInitError(e.message));
}, []);
```

Get your `partner_id` and `auth_token` from the [SmileID Partner Portal](https://portal.smileidentity.com).

---

## Step 6 — Use the components

### BVN KYC (Biometric KYC)

Verifies a user's face against their BVN record. Collects first name, last name, and BVN number, then runs a liveness check.

```tsx
import { BiometricKycView } from 'rn-wrap';

<BiometricKycView
  countryCode="NG"
  idType="BVN"
  idNumber={bvnNumber}        // 11-digit BVN string
  firstName={firstName}
  lastName={lastName}
  showInstructions            // show SmileID instructions screen
  showAttribution             // show SmileID branding
  onSuccess={(e) => {
    const { selfieImage, livenessImages, didSubmitBiometricJob } = e.nativeEvent;
    // selfieImage: file URL string
    // livenessImages: JSON string of URL array
    // didSubmitBiometricJob: boolean
  }}
  onError={(e) => {
    const { message, code } = e.nativeEvent;
  }}
  style={{ flex: 1 }}
/>
```

**Supported props:**

| Prop | Type | Required | Description |
|---|---|---|---|
| `countryCode` | string | ✓ | ISO 3166-1 alpha-2 country code (e.g. `"NG"`) |
| `idType` | string | ✓ | Document type (e.g. `"BVN"`) |
| `idNumber` | string | ✓ | The ID number to verify against |
| `firstName` | string | ✓ | User's first name |
| `lastName` | string | ✓ | User's last name |
| `userId` | string | | Stable ID for the user (auto-generated UUID if omitted) |
| `jobId` | string | | Job ID for this verification (auto-generated UUID if omitted) |
| `allowAgentMode` | boolean | | Allow offline/agent-assisted mode |
| `allowNewEnroll` | boolean | | Allow re-enrollment of existing users |
| `showInstructions` | boolean | | Show instructions screen before capture |
| `showAttribution` | boolean | | Show SmileID branding |
| `useStrictMode` | boolean | | Enforce stricter liveness requirements |
| `extraPartnerParams` | string | | JSON string of `[{key, value}]` pairs for extra metadata |

### SmartSelfie Enrollment

Enrolls a new user's face:

```tsx
import { SmartSelfieEnrollmentView } from 'rn-wrap';

<SmartSelfieEnrollmentView
  showInstructions
  showAttribution
  onSuccess={(e) => console.log(e.nativeEvent)}
  onError={(e) => console.log(e.nativeEvent)}
  style={{ flex: 1 }}
/>
```

### SmartSelfie Authentication

Authenticates a previously enrolled user:

```tsx
import { SmartSelfieAuthenticationView } from 'rn-wrap';

<SmartSelfieAuthenticationView
  userId="enrolled-user-id"
  showInstructions
  showAttribution
  onSuccess={(e) => console.log(e.nativeEvent)}
  onError={(e) => console.log(e.nativeEvent)}
  style={{ flex: 1 }}
/>
```

### Document Verification

Captures and verifies a government-issued ID document:

```tsx
import { DocumentVerificationView } from 'rn-wrap';

<DocumentVerificationView
  countryCode="NG"
  documentType="NATIONAL_ID"
  captureBothSides={false}
  showInstructions
  showAttribution
  onSuccess={(e) => console.log(e.nativeEvent)}
  onError={(e) => console.log(e.nativeEvent)}
  style={{ flex: 1 }}
/>
```

---

## Step 7 — Build and run

Always do a full native rebuild after:
- Changing `Info.plist`
- Changing `Podfile` or running `pod install`
- Changing native Swift/ObjC files

```bash
# Clear Metro cache to pick up rn-wrap source changes
npx react-native start --reset-cache

# In another terminal
npx react-native run-ios
```

---

## Complete BVN KYC flow example

```tsx
import React, { useEffect, useState } from 'react';
import {
  SafeAreaView, ScrollView, Text, TextInput,
  TouchableOpacity, ActivityIndicator, StyleSheet,
} from 'react-native';
import { SmileID, BiometricKycView } from 'rn-wrap';

type Screen = 'form' | 'capture';

export default function BvnKycFlow() {
  const [screen, setScreen] = useState<Screen>('form');
  const [ready, setReady] = useState(false);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [bvn, setBvn] = useState('');
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    SmileID.initialize(true, false, {
      partner_id: 'YOUR_PARTNER_ID',
      auth_token: 'YOUR_AUTH_TOKEN',
      prod_lambda_url: 'https://api.smileidentity.com/v1',
      test_lambda_url: 'https://testapi.smileidentity.com/v1',
    }).then(() => setReady(true));
  }, []);

  if (!ready) {
    return (
      <SafeAreaView style={styles.center}>
        <ActivityIndicator size="large" />
      </SafeAreaView>
    );
  }

  if (screen === 'capture') {
    return (
      <SafeAreaView style={{ flex: 1 }}>
        <BiometricKycView
          countryCode="NG"
          idType="BVN"
          idNumber={bvn}
          firstName={firstName}
          lastName={lastName}
          showInstructions
          showAttribution
          onSuccess={(e: any) => {
            setResult(JSON.stringify(e.nativeEvent, null, 2));
            setScreen('form');
          }}
          onError={(e: any) => {
            setResult(`Error: ${e.nativeEvent.message}`);
            setScreen('form');
          }}
          style={{ flex: 1 }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1 }}>
      <ScrollView contentContainerStyle={styles.form}>
        <Text style={styles.title}>BVN Verification</Text>

        <TextInput style={styles.input} placeholder="First Name"
          value={firstName} onChangeText={setFirstName} autoCapitalize="words" />
        <TextInput style={styles.input} placeholder="Last Name"
          value={lastName} onChangeText={setLastName} autoCapitalize="words" />
        <TextInput style={styles.input} placeholder="11-digit BVN"
          value={bvn} onChangeText={setBvn} keyboardType="numeric" maxLength={11} />

        {result && <Text style={styles.result}>{result}</Text>}

        <TouchableOpacity
          style={[styles.btn, (!firstName || !lastName || bvn.length < 11) && styles.disabled]}
          disabled={!firstName || !lastName || bvn.length < 11}
          onPress={() => setScreen('capture')}>
          <Text style={styles.btnText}>Start Verification</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  form: { padding: 24 },
  title: { fontSize: 24, fontWeight: '700', marginBottom: 24 },
  input: {
    borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8,
    paddingHorizontal: 14, paddingVertical: 12, fontSize: 16, marginBottom: 16,
  },
  btn: {
    backgroundColor: '#16a34a', borderRadius: 12,
    paddingVertical: 16, alignItems: 'center',
  },
  disabled: { backgroundColor: '#94a3b8' },
  btnText: { color: '#fff', fontSize: 16, fontWeight: '600' },
  result: { fontFamily: 'monospace', fontSize: 12, marginBottom: 16, color: '#374151' },
});
```

---

## Troubleshooting

### `View config getter callback for component X must be a function (received undefined)`

**Cause:** Metro is resolving `react-native` from inside `rn-wrap/node_modules/` instead of the app's `node_modules/`. This creates two separate `ReactNativeViewConfigRegistry` instances — the component registers in one, the renderer reads the other.

**Fix:** The `resolveRequest` hook in Step 2 is the only reliable fix. `extraNodeModules` alone does not work because it is only a fallback checked *after* normal module resolution, which already found rn-wrap's local copy.

After adding the hook, clear Metro's cache completely:

```bash
npx react-native start --reset-cache
```

---

### App crashes on camera open with `NSCameraUsageDescription` required

**Cause:** iOS TCC (privacy enforcement) kills the app because `Info.plist` is missing the camera usage description.

**Fix:** Add the keys from Step 4, then do a full native rebuild (`npx react-native run-ios`). Changing `Info.plist` alone is not enough — it must be recompiled into the app bundle.

---

### `ENOENT: src/BiometricKycViewNativeComponent.tsx` during bob build

**Cause:** `react-native-builder-bob` looks for `.tsx` but the file is `.ts`.

**Fix:** Ensure the file is named `BiometricKycViewNativeComponent.ts` (not `.tsx`). Then rebuild:

```bash
cd rn-wrap && npx react-native-builder-bob build
```

---

### Pod install fails / SmileID pod not found

Ensure your `Podfile` has the correct source and the path points to the right directory relative to `ios/Podfile`:

```ruby
source 'https://cdn.cocoapods.org/'
pod 'RnWrap', :path => '../../rn-wrap'
```

Then:

```bash
cd ios && pod install --repo-update
```

---

### DerivedData conflicts after native changes

When you change native Swift, Objective-C, or `.mm` files, Xcode's incremental build sometimes misses changes. Clean DerivedData:

```bash
rm -rf ~/Library/Developer/Xcode/DerivedData/MyApp-*
npx react-native run-ios
```

---

## Library architecture overview

```
rn-wrap/
├── src/
│   ├── BiometricKycViewNativeComponent.ts      ← Fabric JS spec (codegenNativeComponent)
│   ├── DocumentVerificationViewNativeComponent.ts
│   ├── SmartSelfieAuthenticationViewNativeComponent.ts
│   ├── SmartSelfieEnrollmentViewNativeComponent.ts
│   ├── NativeSmileID.ts                        ← TurboModule spec (TurboModuleRegistry)
│   └── index.tsx                               ← public exports
├── ios/
│   ├── BiometricKycView.h / .mm               ← RCTViewComponentView (Fabric C++ bridge)
│   ├── BiometricKycViewProvider.swift          ← UIView hosting UIHostingController
│   └── BiometricKycRootView.swift             ← SwiftUI view calling SmileID.biometricKycScreen
└── lib/
    └── module/                                 ← built output (run `bob build`)
```

**Data flow:**
1. React renders `<BiometricKycView props... />` → Fabric props diffed in C++
2. `BiometricKycView.mm` receives `updateProps` → updates `BiometricKycViewProvider`
3. `BiometricKycViewProvider` rebuilds `BiometricKycRootView` SwiftUI view
4. SmileID SDK handles capture, calls delegate
5. Delegate fires `onSuccess`/`onError` → C++ event emitter → JS `nativeEvent`
