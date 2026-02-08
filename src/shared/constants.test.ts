import { describe, it, expect } from 'vitest';
import { APP_NAME } from './constants';

describe('constants', () => {
  it('exports APP_NAME as Mermaid Viewer', () => {
    expect(APP_NAME).toBe('Mermaid Viewer');
  });
});
