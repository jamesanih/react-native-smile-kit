import { codegenNativeComponent, type ViewProps } from 'react-native';
import type { DirectEventHandler } from './CodegenTypes';

type BiometricKycSuccessEvent = Readonly<{
  selfieImage: string;
  livenessImages: string;
  didSubmitBiometricJob: boolean;
}>;

type BiometricKycErrorEvent = Readonly<{
  message: string;
  code: string;
}>;

export interface NativeProps extends ViewProps {
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
  onSuccess?: DirectEventHandler<BiometricKycSuccessEvent>;
  onError?: DirectEventHandler<BiometricKycErrorEvent>;
}

export default codegenNativeComponent<NativeProps>('BiometricKycView');
