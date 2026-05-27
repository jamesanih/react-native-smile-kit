import type { ViewStyle } from 'react-native';
import NativeBiometricKycView from './BiometricKycViewNativeComponent';
import type { BiometricKycOptions, BiometricKycResult, SmileError } from './types';

type RawNativeError = { code: string; message: string };

export interface BiometricKycViewProps extends BiometricKycOptions {
  style?: ViewStyle;
  onSuccess?: (result: BiometricKycResult) => void;
  onError?: (error: SmileError) => void;
}

export function BiometricKycView({ onSuccess, onError, ...rest }: BiometricKycViewProps) {
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
