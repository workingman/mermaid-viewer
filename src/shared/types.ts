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

export interface SidecarData {
  version: 1;
  nodes: Record<string, { x: number; y: number }>;
}

export interface MergedNode extends ParsedNode {
  hintX?: number;
  hintY?: number;
}

export interface MergedGraph {
  nodes: MergedNode[];
  edges: ParsedEdge[];
  diagramType: string;
}

// ELK input types

export type ELKLayoutOptions = Record<string, string>;

export interface ELKLabel {
  text: string;
  width?: number;
  height?: number;
}

export interface ELKNode {
  id: string;
  width: number;
  height: number;
  x?: number;
  y?: number;
  layoutOptions?: { 'elk.position'?: string };
}

export interface ELKEdge {
  id: string;
  sources: [string];
  targets: [string];
  labels?: ELKLabel[];
}

export interface ELKInputGraph {
  id: 'root';
  layoutOptions: ELKLayoutOptions;
  children: ELKNode[];
  edges: ELKEdge[];
}

// Layout result types

export interface Point {
  x: number;
  y: number;
}

export interface EdgeSection {
  startPoint: Point;
  endPoint: Point;
  bendPoints?: Point[];
}

export interface PositionedNode {
  id: string;
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface RoutedEdge {
  id: string;
  sections: EdgeSection[];
}

export interface EdgeCrossing {
  point: Point;
  edge1Id: string;
  edge2Id: string;
}

export interface LayoutResult {
  positionedNodes: PositionedNode[];
  routedEdges: RoutedEdge[];
}

export interface ELKLayoutResult {
  children: PositionedNode[];
  edges: RoutedEdge[];
}

// Viewport types

export interface ViewportState {
  zoom: number;
  panX: number;
  panY: number;
  contentBounds: { x: number; y: number; width: number; height: number };
}

export interface ViewportRect {
  x: number;
  y: number;
  width: number;
  height: number;
}

// Parse pipeline types

export interface ParseResult {
  graph: ParsedGraph;
  nodeSvgFragments: Map<string, string>;
  passthroughSvg?: string;
}

export class MermaidParseError extends Error {
  override name = 'MermaidParseError' as const;

  constructor(message: string) {
    super(message);
  }
}
