import { useCallback, useEffect, useState } from 'react';
import { Modal, StyleSheet, View } from 'react-native';
import { SmileID } from './SmileID';
import type {
  BiometricKycOptions,
  DocumentVerificationOptions,
  FlowOptions,
  SmartSelfieAuthenticationOptions,
  SmartSelfieEnrollmentOptions,
  SmileError,
  SmileFlow,
  SmileResult,
} from './types';
import NativeBiometricKycView from './BiometricKycViewNativeComponent';
import NativeSmartSelfieEnrollmentView from './SmartSelfieEnrollmentViewNativeComponent';
import NativeSmartSelfieAuthenticationView from './SmartSelfieAuthenticationViewNativeComponent';
import NativeDocumentVerificationView from './DocumentVerificationViewNativeComponent';

type ActiveFlow = {
  flow: SmileFlow;
  options: FlowOptions;
  onSuccess: (result: SmileResult) => void;
  onError: (error: SmileError) => void;
} | null;

type RawNativeError = { code: string; message: string };

export function SmileIDPortal() {
  const [active, setActive] = useState<ActiveFlow>(null);

  const setter = useCallback(
    (
      flow: SmileFlow | null,
      options?: FlowOptions,
      callbacks?: {
        onSuccess: (result: SmileResult) => void;
        onError: (error: SmileError) => void;
      }
    ) => {
      if (!flow) {
        setActive(null);
        return;
      }
      if (!options || !callbacks) return;
      setActive({
        flow,
        options,
        onSuccess: callbacks.onSuccess,
        onError: callbacks.onError,
      });
    },
    []
  );

  useEffect(() => {
    if (SmileID.getInitState() !== 'ready') {
      console.warn(
        '[SmileIDPortal] SmileID is not initialized. Call and await SmileID.initialize() before rendering SmileIDPortal.'
      );
    }
    SmileID._registerPortalSetter(setter);
    return () => {
      SmileID._registerPortalSetter(null);
    };
  }, [setter]);

  if (!active) return null;

  const { flow, options, onSuccess, onError } = active;

  function handleSuccess(nativeEvent: Record<string, unknown>) {
    setActive(null);
    onSuccess(nativeEvent as SmileResult);
  }

  function handleError(nativeEvent: RawNativeError) {
    setActive(null);
    onError({ ...nativeEvent, flowType: flow });
  }

  return (
    <Modal visible animationType="slide" onRequestClose={() => SmileID.dismiss()}>
      <View style={styles.fill}>
        {flow === 'biometric_kyc' && (
          <NativeBiometricKycView
            style={styles.fill}
            {...(options as BiometricKycOptions)}
            onSuccess={(e) => handleSuccess(e.nativeEvent as Record<string, unknown>)}
            onError={(e) => handleError(e.nativeEvent as RawNativeError)}
          />
        )}
        {flow === 'smart_selfie_enrollment' && (
          <NativeSmartSelfieEnrollmentView
            style={styles.fill}
            {...(options as SmartSelfieEnrollmentOptions)}
            onSuccess={(e) => handleSuccess(e.nativeEvent as Record<string, unknown>)}
            onError={(e) => handleError(e.nativeEvent as RawNativeError)}
          />
        )}
        {flow === 'smart_selfie_authentication' && (
          <NativeSmartSelfieAuthenticationView
            style={styles.fill}
            {...(options as SmartSelfieAuthenticationOptions)}
            onSuccess={(e) => handleSuccess(e.nativeEvent as Record<string, unknown>)}
            onError={(e) => handleError(e.nativeEvent as RawNativeError)}
          />
        )}
        {flow === 'document_verification' && (
          <NativeDocumentVerificationView
            style={styles.fill}
            {...(options as DocumentVerificationOptions)}
            onSuccess={(e) => handleSuccess(e.nativeEvent as Record<string, unknown>)}
            onError={(e) => handleError(e.nativeEvent as RawNativeError)}
          />
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
});
