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
