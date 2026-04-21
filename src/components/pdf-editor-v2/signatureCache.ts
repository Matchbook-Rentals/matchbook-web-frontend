const STORAGE_PREFIX = 'pdf-editor-v2:signature:';

export interface CachedSignature {
  value: string;
  type: 'drawn' | 'typed';
  fontFamily?: string;
}

const keyFor = (scope?: string) => `${STORAGE_PREFIX}${scope || 'default'}`;

export function getCachedSignature(scope?: string): CachedSignature | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(keyFor(scope));
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed.value === 'string' && (parsed.type === 'drawn' || parsed.type === 'typed')) {
      return parsed as CachedSignature;
    }
    return null;
  } catch {
    return null;
  }
}

export function setCachedSignature(data: CachedSignature, scope?: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(keyFor(scope), JSON.stringify(data));
  } catch {
    // ignore quota / privacy-mode errors
  }
}

export function clearCachedSignature(scope?: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(keyFor(scope));
  } catch {
    // ignore
  }
}
