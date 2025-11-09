
import React, { useState, useCallback, useRef, useLayoutEffect } from 'react';
import { CertificateElement, Element, BorderStyle, CertificateTemplate, CertificateSize } from './types';
import ControlsSidebar from './components/ControlsSidebar';
import CertificateCanvas from './components/CertificateCanvas';

const App: React.FC = () => {
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [history, setHistory] = useState<Element[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);
  const [certificateSize, setCertificateSize] = useState<CertificateSize>({ name: 'Letter Landscape', width: 1056, height: 816, displayName: 'Letter Landscape (11" x 8.5")' });
  const [certificateBgColor, setCertificateBgColor] = useState<string>('#ffffff');
  const [certificateBorderColor, setCertificateBorderColor] = useState<string>('#c0a062');
  const [certificateBorderStyle, setCertificateBorderStyle] = useState<BorderStyle>('classic');

  const [scale, setScale] = useState(1);
  const mainContentRef = useRef<HTMLElement>(null);
  const certificateRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    const mainEl = mainContentRef.current;
    if (!mainEl) return;

    const calculateScale = () => {
        const availableWidth = mainEl.clientWidth;
        const certificateWidth = certificateSize.width;

        if (certificateWidth > availableWidth) {
            setScale(availableWidth / certificateWidth);
        } else {
            setScale(1);
        }
    };

    calculateScale();

    const resizeObserver = new ResizeObserver(calculateScale);
    resizeObserver.observe(mainEl);

    return () => resizeObserver.disconnect();
  }, [certificateSize.width]);

  const updateElements = useCallback((newElements: Element[]) => {
    const newHistory = history.slice(0, historyIndex + 1);
    newHistory.push(newElements);
    setHistory(newHistory);
    setHistoryIndex(newHistory.length - 1);
    setElements(newElements);
  }, [history, historyIndex]);
  
  const handleUndo = useCallback(() => {
    if (historyIndex > 0) {
      const newIndex = historyIndex - 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      setSelectedElementId(null);
    }
  }, [history, historyIndex]);

  const handleRedo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      const newIndex = historyIndex + 1;
      setHistoryIndex(newIndex);
      setElements(history[newIndex]);
      setSelectedElementId(null);
    }
  }, [history, historyIndex]);

  const updateElement = (id: string, newProps: Partial<Element>) => {
    // FIX: Cast the updated element to Element to resolve a TypeScript issue with discriminated unions.
    const newElements = elements.map(el => el.id === id ? { ...el, ...newProps } as Element : el);
    updateElements(newElements);
  };
  
  const addElement = (type: 'text' | 'image') => {
    let newElement: Element;
    if (type === 'text') {
        newElement = {
            id: crypto.randomUUID(),
            type: 'text',
            x: 100,
            y: 100,
            width: 250,
            height: 50,
            rotation: 0,
            content: 'New Text',
            fontFamily: 'Roboto',
            fontSize: 24,
            fontWeight: 'normal',
            fontStyle: 'normal',
            textDecoration: 'none',
            color: '#000000',
            textAlign: 'left',
            letterSpacing: 0,
            lineHeight: 1.2
        };
    } else { // image
        newElement = {
            id: crypto.randomUUID(),
            type: 'image',
            x: 150,
            y: 150,
            width: 200,
            height: 200,
            rotation: 0,
            src: 'https://picsum.photos/200'
        };
    }
    updateElements([...elements, newElement]);
    setSelectedElementId(newElement.id);
  };

  const deleteElement = (id: string) => {
    updateElements(elements.filter(el => el.id !== id));
    setSelectedElementId(null);
  };

  const handleLayerChange = useCallback((id: string, direction: 'forward' | 'backward' | 'front' | 'back') => {
      const index = elements.findIndex(el => el.id === id);
      if (index === -1) return;

      const newElements = [...elements];
      const [element] = newElements.splice(index, 1);

      switch (direction) {
          case 'forward':
              if (index < newElements.length) {
                  newElements.splice(index + 1, 0, element);
              } else {
                  newElements.push(element); // Already at front, re-add
              }
              break;
          case 'backward':
              if (index > 0) {
                  newElements.splice(index - 1, 0, element);
              } else {
                  newElements.unshift(element); // Already at back, re-add
              }
              break;
          case 'front':
              newElements.push(element);
              break;
          case 'back':
              newElements.unshift(element);
              break;
      }
      updateElements(newElements);
  }, [elements, updateElements]);

  const onTemplateGenerated = useCallback((template: CertificateElement) => {
    updateElements(template.elements);
    setCertificateBgColor(template.backgroundColor);
    setCertificateBorderColor(template.borderColor);
    setCertificateBorderStyle(template.borderStyle || 'classic');
    setSelectedElementId(null);
  }, [updateElements]);

  const onTemplateImported = useCallback((template: CertificateTemplate) => {
    updateElements(template.elements);
    setCertificateBgColor(template.backgroundColor);
    setCertificateBorderColor(template.borderColor);
    setCertificateBorderStyle(template.borderStyle || 'classic');
    setCertificateSize(template.size);
    setSelectedElementId(null);
  }, [updateElements]);

  const handleSetCertificateSize = useCallback((size: CertificateSize) => {
    setCertificateSize(size);
    updateElements([]);
    setCertificateBgColor('#ffffff');
    setCertificateBorderColor('#c0a062');
    setCertificateBorderStyle('classic');
    setSelectedElementId(null);
  }, [updateElements]);

  const selectedElement = elements.find(el => el.id === selectedElementId) || null;

  return (
    <div className="flex h-screen w-screen bg-gray-100 font-sans">
      <ControlsSidebar
        selectedElement={selectedElement}
        updateElement={updateElement}
        addElement={addElement}
        deleteElement={deleteElement}
        handleLayerChange={handleLayerChange}
        certificateRef={certificateRef}
        setSelectedElementId={setSelectedElementId}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
        onTemplateGenerated={onTemplateGenerated}
        onTemplateImported={onTemplateImported}
        elements={elements}
        certificateSize={certificateSize}
        setCertificateSize={handleSetCertificateSize}
        certificateBgColor={certificateBgColor}
        certificateBorderStyle={certificateBorderStyle}
        setCertificateBorderStyle={setCertificateBorderStyle}
        certificateBorderColor={certificateBorderColor}
        setCertificateBorderColor={setCertificateBorderColor}
      />
      <main ref={mainContentRef} className="flex-1 flex items-start justify-center p-4 overflow-auto">
        <div 
          className="my-4"
          style={{
            width: certificateSize.width * scale,
            height: certificateSize.height * scale,
          }}
        >
          <CertificateCanvas
            certificateRef={certificateRef}
            elements={elements}
            selectedElementId={selectedElementId}
            setSelectedElementId={setSelectedElementId}
            updateElement={updateElement}
            certificateSize={certificateSize}
            certificateBgColor={certificateBgColor}
            certificateBorderColor={certificateBorderColor}
            certificateBorderStyle={certificateBorderStyle}
            scale={scale}
          />
        </div>
      </main>
    </div>
  );
};

export default App;
