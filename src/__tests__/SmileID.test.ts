// Each test that needs a fresh SmileID state uses jest.isolateModules
// to get a clean module with idle state. Tests that share state run together.

const makeMocks = (opts?: { initRejects?: boolean }) =>
  jest.mock('react-native', () => ({
    TurboModuleRegistry: {
      getEnforcing: () => ({
        initialize: opts?.initRejects
          ? jest.fn().mockRejectedValue(new Error('init failed'))
          : jest.fn().mockResolvedValue(undefined),
        setCallbackUrl: jest.fn().mockResolvedValue(undefined),
      }),
    },
  }));

describe('SmileID.getInitState', () => {
  it('starts as idle', () => {
    jest.isolateModules(() => {
      jest.mock('react-native', () => ({
        TurboModuleRegistry: {
          getEnforcing: () => ({
            initialize: jest.fn().mockResolvedValue(undefined),
            setCallbackUrl: jest.fn().mockResolvedValue(undefined),
          }),
        },
      }));
      const { SmileID } = require('../SmileID');
      expect(SmileID.getInitState()).toBe('idle');
    });
  });
});

describe('SmileID.initialize', () => {
  it('requires non-empty partnerId', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.mock('react-native', () => ({
        TurboModuleRegistry: {
          getEnforcing: () => ({
            initialize: jest.fn().mockResolvedValue(undefined),
            setCallbackUrl: jest.fn().mockResolvedValue(undefined),
          }),
        },
      }));
      const { SmileID } = require('../SmileID');
      await expect(
        SmileID.initialize({ partnerId: '', authToken: 'tok' })
      ).rejects.toThrow('partnerId');
    });
  });

  it('requires non-empty authToken', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.mock('react-native', () => ({
        TurboModuleRegistry: {
          getEnforcing: () => ({
            initialize: jest.fn().mockResolvedValue(undefined),
            setCallbackUrl: jest.fn().mockResolvedValue(undefined),
          }),
        },
      }));
      const { SmileID } = require('../SmileID');
      await expect(
        SmileID.initialize({ partnerId: 'pid', authToken: '' })
      ).rejects.toThrow('authToken');
    });
  });

  it('transitions state to ready on success', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.mock('react-native', () => ({
        TurboModuleRegistry: {
          getEnforcing: () => ({
            initialize: jest.fn().mockResolvedValue(undefined),
            setCallbackUrl: jest.fn().mockResolvedValue(undefined),
          }),
        },
      }));
      const { SmileID } = require('../SmileID');
      await SmileID.initialize({ partnerId: 'pid', authToken: 'tok' });
      expect(SmileID.getInitState()).toBe('ready');
    });
  });

  it('transitions state to error on failure', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.mock('react-native', () => ({
        TurboModuleRegistry: {
          getEnforcing: () => ({
            initialize: jest.fn().mockRejectedValue(new Error('init failed')),
            setCallbackUrl: jest.fn().mockResolvedValue(undefined),
          }),
        },
      }));
      const { SmileID } = require('../SmileID');
      await expect(SmileID.initialize({ partnerId: 'pid', authToken: 'tok' })).rejects.toThrow();
      expect(SmileID.getInitState()).toBe('error');
    });
  });
});

describe('SmileID.launch', () => {
  it('throws when not initialized (idle state)', () => {
    jest.isolateModules(() => {
      jest.mock('react-native', () => ({
        TurboModuleRegistry: {
          getEnforcing: () => ({
            initialize: jest.fn().mockResolvedValue(undefined),
            setCallbackUrl: jest.fn().mockResolvedValue(undefined),
          }),
        },
      }));
      const { SmileID } = require('../SmileID');
      expect(() =>
        SmileID.launch(
          'biometric_kyc',
          { countryCode: 'NG', idType: 'NIN', idNumber: '123', firstName: 'Ada', lastName: 'Obi' },
          { onSuccess: jest.fn(), onError: jest.fn() }
        )
      ).toThrow('SmileID not initialized');
    });
  });

  it('throws when biometric_kyc is missing countryCode', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.mock('react-native', () => ({
        TurboModuleRegistry: {
          getEnforcing: () => ({
            initialize: jest.fn().mockResolvedValue(undefined),
            setCallbackUrl: jest.fn().mockResolvedValue(undefined),
          }),
        },
      }));
      const { SmileID } = require('../SmileID');
      await SmileID.initialize({ partnerId: 'pid', authToken: 'tok' });
      expect(() =>
        SmileID.launch(
          'biometric_kyc',
          { countryCode: '', idType: 'NIN', idNumber: '123', firstName: 'Ada', lastName: 'Obi' },
          { onSuccess: jest.fn(), onError: jest.fn() }
        )
      ).toThrow('biometric_kyc requires countryCode');
    });
  });

  it('throws when smart_selfie_authentication is missing userId', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.mock('react-native', () => ({
        TurboModuleRegistry: {
          getEnforcing: () => ({
            initialize: jest.fn().mockResolvedValue(undefined),
            setCallbackUrl: jest.fn().mockResolvedValue(undefined),
          }),
        },
      }));
      const { SmileID } = require('../SmileID');
      await SmileID.initialize({ partnerId: 'pid', authToken: 'tok' });
      expect(() =>
        SmileID.launch(
          'smart_selfie_authentication',
          { userId: '' },
          { onSuccess: jest.fn(), onError: jest.fn() }
        )
      ).toThrow('userId');
    });
  });

  it('throws when document_verification is missing countryCode', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.mock('react-native', () => ({
        TurboModuleRegistry: {
          getEnforcing: () => ({
            initialize: jest.fn().mockResolvedValue(undefined),
            setCallbackUrl: jest.fn().mockResolvedValue(undefined),
          }),
        },
      }));
      const { SmileID } = require('../SmileID');
      await SmileID.initialize({ partnerId: 'pid', authToken: 'tok' });
      expect(() =>
        SmileID.launch(
          'document_verification',
          { countryCode: '', documentType: 'NATIONAL_ID' },
          { onSuccess: jest.fn(), onError: jest.fn() }
        )
      ).toThrow('document_verification requires countryCode');
    });
  });
});

describe('SmileID.onStateChange', () => {
  it('notifies listeners on state change', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.mock('react-native', () => ({
        TurboModuleRegistry: {
          getEnforcing: () => ({
            initialize: jest.fn().mockResolvedValue(undefined),
            setCallbackUrl: jest.fn().mockResolvedValue(undefined),
          }),
        },
      }));
      const { SmileID } = require('../SmileID');
      const listener = jest.fn();
      const unsub = SmileID.onStateChange(listener);
      await SmileID.initialize({ partnerId: 'pid', authToken: 'tok' });
      expect(listener).toHaveBeenCalledWith('initializing');
      expect(listener).toHaveBeenCalledWith('ready');
      unsub();
    });
  });

  it('stops notifying after unsubscribe', async () => {
    await jest.isolateModulesAsync(async () => {
      jest.mock('react-native', () => ({
        TurboModuleRegistry: {
          getEnforcing: () => ({
            initialize: jest.fn().mockResolvedValue(undefined),
            setCallbackUrl: jest.fn().mockResolvedValue(undefined),
          }),
        },
      }));
      const { SmileID } = require('../SmileID');
      const listener = jest.fn();
      const unsub = SmileID.onStateChange(listener);
      unsub();
      await SmileID.initialize({ partnerId: 'pid', authToken: 'tok' });
      expect(listener).not.toHaveBeenCalled();
    });
  });
});

describe('SmileID.dismiss', () => {
  it('does not throw when no portal is mounted', () => {
    jest.isolateModules(() => {
      jest.mock('react-native', () => ({
        TurboModuleRegistry: {
          getEnforcing: () => ({
            initialize: jest.fn().mockResolvedValue(undefined),
            setCallbackUrl: jest.fn().mockResolvedValue(undefined),
          }),
        },
      }));
      const { SmileID } = require('../SmileID');
      expect(() => SmileID.dismiss()).not.toThrow();
    });
  });
});

// Keep makeMocks in scope to avoid unused variable lint error
void makeMocks;
