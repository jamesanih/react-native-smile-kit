import { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Button,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  BiometricKycView,
  DocumentVerificationView,
  SmartSelfieAuthenticationView,
  SmartSelfieEnrollmentView,
  SmileID,
  SmileIDPortal,
  useSmileID,
} from 'rn-wrap';
import type { SmileError, SmileResult } from 'rn-wrap';

// ─── Credentials Screen ──────────────────────────────────────────────────────

function CredentialsScreen({ onReady }: { onReady: () => void }) {
  const [partnerId, setPartnerId] = useState('');
  const [authToken, setAuthToken] = useState('');
  const [useSandbox, setUseSandbox] = useState(true);
  const [loading, setLoading] = useState(false);

  async function handleInit() {
    if (!partnerId.trim() || !authToken.trim()) {
      Alert.alert(
        'Missing credentials',
        'Both Partner ID and Auth Token are required.'
      );
      return;
    }
    setLoading(true);
    try {
      await SmileID.initialize({ partnerId, authToken, useSandbox });
      onReady();
    } catch (e) {
      Alert.alert('Init failed', e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <Text style={styles.heading}>SmileID SDK — Example</Text>
      <Text style={styles.label}>Partner ID</Text>
      <TextInput
        style={styles.input}
        value={partnerId}
        onChangeText={setPartnerId}
        placeholder="Enter your Partner ID"
        autoCapitalize="none"
      />
      <Text style={styles.label}>Auth Token</Text>
      <TextInput
        style={styles.input}
        value={authToken}
        onChangeText={setAuthToken}
        placeholder="Enter your Auth Token"
        autoCapitalize="none"
        secureTextEntry
      />
      <View style={styles.row}>
        <Text style={styles.label}>Use Sandbox</Text>
        <Switch value={useSandbox} onValueChange={setUseSandbox} />
      </View>
      {loading ? (
        <ActivityIndicator style={styles.spacer} />
      ) : (
        <Button title="Initialize SDK" onPress={handleInit} />
      )}
    </SafeAreaView>
  );
}

// ─── Result display ───────────────────────────────────────────────────────────

function ResultBox({
  result,
  error,
}: {
  result?: SmileResult;
  error?: SmileError;
}) {
  if (!result && !error) return null;
  return (
    <View style={error ? styles.errorBox : styles.successBox}>
      <Text style={styles.resultText}>
        {error
          ? `Error [${error.code}]: ${error.message}`
          : `Success: ${JSON.stringify(result, null, 2)}`}
      </Text>
    </View>
  );
}

// ─── Imperative Tab ───────────────────────────────────────────────────────────

function ImperativeTab() {
  const { launch, dismiss } = useSmileID();
  const [lastResult, setLastResult] = useState<SmileResult | undefined>();
  const [lastError, setLastError] = useState<SmileError | undefined>();

  function handleSuccess(result: SmileResult) {
    setLastResult(result);
    setLastError(undefined);
  }

  function handleError(error: SmileError) {
    setLastError(error);
    setLastResult(undefined);
  }

  return (
    <ScrollView contentContainerStyle={styles.tab}>
      <Text style={styles.heading}>Imperative API</Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          launch(
            'biometric_kyc',
            {
              countryCode: 'NG',
              idType: 'NIN_V2',
              idNumber: '00000000000',
              firstName: 'Ada',
              lastName: 'Obi',
            },
            { onSuccess: handleSuccess, onError: handleError }
          )
        }
      >
        <Text style={styles.buttonText}>Biometric KYC</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          launch(
            'smart_selfie_enrollment',
            {},
            { onSuccess: handleSuccess, onError: handleError }
          )
        }
      >
        <Text style={styles.buttonText}>SmartSelfie Enrollment</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          launch(
            'smart_selfie_authentication',
            { userId: 'test-user-id' },
            { onSuccess: handleSuccess, onError: handleError }
          )
        }
      >
        <Text style={styles.buttonText}>SmartSelfie Authentication</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() =>
          launch(
            'document_verification',
            { countryCode: 'NG', documentType: 'NATIONAL_ID' },
            { onSuccess: handleSuccess, onError: handleError }
          )
        }
      >
        <Text style={styles.buttonText}>Document Verification</Text>
      </TouchableOpacity>

      <Button title="Dismiss active flow" onPress={dismiss} />
      <ResultBox result={lastResult} error={lastError} />
    </ScrollView>
  );
}

// ─── Declarative Tab ──────────────────────────────────────────────────────────

function DeclarativeTab() {
  const [lastResult, setLastResult] = useState<SmileResult | undefined>();
  const [lastError, setLastError] = useState<SmileError | undefined>();

  function handleSuccess(result: SmileResult) {
    setLastResult(result);
    setLastError(undefined);
  }

  function handleError(error: SmileError) {
    setLastError(error);
    setLastResult(undefined);
  }

  return (
    <ScrollView contentContainerStyle={styles.tab}>
      <Text style={styles.heading}>Declarative API</Text>

      <Text style={styles.label}>BiometricKycView</Text>
      <View style={styles.flowBox}>
        <BiometricKycView
          countryCode="NG"
          idType="NIN_V2"
          idNumber="00000000000"
          firstName="Ada"
          lastName="Obi"
          style={styles.flowBox}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </View>

      <Text style={styles.label}>SmartSelfieEnrollmentView</Text>
      <View style={styles.flowBox}>
        <SmartSelfieEnrollmentView
          style={styles.flowBox}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </View>

      <Text style={styles.label}>SmartSelfieAuthenticationView</Text>
      <View style={styles.flowBox}>
        <SmartSelfieAuthenticationView
          userId="test-user-id"
          style={styles.flowBox}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </View>

      <Text style={styles.label}>DocumentVerificationView</Text>
      <View style={styles.flowBox}>
        <DocumentVerificationView
          countryCode="NG"
          documentType="NATIONAL_ID"
          style={styles.flowBox}
          onSuccess={handleSuccess}
          onError={handleError}
        />
      </View>

      <ResultBox result={lastResult} error={lastError} />
    </ScrollView>
  );
}

// ─── Tab bar ──────────────────────────────────────────────────────────────────

function TabBar({
  active,
  onChange,
}: {
  active: 'imperative' | 'declarative';
  onChange: (t: 'imperative' | 'declarative') => void;
}) {
  return (
    <View style={styles.tabBar}>
      {(['imperative', 'declarative'] as const).map((tab) => (
        <TouchableOpacity
          key={tab}
          style={[styles.tabItem, active === tab && styles.tabItemActive]}
          onPress={() => onChange(tab)}
        >
          <Text
            style={[styles.tabText, active === tab && styles.tabTextActive]}
          >
            {tab === 'imperative' ? 'Imperative' : 'Declarative'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Root ─────────────────────────────────────────────────────────────────────

export default function App() {
  const [ready, setReady] = useState(false);
  const [activeTab, setActiveTab] = useState<'imperative' | 'declarative'>(
    'imperative'
  );

  if (!ready) return <CredentialsScreen onReady={() => setReady(true)} />;

  return (
    <>
      <SafeAreaView style={styles.fill}>
        <TabBar active={activeTab} onChange={setActiveTab} />
        {activeTab === 'imperative' ? <ImperativeTab /> : <DeclarativeTab />}
      </SafeAreaView>
      <SmileIDPortal />
    </>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  fill: { flex: 1 },
  screen: { flex: 1, padding: 24 },
  heading: { fontSize: 20, fontWeight: '700', marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginTop: 12, marginBottom: 4 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 10,
    fontSize: 14,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  spacer: { marginTop: 16 },
  tab: { padding: 16, paddingBottom: 40 },
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderColor: '#ddd' },
  tabItem: { flex: 1, paddingVertical: 12, alignItems: 'center' },
  tabItemActive: { borderBottomWidth: 2, borderColor: '#007AFF' },
  tabText: { color: '#888', fontWeight: '500' },
  tabTextActive: { color: '#007AFF', fontWeight: '700' },
  button: {
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 14,
    paddingHorizontal: 20,
    alignItems: 'center',
    marginBottom: 12,
  },
  buttonText: { color: '#fff', fontWeight: '600', fontSize: 15 },
  flowBox: {
    height: 400,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 16,
  },
  successBox: {
    backgroundColor: '#e6f4ea',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  errorBox: {
    backgroundColor: '#fce8e6',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  resultText: { fontSize: 12, fontFamily: 'monospace' },
});
