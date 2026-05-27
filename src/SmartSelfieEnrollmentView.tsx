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
          ? (e: { nativeEvent: SmartSelfieEnrollmentResult }) => onSuccess(e.nativeEvent)
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
