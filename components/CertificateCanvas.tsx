
import React from 'react';
import { Element, BorderStyle } from '../types';
import EditableElement from './EditableElement';
import DecorativeBorder from './DecorativeBorder';

interface CertificateCanvasProps {
  certificateRef: React.RefObject<HTMLDivElement>;
  elements: Element[];
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  updateElement: (id: string, newProps: Partial<Element>) => void;
  certificateSize: { width: number, height: number };
  certificateBgColor: string;
  certificateBorderColor: string;
  certificateBorderStyle: BorderStyle;
  scale: number;
}

const CertificateCanvas: React.FC<CertificateCanvasProps> = ({
  certificateRef,
  elements,
  selectedElementId,
  setSelectedElementId,
  updateElement,
  certificateSize,
  certificateBgColor,
  certificateBorderColor,
  certificateBorderStyle,
  scale,
}) => {
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === certificateRef.current) {
      setSelectedElementId(null);
    }
  };

  return (
    <div
      ref={certificateRef}
      className="shadow-2xl relative transition-all duration-300"
      style={{
          width: `${certificateSize.width}px`,
          height: `${certificateSize.height}px`,
          backgroundColor: certificateBgColor,
          transform: `scale(${scale})`,
          transformOrigin: 'top left',
      }}
      onClick={handleCanvasClick}
    >
      <DecorativeBorder 
        width={certificateSize.width} 
        height={certificateSize.height} 
        color={certificateBorderColor}
        style={certificateBorderStyle}
      />
      {elements.map((element) => (
        <EditableElement
          key={element.id}
          element={element}
          isSelected={element.id === selectedElementId}
          onSelect={() => setSelectedElementId(element.id)}
          updateElement={updateElement}
        />
      ))}
    </div>
  );
};

export default CertificateCanvas;
