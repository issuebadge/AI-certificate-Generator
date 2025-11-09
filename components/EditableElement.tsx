
import React, { useRef, useState, useEffect } from 'react';
import { Element, TextElement, ImageElement, ShapeElement } from '../types';

interface EditableElementProps {
  element: Element;
  isSelected: boolean;
  onSelect: () => void;
  updateElement: (id: string, newProps: Partial<Element>) => void;
  scale: number;
}

const MIN_WIDTH = 20;
const MIN_HEIGHT = 20;

const EditableElement: React.FC<EditableElementProps> = ({ element, isSelected, onSelect, updateElement, scale }) => {
  const ref = useRef<HTMLDivElement>(null);
  const editableRef = useRef<HTMLDivElement>(null);
  const [isEditing, setIsEditing] = useState(false);
  
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
    pivot: { x: 0, y: 0 },
    canvasRect: null as DOMRect | null,
  });

  useEffect(() => {
    if (isEditing && editableRef.current) {
      editableRef.current.focus();
      const selection = window.getSelection();
      const range = document.createRange();
      range.selectNodeContents(editableRef.current);
      selection?.removeAllRanges();
      selection?.addRange(range);
    }
  }, [isEditing]);

  const rotateVector = (vec: {x: number, y: number}, angleRad: number) => {
    const cos = Math.cos(angleRad);
    const sin = Math.sin(angleRad);
    return {
      x: vec.x * cos - vec.y * sin,
      y: vec.x * sin + vec.y * cos,
    };
  };

  const getHandleAndPivot = (direction: string, rect: { width: number; height: number; }) => {
    const { width, height } = rect;
    const handle = { x: 0, y: 0 };
    const pivot = { x: 0, y: 0 };
    
    if (direction.includes('r')) { handle.x = width / 2; pivot.x = -width / 2; }
    if (direction.includes('l')) { handle.x = -width / 2; pivot.x = width / 2; }
    if (direction.includes('b')) { handle.y = height / 2; pivot.y = -height / 2; }
    if (direction.includes('t')) { handle.y = -height / 2; pivot.y = height / 2; }
    
    return { handle, pivot };
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>, type: 'move' | 'resize' | 'rotate', direction = '') => {
    e.stopPropagation();
    onSelect();

    const el = ref.current;
    if (!el || !el.parentElement) return;
    
    const canvasRect = el.parentElement.getBoundingClientRect();
    const { x, y, width, height, rotation } = element;
    const center = { x: x + width / 2, y: y + height / 2 };
    const angleRad = rotation * Math.PI / 180;
    
    interactionRef.current = {
      type,
      startX: e.clientX,
      startY: e.clientY,
      startElementX: x,
      startElementY: y,
      startWidth: width,
      startHeight: height,
      startRotation: rotation,
      center,
      resizeDirection: direction,
      canvasRect,
      pivot: { x: 0, y: 0 }, // will be set for resize
    };
    
    if (type === 'resize') {
        const { pivot: pivotLocal } = getHandleAndPivot(direction, { width, height });
        const pivotWorld = {
            x: center.x + pivotLocal.x * Math.cos(angleRad) - pivotLocal.y * Math.sin(angleRad),
            y: center.y + pivotLocal.x * Math.sin(angleRad) + pivotLocal.y * Math.cos(angleRad)
        };
        interactionRef.current.pivot = pivotWorld;
    }

    const handleMouseMove = (moveEvent: MouseEvent) => {
        const { type, startX, startY, startElementX, startElementY, center, resizeDirection, startRotation, canvasRect, pivot, startWidth, startHeight } = interactionRef.current;
        if (!type || !canvasRect) return;

        const mouseX = (moveEvent.clientX - canvasRect.left) / scale;
        const mouseY = (moveEvent.clientY - canvasRect.top) / scale;
        
        if (type === 'move') {
            const dx = (moveEvent.clientX - startX) / scale;
            const dy = (moveEvent.clientY - startY) / scale;
            updateElement(element.id, { x: startElementX + dx, y: startElementY + dy });
        } else if (type === 'rotate') {
            const angle = Math.atan2(mouseY - center.y, mouseX - center.x) * (180 / Math.PI) + 90;
            updateElement(element.id, { rotation: (angle + 360) % 360 });
        } else if (type === 'resize') {
            const angleRad = startRotation * Math.PI / 180;
            
            const boxVectorWorld = { x: mouseX - pivot.x, y: mouseY - pivot.y };
            const boxVectorLocal = rotateVector(boxVectorWorld, -angleRad);

            const isCorner = resizeDirection.length === 2;
            
            let newWidth = isCorner || resizeDirection.includes('l') || resizeDirection.includes('r') 
                ? Math.max(MIN_WIDTH, Math.abs(boxVectorLocal.x)) 
                : startWidth;
            let newHeight = isCorner || resizeDirection.includes('t') || resizeDirection.includes('b') 
                ? Math.max(MIN_HEIGHT, Math.abs(boxVectorLocal.y)) 
                : startHeight;

            let centerOffsetFromPivotLocal;
    
            if (isCorner) {
                centerOffsetFromPivotLocal = { x: boxVectorLocal.x / 2, y: boxVectorLocal.y / 2 };
            } else if (resizeDirection.includes('l') || resizeDirection.includes('r')) {
                centerOffsetFromPivotLocal = { x: boxVectorLocal.x / 2, y: 0 };
            } else { // t or b
                centerOffsetFromPivotLocal = { x: 0, y: boxVectorLocal.y / 2 };
            }

            const centerOffsetFromPivotWorld = rotateVector(centerOffsetFromPivotLocal, angleRad);
            const newCenter = { x: pivot.x + centerOffsetFromPivotWorld.x, y: pivot.y + centerOffsetFromPivotWorld.y };
            const newX = newCenter.x - newWidth / 2;
            const newY = newCenter.y - newHeight / 2;
            
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

  const handleDoubleClick = () => {
    if (element.type === 'text') {
      setIsEditing(true);
    }
  };

  const handleBlur = (e: React.FocusEvent<HTMLDivElement>) => {
    setIsEditing(false);
    const newContent = e.currentTarget.innerText;
    if (element.type === 'text' && element.content !== newContent) {
      updateElement(element.id, { content: newContent });
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>) => {
    if (e.key === 'Escape') {
      e.currentTarget.blur();
    }
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
        const textStyles: React.CSSProperties = {
            fontFamily: `"${textEl.fontFamily}", sans-serif`,
            fontSize: `${textEl.fontSize}px`,
            fontWeight: textEl.fontWeight,
            fontStyle: textEl.fontStyle,
            textDecoration: textEl.textDecoration,
            color: textEl.color,
            textAlign: textEl.textAlign,
            letterSpacing: `${textEl.letterSpacing}px`,
            lineHeight: textEl.lineHeight,
            wordBreak: 'break-word',
            whiteSpace: 'pre-wrap',
        };

        if (isEditing) {
            return (
                <div
                    ref={editableRef}
                    contentEditable
                    suppressContentEditableWarning
                    onBlur={handleBlur}
                    onKeyDown={handleKeyDown}
                    style={{
                        ...style,
                        ...textStyles,
                        cursor: 'text',
                        outline: 'none',
                    }}
                    dangerouslySetInnerHTML={{ __html: textEl.content }}
                />
            );
        }
        
        return (
          <div
            style={{
              ...style,
              ...textStyles,
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
      onMouseDown={(e) => {
        if (isEditing) {
            e.stopPropagation();
            return;
        }
        handleMouseDown(e, 'move')
      }}
      onDoubleClick={handleDoubleClick}
    >
        <div className="w-full h-full" style={{ cursor: isSelected ? (isEditing ? 'text' : 'move') : 'pointer' }}>
            {renderElement()}
        </div>
      {isSelected && !isEditing && (
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
