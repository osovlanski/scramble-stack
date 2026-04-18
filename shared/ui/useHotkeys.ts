import { useEffect } from 'react';

type HotkeyHandler = (event: KeyboardEvent) => void;

interface HotkeyOptions {
  enabled?: boolean;
  preventDefault?: boolean;
  target?: Window | HTMLElement | null;
}

function matches(event: KeyboardEvent, combo: string): boolean {
  const parts = combo.toLowerCase().split('+').map(part => part.trim());
  const key = parts[parts.length - 1];
  const needsMeta = parts.includes('meta') || parts.includes('cmd');
  const needsCtrl = parts.includes('ctrl');
  const needsShift = parts.includes('shift');
  const needsAlt = parts.includes('alt') || parts.includes('option');
  return (
    event.key.toLowerCase() === key &&
    event.metaKey === needsMeta &&
    event.ctrlKey === needsCtrl &&
    event.shiftKey === needsShift &&
    event.altKey === needsAlt
  );
}

export function useHotkeys(
  bindings: Record<string, HotkeyHandler>,
  options: HotkeyOptions = {},
): void {
  const { enabled = true, preventDefault = true, target } = options;

  useEffect(() => {
    if (!enabled) return;
    const element = target ?? (typeof window === 'undefined' ? null : window);
    if (!element) return;

    const listener = (event: Event) => {
      const keyboardEvent = event as KeyboardEvent;
      const tag = (keyboardEvent.target as HTMLElement | null)?.tagName;
      if (tag === 'INPUT' || tag === 'TEXTAREA' || (keyboardEvent.target as HTMLElement | null)?.isContentEditable) {
        return;
      }
      for (const [combo, handler] of Object.entries(bindings)) {
        if (matches(keyboardEvent, combo)) {
          if (preventDefault) keyboardEvent.preventDefault();
          handler(keyboardEvent);
          return;
        }
      }
    };

    element.addEventListener('keydown', listener);
    return () => element.removeEventListener('keydown', listener);
  }, [bindings, enabled, preventDefault, target]);
}
