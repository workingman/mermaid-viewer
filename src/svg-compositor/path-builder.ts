import type { Point, EdgeSection } from '@shared/types';
import { EDGE_CORNER_RADIUS, EDGE_CROSSING_GAP } from '@layout-engine/elk-config';

export function buildEdgeSvgPath(sections: EdgeSection[], crossingPoints: Point[]): string {
  const ctx: PathContext = { crossingPoints, commands: [] };
  for (const section of sections) {
    buildSectionPath(section, ctx);
  }
  return ctx.commands.join(' ');
}

interface PathContext {
  crossingPoints: Point[];
  commands: string[];
}

function buildSectionPath(section: EdgeSection, ctx: PathContext): void {
  const points = buildFullPointList(section);
  ctx.commands.push(`M ${points[0].x} ${points[0].y}`);
  for (let i = 1; i < points.length; i++) {
    const prev = points[i - 1];
    const curr = points[i];
    const next = i < points.length - 1 ? points[i + 1] : null;
    appendSegment(prev, curr, next, ctx);
  }
}

function buildFullPointList(section: EdgeSection): Point[] {
  const points: Point[] = [section.startPoint];
  if (section.bendPoints) {
    points.push(...section.bendPoints);
  }
  points.push(section.endPoint);
  return points;
}

function appendSegment(prev: Point, curr: Point, next: Point | null, ctx: PathContext): void {
  const crossing = findNearestCrossing(prev, curr, ctx.crossingPoints);
  if (crossing) {
    appendCrossingGap(crossing, curr, ctx.commands);
    return;
  }
  if (next) {
    ctx.commands.push(...buildRoundedCorner(prev, curr, next));
  } else {
    ctx.commands.push(`L ${curr.x} ${curr.y}`);
  }
}

function findNearestCrossing(from: Point, to: Point, crossingPoints: Point[]): Point | null {
  for (const cp of crossingPoints) {
    if (isPointOnSegment(from, to, cp)) return cp;
  }
  return null;
}

function isPointOnSegment(a: Point, b: Point, p: Point): boolean {
  const cross = (p.x - a.x) * (b.y - a.y) - (p.y - a.y) * (b.x - a.x);
  if (Math.abs(cross) > 1) return false;
  const minX = Math.min(a.x, b.x);
  const maxX = Math.max(a.x, b.x);
  const minY = Math.min(a.y, b.y);
  const maxY = Math.max(a.y, b.y);
  return p.x >= minX && p.x <= maxX && p.y >= minY && p.y <= maxY;
}

function appendCrossingGap(crossing: Point, segEnd: Point, commands: string[]): void {
  const halfGap = EDGE_CROSSING_GAP / 2;
  const dx = segEnd.x - crossing.x;
  const dy = segEnd.y - crossing.y;
  const len = Math.sqrt(dx * dx + dy * dy);
  if (len === 0) return;
  const nx = dx / len;
  const ny = dy / len;
  const gapStart = {
    x: crossing.x - nx * halfGap,
    y: crossing.y - ny * halfGap,
  };
  const gapEnd = {
    x: crossing.x + nx * halfGap,
    y: crossing.y + ny * halfGap,
  };
  commands.push(`L ${gapStart.x} ${gapStart.y}`);
  commands.push(`M ${gapEnd.x} ${gapEnd.y}`);
}

function buildRoundedCorner(prev: Point, bend: Point, next: Point): string[] {
  const r = clampRadius(prev, bend, next);
  if (r < 1) {
    return [`L ${bend.x} ${bend.y}`];
  }
  const approach = approachPoint(prev, bend, r);
  const depart = departPoint(bend, next, r);
  return [`L ${approach.x} ${approach.y}`, `Q ${bend.x} ${bend.y} ${depart.x} ${depart.y}`];
}

function clampRadius(prev: Point, bend: Point, next: Point): number {
  const d1 = distance(prev, bend);
  const d2 = distance(bend, next);
  return Math.min(EDGE_CORNER_RADIUS, d1 / 2, d2 / 2);
}

function approachPoint(from: Point, to: Point, r: number): Point {
  const d = distance(from, to);
  const ratio = (d - r) / d;
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

function departPoint(from: Point, to: Point, r: number): Point {
  const d = distance(from, to);
  const ratio = r / d;
  return {
    x: from.x + (to.x - from.x) * ratio,
    y: from.y + (to.y - from.y) * ratio,
  };
}

function distance(a: Point, b: Point): number {
  const dx = b.x - a.x;
  const dy = b.y - a.y;
  return Math.sqrt(dx * dx + dy * dy);
}
