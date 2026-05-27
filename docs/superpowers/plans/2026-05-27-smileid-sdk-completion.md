# SmileID SDK Completion Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Close all gaps in the existing SmileID React Native SDK scaffold — Android BiometricKYC parity, credential bug fix, and the full JS orchestration layer (typed init, state guard, imperative launch, portal modal, declarative wrappers, hook, utilities).

**Architecture:** Native Fabric components and TurboModule stay unchanged; a new JS orchestration layer in `src/` wraps them to provide a clean public API. The module-level state machine in `src/SmileID.ts` communicates with `SmileIDPortal` via a registered setter ref — no React context or event emitter needed.

**Tech Stack:** Kotlin + Jetpack Compose (Android), Swift + SwiftUI (iOS), TypeScript + React Native New Architecture (Fabric + TurboModules), Jest (unit tests for JS layer)

---

## File Map

### New files to create

| File | Purpose |
|------|---------|
| `android/.../BiometricKycView.kt` | Compose view hosting `SmileID.BiometricKyc()` |
| `android/.../BiometricKycViewManager.kt` | Fabric view manager for BiometricKyc |
| `src/types.ts` | All public TypeScript types — `SmileFlow`, `SmileError`, `SmileResult`, option/result types |
| `src/SmileID.ts` | JS init wrapper, state machine, `launch()`, `dismiss()`, `getInitState()`, `onStateChange()` |
| `src/SmileIDPortal.tsx` | React modal host that `launch()` drives |
| `src/BiometricKycView.tsx` | JS wrapper over native `BiometricKycViewNativeComponent` |
| `src/SmartSelfieEnrollmentView.tsx` | JS wrapper over native `SmartSelfieEnrollmentViewNativeComponent` |
| `src/SmartSelfieAuthenticationView.tsx` | JS wrapper over native `SmartSelfieAuthenticationViewNativeComponent` |
| `src/DocumentVerificationView.tsx` | JS wrapper over native `DocumentVerificationViewNativeComponent` |
| `src/useSmileID.ts` | React hook subscribing to init state |
| `src/utils.ts` | `parseLivenessImages` helper |
| `src/__tests__/SmileID.test.ts` | Jest tests for init wrapper and state machine |
| `src/__tests__/utils.test.ts` | Jest tests for utilities |

### Files to modify

| File | Change |
|------|--------|
| `android/.../SmileIDExtensions.kt` | Add `BiometricKycResult.toWritableMap()` extension |
| `android/.../SmileIDModule.kt` | Fix credentials: parse config ReadableMap → forward to `SmileID.initialize()` |
| `android/.../RnWrapPackage.kt` | Register `BiometricKycViewManager()` |
| `src/index.tsx` | Replace all exports with clean named-only public surface |
| `eslint.config.mjs` | Add `no-restricted-imports` for native component files |
| `package.json` | Add Jest dev dependency + `jest` config block |
| `example/src/App.tsx` | Three-screen example: credentials, imperative tab, declarative tab |

---

## Task 1: Extend SmileIDExtensions.kt with BiometricKycResult mapping

**Files:**
- Modify: `android/src/main/java/com/rnwrap/SmileIDExtensions.kt`

- [ ] **Step 1: Add the BiometricKycResult extension**

Open `android/src/main/java/com/rnwrap/SmileIDExtensions.kt`. The file currently has extensions for `SmartSelfieResult`, `DocumentVerificationResult`, and `Throwable`. Add the BiometricKyc extension. The full updated file:

```kotlin
package com.rnwrap

import com.facebook.react.bridge.Arguments
import com.facebook.react.bridge.WritableMap
import com.smileidentity.results.BiometricKycResult
import com.smileidentity.results.DocumentVerificationResult
import com.smileidentity.results.SmartSelfieResult
import kotlinx.serialization.encodeToString
import kotlinx.serialization.json.Json
import org.json.JSONArray

fun SmartSelfieResult.toWritableMap(): WritableMap =
  Arguments.createMap().apply {
    putString("result", Json.encodeToString(this@toWritableMap))
  }

fun DocumentVerificationResult.toWritableMap(): WritableMap =
  Arguments.createMap().apply {
    putString("selfie", selfieFile?.absolutePath ?: "")
    putString("documentFrontFile", documentFrontFile?.absolutePath ?: "")
    putString("documentBackFile", documentBackFile?.absolutePath ?: "")
    putBoolean("didSubmitDocumentVerificationJob", didSubmitDocumentVerificationJob)
  }

fun BiometricKycResult.toWritableMap(): WritableMap =
  Arguments.createMap().apply {
    putString("selfieImage", selfieFile?.absolutePath ?: "")
    val arr = JSONArray()
    livenessFiles.forEach { arr.put(it.absolutePath) }
    putString("livenessImages", arr.toString())
    putBoolean("didSubmitBiometricJob", didSubmitBiometricJob)
  }

fun Throwable.toErrorPayload(): WritableMap =
  Arguments.createMap().apply {
    putString("message", message ?: "Unknown error")
    putString("code", "")
  }
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/mac/Documents/rn-wrap && ./example/android/gradlew -p android compileDebugKotlin --no-daemon 2>&1 | tail -20
```

Expected: `BUILD SUCCESSFUL` (or at worst warnings, no errors)

- [ ] **Step 3: Commit**

```bash
git add android/src/main/java/com/rnwrap/SmileIDExtensions.kt
git commit -m "feat(android): add BiometricKycResult.toWritableMap extension"
```

---

## Task 2: Create BiometricKycView.kt

**Files:**
- Create: `android/src/main/java/com/rnwrap/BiometricKycView.kt`

- [ ] **Step 1: Create the view**

```kotlin
package com.rnwrap

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import com.smileidentity.SmileID
import com.smileidentity.results.SmileIDResult
import com.smileidentity.util.randomJobId
import com.smileidentity.util.randomUserId

class BiometricKycView(context: Context) :
  SmileIDComposeHostView(context = context, shouldUseAndroidLayout = true) {

  var countryCode by mutableStateOf("")
  var idType by mutableStateOf("")
  var idNumber by mutableStateOf("")
  var firstName by mutableStateOf("")
  var lastName by mutableStateOf("")
  var userId by mutableStateOf<String?>(null)
  var jobId by mutableStateOf<String?>(null)
  var allowAgentMode by mutableStateOf<Boolean?>(null)
  var allowNewEnroll by mutableStateOf<Boolean?>(null)
  var showInstructions by mutableStateOf<Boolean?>(null)
  var showAttribution by mutableStateOf<Boolean?>(null)
  var useStrictMode by mutableStateOf<Boolean?>(null)
  var extraPartnerParams by mutableStateOf<Map<String, String>>(emptyMap())

  @Composable
  override fun Content() {
    SmileID.BiometricKyc(
      countryCode = countryCode,
      idType = idType,
      idNumber = idNumber,
      firstName = firstName,
      lastName = lastName,
      userId = userId ?: randomUserId(),
      jobId = jobId ?: randomJobId(),
      allowAgentMode = allowAgentMode ?: false,
      allowNewEnroll = allowNewEnroll ?: false,
      showInstructions = showInstructions ?: true,
      showAttribution = showAttribution ?: true,
      useStrictMode = useStrictMode ?: false,
      extraPartnerParams = extraPartnerParams,
      onResult = { result ->
        when (result) {
          is SmileIDResult.Success ->
            dispatchDirectEvent("onSuccess", result.data.toWritableMap())
          is SmileIDResult.Error ->
            dispatchDirectEvent("onError", result.throwable.toErrorPayload())
        }
      },
    )
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/mac/Documents/rn-wrap && ./example/android/gradlew -p android compileDebugKotlin --no-daemon 2>&1 | tail -20
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: Commit**

```bash
git add android/src/main/java/com/rnwrap/BiometricKycView.kt
git commit -m "feat(android): add BiometricKycView Compose host"
```

---

## Task 3: Create BiometricKycViewManager.kt and register it

**Files:**
- Create: `android/src/main/java/com/rnwrap/BiometricKycViewManager.kt`
- Modify: `android/src/main/java/com/rnwrap/RnWrapPackage.kt`

- [ ] **Step 1: Create the view manager**

```kotlin
package com.rnwrap

import com.facebook.react.module.annotations.ReactModule
import com.facebook.react.uimanager.SimpleViewManager
import com.facebook.react.uimanager.ThemedReactContext
import com.facebook.react.uimanager.annotations.ReactProp
import com.facebook.react.viewmanagers.BiometricKycViewManagerDelegate
import com.facebook.react.viewmanagers.BiometricKycViewManagerInterface

@ReactModule(name = BiometricKycViewManager.NAME)
class BiometricKycViewManager :
  SimpleViewManager<BiometricKycView>(),
  BiometricKycViewManagerInterface<BiometricKycView> {

  private val delegate = BiometricKycViewManagerDelegate(this)

  override fun getDelegate() = delegate
  override fun getName() = NAME
  override fun createViewInstance(context: ThemedReactContext) = BiometricKycView(context)

  @ReactProp(name = "countryCode")
  override fun setCountryCode(view: BiometricKycView?, value: String?) {
    view?.countryCode = value ?: ""
  }

  @ReactProp(name = "idType")
  override fun setIdType(view: BiometricKycView?, value: String?) {
    view?.idType = value ?: ""
  }

  @ReactProp(name = "idNumber")
  override fun setIdNumber(view: BiometricKycView?, value: String?) {
    view?.idNumber = value ?: ""
  }

  @ReactProp(name = "firstName")
  override fun setFirstName(view: BiometricKycView?, value: String?) {
    view?.firstName = value ?: ""
  }

  @ReactProp(name = "lastName")
  override fun setLastName(view: BiometricKycView?, value: String?) {
    view?.lastName = value ?: ""
  }

  @ReactProp(name = "userId")
  override fun setUserId(view: BiometricKycView?, value: String?) {
    view?.userId = value?.takeIf { it.isNotEmpty() }
  }

  @ReactProp(name = "jobId")
  override fun setJobId(view: BiometricKycView?, value: String?) {
    view?.jobId = value?.takeIf { it.isNotEmpty() }
  }

  @ReactProp(name = "allowAgentMode")
  override fun setAllowAgentMode(view: BiometricKycView?, value: Boolean) {
    view?.allowAgentMode = value
  }

  @ReactProp(name = "allowNewEnroll")
  override fun setAllowNewEnroll(view: BiometricKycView?, value: Boolean) {
    view?.allowNewEnroll = value
  }

  @ReactProp(name = "showInstructions")
  override fun setShowInstructions(view: BiometricKycView?, value: Boolean) {
    view?.showInstructions = value
  }

  @ReactProp(name = "showAttribution")
  override fun setShowAttribution(view: BiometricKycView?, value: Boolean) {
    view?.showAttribution = value
  }

  @ReactProp(name = "useStrictMode")
  override fun setUseStrictMode(view: BiometricKycView?, value: Boolean) {
    view?.useStrictMode = value
  }

  @ReactProp(name = "extraPartnerParams")
  override fun setExtraPartnerParams(view: BiometricKycView?, value: String?) {
    view?.extraPartnerParams = DocumentVerificationViewManager.parsePartnerParams(value)
  }

  companion object {
    const val NAME = "BiometricKycView"
  }
}
```

- [ ] **Step 2: Register in RnWrapPackage.kt**

Open `android/src/main/java/com/rnwrap/RnWrapPackage.kt`. Replace the `createViewManagers` list:

```kotlin
override fun createViewManagers(reactContext: ReactApplicationContext): List<ViewManager<*, *>> =
  listOf(
    RnWrapViewManager(),
    BiometricKycViewManager(),
    DocumentVerificationViewManager(),
    SmartSelfieAuthenticationViewManager(),
    SmartSelfieEnrollmentViewManager(),
  )
```

- [ ] **Step 3: Verify it compiles**

```bash
cd /Users/mac/Documents/rn-wrap && ./example/android/gradlew -p android compileDebugKotlin --no-daemon 2>&1 | tail -20
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 4: Commit**

```bash
git add android/src/main/java/com/rnwrap/BiometricKycViewManager.kt \
        android/src/main/java/com/rnwrap/RnWrapPackage.kt
git commit -m "feat(android): add BiometricKycViewManager and register in package"
```

---

## Task 4: Fix Android credentials bug in SmileIDModule.kt

**Files:**
- Modify: `android/src/main/java/com/rnwrap/SmileIDModule.kt`

The current `initialize()` receives `config: ReadableMap?` but never forwards it to `SmileID.initialize()`. Fix by constructing a `Config` object from the map.

- [ ] **Step 1: Update SmileIDModule.kt**

Replace the entire file:

```kotlin
package com.rnwrap

import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.ReadableMap
import com.facebook.react.bridge.UiThreadUtil
import com.facebook.react.module.annotations.ReactModule
import com.smileidentity.SmileID
import com.smileidentity.models.Config

@ReactModule(name = SmileIDModule.NAME)
class SmileIDModule(reactContext: ReactApplicationContext) :
  ReactContextBaseJavaModule(reactContext) {

  override fun getName() = NAME

  @ReactMethod
  fun initialize(
    useSandbox: Boolean,
    enableCrashReporting: Boolean,
    config: ReadableMap?,
    apiKey: String?,
    promise: Promise,
  ) {
    UiThreadUtil.runOnUiThread {
      try {
        if (config != null &&
          config.hasKey("partner_id") &&
          !config.getString("partner_id").isNullOrEmpty()
        ) {
          val smileConfig = Config(
            partnerId     = config.getString("partner_id") ?: "",
            authToken     = config.getString("auth_token") ?: "",
            prodLambdaUrl = if (config.hasKey("prod_lambda_url")) config.getString("prod_lambda_url") else null,
            testLambdaUrl = if (config.hasKey("test_lambda_url")) config.getString("test_lambda_url") else null,
          )
          SmileID.initialize(
            reactApplicationContext,
            config = smileConfig,
            useSandbox = useSandbox,
            enableCrashReporting = enableCrashReporting,
          )
        } else {
          // Fall back to smile_config.json in assets
          SmileID.initialize(
            reactApplicationContext,
            useSandbox = useSandbox,
            enableCrashReporting = enableCrashReporting,
          )
        }
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("SmileID_INIT_ERROR", e.message, e)
      }
    }
  }

  @ReactMethod
  fun setCallbackUrl(url: String?, promise: Promise) {
    UiThreadUtil.runOnUiThread {
      try {
        if (!url.isNullOrEmpty()) {
          SmileID.setCallbackUrl(url)
        }
        promise.resolve(null)
      } catch (e: Exception) {
        promise.reject("SmileID_CALLBACK_ERROR", e.message, e)
      }
    }
  }

  companion object {
    const val NAME = "SmileID"
  }
}
```

- [ ] **Step 2: Verify it compiles**

```bash
cd /Users/mac/Documents/rn-wrap && ./example/android/gradlew -p android compileDebugKotlin --no-daemon 2>&1 | tail -20
```

Expected: `BUILD SUCCESSFUL`

- [ ] **Step 3: Commit**

```bash
git add android/src/main/java/com/rnwrap/SmileIDModule.kt
git commit -m "fix(android): forward credentials config to SmileID.initialize()"
```

---

## Task 5: Set up Jest and create src/types.ts

**Files:**
- Modify: `package.json`
- Create: `src/types.ts`
- Create: `src/__tests__/utils.test.ts` (placeholder — actual tests in Task 9)

- [ ] **Step 1: Add Jest to package.json**

In `package.json`, add to `devDependencies`:
```json
"jest": "^29.7.0",
"@types/jest": "^29.5.14",
"babel-jest": "^29.7.0"
```

Add a `jest` config block to `package.json` (at the top level, after `"prettier"`):
```json
"jest": {
  "preset": "react-native",
  "testMatch": ["**/__tests__/**/*.test.ts", "**/__tests__/**/*.test.tsx"],
  "transformIgnorePatterns": [
    "node_modules/(?!(react-native|@react-native|rn-wrap)/)"
  ],
  "moduleNameMapper": {
    "react-native": "<rootDir>/node_modules/react-native"
  }
}
```

- [ ] **Step 2: Install the new deps**

```bash
cd /Users/mac/Documents/rn-wrap && yarn add --dev jest @types/jest babel-jest 2>&1 | tail -10
```

Expected: packages added, no peer dep errors

- [ ] **Step 3: Create src/types.ts**

```typescript
export type SmileFlow =
  | 'biometric_kyc'
  | 'smart_selfie_enrollment'
  | 'smart_selfie_authentication'
  | 'document_verification';

export type SmileError = {
  code: string;
  message: string;
  flowType: SmileFlow;
};

export type BiometricKycResult = {
  selfieImage: string;
  livenessImages: string; // JSON-encoded string array — use parseLivenessImages()
  didSubmitBiometricJob: boolean;
};

// SmartSelfie flows emit the whole result as a JSON-encoded string in `result`
// because native serialises SmartSelfieResult via kotlinx-serialization / Codable.
// Use JSON.parse(result) if you need individual fields.
export type SmartSelfieEnrollmentResult = {
  result: string;
};

export type SmartSelfieAuthenticationResult = {
  result: string;
};

// DocumentVerification field names match what Android SmileIDExtensions.kt and
// the iOS ObjC++ event emitter actually emit.
export type DocumentVerificationResult = {
  selfie: string;
  documentFrontFile: string;
  documentBackFile: string;
  didSubmitDocumentVerificationJob: boolean;
};

export type SmileResult =
  | BiometricKycResult
  | SmartSelfieEnrollmentResult
  | SmartSelfieAuthenticationResult
  | DocumentVerificationResult;

export interface BiometricKycOptions {
  countryCode: string;
  idType: string;
  idNumber: string;
  firstName: string;
  lastName: string;
  userId?: string;
  jobId?: string;
  allowAgentMode?: boolean;
  allowNewEnroll?: boolean;
  showInstructions?: boolean;
  showAttribution?: boolean;
  useStrictMode?: boolean;
  extraPartnerParams?: string;
}

export interface SmartSelfieEnrollmentOptions {
  userId?: string;
  jobId?: string;
  allowAgentMode?: boolean;
  showInstructions?: boolean;
  showAttribution?: boolean;
  extraPartnerParams?: string;
}

export interface SmartSelfieAuthenticationOptions {
  userId: string;
  jobId?: string;
  allowAgentMode?: boolean;
  showInstructions?: boolean;
  showAttribution?: boolean;
  extraPartnerParams?: string;
}

export interface DocumentVerificationOptions {
  countryCode: string;
  documentType: string;
  userId?: string;
  jobId?: string;
  showInstructions?: boolean;
  showAttribution?: boolean;
  allowAgentMode?: boolean;
  showSkipButton?: boolean;
  extraPartnerParams?: string;
}

export type FlowOptions =
  | BiometricKycOptions
  | SmartSelfieEnrollmentOptions
  | SmartSelfieAuthenticationOptions
  | DocumentVerificationOptions;

export type InitState = 'idle' | 'initializing' | 'ready' | 'error';
```

- [ ] **Step 4: Commit**

```bash
git add package.json yarn.lock src/types.ts
git commit -m "feat: add shared TypeScript types and Jest setup"
```

---

## Task 6: Create src/SmileID.ts — init wrapper and state machine

**Files:**
- Create: `src/SmileID.ts`
- Create: `src/__tests__/SmileID.test.ts`

The `SmileID` object wraps the native TurboModule, tracks init state, guards `launch()`, and communicates with `SmileIDPortal` via a module-level setter ref.

- [ ] **Step 1: Write the failing tests first**

Create `src/__tests__/SmileID.test.ts`:

```typescript
jest.mock('react-native', () => ({
  TurboModuleRegistry: {
    getEnforcing: () => ({
      initialize: jest.fn().mockResolvedValue(undefined),
      setCallbackUrl: jest.fn().mockResolvedValue(undefined),
    }),
  },
}));

// Re-import after mock
let SmileID: typeof import('../SmileID').SmileID;

beforeEach(() => {
  jest.resetModules();
  SmileID = require('../SmileID').SmileID;
});

describe('SmileID.getInitState', () => {
  it('starts as idle', () => {
    expect(SmileID.getInitState()).toBe('idle');
  });
});

describe('SmileID.initialize', () => {
  it('requires partnerId', async () => {
    await expect(
      SmileID.initialize({ partnerId: '', authToken: 'tok' })
    ).rejects.toThrow('partnerId');
  });

  it('requires authToken', async () => {
    await expect(
      SmileID.initialize({ partnerId: 'pid', authToken: '' })
    ).rejects.toThrow('authToken');
  });

  it('transitions state to ready on success', async () => {
    await SmileID.initialize({ partnerId: 'pid', authToken: 'tok' });
    expect(SmileID.getInitState()).toBe('ready');
  });

  it('transitions state to error on failure', async () => {
    jest.resetModules();
    jest.mock('react-native', () => ({
      TurboModuleRegistry: {
        getEnforcing: () => ({
          initialize: jest.fn().mockRejectedValue(new Error('init failed')),
          setCallbackUrl: jest.fn(),
        }),
      },
    }));
    const { SmileID: S } = require('../SmileID');
    await expect(S.initialize({ partnerId: 'pid', authToken: 'tok' })).rejects.toThrow();
    expect(S.getInitState()).toBe('error');
  });
});

describe('SmileID.launch', () => {
  it('throws when not initialized', () => {
    expect(() =>
      SmileID.launch('biometric_kyc', {
        countryCode: 'NG', idType: 'NIN', idNumber: '123',
        firstName: 'Ada', lastName: 'Obi',
      }, { onSuccess: jest.fn(), onError: jest.fn() })
    ).toThrow('SmileID not initialized');
  });

  it('throws when biometric_kyc is missing required fields', async () => {
    await SmileID.initialize({ partnerId: 'pid', authToken: 'tok' });
    expect(() =>
      SmileID.launch('biometric_kyc', {
        countryCode: '', idType: 'NIN', idNumber: '123',
        firstName: 'Ada', lastName: 'Obi',
      }, { onSuccess: jest.fn(), onError: jest.fn() })
    ).toThrow('biometric_kyc requires countryCode');
  });
});

describe('SmileID.onStateChange', () => {
  it('notifies listeners on state change', async () => {
    const listener = jest.fn();
    const unsub = SmileID.onStateChange(listener);
    await SmileID.initialize({ partnerId: 'pid', authToken: 'tok' });
    expect(listener).toHaveBeenCalledWith('initializing');
    expect(listener).toHaveBeenCalledWith('ready');
    unsub();
  });
});
```

- [ ] **Step 2: Run — confirm they all fail**

```bash
cd /Users/mac/Documents/rn-wrap && yarn jest src/__tests__/SmileID.test.ts 2>&1 | tail -20
```

Expected: errors about `../SmileID` not found

- [ ] **Step 3: Create src/SmileID.ts**

```typescript
import { TurboModuleRegistry } from 'react-native';
import type { Spec } from './NativeSmileID';
import type {
  BiometricKycOptions,
  FlowOptions,
  InitState,
  SmileError,
  SmileFlow,
  SmileResult,
} from './types';

export interface SmileIDConfig {
  partnerId: string;
  authToken: string;
  prodLambdaUrl?: string;
  testLambdaUrl?: string;
  useSandbox?: boolean;
  enableCrashReporting?: boolean;
  callbackUrl?: string;
}

const NativeModule = TurboModuleRegistry.getEnforcing<Spec>('SmileID');

let _state: InitState = 'idle';
let _lastError: string | null = null;
const _listeners = new Set<(state: InitState) => void>();

// Registered by SmileIDPortal on mount; null when no portal is mounted
let _portalSetter: ((flow: SmileFlow | null, options?: FlowOptions, callbacks?: {
  onSuccess: (result: SmileResult) => void;
  onError: (error: SmileError) => void;
}) => void) | null = null;

function setState(next: InitState) {
  _state = next;
  _listeners.forEach((l) => l(next));
}

function validateOptions(flow: SmileFlow, options: FlowOptions) {
  if (flow === 'biometric_kyc') {
    const o = options as BiometricKycOptions;
    if (!o.countryCode || !o.idType || !o.idNumber) {
      throw new Error('biometric_kyc requires countryCode, idType, and idNumber');
    }
    if (!o.firstName || !o.lastName) {
      throw new Error('biometric_kyc requires firstName and lastName');
    }
  }
  if (flow === 'smart_selfie_authentication') {
    const o = options as { userId?: string };
    if (!o.userId) {
      throw new Error('smart_selfie_authentication requires userId');
    }
  }
  if (flow === 'document_verification') {
    const o = options as { countryCode?: string; documentType?: string };
    if (!o.countryCode || !o.documentType) {
      throw new Error('document_verification requires countryCode and documentType');
    }
  }
}

export const SmileID = {
  getInitState(): InitState {
    return _state;
  },

  onStateChange(listener: (state: InitState) => void): () => void {
    _listeners.add(listener);
    return () => { _listeners.delete(listener); };
  },

  /** @internal — called by SmileIDPortal on mount/unmount */
  _registerPortalSetter(
    setter: typeof _portalSetter
  ) {
    _portalSetter = setter;
  },

  async initialize(config: SmileIDConfig): Promise<void> {
    if (!config.partnerId?.trim()) {
      throw new Error(
        'SmileID.initialize() requires partnerId and authToken. ' +
        'Alternatively, place smile_config.json in your iOS bundle or Android assets/.'
      );
    }
    if (!config.authToken?.trim()) {
      throw new Error(
        'SmileID.initialize() requires partnerId and authToken. ' +
        'Alternatively, place smile_config.json in your iOS bundle or Android assets/.'
      );
    }

    setState('initializing');
    try {
      await NativeModule.initialize(
        config.useSandbox ?? false,
        config.enableCrashReporting ?? true,
        {
          partner_id: config.partnerId,
          auth_token: config.authToken,
          prod_lambda_url: config.prodLambdaUrl,
          test_lambda_url: config.testLambdaUrl,
        }
      );
      if (config.callbackUrl) {
        await NativeModule.setCallbackUrl(config.callbackUrl);
      }
      setState('ready');
    } catch (e) {
      _lastError = e instanceof Error ? e.message : String(e);
      setState('error');
      throw e;
    }
  },

  launch(
    flow: SmileFlow,
    options: FlowOptions,
    callbacks: {
      onSuccess: (result: SmileResult) => void;
      onError: (error: SmileError) => void;
    }
  ): void {
    if (_state === 'idle' || _state === 'initializing') {
      throw new Error(
        'SmileID not initialized. Await SmileID.initialize() before launching flows.'
      );
    }
    if (_state === 'error') {
      throw new Error(
        `SmileID initialization failed: ${_lastError ?? 'unknown error'}. Call SmileID.initialize() again.`
      );
    }
    validateOptions(flow, options);
    if (!_portalSetter) {
      console.warn('[SmileID] SmileIDPortal is not mounted. Mount <SmileIDPortal /> at your app root.');
      return;
    }
    _portalSetter(flow, options, callbacks);
  },

  dismiss(): void {
    _portalSetter?.(null);
  },
};
```

- [ ] **Step 4: Run tests — confirm they pass**

```bash
cd /Users/mac/Documents/rn-wrap && yarn jest src/__tests__/SmileID.test.ts 2>&1 | tail -30
```

Expected: all tests pass, `Tests: X passed`

- [ ] **Step 5: Commit**

```bash
git add src/SmileID.ts src/__tests__/SmileID.test.ts
git commit -m "feat: add SmileID init wrapper, state machine, and launch/dismiss API"
```

---

## Task 7: Create src/utils.ts with parseLivenessImages

**Files:**
- Create: `src/utils.ts`
- Create: `src/__tests__/utils.test.ts`

- [ ] **Step 1: Write the failing test**

Create `src/__tests__/utils.test.ts`:

```typescript
import { parseLivenessImages } from '../utils';

describe('parseLivenessImages', () => {
  it('parses a valid JSON array string', () => {
    const raw = JSON.stringify(['/path/a.jpg', '/path/b.jpg']);
    expect(parseLivenessImages(raw)).toEqual(['/path/a.jpg', '/path/b.jpg']);
  });

  it('returns empty array for empty string', () => {
    expect(parseLivenessImages('')).toEqual([]);
  });

  it('returns empty array for invalid JSON', () => {
    expect(parseLivenessImages('not-json')).toEqual([]);
  });

  it('returns empty array for JSON non-array', () => {
    expect(parseLivenessImages('{"key":"val"}')).toEqual([]);
  });
});
```

- [ ] **Step 2: Run — confirm fail**

```bash
cd /Users/mac/Documents/rn-wrap && yarn jest src/__tests__/utils.test.ts 2>&1 | tail -10
```

Expected: Cannot find module `../utils`

- [ ] **Step 3: Create src/utils.ts**

```typescript
export function parseLivenessImages(raw: string): string[] {
  if (!raw) return [];
  try {
    const parsed: unknown = JSON.parse(raw);
    if (Array.isArray(parsed)) return parsed as string[];
    return [];
  } catch {
    return [];
  }
}
```

- [ ] **Step 4: Run — confirm pass**

```bash
cd /Users/mac/Documents/rn-wrap && yarn jest src/__tests__/utils.test.ts 2>&1 | tail -10
```

Expected: `Tests: 4 passed`

- [ ] **Step 5: Commit**

```bash
git add src/utils.ts src/__tests__/utils.test.ts
git commit -m "feat: add parseLivenessImages utility"
```

---

## Task 8: Create src/SmileIDPortal.tsx

**Files:**
- Create: `src/SmileIDPortal.tsx`

- [ ] **Step 1: Create the portal**

```tsx
import React, { useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SmileID } from './SmileID';
import type { FlowOptions, SmileError, SmileFlow, SmileResult } from './types';
import NativeBiometricKycView from './BiometricKycViewNativeComponent';
import NativeSmartSelfieEnrollmentView from './SmartSelfieEnrollmentViewNativeComponent';
import NativeSmartSelfieAuthenticationView from './SmartSelfieAuthenticationViewNativeComponent';
import NativeDocumentVerificationView from './DocumentVerificationViewNativeComponent';

type ActiveFlow = {
  flow: SmileFlow;
  options: FlowOptions;
  onSuccess: (result: SmileResult) => void;
  onError: (error: SmileError) => void;
} | null;

export function SmileIDPortal() {
  const [active, setActive] = useState<ActiveFlow>(null);

  const setter = useCallback(
    (
      flow: SmileFlow | null,
      options?: FlowOptions,
      callbacks?: {
        onSuccess: (result: SmileResult) => void;
        onError: (error: SmileError) => void;
      }
    ) => {
      if (!flow) {
        setActive(null);
        return;
      }
      if (!options || !callbacks) return;
      setActive({ flow, options, callbacks });
    },
    []
  );

  useEffect(() => {
    if (SmileID.getInitState() !== 'ready') {
      console.warn(
        '[SmileIDPortal] SmileID is not initialized. Call SmileID.initialize() before rendering SmileIDPortal.'
      );
    }
    SmileID._registerPortalSetter(setter);
    return () => { SmileID._registerPortalSetter(null); };
  }, [setter]);

  if (!active) return null;

  const { flow, options, onSuccess, onError } = active;

  function handleSuccess(nativeEvent: Record<string, unknown>) {
    setActive(null);
    onSuccess(nativeEvent as SmileResult);
  }

  function handleError(nativeEvent: { code: string; message: string }) {
    setActive(null);
    onError({ ...nativeEvent, flowType: flow });
  }

  return (
    <Modal visible animationType="slide" onRequestClose={() => SmileID.dismiss()}>
      <View style={styles.fill}>
        {flow === 'biometric_kyc' && (
          <NativeBiometricKycView
            style={styles.fill}
            {...(options as object)}
            onSuccess={(e) => handleSuccess(e.nativeEvent as Record<string, unknown>)}
            onError={(e) => handleError(e.nativeEvent as { code: string; message: string })}
          />
        )}
        {flow === 'smart_selfie_enrollment' && (
          <NativeSmartSelfieEnrollmentView
            style={styles.fill}
            {...(options as object)}
            onSuccess={(e) => handleSuccess(e.nativeEvent as Record<string, unknown>)}
            onError={(e) => handleError(e.nativeEvent as { code: string; message: string })}
          />
        )}
        {flow === 'smart_selfie_authentication' && (
          <NativeSmartSelfieAuthenticationView
            style={styles.fill}
            {...(options as object)}
            onSuccess={(e) => handleSuccess(e.nativeEvent as Record<string, unknown>)}
            onError={(e) => handleError(e.nativeEvent as { code: string; message: string })}
          />
        )}
        {flow === 'document_verification' && (
          <NativeDocumentVerificationView
            style={styles.fill}
            {...(options as object)}
            onSuccess={(e) => handleSuccess(e.nativeEvent as Record<string, unknown>)}
            onError={(e) => handleError(e.nativeEvent as { code: string; message: string })}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
```

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/mac/Documents/rn-wrap && yarn typecheck 2>&1 | tail -20
```

Expected: no errors (or only pre-existing errors unrelated to this file)

- [ ] **Step 3: Commit**

```bash
git add src/SmileIDPortal.tsx
git commit -m "feat: add SmileIDPortal modal host"
```

---

## Task 9: Create declarative JS wrapper components

**Files:**
- Create: `src/BiometricKycView.tsx`
- Create: `src/SmartSelfieEnrollmentView.tsx`
- Create: `src/SmartSelfieAuthenticationView.tsx`
- Create: `src/DocumentVerificationView.tsx`

Each wrapper intercepts the raw native event, injects `flowType` into errors, and provides typed props to consumers.

- [ ] **Step 1: Create src/BiometricKycView.tsx**

```tsx
import React from 'react';
import type { ViewStyle } from 'react-native';
import NativeBiometricKycView from './BiometricKycViewNativeComponent';
import type { BiometricKycOptions, BiometricKycResult, SmileError } from './types';

type RawNativeError = { code: string; message: string };

export interface BiometricKycViewProps extends BiometricKycOptions {
  style?: ViewStyle;
  onSuccess?: (result: BiometricKycResult) => void;
  onError?: (error: SmileError) => void;
}

export function BiometricKycView({
  onSuccess,
  onError,
  ...rest
}: BiometricKycViewProps) {
  return (
    <NativeBiometricKycView
      {...rest}
      onSuccess={
        onSuccess
          ? (e: { nativeEvent: BiometricKycResult }) => onSuccess(e.nativeEvent)
          : undefined
      }
      onError={
        onError
          ? (e: { nativeEvent: RawNativeError }) =>
              onError({ ...e.nativeEvent, flowType: 'biometric_kyc' })
          : undefined
      }
    />
  );
}
```

- [ ] **Step 2: Create src/SmartSelfieEnrollmentView.tsx**

```tsx
import React from 'react';
import type { ViewStyle } from 'react-native';
import NativeSmartSelfieEnrollmentView from './SmartSelfieEnrollmentViewNativeComponent';
import type {
  SmartSelfieEnrollmentOptions,
  SmartSelfieEnrollmentResult,
  SmileError,
} from './types';

type RawNativeError = { code: string; message: string };

export interface SmartSelfieEnrollmentViewProps extends SmartSelfieEnrollmentOptions {
  style?: ViewStyle;
  onSuccess?: (result: SmartSelfieEnrollmentResult) => void;
  onError?: (error: SmileError) => void;
}

export function SmartSelfieEnrollmentView({
  onSuccess,
  onError,
  ...rest
}: SmartSelfieEnrollmentViewProps) {
  return (
    <NativeSmartSelfieEnrollmentView
      {...rest}
      onSuccess={
        onSuccess
          ? (e: { nativeEvent: SmartSelfieEnrollmentResult }) =>
              onSuccess(e.nativeEvent)
          : undefined
      }
      onError={
        onError
          ? (e: { nativeEvent: RawNativeError }) =>
              onError({ ...e.nativeEvent, flowType: 'smart_selfie_enrollment' })
          : undefined
      }
    />
  );
}
```

- [ ] **Step 3: Create src/SmartSelfieAuthenticationView.tsx**

```tsx
import React from 'react';
import type { ViewStyle } from 'react-native';
import NativeSmartSelfieAuthenticationView from './SmartSelfieAuthenticationViewNativeComponent';
import type {
  SmartSelfieAuthenticationOptions,
  SmartSelfieAuthenticationResult,
  SmileError,
} from './types';

type RawNativeError = { code: string; message: string };

export interface SmartSelfieAuthenticationViewProps
  extends SmartSelfieAuthenticationOptions {
  style?: ViewStyle;
  onSuccess?: (result: SmartSelfieAuthenticationResult) => void;
  onError?: (error: SmileError) => void;
}

export function SmartSelfieAuthenticationView({
  onSuccess,
  onError,
  ...rest
}: SmartSelfieAuthenticationViewProps) {
  return (
    <NativeSmartSelfieAuthenticationView
      {...rest}
      onSuccess={
        onSuccess
          ? (e: { nativeEvent: SmartSelfieAuthenticationResult }) =>
              onSuccess(e.nativeEvent)
          : undefined
      }
      onError={
        onError
          ? (e: { nativeEvent: RawNativeError }) =>
              onError({
                ...e.nativeEvent,
                flowType: 'smart_selfie_authentication',
              })
          : undefined
      }
    />
  );
}
```

- [ ] **Step 4: Create src/DocumentVerificationView.tsx**

```tsx
import React from 'react';
import type { ViewStyle } from 'react-native';
import NativeDocumentVerificationView from './DocumentVerificationViewNativeComponent';
import type {
  DocumentVerificationOptions,
  DocumentVerificationResult,
  SmileError,
} from './types';

type RawNativeError = { code: string; message: string };

export interface DocumentVerificationViewProps extends DocumentVerificationOptions {
  style?: ViewStyle;
  onSuccess?: (result: DocumentVerificationResult) => void;
  onError?: (error: SmileError) => void;
}

export function DocumentVerificationView({
  onSuccess,
  onError,
  ...rest
}: DocumentVerificationViewProps) {
  return (
    <NativeDocumentVerificationView
      {...rest}
      onSuccess={
        onSuccess
          ? (e: { nativeEvent: DocumentVerificationResult }) =>
              onSuccess(e.nativeEvent)
          : undefined
      }
      onError={
        onError
          ? (e: { nativeEvent: RawNativeError }) =>
              onError({ ...e.nativeEvent, flowType: 'document_verification' })
          : undefined
      }
    />
  );
}
```

- [ ] **Step 5: Run typecheck**

```bash
cd /Users/mac/Documents/rn-wrap && yarn typecheck 2>&1 | tail -20
```

Expected: no new errors

- [ ] **Step 6: Commit**

```bash
git add src/BiometricKycView.tsx src/SmartSelfieEnrollmentView.tsx \
        src/SmartSelfieAuthenticationView.tsx src/DocumentVerificationView.tsx
git commit -m "feat: add typed JS wrapper components for all four flows"
```

---

## Task 10: Create src/useSmileID.ts

**Files:**
- Create: `src/useSmileID.ts`

- [ ] **Step 1: Create the hook**

```typescript
import { useEffect, useState } from 'react';
import { SmileID } from './SmileID';
import type { FlowOptions, InitState, SmileError, SmileFlow, SmileResult } from './types';

export function useSmileID() {
  const [initState, setInitState] = useState<InitState>(SmileID.getInitState());

  useEffect(() => {
    const unsubscribe = SmileID.onStateChange(setInitState);
    return unsubscribe;
  }, []);

  return {
    initState,
    isReady: initState === 'ready',
    launch: (
      flow: SmileFlow,
      options: FlowOptions,
      callbacks: {
        onSuccess: (result: SmileResult) => void;
        onError: (error: SmileError) => void;
      }
    ) => SmileID.launch(flow, options, callbacks),
    dismiss: () => SmileID.dismiss(),
  };
}
```

- [ ] **Step 2: Run typecheck**

```bash
cd /Users/mac/Documents/rn-wrap && yarn typecheck 2>&1 | tail -20
```

Expected: no errors

- [ ] **Step 3: Commit**

```bash
git add src/useSmileID.ts
git commit -m "feat: add useSmileID hook for React lifecycle integration"
```

---

## Task 11: Update src/index.tsx and add ESLint no-restricted-imports rule

**Files:**
- Modify: `src/index.tsx`
- Modify: `eslint.config.mjs`

- [ ] **Step 1: Replace src/index.tsx**

```typescript
// Init
export { SmileID } from './SmileID';
export type { SmileIDConfig } from './SmileID';

// Portal (mount once at your app root)
export { SmileIDPortal } from './SmileIDPortal';

// Hook
export { useSmileID } from './useSmileID';

// Utilities
export { parseLivenessImages } from './utils';

// Types
export type {
  SmileFlow,
  SmileError,
  SmileResult,
  InitState,
  BiometricKycOptions,
  BiometricKycResult,
  SmartSelfieEnrollmentOptions,
  SmartSelfieEnrollmentResult,
  SmartSelfieAuthenticationOptions,
  SmartSelfieAuthenticationResult,
  DocumentVerificationOptions,
  DocumentVerificationResult,
  FlowOptions,
} from './types';

// Declarative components (JS wrappers — typed, flowType-enriched)
export { BiometricKycView } from './BiometricKycView';
export { SmartSelfieEnrollmentView } from './SmartSelfieEnrollmentView';
export { SmartSelfieAuthenticationView } from './SmartSelfieAuthenticationView';
export { DocumentVerificationView } from './DocumentVerificationView';
```

- [ ] **Step 2: Update eslint.config.mjs to add no-restricted-imports**

Replace the content with:

```javascript
import { fixupConfigRules } from '@eslint/compat';
import { FlatCompat } from '@eslint/eslintrc';
import js from '@eslint/js';
import prettier from 'eslint-plugin-prettier';
import { defineConfig } from 'eslint/config';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const compat = new FlatCompat({
  baseDirectory: __dirname,
  recommendedConfig: js.configs.recommended,
  allConfig: js.configs.all,
});

export default defineConfig([
  {
    extends: fixupConfigRules(compat.extends('@react-native', 'prettier')),
    plugins: { prettier },
    rules: {
      'react/react-in-jsx-scope': 'off',
      'prettier/prettier': 'error',
    },
  },
  // Restrict native component imports in consumer code only.
  // src/ internals (SmileIDPortal, wrappers) are legitimately allowed to
  // import native components — the rule must not apply to them.
  {
    files: ['example/**/*.{ts,tsx}'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['**/BiometricKycViewNativeComponent'],
              message: "Import BiometricKycView from 'rn-wrap' instead.",
            },
            {
              group: ['**/SmartSelfieEnrollmentViewNativeComponent'],
              message: "Import SmartSelfieEnrollmentView from 'rn-wrap' instead.",
            },
            {
              group: ['**/SmartSelfieAuthenticationViewNativeComponent'],
              message: "Import SmartSelfieAuthenticationView from 'rn-wrap' instead.",
            },
            {
              group: ['**/DocumentVerificationViewNativeComponent'],
              message: "Import DocumentVerificationView from 'rn-wrap' instead.",
            },
          ],
        },
      ],
    },
  },
  {
    ignores: ['node_modules/', 'lib/'],
  },
]);
```

- [ ] **Step 3: Run lint + typecheck**

```bash
cd /Users/mac/Documents/rn-wrap && yarn lint 2>&1 | tail -20 && yarn typecheck 2>&1 | tail -20
```

Expected: no errors on lint or typecheck

- [ ] **Step 4: Commit**

```bash
git add src/index.tsx eslint.config.mjs
git commit -m "feat: update public API surface and add ESLint native import guard"
```

---

## Task 12: Build the example app

**Files:**
- Modify: `example/src/App.tsx`

The example app has three screens: a credentials screen (shown first), then two tabs for imperative and declarative flows.

- [ ] **Step 1: Replace example/src/App.tsx**

```tsx
import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BiometricKycView,
  DocumentVerificationView,
  SmartSelfieAuthenticationView,
  SmartSelfieEnrollmentView,
  SmileID,
  SmileIDPortal,
  useSmileID,
} from 'rn-wrap';
import type { SmileError, SmileResult } from 'rn-wrap';

// ─── Credentials Screen ──────────────────────────────────────────────────────

function CredentialsScreen({ onReady }: { onReady: () => void }) {
  const [partnerId, setPartnerId] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [useSandbox, setUseSandbox] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleInit() {
    if (!partnerId.trim() || !authToken.trim()) {
      Alert.alert('Missing credentials', 'Both Partner ID and Auth Token are required.');
      return;
    }
    setLoading(true);
    try {
      await SmileID.initialize({ partnerId, authToken, useSandbox });
      onReady();
    } catch (e) {
      Alert.alert('Init failed', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.heading}>SmileID SDK — Example</Text>
      <Text style={styles.label}>Partner ID</Text>
      <TextInput
        style={styles.input}
        value={partnerId}
        onChangeText={setPartnerId}
        placeholder="Enter your Partner ID"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Auth Token</Text>
      <TextInput
        style={styles.input}
        value={authToken}
        onChangeText={setAuthToken}
        placeholder="Enter your Auth Token"
        autoCapitalize="none"
        secureTextEntry
      />
      <View style={styles.row}>
        <Text style={styles.label}>Use Sandbox</Text>
        <Switch value={useSandbox} onValueChange={setUseSandbox} />
      </View>
      {loading ? (
        <ActivityIndicator style={styles.spacer} />
      ) : (
        <Button title="Initialize SDK" onPress={handleInit} />
      )}
    </SafeAreaView>
  );
}

// ─── Result display ───────────────────────────────────────────────────────────

function ResultBox({ result, error }: { result?: SmileResult; error?: SmileError }) {
  if (!result && !error) return null;
  return (
    <View style={error ? styles.errorBox : styles.successBox}>
      <Text style={styles.resultText}>
        {error
          ? `Error [${error.code}]: ${error.message}`
          : `Success: ${JSON.stringify(result, null, 2)}`}
      </Text>
    </View>
  );
}

// ─── Imperative Tab ───────────────────────────────────────────────────────────

function ImperativeTab() {
  const { launch, dismiss } = useSmileID();
  const [lastResult, setLastResult] = useState<SmileResult | undefined>();
  const [lastError, setLastError] = useState<SmileError | undefined>();

  function handleSuccess(result: SmileResult) {
    setLastResult(result);
    setLastError(undefined);
  }
  function handleError(error: SmileError) {
    setLastError(error);
    setLastResult(undefined);
  }

  return (
    <ScrollView contentContainerStyle={styles.tab}>
      <Text style={styles.heading}>Imperative API</Text>

      <TouchableOpacity
        style={styles.button}
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
            { onSuccess: handleSuccess, onError: handleError }
          )
        }>
        <Text style={styles.buttonText}>Biometric KYC</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          launch(
            'smart_selfie_enrollment',
            {},
            { onSuccess: handleSuccess, onError: handleError }
          )
        }>
        <Text style={styles.buttonText}>SmartSelfie Enrollment</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          launch(
            'smart_selfie_authentication',
            { userId: 'test-user-id' },
            { onSuccess: handleSuccess, onError: handleError }
          )
        }>
        <Text style={styles.buttonText}>SmartSelfie Authentication</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          launch(
            'document_verification',
            { countryCode: 'NG', documentType: 'NATIONAL_ID' },
            { onSuccess: handleSuccess, onError: handleError }
          )
        }>
        <Text style={styles.buttonText}>Document Verification</Text>
      </TouchableOpacity>

      <Button title="Dismiss active flow" onPress={dismiss} />
      <ResultBox result={lastResult} error={lastError} />
    </ScrollView>
  );
}

// ─── Declarative Tab ──────────────────────────────────────────────────────────

function DeclarativeTab() {
  const [lastResult, setLastResult] = useState<SmileResult | undefined>();
  const [lastError, setLastError] = useState<SmileError | undefined>();

  function handleSuccess(result: SmileResult) {
    setLastResult(result);
    setLastError(undefined);
  }
  function handleError(error: SmileError) {
    setLastError(error);
    setLastResult(undefined);
  }

  return (
    <ScrollView contentContainerStyle={styles.tab}>
      <Text style={styles.heading}>Declarative API</Text>
      <Text style={styles.label}>BiometricKycView (embedded)</Text>
      <View style={styles.flowBox}>
        <BiometricKycView
          countryCode="NG"
          idType="NIN_V2"
          idNumber="00000000000"
          firstName="Ada"
          lastName="Obi"
          style={styles.flowBox}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </View>
      <Text style={styles.label}>SmartSelfieEnrollmentView (embedded)</Text>
      <View style={styles.flowBox}>
        <SmartSelfieEnrollmentView
          style={styles.flowBox}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </View>
      <Text style={styles.label}>SmartSelfieAuthenticationView (embedded)</Text>
      <View style={styles.flowBox}>
        <SmartSelfieAuthenticationView
          userId="test-user-id"
          style={styles.flowBox}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </View>
      <Text style={styles.label}>DocumentVerificationView (embedded)</Text>
      <View style={styles.flowBox}>
        <DocumentVerificationView
          countryCode="NG"
          documentType="NATIONAL_ID"
          style={styles.flowBox}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </View>
      <ResultBox result={lastResult} error={lastError} />
    </ScrollView>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
}: {
  active: 'imperative' | 'declarative';
  onChange: (t: 'imperative' | 'declarative') => void;
}) {
  return (
    <View style={styles.tabBar}>
      {(['imperative', 'declarative'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tabItem, active === tab && styles.tabItemActive]}
          onPress={() => onChange(tab)}>
          <Text style={[styles.tabText, active === tab && styles.tabTextActive]}>
            {tab === 'imperative' ? 'Imperative' : 'Declarative'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'imperative' | 'declarative'>('imperative');

  if (!ready) return <CredentialsScreen onReady={() => setReady(true)} />;

  return (
    <>
      <SafeAreaView style={styles.fill}>
        <TabBar active={activeTab} onChange={setActiveTab} />
        {activeTab === 'imperative' ? <ImperativeTab /> : <DeclarativeTab />}
      </SafeAreaView>
      <SmileIDPortal />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fill: { flex: 1 },
  screen: { flex: 1, padding: 24 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1, borderColor: '#ccc', borderRadius: 8,
    padding: 10, fontSize: 14,
  },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 12 },
  spacer: { marginTop: 16 },
  tab: { padding: 16, paddingBottom: 40 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd' },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabItemActive: { borderBottomWidth: 2, borderColor: '#007AFF' },
  tabText: { color: '#888', fontWeight: '500' },
  tabTextActive: { color: '#007AFF', fontWeight: '700' },
  button: {
    backgroundColor: '#007AFF', borderRadius: 8,
    paddingVertical: 14, paddingHorizontal: 20,
    alignItems: 'center', marginBottom: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  flowBox: { height: 400, borderRadius: 8, overflow: 'hidden', marginBottom: 16 },
  successBox: { backgroundColor: '#e6f4ea', padding: 12, borderRadius: 8, marginTop: 16 },
  errorBox: { backgroundColor: '#fce8e6', padding: 12, borderRadius: 8, marginTop: 16 },
  resultText: { fontSize: 12, fontFamily: 'monospace' },
});
```

- [ ] **Step 2: Run typecheck on example**

```bash
cd /Users/mac/Documents/rn-wrap && yarn typecheck 2>&1 | tail -20
```

Expected: no errors

- [ ] **Step 3: Run all Jest tests**

```bash
cd /Users/mac/Documents/rn-wrap && yarn jest 2>&1 | tail -20
```

Expected: all tests pass

- [ ] **Step 4: Commit**

```bash
git add example/src/App.tsx
git commit -m "feat(example): three-screen app demonstrating imperative and declarative APIs"
```

---

## Task 13: Update README.md

**Files:**
- Modify: `README.md`

- [ ] **Step 1: Replace README.md**

```markdown
# rn-wrap — SmileID React Native SDK

Production-grade React Native wrapper for [Smile Identity](https://smileidentity.com) biometric verification flows. Built on React Native New Architecture (Fabric + TurboModules). Supports React Native 0.75+.

---

## Installation

```sh
npm install rn-wrap
# or
yarn add rn-wrap
```

### iOS

```sh
cd ios && RCT_NEW_ARCH_ENABLED=1 bundle exec pod install
```

### Android

New Architecture is enabled by default in React Native 0.76+. For older versions, set `newArchEnabled=true` in `android/gradle.properties`.

---

## Setup

### 1. Mount `SmileIDPortal` at your app root

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

### 2. Initialize the SDK before rendering any SmileID UI

```tsx
import { SmileID } from 'rn-wrap';

// On app startup — await this before navigating to any SmileID screen
await SmileID.initialize({
  partnerId: 'YOUR_PARTNER_ID',
  authToken: 'YOUR_AUTH_TOKEN',
  useSandbox: true, // false for production
});
```

**Important:** `initialize()` is async. Show a loading screen while it resolves. Calling `SmileID.launch()` before it completes will throw.

#### Three ways to provide credentials

**Option 1 — Programmatic (recommended):**
```ts
await SmileID.initialize({ partnerId: 'pid', authToken: 'tok' });
```

**Option 2 — Environment variables via `react-native-config`:**
```ts
import Config from 'react-native-config';
await SmileID.initialize({
  partnerId: Config.SMILE_PARTNER_ID,
  authToken: Config.SMILE_AUTH_TOKEN,
  useSandbox: Config.SMILE_SANDBOX === 'true',
});
```

**Option 3 — Config file fallback:** Place `smile_config.json` in your iOS app bundle or Android `assets/` folder and call `SmileID.initialize()` without credentials. The native SDK will read the file automatically.

---

## Usage — Imperative API

Trigger any flow from a button, gesture, or any other handler:

```tsx
import { SmileID } from 'rn-wrap';

SmileID.launch(
  'biometric_kyc',
  { countryCode: 'NG', idType: 'NIN_V2', idNumber: '00000000000', firstName: 'Ada', lastName: 'Obi' },
  {
    onSuccess: (result) => console.log('Success', result),
    onError:   (error)  => console.error('Error', error.code, error.message),
  }
);
```

**Supported flows:** `biometric_kyc` · `smart_selfie_enrollment` · `smart_selfie_authentication` · `document_verification`

**Dismiss programmatically:**
```ts
SmileID.dismiss(); // closes the active flow modal
```

---

## Usage — Declarative Component API

Embed a verification screen directly in your layout:

```tsx
import { BiometricKycView } from 'rn-wrap';

<BiometricKycView
  countryCode="NG"
  idType="NIN_V2"
  idNumber="00000000000"
  firstName="Ada"
  lastName="Obi"
  style={{ flex: 1 }}
  onSuccess={(result) => console.log(result)}
  onError={(error) => console.error(error.flowType, error.code)}
/>
```

---

## React Hook

```tsx
import { useSmileID } from 'rn-wrap';

function MyScreen() {
  const { isReady, launch } = useSmileID();

  if (!isReady) return <ActivityIndicator />;

  return (
    <Button
      title="Verify"
      onPress={() => launch('smart_selfie_enrollment', {}, { onSuccess, onError })}
    />
  );
}
```

---

## Utilities

```ts
import { parseLivenessImages } from 'rn-wrap';

// livenessImages in BiometricKycResult is a JSON-encoded string array
const paths: string[] = parseLivenessImages(result.livenessImages);
```

---

## Minimizing SDK Size

### Android — enable ProGuard/R8 and ABI splits

In `android/app/build.gradle`:
```gradle
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

### iOS — dynamic frameworks and dead code stripping

In your `Podfile`:
```ruby
use_frameworks! :linkage => :dynamic
```

In Xcode, under your target's Build Settings (Release):
- `DEAD_CODE_STRIPPING` → `YES`
- `STRIP_INSTALLED_PRODUCT` → `YES`
- `DEBUG_INFORMATION_FORMAT` → `dwarf-with-dsym`

---

## License

MIT
```

- [ ] **Step 2: Commit**

```bash
git add README.md
git commit -m "docs: add installation, setup, usage, and size minimization guide"
```

---

## Self-Review Checklist

After all tasks are complete, run this final check:

```bash
# All JS tests pass
cd /Users/mac/Documents/rn-wrap && yarn jest

# No TypeScript errors
yarn typecheck

# No lint errors
yarn lint

# Android compiles
./example/android/gradlew -p android compileDebugKotlin --no-daemon 2>&1 | tail -5
```

All four commands must exit cleanly before the implementation is considered done.
