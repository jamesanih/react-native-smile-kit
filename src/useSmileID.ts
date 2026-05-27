import { useEffect, useState } from 'react';
import { SmileID } from './SmileID';
import type { FlowOptions, InitState, SmileError, SmileFlow, SmileResult } from './types';

export function useSmileID() {
  const [initState, setInitState] = useState<InitState>(SmileID.getInitState());

  useEffect(() => {
    const unsubscribe = SmileID.onStateChange(setInitState);
    return unsubscribe;
  }, []);

  return {
    initState,
    isReady: initState === 'ready',
    launch: (
      flow: SmileFlow,
      options: FlowOptions,
      callbacks: {
        onSuccess: (result: SmileResult) => void;
        onError: (error: SmileError) => void;
      }
    ) => SmileID.launch(flow, options, callbacks),
    dismiss: () => SmileID.dismiss(),
  };
}
