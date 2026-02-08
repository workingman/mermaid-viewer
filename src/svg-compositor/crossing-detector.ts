import type { RoutedEdge, EdgeCrossing, Point } from '@shared/types';

interface Segment {
  p1: Point;
  p2: Point;
  edgeId: string;
}

const EPSILON = 1e-10;

function extractSegments(edge: RoutedEdge): Segment[] {
  const segments: Segment[] = [];
  for (const section of edge.sections) {
    const points = buildPointList(section);
    for (let i = 0; i < points.length - 1; i++) {
      segments.push({ p1: points[i], p2: points[i + 1], edgeId: edge.id });
    }
  }
  return segments;
}

function buildPointList(section: {
  startPoint: Point;
  endPoint: Point;
  bendPoints?: Point[];
}): Point[] {
  const points = [section.startPoint];
  if (section.bendPoints) {
    points.push(...section.bendPoints);
  }
  points.push(section.endPoint);
  return points;
}

function findIntersection(
  a: Segment,
  b: Segment,
): Point | null {
  const denom = computeDenom(a, b);
  if (Math.abs(denom) < EPSILON) return null;

  const t = computeT(a, b, denom);
  const u = computeU(a, b, denom);

  if (t < EPSILON || t > 1 - EPSILON) return null;
  if (u < EPSILON || u > 1 - EPSILON) return null;

  return {
    x: a.p1.x + t * (a.p2.x - a.p1.x),
    y: a.p1.y + t * (a.p2.y - a.p1.y),
  };
}

function computeDenom(a: Segment, b: Segment): number {
  return (
    (a.p1.x - a.p2.x) * (b.p1.y - b.p2.y) -
    (a.p1.y - a.p2.y) * (b.p1.x - b.p2.x)
  );
}

function computeT(a: Segment, b: Segment, denom: number): number {
  return (
    ((a.p1.x - b.p1.x) * (b.p1.y - b.p2.y) -
      (a.p1.y - b.p1.y) * (b.p1.x - b.p2.x)) /
    denom
  );
}

function computeU(a: Segment, b: Segment, denom: number): number {
  return (
    ((a.p1.x - b.p1.x) * (a.p1.y - a.p2.y) -
      (a.p1.y - b.p1.y) * (a.p1.x - a.p2.x)) /
    denom
  );
}

export function computeEdgeCrossings(
  routedEdges: RoutedEdge[],
): EdgeCrossing[] {
  const crossings: EdgeCrossing[] = [];
  const edgeSegments = routedEdges.map(extractSegments);

  for (let i = 0; i < edgeSegments.length; i++) {
    for (let j = i + 1; j < edgeSegments.length; j++) {
      collectPairCrossings(edgeSegments[i], edgeSegments[j], crossings);
    }
  }
  return crossings;
}

function collectPairCrossings(
  segsA: Segment[],
  segsB: Segment[],
  crossings: EdgeCrossing[],
): void {
  for (const a of segsA) {
    for (const b of segsB) {
      const pt = findIntersection(a, b);
      if (pt) {
        crossings.push({
          point: pt,
          edge1Id: a.edgeId,
          edge2Id: b.edgeId,
        });
      }
    }
  }
}
