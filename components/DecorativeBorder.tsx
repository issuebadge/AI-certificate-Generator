
import React from 'react';
import { BorderStyle } from '../types';

interface DecorativeBorderProps {
  width: number;
  height: number;
  color: string;
  style: BorderStyle;
}

const DecorativeBorder: React.FC<DecorativeBorderProps> = ({ width, height, color, style }) => {
  const strokeWidth = 2;
  const padding = 15;

  const renderClassicBorder = () => {
    const cornerSize = 40;
    const cornerPath = `M ${padding},${padding + cornerSize} L ${padding},${padding} L ${padding + cornerSize},${padding}`;
    const innerCornerPath = `M ${padding + 5},${padding + cornerSize - 5} L ${padding + 5},${padding + 5} L ${padding + cornerSize - 5},${padding + 5}`;

    return (
      <>
        <rect
          x={padding}
          y={padding}
          width={width - padding * 2}
          height={height - padding * 2}
          fill="none"
          stroke={color}
          strokeWidth={strokeWidth / 2}
        />
        <g stroke={color} strokeWidth={strokeWidth} fill="none">
          <path d={cornerPath} />
          <path d={innerCornerPath} strokeWidth={strokeWidth / 2} />
          <path d={cornerPath} transform={`translate(${width}, 0) scale(-1, 1)`} />
          <path d={innerCornerPath} strokeWidth={strokeWidth / 2} transform={`translate(${width}, 0) scale(-1, 1)`} />
          <path d={cornerPath} transform={`translate(0, ${height}) scale(1, -1)`} />
          <path d={innerCornerPath} strokeWidth={strokeWidth / 2} transform={`translate(0, ${height}) scale(1, -1)`} />
          <path d={cornerPath} transform={`translate(${width}, ${height}) scale(-1, -1)`} />
          <path d={innerCornerPath} strokeWidth={strokeWidth / 2} transform={`translate(${width}, ${height}) scale(-1, -1)`} />
        </g>
      </>
    );
  };

  const renderDoubleBorder = () => (
    <g stroke={color} fill="none">
      <rect
        x={padding}
        y={padding}
        width={width - padding * 2}
        height={height - padding * 2}
        strokeWidth={strokeWidth}
      />
      <rect
        x={padding + 6}
        y={padding + 6}
        width={width - (padding + 6) * 2}
        height={height - (padding + 6) * 2}
        strokeWidth={strokeWidth / 2}
      />
    </g>
  );

  const renderMinimalBorder = () => (
    <rect
      x={padding}
      y={padding}
      width={width - padding * 2}
      height={height - padding * 2}
      fill="none"
      stroke={color}
      strokeWidth={strokeWidth / 1.5}
    />
  );

  const renderBorder = () => {
    switch (style) {
      case 'classic':
        return renderClassicBorder();
      case 'double':
        return renderDoubleBorder();
      case 'minimal':
        return renderMinimalBorder();
      default:
        return null;
    }
  };

  return (
    <svg
      width={width}
      height={height}
      className="absolute top-0 left-0 pointer-events-none"
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
    >
      {renderBorder()}
    </svg>
  );
};

export default DecorativeBorder;
