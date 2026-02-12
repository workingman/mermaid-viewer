// @vitest-environment jsdom
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { MermaidParseError } from '@shared/types';

vi.mock('mermaid', () => ({
  default: {
    initialize: vi.fn(),
    parse: vi.fn(),
    render: vi.fn(),
  },
}));

import mermaid from 'mermaid';
import { parse } from './mermaid-parser';

beforeEach(() => {
  vi.clearAllMocks();
  document.body.innerHTML = '';

  vi.mocked(mermaid.parse).mockResolvedValue(undefined as never);
  vi.mocked(mermaid.render).mockResolvedValue({
    svg: '<svg>ok</svg>',
    bindFunctions: vi.fn(),
  } as never);
});

describe('parse', () => {
  it('returns a ParseResult for valid input', async () => {
    const result = await parse('graph TD; A-->B');
    expect(result.graph).toBeDefined();
    expect(result.nodeSvgFragments).toBeInstanceOf(Map);
    expect(result.passthroughSvg).toBe('<svg>ok</svg>');
  });

  it('throws MermaidParseError for invalid syntax', async () => {
    vi.mocked(mermaid.parse).mockRejectedValue(new Error('bad'));
    await expect(parse('not valid')).rejects.toThrow(MermaidParseError);
    await expect(parse('not valid')).rejects.toThrow('bad');
  });

  it('cleans up the off-screen container after rendering', async () => {
    await parse('graph TD; A-->B');
    const leftover = document.querySelectorAll('div');
    expect(leftover).toHaveLength(0);
  });

  it('calls mermaid.initialize with correct config', async () => {
    await parse('graph TD; A-->B');
    expect(mermaid.initialize).toHaveBeenCalledWith({
      startOnLoad: false,
    });
  });

  it('generates unique render IDs across calls', async () => {
    await parse('graph TD; A-->B');
    await parse('graph TD; C-->D');

    const calls = vi.mocked(mermaid.render).mock.calls;
    const ids = calls.map((c) => c[0]);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
