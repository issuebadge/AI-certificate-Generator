
import React, { useRef } from 'react';
import { Element, TextElement, ImageElement, ShapeElement } from '../types';

interface EditableElementProps {
  element: Element;
  isSelected: boolean;
  onSelect: () => void;
  updateElement: (id: string, newProps: Partial<Element>) => void;
}

const MIN_WIDTH = 20;
const MIN_HEIGHT = 20;

const EditableElement: React.FC<EditableElementProps> = ({ element, isSelected, onSelect, updateElement }) => {
  const ref = useRef<HTMLDivElement>(null);
  const interactionRef = useRef({
    type: null as 'move' | 'resize' | 'rotate' | null,
    startX: 0,
    startY: 0,
    startElementX: 0,
    startElementY: 0,
    startWidth: 0,
    startHeight: 0,
    startRotation: 0,
    center: { x: 0, y: 0 },
    resizeDirection: '',
  });

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, type: 'move' | 'resize' | 'rotate', direction = '') => {
    e.stopPropagation();
    onSelect();

    const el = ref.current;
    if (!el) return;
    
    interactionRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startElementX: element.x,
      startElementY: element.y,
      startWidth: element.width,
      startHeight: element.height,
      startRotation: element.rotation,
      center: {
        x: element.x + element.width / 2,
        y: element.y + element.height / 2,
      },
      resizeDirection: direction,
    };

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const { type, startX, startY, startElementX, startElementY, startWidth, startHeight, center, resizeDirection, startRotation } = interactionRef.current;
        if (!type) return;

        const dx = moveEvent.clientX - startX;
        const dy = moveEvent.clientY - startY;
        
        const parentElement = ref.current?.parentElement;
        if (!parentElement) return;

        if (type === 'move') {
            updateElement(element.id, { x: startElementX + dx, y: startElementY + dy });
        } else if (type === 'rotate') {
            const parentRect = parentElement.getBoundingClientRect();
            const centerX = parentRect.left + center.x;
            const centerY = parentRect.top + center.y;
            const angle = Math.atan2(moveEvent.clientY - centerY, moveEvent.clientX - centerX) * (180 / Math.PI) + 90;
            updateElement(element.id, { rotation: (angle + 360) % 360 });
        } else if (type === 'resize') {
            let newWidth = startWidth;
            let newHeight = startHeight;
            let newX = startElementX;
            let newY = startElementY;

            // This resize logic does not account for rotation yet, but fixes movement.
            if (resizeDirection.includes('r')) newWidth = Math.max(MIN_WIDTH, startWidth + dx);
            if (resizeDirection.includes('l')) {
                newWidth = Math.max(MIN_WIDTH, startWidth - dx);
                if (newWidth > MIN_WIDTH) {
                    newX = startElementX + dx;
                }
            }
            if (resizeDirection.includes('b')) newHeight = Math.max(MIN_HEIGHT, startHeight + dy);
            if (resizeDirection.includes('t')) {
                newHeight = Math.max(MIN_HEIGHT, startHeight - dy);
                if (newHeight > MIN_HEIGHT) {
                   newY = startElementY + dy;
                }
            }
            
            updateElement(element.id, { width: newWidth, height: newHeight, x: newX, y: newY });
        }
    };

    const handleMouseUp = () => {
        interactionRef.current.type = null;
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mouseup', handleMouseUp);
    };

    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
  };
  
  const renderElement = () => {
    const style: React.CSSProperties = {
      width: '100%',
      height: '100%',
      overflow: 'hidden',
    };
    
    switch (element.type) {
      case 'text':
        const textEl = element as TextElement;
        return (
          <div
            style={{
              ...style,
              fontFamily: `"${textEl.fontFamily}", sans-serif`,
              fontSize: `${textEl.fontSize}px`,
              fontWeight: textEl.fontWeight,
              fontStyle: textEl.fontStyle,
              textDecoration: textEl.textDecoration,
              color: textEl.color,
              textAlign: textEl.textAlign,
              letterSpacing: `${textEl.letterSpacing}px`,
              lineHeight: textEl.lineHeight,
              display: 'flex',
              alignItems: 'center',
              justifyContent: textEl.textAlign
            }}
          >
            {textEl.content}
          </div>
        );
      case 'image':
        return <img src={(element as ImageElement).src} alt="certificate element" style={{...style, objectFit: 'cover' }} draggable={false} />;
      case 'shape':
        const shapeEl = element as ShapeElement;
        if (shapeEl.shapeType === 'line') {
          return <div style={{...style, backgroundColor: shapeEl.stroke, height: `${shapeEl.strokeWidth}px` }}></div>
        }
        return null;
      default:
        return null;
    }
  };
  
  const resizeHandles = [
    { cursor: 'nwse-resize', position: 'top-0 left-0', direction: 'tl' },
    { cursor: 'ns-resize', position: 'top-0 left-1/2 -translate-x-1/2', direction: 't' },
    { cursor: 'nesw-resize', position: 'top-0 right-0', direction: 'tr' },
    { cursor: 'ew-resize', position: 'top-1/2 -translate-y-1/2 left-0', direction: 'l' },
    { cursor: 'ew-resize', position: 'top-1/2 -translate-y-1/2 right-0', direction: 'r' },
    { cursor: 'nesw-resize', position: 'bottom-0 left-0', direction: 'bl' },
    { cursor: 'ns-resize', position: 'bottom-0 left-1/2 -translate-x-1/2', direction: 'b' },
    { cursor: 'nwse-resize', position: 'bottom-0 right-0', direction: 'br' },
  ];

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        left: `${element.x}px`,
        top: `${element.y}px`,
        width: `${element.width}px`,
        height: `${element.height}px`,
        transform: `rotate(${element.rotation}deg)`,
        transformOrigin: 'center center',
      }}
      onMouseDown={(e) => handleMouseDown(e, 'move')}
    >
        <div className="w-full h-full" style={{ cursor: isSelected ? 'move' : 'pointer' }}>
            {renderElement()}
        </div>
      {isSelected && (
        <>
            <div className="absolute -top-1 -left-1 -right-1 -bottom-1 border-2 border-blue-500 pointer-events-none"></div>
            {resizeHandles.map(handle => (
              <div
                key={handle.direction}
                className={`absolute w-3 h-3 bg-white border border-blue-500 rounded-full ${handle.position}`}
                style={{ cursor: handle.cursor, transform: 'translate(-50%, -50%)' }}
                onMouseDown={(e) => handleMouseDown(e, 'resize', handle.direction)}
              />
            ))}
            <div
                className="absolute -top-8 left-1/2 -translate-x-1/2 w-4 h-4 bg-white border border-blue-500 rounded-full"
                style={{ cursor: 'alias' }}
                onMouseDown={(e) => handleMouseDown(e, 'rotate')}
            >
                <div className="absolute top-3 left-1/2 -translate-x-1/2 w-px h-4 bg-blue-500"></div>
            </div>
        </>
      )}
    </div>
  );
};

export default EditableElement;
