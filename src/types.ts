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
