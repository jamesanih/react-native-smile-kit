# SmileID React Native SDK — Completion Design

**Date:** 2026-05-27  
**Status:** Approved  
**Scope:** Close all gaps in the existing scaffold to produce a production-grade, npm-publishable SDK

---

## 1. Architecture Overview

The SDK has two distinct layers that must never leak across each other.

**Native layer (existing):** Four Fabric components — `BiometricKycView`, `SmartSelfieEnrollmentView`, `SmartSelfieAuthenticationView`, `DocumentVerificationView` — plus one TurboModule (`SmileIDModule`) for SDK initialization. iOS uses ObjC++ Fabric view implementations backed by SwiftUI providers via `UIHostingController`. Android uses `SmileIDComposeHostView` (a Kotlin `AbstractComposeView`) with Kotlin/Compose view managers. Codegen specs live in `src/` and use flat props + `DirectEventHandler` throughout.

**JS orchestration layer (to be built):** A thin TypeScript layer that:
- Tracks initialization state and guards `launch()` calls
- Provides an imperative `SmileID.launch()` API via a JS-level modal (no new native code)
- Exports JS wrapper components that enrich native error events with `flowType`
- Exposes a single clean `SmileIDConfig` options bag for credentials

Consumers never import from native component files directly. Everything surfaces through `src/index.tsx`. This rule should be documented prominently in the README and enforced with an ESLint `no-restricted-imports` rule pointing at the internal native component files.

---

## 2. Credential Handling (Bug Fix + API Improvement)

### 2a. Android bug — credentials are silently dropped

`SmileIDModule.kt` currently ignores the `config` parameter:

```kotlin
// BUG: config is received but never forwarded
SmileID.initialize(reactApplicationContext, useSandbox = useSandbox)
```

Fix: parse the `ReadableMap` and construct the SmileID Android `Config` object before calling `initialize()`:

```kotlin
val smileConfig = Config(
  partnerId     = config?.getString("partnerId") ?: "",
  authToken     = config?.getString("authToken") ?: "",
  prodLambdaUrl = config?.getString("prodLambdaUrl"),
  testLambdaUrl = config?.getString("testLambdaUrl"),
)
SmileID.initialize(reactApplicationContext, config = smileConfig, useSandbox = useSandbox)
```

If `config` is null, fall back to SmileID's default file-based config (same pattern iOS already uses).

### 2b. Public JS API — replace positional args with an options bag

**Before (current — awkward, untyped):**
```ts
initialize(useSandbox: boolean, enableCrashReporting: boolean, config?: Object): Promise<void>
```

**After (typed, ergonomic):**
```ts
export interface SmileIDConfig {
  partnerId:             string;
  authToken:             string;
  prodLambdaUrl?:        string;
  testLambdaUrl?:        string;
  useSandbox?:           boolean; // default: false
  enableCrashReporting?: boolean; // default: true
  callbackUrl?:          string;
}

// Usage
await SmileID.initialize({
  partnerId: 'YOUR_PARTNER_ID',
  authToken: 'YOUR_AUTH_TOKEN',
  useSandbox: true,
});
```

The JS `initialize()` wrapper validates that `partnerId` and `authToken` are non-empty strings before calling native, throwing a descriptive `Error` immediately if either is missing:

```
SmileID.initialize() requires partnerId and authToken.
Alternatively, place smile_config.json in your iOS bundle or Android assets/.
```

The NativeSmileID TurboModule spec (`NativeSmileID.ts`) stays as-is at the native boundary. The typed `SmileIDConfig` interface and the validation wrapper live in the JS orchestration layer only.

### 2c. Three supported credential modes (both platforms)

| Mode | How it works | When to use |
|------|-------------|-------------|
| **Programmatic** (recommended) | Pass `partnerId` + `authToken` in `initialize()` | Runtime config, CI/CD environments |
| **Environment variables** | Use `react-native-config` to read from `.env` | Teams with existing env-var infrastructure |
| **Config file** (fallback) | `smile_config.json` in iOS bundle / Android `assets/` | Static credentials baked into the app |

The README will document all three modes. The `.env` example to include:

```ts
import Config from 'react-native-config';

await SmileID.initialize({
  partnerId: Config.SMILE_PARTNER_ID,
  authToken: Config.SMILE_AUTH_TOKEN,
  useSandbox: Config.SMILE_SANDBOX === 'true',
});
```

iOS already handles the file fallback. Android needs the same: if `config` param is null/empty, call `SmileID.initialize()` without a config object and let the Android SDK pick up `smile_config.json` from assets automatically.

---

## 3. Initialization State Guard

`SmileID.initialize()` is async. The SDK tracks state in a module-level variable (no React state, no context):

```
idle → initializing → ready
                    ↘ error(message)
```

Rules:
- `SmileID.launch()` called in `idle` or `initializing` state: throws synchronously — `"SmileID not initialized. Await SmileID.initialize() before launching flows."`
- `SmileID.launch()` called in `error` state: throws — `"SmileID initialization failed: <original error message>. Call SmileID.initialize() again."`
- `SmileIDPortal` rendered before `ready`: renders nothing + logs a console warning. Does not crash.
- After successful `initialize()`: state moves to `ready`, all subsequent `launch()` calls proceed normally.

The SDK exposes `getInitState()` for consumers who need to check state programmatically:

```ts
SmileID.getInitState(); // 'idle' | 'initializing' | 'ready' | 'error'
```

The SDK also exposes `onStateChange()` which returns an unsubscribe function, used internally by `useSmileID` (see Section 12):

```ts
const unsubscribe = SmileID.onStateChange((state) => {
  console.log('SmileID state:', state);
});
// call unsubscribe() to remove the listener
```

State change listeners are stored in a module-level `Set` and notified synchronously whenever state transitions.

The README setup guide will explicitly tell consumers to `await SmileID.initialize()` before rendering any SmileID UI and suggest a loading screen pattern while it resolves.

---

## 4. Consistent Error Shape and Result Types

All four flows, both platforms, both trigger styles surface a single error type to consumers.

```ts
export type SmileFlow =
  | 'biometric_kyc'
  | 'smart_selfie_enrollment'
  | 'smart_selfie_authentication'
  | 'document_verification';

export type SmileError = {
  code:     string;
  message:  string;
  flowType: SmileFlow;
};

// Per-flow success result types (match the codegen event payloads exactly)
export type BiometricKycResult = {
  selfieImage:           string;
  livenessImages:        string; // JSON-encoded string array — use parseLivenessImages()
  didSubmitBiometricJob: boolean;
};

export type SmartSelfieEnrollmentResult = {
  selfieImage:            string;
  livenessImages:         string;
  didSubmitEnrollmentJob: boolean;
};

export type SmartSelfieAuthenticationResult = {
  selfieImage:                string;
  livenessImages:             string;
  didSubmitAuthenticationJob: boolean;
};

export type DocumentVerificationResult = {
  selfieImage:                      string;
  documentFrontImage:               string;
  documentBackImage?:               string;
  didSubmitDocumentVerificationJob: boolean;
};

// Union for use with SmileID.launch() callbacks
export type SmileResult =
  | BiometricKycResult
  | SmartSelfieEnrollmentResult
  | SmartSelfieAuthenticationResult
  | DocumentVerificationResult;
```

**`livenessImages` utility:** Native sends `livenessImages` as a JSON-encoded string because Fabric props must be scalar. The SDK exports a helper so consumers never have to know this:

```ts
export const parseLivenessImages = (raw: string): string[] => {
  try {
    return JSON.parse(raw);
  } catch {
    return [];
  }
};
```

**Implementation strategy — enrichment at the JS layer only:**

- Raw Fabric events from native emit `{ code: string, message: string }`. The codegen specs and native implementations are not changed.
- The `SmileIDPortal` (imperative path) wraps the raw event into `SmileError` before calling `onError`, since it always knows the active flow.
- JS wrapper components (declarative path) intercept the raw `onError` prop and inject `flowType` before forwarding to the consumer.

Consumers always receive `SmileError` regardless of which API style they use.

---

## 5. Imperative API — `SmileID.launch()` and `SmileID.dismiss()`

```ts
SmileID.launch(
  flow: SmileFlow,
  options: FlowOptions,
  callbacks: {
    onSuccess: (result: SmileResult) => void;
    onError:   (error: SmileError)   => void;
  }
): void;

SmileID.dismiss(): void; // closes the active modal, if any
```

`launch()` sets a module-level active-flow descriptor and calls a registered setter from `SmileIDPortal` to trigger a re-render. No React context, no event emitter library — just a plain JS module-level callback ref.

`dismiss()` clears the active-flow descriptor via the same setter, closing the modal without invoking any callback. Useful for timeout scenarios or custom back-button handling.

### Runtime validation

Before calling native, `launch()` validates required options per flow:

```ts
if (flow === 'biometric_kyc') {
  const opts = options as BiometricKycOptions;
  if (!opts.countryCode || !opts.idType || !opts.idNumber) {
    throw new Error('biometric_kyc requires countryCode, idType, and idNumber');
  }
}
// ... equivalent guards for the other three flows
```

This catches misconfigured calls at the JS boundary before they reach native.

### Per-flow option types

```ts
export interface BiometricKycOptions {
  countryCode:         string;
  idType:              string;
  idNumber:            string;
  firstName:           string;
  lastName:            string;
  userId?:             string;
  jobId?:              string;
  allowAgentMode?:     boolean;
  allowNewEnroll?:     boolean;
  showInstructions?:   boolean;
  showAttribution?:    boolean;
  useStrictMode?:      boolean;
  extraPartnerParams?: string;
}

export interface SmartSelfieEnrollmentOptions {
  userId?:             string;
  jobId?:              string;
  allowAgentMode?:     boolean;
  showInstructions?:   boolean;
  showAttribution?:    boolean;
  extraPartnerParams?: string;
}

export interface SmartSelfieAuthenticationOptions {
  userId:              string;
  jobId?:              string;
  allowAgentMode?:     boolean;
  showInstructions?:   boolean;
  showAttribution?:    boolean;
  extraPartnerParams?: string;
}

export interface DocumentVerificationOptions {
  countryCode:         string;
  documentType:        string;
  userId?:             string;
  jobId?:              string;
  showInstructions?:   boolean;
  showAttribution?:    boolean;
  allowAgentMode?:     boolean;
  showSkipButton?:     boolean;
  extraPartnerParams?: string;
}

export type FlowOptions =
  | BiometricKycOptions
  | SmartSelfieEnrollmentOptions
  | SmartSelfieAuthenticationOptions
  | DocumentVerificationOptions;
```

---

## 6. `SmileIDPortal` — Modal Host

Consumers mount once at the app root (above the navigation container):

```tsx
import { SmileIDPortal } from 'rn-wrap';

export default function App() {
  return (
    <>
      <YourNavigationContainer />
      <SmileIDPortal />
    </>
  );
}
```

Internals:
- `SmileIDPortal` holds local React state: `activeFlow: SmileFlow | null` and `activeOptions`.
- On mount it registers a setter into a module-level ref that `SmileID.launch()` and `SmileID.dismiss()` call.
- Renders a RN `Modal` (`transparent={false}`, `animationType="slide"`) when `activeFlow` is non-null.
- Inside the Modal, a `switch(activeFlow)` renders the correct Fabric component with `activeOptions` spread as props.
- On `onSuccess` or `onError` from the Fabric component: clears `activeFlow` (closing the modal), enriches the error with `flowType`, then invokes the consumer's callback.
- If `SmileID.initialize()` hasn't completed, `SmileIDPortal` renders nothing and logs a console warning.

---

## 7. Declarative Component Wrappers

Instead of re-exporting raw Fabric components, `index.tsx` exports JS wrappers that:
1. Accept the same props as the codegen spec
2. Pass all props through to the native Fabric component
3. Intercept `onError` to inject `flowType` before forwarding

`e.nativeEvent` is typed explicitly to avoid TypeScript inference issues:

```tsx
type RawNativeError = { code: string; message: string };

export function BiometricKycView(props: BiometricKycOptions & {
  onSuccess?: (result: BiometricKycResult) => void;
  onError?:   (error: SmileError) => void;
  style?:     ViewStyle;
}) {
  return (
    <NativeBiometricKycView
      {...props}
      onError={props.onError
        ? (e: { nativeEvent: RawNativeError }) =>
            props.onError!({ ...e.nativeEvent, flowType: 'biometric_kyc' })
        : undefined
      }
      onSuccess={props.onSuccess
        ? (e: { nativeEvent: BiometricKycResult }) =>
            props.onSuccess!(e.nativeEvent)
        : undefined
      }
    />
  );
}
```

Same pattern for all four flows.

---

## 8. Android BiometricKYC Gap

Three files to create, one file to update:

| File | Action |
|------|--------|
| `android/.../BiometricKycView.kt` | New — extends `SmileIDComposeHostView`, renders `SmileID.BiometricKyc(...)` in Compose `Content()`, dispatches `onSuccess`/`onError` via `dispatchDirectEvent` |
| `android/.../BiometricKycViewManager.kt` | New — `SimpleViewManager<BiometricKycView>`, registers all props matching codegen spec, maps prop setters |
| `RnWrapPackage.kt` | Add `BiometricKycViewManager()` to `createViewManagers` list |

Pattern mirrors `SmartSelfieEnrollmentView.kt` / `SmartSelfieEnrollmentViewManager.kt` exactly.

---

## 9. SDK Size Minimization

### Android — ProGuard/R8 + ABI splits

Document in README under "Minimizing SDK Size":

```gradle
// app/build.gradle
android {
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }

  splits {
    abi {
      enable true
      reset()
      include 'arm64-v8a', 'x86_64'
    }
  }
}
```

ABI splits significantly reduce Play Store distribution size by shipping per-architecture APKs.

### iOS — Dead code stripping + dynamic frameworks

Document in README:

```ruby
# Podfile — prefer dynamic linking
use_frameworks! :linkage => :dynamic
```

Xcode build settings (add to release configuration):
- `DEAD_CODE_STRIPPING = YES`
- `STRIP_INSTALLED_PRODUCT = YES`
- `DEBUG_INFORMATION_FORMAT = dwarf-with-dsym` (keeps symbols for crash reporting without bloating the binary)

---

## 10. `src/index.tsx` — Final Public API Surface

```ts
// Init
export { SmileID } from './SmileID';
export type { SmileIDConfig } from './SmileID';

// Portal (mount once at app root)
export { SmileIDPortal } from './SmileIDPortal';

// Hook
export { useSmileID } from './useSmileID';

// Utilities
export { parseLivenessImages } from './utils';

// Types
export type { SmileFlow, SmileError, SmileResult } from './types';
export type {
  BiometricKycOptions,
  BiometricKycResult,
  SmartSelfieEnrollmentOptions,
  SmartSelfieEnrollmentResult,
  SmartSelfieAuthenticationOptions,
  SmartSelfieAuthenticationResult,
  DocumentVerificationOptions,
  DocumentVerificationResult,
} from './types';

// Declarative components (JS wrappers over Fabric)
export { BiometricKycView }              from './BiometricKycView';
export { SmartSelfieEnrollmentView }     from './SmartSelfieEnrollmentView';
export { SmartSelfieAuthenticationView } from './SmartSelfieAuthenticationView';
export { DocumentVerificationView }      from './DocumentVerificationView';
```

No star re-exports. No default exports from index. All named.

---

## 11. Example App Structure

Three screens:

**Screen 1 — Credentials (first screen on launch):** Text inputs for `partnerId` and `authToken`, a sandbox toggle, and an "Initialize" button. Calls `SmileID.initialize()` on press, shows a loading indicator during init, then navigates to the main tabs on success. Makes the example immediately runnable without hardcoded credentials.

**Tab 1 — Imperative:** Four buttons, one per flow. Each calls `SmileID.launch(flow, options, callbacks)`. Shows a result/error `Text` below each button after completion. Also demonstrates `SmileID.dismiss()` via a "Cancel active flow" button.

**Tab 2 — Declarative:** Each flow rendered as an embedded `View` component inside a `ScrollView`. Demonstrates the component API with `onSuccess`/`onError` handlers.

All three screens share a single `SmileIDPortal` mounted at the example app root.

---

## 12. `useSmileID` Hook

A React hook that ties init state to rendering lifecycle:

```ts
export type InitState = 'idle' | 'initializing' | 'ready' | 'error';

export const useSmileID = () => {
  const [initState, setInitState] = useState<InitState>(SmileID.getInitState());

  useEffect(() => {
    const unsubscribe = SmileID.onStateChange(setInitState);
    return unsubscribe;
  }, []);

  return {
    initState,
    isReady:  initState === 'ready',
    launch:   SmileID.launch,
    dismiss:  SmileID.dismiss,
  };
};
```

Usage:

```tsx
const { isReady, launch } = useSmileID();

if (!isReady) return <ActivityIndicator />;

return (
  <Button onPress={() => launch('biometric_kyc', options, callbacks)} />
);
```

The hook does not call `initialize()` — that remains the consumer's explicit responsibility at app startup.

---

## Implementation Order

1. Android BiometricKYC gap (Section 8) — native, isolated, lowest risk
2. Android credentials bug fix (Section 2a) — native, critical correctness fix
3. JS types file `src/types.ts` (Section 4) — foundation for everything JS
4. `SmileID` init wrapper + state machine `src/SmileID.ts` (Sections 2b, 3, 5)
5. `SmileIDPortal` `src/SmileIDPortal.tsx` (Section 6)
6. Declarative wrappers `src/Biometric*.tsx` etc. (Section 7)
7. `useSmileID` hook `src/useSmileID.ts` (Section 12)
8. `parseLivenessImages` utility `src/utils.ts` (Section 4)
9. `src/index.tsx` cleanup (Section 10)
10. Example app (Section 11)

---

## Out of Scope

- Offline/network resilience (handled by the underlying SmileID native SDK)
- Custom UI theming of the verification screens (SmileID native SDK controls that)
- Server-side job status polling (consumer responsibility)
- Biometric data storage (native SDK responsibility)
