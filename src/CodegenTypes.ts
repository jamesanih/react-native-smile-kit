import type { NativeSyntheticEvent } from 'react-native';

export type DirectEventHandler<T> = (event: NativeSyntheticEvent<T>) => void;
export type Float = number;
export type Int32 = number;
export type WithDefault<T, _Default> = T | null | undefined;
