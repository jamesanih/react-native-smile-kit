import type { ColorValue, ViewProps } from 'react-native';

type Props = ViewProps & {
  color?: ColorValue;
};

export function RnWrapView(_props: Props): never {
  throw new Error(
    "'rn-wrap' is only supported on native platforms."
  );
}
