/**
 * @vitest-environment jsdom
 */
import { describe, it, expect } from 'vitest';
import { ErrorBoundary } from '@error/error-boundary';

describe('error boundary integration', () => {
  it('preserves last valid SVG after error', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const eb = new ErrorBoundary(container);
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    eb.cacheRender(svg);
    eb.showError('Parse failed: unexpected token');
    expect(eb.getLastValidRender()).toBe(svg);
    const banner = container.querySelector('.error-banner');
    expect(banner).not.toBeNull();
    expect(banner!.textContent).toBe('Parse failed: unexpected token');
  });

  it('clears error banner on successful recovery', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const eb = new ErrorBoundary(container);
    eb.showError('old error');
    expect(container.querySelector('.error-banner')).not.toBeNull();
    const newSvg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    eb.handleRenderSuccess(newSvg);
    expect(container.querySelector('.error-banner')).toBeNull();
    expect(eb.getLastValidRender()).toBe(newSvg);
  });

  it('returns null when no valid render has been cached', () => {
    const container = document.createElement('div');
    const eb = new ErrorBoundary(container);
    eb.showError('error before any render');
    expect(eb.getLastValidRender()).toBeNull();
  });

  it('updates banner text on consecutive errors', () => {
    const container = document.createElement('div');
    document.body.appendChild(container);
    const eb = new ErrorBoundary(container);
    eb.showError('first error');
    eb.showError('second error');
    const banner = container.querySelector('.error-banner');
    expect(banner!.textContent).toBe('second error');
  });
});
