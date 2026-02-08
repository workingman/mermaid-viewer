export interface ParsedNode {
  id: string;
  label: string;
  shape: string;
  width: number;
  height: number;
  svgFragment: string;
}

export type LineStyle = 'solid' | 'dotted' | 'thick';

export interface ParsedEdge {
  id: string;
  sourceId: string;
  targetId: string;
  label: string | null;
  arrowType: string;
  lineStyle: LineStyle;
}

export interface ParsedGraph {
  nodes: ParsedNode[];
  edges: ParsedEdge[];
  diagramType: string;
}
