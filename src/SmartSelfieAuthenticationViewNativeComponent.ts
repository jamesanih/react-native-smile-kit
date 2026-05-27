import { codegenNativeComponent, type ViewProps } from 'react-native';
import type { DirectEventHandler } from './CodegenTypes';

type SmartSelfieSuccessEvent = Readonly<{ result: string }>;
type SmartSelfieErrorEvent = Readonly<{ message: string; code: string }>;

export interface NativeProps extends ViewProps {
  userId: string;
  jobId?: string;
  allowAgentMode?: boolean;
  allowNewEnroll?: boolean;
  showAttribution?: boolean;
  showInstructions?: boolean;
  extraPartnerParams?: string;
  onSuccess?: DirectEventHandler<SmartSelfieSuccessEvent>;
  onError?: DirectEventHandler<SmartSelfieErrorEvent>;
}

export default codegenNativeComponent<NativeProps>(
  'SmartSelfieAuthenticationView'
);
