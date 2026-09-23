import { useEffect } from 'react';

export function useHotkey(combo, callback, options = {}) {
  useEffect(() => {
    const handleKeyDown = (event) => {
      if (options.disabled) return;

      const keys = combo.toLowerCase().split('+');
      const isCtrlOrMeta = keys.includes('ctrl') || keys.includes('cmd') || keys.includes('meta');
      const ctrlOrMetaPressed = event.ctrlKey || event.metaKey;
      const shiftRequired = keys.includes('shift');
      const targetKey = keys[keys.length - 1];

      if (isCtrlOrMeta && !ctrlOrMetaPressed) return;
      if (shiftRequired && !event.shiftKey) return;

      if (event.key.toLowerCase() === targetKey) {
        if (options.preventDefault !== false) {
          event.preventDefault();
        }
        callback(event);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [combo, callback, options.disabled, options.preventDefault]);
}
