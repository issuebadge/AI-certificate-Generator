
import React from 'react';
import { Element } from '../types';
import EditableElement from './EditableElement';

interface CertificateCanvasProps {
  certificateRef: React.RefObject<HTMLDivElement>;
  elements: Element[];
  selectedElementId: string | null;
  setSelectedElementId: (id: string | null) => void;
  updateElement: (id: string, newProps: Partial<Element>) => void;
}

const CertificateCanvas: React.FC<CertificateCanvasProps> = ({
  certificateRef,
  elements,
  selectedElementId,
  setSelectedElementId,
  updateElement,
}) => {
  const handleCanvasClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === certificateRef.current) {
      setSelectedElementId(null);
    }
  };

  return (
    <div
      ref={certificateRef}
      className="w-[1123px] h-[794px] bg-white shadow-2xl relative"
      style={{
          boxSizing: 'content-box',
          border: '1px solid #ccc'
      }}
      onClick={handleCanvasClick}
    >
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
