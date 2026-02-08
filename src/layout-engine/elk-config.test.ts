import { describe, it, expect } from 'vitest';
import {
  ELK_OPTIONS,
  EDGE_CORNER_RADIUS,
  EDGE_CROSSING_GAP,
  EDGE_BRIDGE_RADIUS,
} from './elk-config';

describe('ELK_OPTIONS', () => {
  it('uses layered algorithm with DOWN direction', () => {
    expect(ELK_OPTIONS['elk.algorithm']).toBe('layered');
    expect(ELK_OPTIONS['elk.direction']).toBe('DOWN');
  });

  it('configures orthogonal edge routing', () => {
    expect(ELK_OPTIONS['elk.edgeRouting']).toBe('ORTHOGONAL');
  });

  it('sets spacing values as strings', () => {
    expect(ELK_OPTIONS['elk.spacing.nodeNode']).toBe('40');
    expect(ELK_OPTIONS['elk.spacing.edgeEdge']).toBe('15');
  });
});

describe('edge rendering constants', () => {
  it('exports expected numeric values', () => {
    expect(EDGE_CORNER_RADIUS).toBe(6);
    expect(EDGE_CROSSING_GAP).toBe(10);
    expect(EDGE_BRIDGE_RADIUS).toBe(5);
  });
});
