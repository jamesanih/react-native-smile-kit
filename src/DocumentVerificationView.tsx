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
