import { describe, it, expect } from 'vitest';
// @ts-expect-error -- node fs not in browser tsconfig; test-only
import fs from 'fs';
// @ts-expect-error -- node path not in browser tsconfig; test-only
import path from 'path';

// @ts-expect-error -- __dirname available in vitest node runtime
const cssPath = path.resolve(__dirname, 'edit-mode.css');
const css = fs.readFileSync(cssPath, 'utf-8');

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
