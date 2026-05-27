import type { ViewStyle } from 'react-native';
import NativeSmartSelfieAuthenticationView from './SmartSelfieAuthenticationViewNativeComponent';
import type {
  SmartSelfieAuthenticationOptions,
  SmartSelfieAuthenticationResult,
  SmileError,
} from './types';

type RawNativeError = { code: string; message: string };

export interface SmartSelfieAuthenticationViewProps extends SmartSelfieAuthenticationOptions {
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
