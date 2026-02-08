import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const css = readFileSync(resolve(__dirname, 'edit-mode.css'), 'utf-8');

describe('edit-mode.css', () => {
  it('scopes grid background to .editing-active', () => {
    expect(css).toContain('.editing-active');
    expect(css).toContain('repeating-linear-gradient');
  });

  it('defines --edit-grid-size custom property at 20px', () => {
    expect(css).toMatch(/--edit-grid-size:\s*20px/);
  });

  it('defines --edit-grid-color custom property', () => {
    expect(css).toMatch(/--edit-grid-color:\s*rgba\(0,\s*0,\s*0,\s*0\.05\)/);
  });

  it('includes .node--selected with visible outline', () => {
    expect(css).toContain('.node--selected');
    expect(css).toContain('outline:');
  });
});
