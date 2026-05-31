import type { TurboModule } from 'react-native';
import { TurboModuleRegistry } from 'react-native';

export interface SmileConfig {
  partner_id?: string;
  auth_token?: string;
  prod_lambda_url?: string;
  test_lambda_url?: string;
}

export interface Spec extends TurboModule {
  initialize(
    useSandbox: boolean,
    enableCrashReporting: boolean,
    config?: Object,
    apiKey?: string | null
  ): Promise<void>;
  setCallbackUrl(url?: string): Promise<void>;
}

export default TurboModuleRegistry.getEnforcing<Spec>('SmileID');
