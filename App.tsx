
import React, { useState, useCallback, useRef } from 'react';
import { CertificateElement, Element } from './types';
import ControlsSidebar from './components/ControlsSidebar';
import CertificateCanvas from './components/CertificateCanvas';

const App: React.FC = () => {
  const [elements, setElements] = useState<Element[]>([]);
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);
  const [history, setHistory] = useState<Element[][]>([[]]);
  const [historyIndex, setHistoryIndex] = useState(0);

  const certificateRef = useRef<HTMLDivElement>(null);

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
    const newElements = elements.map(el => el.id === id ? { ...el, ...newProps } : el);
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
            textAlign: 'center',
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

  const selectedElement = elements.find(el => el.id === selectedElementId) || null;

  return (
    <div className="flex h-screen w-screen bg-gray-100 font-sans">
      <ControlsSidebar
        elements={elements}
        setElements={updateElements}
        selectedElement={selectedElement}
        updateElement={updateElement}
        addElement={addElement}
        deleteElement={deleteElement}
        certificateRef={certificateRef}
        setSelectedElementId={setSelectedElementId}
        handleUndo={handleUndo}
        handleRedo={handleRedo}
        canUndo={historyIndex > 0}
        canRedo={historyIndex < history.length - 1}
      />
      <main className="flex-1 flex items-center justify-center p-4 overflow-auto">
        <CertificateCanvas
          certificateRef={certificateRef}
          elements={elements}
          selectedElementId={selectedElementId}
          setSelectedElementId={setSelectedElementId}
          updateElement={updateElement}
        />
      </main>
    </div>
  );
};

export default App;
