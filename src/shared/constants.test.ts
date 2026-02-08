import { describe, it, expect } from 'vitest';
import {
  APP_NAME,
  GRAPH_DIAGRAM_TYPES,
  NON_GRAPH_DIAGRAM_TYPES,
  isGraphDiagram,
} from './constants';

describe('constants', () => {
  it('exports APP_NAME as Mermaid Viewer', () => {
    expect(APP_NAME).toBe('Mermaid Viewer');
  });
});

describe('isGraphDiagram', () => {
  it('returns true for graph diagram types', () => {
    for (const type of GRAPH_DIAGRAM_TYPES) {
      expect(isGraphDiagram(type)).toBe(true);
    }
  });

  it('returns false for non-graph diagram types', () => {
    for (const type of NON_GRAPH_DIAGRAM_TYPES) {
      expect(isGraphDiagram(type)).toBe(false);
    }
  });

  it('returns false for unknown types', () => {
    expect(isGraphDiagram('unknown')).toBe(false);
  });
});
