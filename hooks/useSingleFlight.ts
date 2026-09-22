import { useCallback, useRef } from 'react';

interface Options {
  /** Keep blocking taps after the task succeeded (use when the screen closes right after). */
  lockOnSuccess?: boolean;
}

/**
 * Stops double taps. While one task is running, calling `run` again does nothing.
 * It uses a ref, so the block works instantly - before React has re-drawn the button.
 * Example: pressing "Save Bill" twice quickly makes only ONE bill.
 */
export function useSingleFlight() {
  const running = useRef(false);

  return useCallback(async (task: () => Promise<void>, options: Options = {}): Promise<void> => {
    if (running.current) return;
    running.current = true;
    try {
      await task();
      if (!options.lockOnSuccess) running.current = false;
    } catch (error) {
      running.current = false;
      throw error;
    }
  }, []);
}
