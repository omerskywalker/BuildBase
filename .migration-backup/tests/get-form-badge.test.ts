import { describe, it, expect } from 'vitest';
import { getFormBadge } from '@/lib/utils';

describe('getFormBadge', () => {
  it('should return "Solid Form ✅" for locked_in status', () => {
    expect(getFormBadge('locked_in')).toBe('Solid Form ✅');
  });

  it('should return null for needs_cues status', () => {
    expect(getFormBadge('needs_cues')).toBeNull();
  });

  it('should return null for getting_there status', () => {
    expect(getFormBadge('getting_there')).toBeNull();
  });

  it('should return null for null status', () => {
    expect(getFormBadge(null)).toBeNull();
  });

  it('should return null for undefined status', () => {
    expect(getFormBadge(undefined)).toBeNull();
  });

  it('should return null for empty string', () => {
    expect(getFormBadge('')).toBeNull();
  });

  it('should return null for unknown status', () => {
    expect(getFormBadge('unknown_status')).toBeNull();
  });

  it('should handle status as any type and return null for non-locked_in values', () => {
    expect(getFormBadge('random')).toBeNull();
    expect(getFormBadge(123 as any)).toBeNull();
    expect(getFormBadge(true as any)).toBeNull();
    expect(getFormBadge({} as any)).toBeNull();
  });
});