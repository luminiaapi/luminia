/**
 * Utilities for debounced storage operations
 */

type SaveFunction = () => Promise<void>;

/**
 * Creates a debounced save function
 */
export function createDebouncedSave(delayMs: number = 400): {
  schedule: (fn: SaveFunction) => void;
  immediate: (fn: SaveFunction) => void;
  cancel: () => void;
} {
  let timer: ReturnType<typeof setTimeout> | null = null;

  return {
    schedule: (fn: SaveFunction) => {
      if (timer) clearTimeout(timer);
      timer = setTimeout(() => {
        fn().catch(console.error);
      }, delayMs);
    },

    immediate: (fn: SaveFunction) => {
      if (timer) clearTimeout(timer);
      fn().catch(console.error);
    },

    cancel: () => {
      if (timer) {
        clearTimeout(timer);
        timer = null;
      }
    }
  };
}
