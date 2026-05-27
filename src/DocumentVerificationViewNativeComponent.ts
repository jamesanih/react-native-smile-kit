import { codegenNativeComponent, type ViewProps } from 'react-native';
import type {
  DirectEventHandler,
  Float,
  Int32,
  WithDefault,
} from './CodegenTypes';

type AutoCapture = 'AutoCapture' | 'ManualCaptureOnly';

type DocumentVerificationSuccessEvent = Readonly<{
  selfie: string;
  documentFrontFile: string;
  documentBackFile: string;
  didSubmitDocumentVerificationJob: boolean;
}>;

type DocumentVerificationErrorEvent = Readonly<{
  message: string;
  code: string;
}>;

export interface NativeProps extends ViewProps {
  countryCode: string;
  userId?: string;
  jobId?: string;
  documentType?: string;
  captureBothSides?: boolean;
  autoCaptureTimeout?: Int32;
  autoCapture?: WithDefault<AutoCapture, 'AutoCapture'>;
  idAspectRatio?: Float;
  allowAgentMode?: boolean;
  allowGalleryUpload?: boolean;
  allowNewEnroll?: boolean;
  showInstructions?: boolean;
  showAttribution?: boolean;
  useStrictMode?: boolean;
  skipApiSubmission?: boolean;
  bypassSelfieCaptureWithFile?: string;
  extraPartnerParams?: string;
  onSuccess?: DirectEventHandler<DocumentVerificationSuccessEvent>;
  onError?: DirectEventHandler<DocumentVerificationErrorEvent>;
}

export default codegenNativeComponent<NativeProps>('DocumentVerificationView');
