import { describe, it, expect } from 'vitest';
import { detectDiagramType, isPassthrough } from './diagram-detector';
import { isGraphDiagram } from '@shared/constants';

describe('detectDiagramType', () => {
  it('detects flowchart', () => {
    expect(detectDiagramType('flowchart TD\n  A-->B')).toBe('flowchart');
  });

  it('detects stateDiagram as graph type', () => {
    expect(detectDiagramType('stateDiagram\n  [*]-->A')).toBe('stateDiagram');
  });

  it('detects classDiagram as graph type', () => {
    expect(detectDiagramType('classDiagram\n  A <|-- B')).toBe('classDiagram');
  });

  it('detects erDiagram as graph type', () => {
    expect(detectDiagramType('erDiagram\n  A ||--o{ B : has')).toBe('erDiagram');
  });

  it('detects sequenceDiagram as non-graph', () => {
    expect(detectDiagramType('sequenceDiagram\n  A->>B: msg')).toBe('sequenceDiagram');
  });

  it('detects gantt as non-graph', () => {
    expect(detectDiagramType('gantt\n  title A')).toBe('gantt');
  });

  it('treats graph keyword as flowchart', () => {
    expect(detectDiagramType('graph LR\n  A-->B')).toBe('flowchart');
  });

  it('skips %%{init:}%% directives', () => {
    const text = '%%{init: {"theme": "dark"}}%%\nflowchart TD\n  A-->B';
    expect(detectDiagramType(text)).toBe('flowchart');
  });

  it('ignores direction suffixes during detection', () => {
    expect(detectDiagramType('flowchart RL')).toBe('flowchart');
    expect(detectDiagramType('flowchart BT')).toBe('flowchart');
  });

  it('returns unknown for empty input', () => {
    expect(detectDiagramType('')).toBe('unknown');
  });

  it('returns the raw keyword for unknown types', () => {
    expect(detectDiagramType('journey\n  title My day')).toBe('journey');
  });
});

describe('isPassthrough', () => {
  it('returns true for non-graph types', () => {
    expect(isPassthrough('sequenceDiagram')).toBe(true);
    expect(isPassthrough('gantt')).toBe(true);
    expect(isPassthrough('pie')).toBe(true);
  });

  it('returns false for graph types', () => {
    expect(isPassthrough('flowchart')).toBe(false);
    expect(isPassthrough('stateDiagram')).toBe(false);
  });

  it('returns true for unknown types', () => {
    expect(isPassthrough('unknown')).toBe(true);
  });
});

describe('isGraphDiagram integration', () => {
  it('classifies detected types correctly', () => {
    expect(isGraphDiagram(detectDiagramType('flowchart TD\n  A-->B'))).toBe(true);
    expect(isGraphDiagram(detectDiagramType('sequenceDiagram\n  A->>B: x'))).toBe(false);
  });
});
