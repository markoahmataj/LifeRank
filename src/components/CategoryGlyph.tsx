// src/components/CategoryGlyph.tsx
// SVG glyph icons for the 5 life categories.

import React from 'react';
import Svg, { Path, Circle, Line } from 'react-native-svg';
import type { CategoryGlyph } from '../design-system/types';

interface CategoryGlyphProps {
  glyph: CategoryGlyph;
  color: string;
  size?: number;
  strokeWidth?: number;
}

export function CategoryGlyphIcon({
  glyph,
  color,
  size = 18,
  strokeWidth = 1.6,
}: CategoryGlyphProps) {
  const s = { stroke: color, strokeWidth, fill: 'none' as const, strokeLinecap: 'round' as const, strokeLinejoin: 'round' as const };

  switch (glyph) {
    case 'crosshair':
      // Discipline — crosshair / target
      return (
        <Svg width={size} height={size} viewBox="0 0 18 18">
          <Circle cx={9} cy={9} r={5} {...s}/>
          <Circle cx={9} cy={9} r={1.5} fill={color}/>
          <Line x1={9} y1={1} x2={9} y2={4} {...s}/>
          <Line x1={9} y1={14} x2={9} y2={17} {...s}/>
          <Line x1={1} y1={9} x2={4} y2={9} {...s}/>
          <Line x1={14} y1={9} x2={17} y2={9} {...s}/>
        </Svg>
      );
    case 'diamond':
      // Style — diamond / gem
      return (
        <Svg width={size} height={size} viewBox="0 0 18 18">
          <Path d="M9 2L16 9L9 16L2 9Z" {...s}/>
          <Path d="M2 9h14" {...s} strokeOpacity={0.5}/>
          <Path d="M5 5l4 4 4-4" {...s} strokeOpacity={0.5}/>
        </Svg>
      );
    case 'node':
      // Environment — node / network
      return (
        <Svg width={size} height={size} viewBox="0 0 18 18">
          <Circle cx={9}  cy={9}  r={2} fill={color}/>
          <Circle cx={3}  cy={5}  r={1.5} fill={color}/>
          <Circle cx={15} cy={5}  r={1.5} fill={color}/>
          <Circle cx={3}  cy={13} r={1.5} fill={color}/>
          <Circle cx={15} cy={13} r={1.5} fill={color}/>
          <Line x1={9} y1={9} x2={3}  y2={5}  {...s}/>
          <Line x1={9} y1={9} x2={15} y2={5}  {...s}/>
          <Line x1={9} y1={9} x2={3}  y2={13} {...s}/>
          <Line x1={9} y1={9} x2={15} y2={13} {...s}/>
        </Svg>
      );
    case 'chart':
      // Money — bar chart / capital
      return (
        <Svg width={size} height={size} viewBox="0 0 18 18">
          <Path d="M2 14V6M6 14V9M10 14V4M14 14V7M18 14H1" {...s}/>
        </Svg>
      );
    case 'ascent':
      // Career — ascending arrow
      return (
        <Svg width={size} height={size} viewBox="0 0 18 18">
          <Path d="M2 14L8 8l4 3 6-8" {...s}/>
          <Path d="M12 3h4v4" {...s}/>
        </Svg>
      );
    default:
      return null;
  }
}
