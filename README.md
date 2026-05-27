# react-native-smile-kit

React Native SDK wrapping the [Smile Identity](https://usesmileid.com) native SDKs for iOS and Android.

Built on React Native New Architecture (Fabric + TurboModules). Supports BiometricKYC, SmartSelfie Enrollment/Authentication, and Document Verification.

## Requirements

- React Native ≥ 0.76 (New Architecture enabled)
- iOS 14+
- Android API 21+

## Installation

```sh
npm install react-native-smile-kit
# or
yarn add react-native-smile-kit
```

### iOS

```sh
cd ios && pod install
```

### Android

No extra steps — the package links automatically via autolinking.

## Setup

Mount `<SmileIDPortal />` **once** at your app root (required for the imperative API):

```tsx
import { SmileIDPortal } from 'react-native-smile-kit';

export default function App() {
  return (
    <>
      <YourApp />
      <SmileIDPortal />
    </>
  );
}
```

## Initializing the SDK

Call `SmileID.initialize()` before launching any flow. This is typically done on a credentials screen or inside an authentication gate.

```tsx
import { SmileID } from 'react-native-smile-kit';

await SmileID.initialize({
  partnerId: 'YOUR_PARTNER_ID',
  authToken: 'YOUR_AUTH_TOKEN',
  useSandbox: true, // false for production
});
```

**Three credential modes:**

| Mode | When to use |
|------|-------------|
| `partnerId` + `authToken` | Standard: credentials provided at runtime |
| `useSandbox: true` only | Testing with bundled sandbox config |
| No config (plist/JSON in bundle) | Credentials baked into the app bundle |

## Imperative API

Use the `useSmileID` hook or call `SmileID.launch()` directly.

```tsx
import { useSmileID } from 'react-native-smile-kit';
import type { SmileResult, SmileError } from 'react-native-smile-kit';

function MyScreen() {
  const { launch, dismiss, isReady } = useSmileID();

  return (
    <Button
      disabled={!isReady}
      onPress={() =>
        launch(
          'biometric_kyc',
          {
            countryCode: 'NG',
            idType: 'NIN_V2',
            idNumber: '00000000000',
            firstName: 'Ada',
            lastName: 'Obi',
          },
          {
            onSuccess: (result: SmileResult) => console.log(result),
            onError: (error: SmileError) => console.error(error),
          }
        )
      }
      title="Start Biometric KYC"
    />
  );
}
```

### Available flows

| Flow key | Options type | Result type |
|----------|-------------|-------------|
| `'biometric_kyc'` | `BiometricKycOptions` | `BiometricKycResult` |
| `'smart_selfie_enrollment'` | `SmartSelfieEnrollmentOptions` | `SmartSelfieEnrollmentResult` |
| `'smart_selfie_authentication'` | `SmartSelfieAuthenticationOptions` | `SmartSelfieAuthenticationResult` |
| `'document_verification'` | `DocumentVerificationOptions` | `DocumentVerificationResult` |

Call `dismiss()` to programmatically close an active flow.

## Declarative API

Embed flows directly as components. Each component fills its parent's layout.

```tsx
import { BiometricKycView, DocumentVerificationView } from 'react-native-smile-kit';

<BiometricKycView
  countryCode="NG"
  idType="NIN_V2"
  idNumber="00000000000"
  firstName="Ada"
  lastName="Obi"
  style={{ height: 400 }}
  onSuccess={(result) => console.log(result)}
  onError={(error) => console.error(error)}
/>

<DocumentVerificationView
  countryCode="NG"
  documentType="NATIONAL_ID"
  style={{ height: 400 }}
  onSuccess={(result) => console.log(result)}
  onError={(error) => console.error(error)}
/>
```

## Error handling

All `onError` callbacks receive a consistent `SmileError` shape:

```ts
type SmileError = {
  code: string;
  message: string;
  flowType: SmileFlow; // which flow produced the error
};
```

## Liveness images

`BiometricKycResult.livenessImages` arrives as a JSON-serialized string from Android. Use the provided helper to decode it:

```ts
import { parseLivenessImages } from 'react-native-smile-kit';

const paths: string[] = parseLivenessImages(result.livenessImages);
```

## API reference

### `SmileID`

| Method | Signature | Description |
|--------|-----------|-------------|
| `initialize` | `(config?: SmileIDConfig) => Promise<void>` | Initialize the SDK with optional credentials |
| `launch` | `(flow, options, callbacks) => void` | Open a flow via SmileIDPortal |
| `dismiss` | `() => void` | Close the active flow |
| `getInitState` | `() => InitState` | Synchronous state read (`'idle' \| 'initializing' \| 'ready' \| 'error'`) |
| `onStateChange` | `(listener) => () => void` | Subscribe to init state changes; returns unsubscribe fn |

### `useSmileID`

```ts
const { initState, isReady, launch, dismiss } = useSmileID();
```

Subscribes to `SmileID` state changes and re-renders on transitions.

## SDK size minimization

### Android

Enable R8/ProGuard in your `android/app/build.gradle`:

```groovy
buildTypes {
    release {
        minifyEnabled true
        proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
}
```

### iOS

Use dynamic frameworks and enable dead code stripping in your Xcode build settings:

- **Dead Code Stripping**: YES
- **Strip Linked Product**: YES
- Avoid `use_frameworks! :linkage => :static` unless required by other dependencies.

## Contributing

- [Development workflow](CONTRIBUTING.md#development-workflow)
- [Sending a pull request](CONTRIBUTING.md#sending-a-pull-request)
- [Code of conduct](CODE_OF_CONDUCT.md)

## License

MIT

---

Made with [create-react-native-library](https://github.com/callstack/react-native-builder-bob)
