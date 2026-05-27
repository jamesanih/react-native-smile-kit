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
let _portalSetter:
  | ((
      flow: SmileFlow | null,
      options?: FlowOptions,
      callbacks?: {
        onSuccess: (result: SmileResult) => void;
        onError: (error: SmileError) => void;
      }
    ) => void)
  | null = null;

function setState(next: InitState) {
  _state = next;
  _listeners.forEach((l) => l(next));
}

function validateOptions(flow: SmileFlow, options: FlowOptions) {
  if (flow === 'biometric_kyc') {
    const o = options as BiometricKycOptions;
    if (!o.countryCode || !o.idType || !o.idNumber) {
      throw new Error(
        'biometric_kyc requires countryCode, idType, and idNumber'
      );
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
      throw new Error(
        'document_verification requires countryCode and documentType'
      );
    }
  }
}

export const SmileID = {
  getInitState(): InitState {
    return _state;
  },

  onStateChange(listener: (state: InitState) => void): () => void {
    _listeners.add(listener);
    return () => {
      _listeners.delete(listener);
    };
  },

  /** @internal — called by SmileIDPortal on mount/unmount */
  _registerPortalSetter(setter: typeof _portalSetter) {
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
      console.warn(
        '[SmileID] SmileIDPortal is not mounted. Mount <SmileIDPortal /> at your app root.'
      );
      return;
    }
    _portalSetter(flow, options, callbacks);
  },

  dismiss(): void {
    _portalSetter?.(null);
  },
};
