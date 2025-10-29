
import React, { useState, useCallback } from 'react';
import { Element, TextElement } from '../types';
import { generateCertificateTemplate } from '../services/geminiService';
import { AddImageIcon, AddTextIcon, DeleteIcon, DownloadIcon, LoaderIcon, RedoIcon, UndoIcon, AlignCenterIcon, AlignLeftIcon, AlignRightIcon, AlignJustifyIcon, BoldIcon, ItalicIcon, UnderlineIcon } from './icons';

// Fix for window.jspdf and window.html2canvas TypeScript errors
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
  }
}

interface ControlsSidebarProps {
  elements: Element[];
  setElements: (elements: Element[]) => void;
  selectedElement: Element | null;
  updateElement: (id: string, newProps: Partial<Element>) => void;
  addElement: (type: 'text' | 'image') => void;
  deleteElement: (id: string) => void;
  certificateRef: React.RefObject<HTMLDivElement>;
  setSelectedElementId: (id: string | null) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
}

const FONT_FACES = ['Roboto', 'Merriweather', 'Montserrat', 'Playfair Display', 'Open Sans', 'Lato'];

const ControlsSidebar: React.FC<ControlsSidebarProps> = ({
  setElements,
  selectedElement,
  updateElement,
  addElement,
  deleteElement,
  certificateRef,
  setSelectedElementId,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
}) => {
  const [prompt, setPrompt] = useState('Certificate of Appreciation');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const template = await generateCertificateTemplate(prompt);
      setElements(template.elements);
      setSelectedElementId(null);
    } catch (e) {
      setError('Failed to generate template. Please check your API key and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = useCallback(() => {
    if (certificateRef.current) {
        setSelectedElementId(null);
        // Allow state to update and UI to re-render without selection box
        setTimeout(() => {
            const { jsPDF } = window.jspdf;
            const certificateNode = certificateRef.current;
            if (!certificateNode) return;

            window.html2canvas(certificateNode, { scale: 2 }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: 'landscape',
                    unit: 'px',
                    format: [certificateNode.offsetWidth, certificateNode.offsetHeight]
                });
                pdf.addImage(imgData, 'PNG', 0, 0, certificateNode.offsetWidth, certificateNode.offsetHeight);
                pdf.save("certificate.pdf");
            });
        }, 100);
    }
  }, [certificateRef, setSelectedElementId]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0] && selectedElement?.type === 'image') {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        updateElement(selectedElement.id, { src: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const renderTextEditor = () => {
    if (!selectedElement || selectedElement.type !== 'text') return null;
    const textEl = selectedElement as TextElement;

    const toggleStyle = (property: 'fontWeight' | 'fontStyle' | 'textDecoration', value: string, defaultValue: string) => {
        updateElement(textEl.id, { [property]: textEl[property] === value ? defaultValue : value });
    };
    
    return (
        <div className="space-y-4">
            <div>
                <label className="text-sm font-semibold text-gray-600 mb-2 block">Content</label>
                <textarea
                    value={textEl.content}
                    onChange={(e) => updateElement(textEl.id, { content: e.target.value })}
                    className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 transition duration-150"
                    rows={4}
                />
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg">
                <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Font</label>
                        <select
                            value={textEl.fontFamily}
                            onChange={(e) => updateElement(textEl.id, { fontFamily: e.target.value })}
                            className="w-full p-2 border rounded-md text-sm"
                        >
                            {FONT_FACES.map(font => <option key={font} value={font}>{font}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Size</label>
                        <input
                            type="number"
                            value={textEl.fontSize}
                            onChange={(e) => updateElement(textEl.id, { fontSize: parseInt(e.target.value) || 0 })}
                            className="w-full p-2 border rounded-md text-sm"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <div>
                        <label className="text-xs text-gray-500 block mb-1">Color</label>
                        <input
                            type="color"
                            value={textEl.color}
                            onChange={(e) => updateElement(textEl.id, { color: e.target.value })}
                            className="w-full h-10 p-1 border rounded-md"
                        />
                    </div>
                    <div className="flex flex-col">
                        <label className="text-xs text-gray-500 block mb-1">Style</label>
                        <div className="flex h-full items-center gap-1">
                            <button onClick={() => toggleStyle('fontWeight', 'bold', 'normal')} className={`p-2 rounded-md ${textEl.fontWeight === 'bold' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200'}`}><BoldIcon /></button>
                            <button onClick={() => toggleStyle('fontStyle', 'italic', 'normal')} className={`p-2 rounded-md ${textEl.fontStyle === 'italic' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200'}`}><ItalicIcon /></button>
                            <button onClick={() => toggleStyle('textDecoration', 'underline', 'none')} className={`p-2 rounded-md ${textEl.textDecoration === 'underline' ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200'}`}><UnderlineIcon /></button>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-3 bg-gray-50 rounded-lg">
                <label className="text-xs text-gray-500 block mb-2">Alignment</label>
                <div className="flex items-center gap-1">
                    {(['left', 'center', 'right', 'justify'] as const).map(align => (
                        <button key={align} onClick={() => updateElement(textEl.id, { textAlign: align })} className={`flex-1 p-2 rounded-md ${textEl.textAlign === align ? 'bg-indigo-100 text-indigo-700' : 'bg-gray-200'}`}>
                            {align === 'left' && <AlignLeftIcon />}
                            {align === 'center' && <AlignCenterIcon />}
                            {align === 'right' && <AlignRightIcon />}
                            {align === 'justify' && <AlignJustifyIcon />}
                        </button>
                    ))}
                </div>
            </div>
            
            <div className="p-3 bg-gray-50 rounded-lg space-y-3">
                <div>
                  <label className="text-xs text-gray-500 flex justify-between items-center mb-1"><span>Letter Spacing</span> <span>{textEl.letterSpacing}px</span></label>
                  <input type="range" min="-5" max="20" step="0.5" value={textEl.letterSpacing} onChange={(e) => updateElement(textEl.id, { letterSpacing: parseFloat(e.target.value) })} className="w-full" />
                </div>
                <div>
                  <label className="text-xs text-gray-500 flex justify-between items-center mb-1"><span>Line Height</span> <span>{textEl.lineHeight}</span></label>
                  <input type="range" min="0.8" max="3" step="0.1" value={textEl.lineHeight} onChange={(e) => updateElement(textEl.id, { lineHeight: parseFloat(e.target.value) })} className="w-full" />
                </div>
            </div>
        </div>
    );
  };


  return (
    <div className="w-80 bg-white shadow-lg h-full flex flex-col p-4 space-y-4 overflow-y-auto">
      <div className="border-b pb-4">
        <h1 className="text-xl font-bold text-gray-800">AI Certificate Generator</h1>
        <p className="text-sm text-gray-500">Design beautiful certificates instantly.</p>
      </div>

      <div className="border-b pb-4">
        <label htmlFor="prompt" className="text-sm font-semibold text-gray-600 mb-2 block">Certificate Type</label>
        <textarea
          id="prompt"
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 transition duration-150"
          rows={2}
          placeholder="e.g., Employee of the Month"
        />
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full mt-2 bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center justify-center transition duration-150"
        >
          {isLoading ? <LoaderIcon /> : 'Generate with AI'}
        </button>
        {error && <p className="text-red-500 text-xs mt-2">{error}</p>}
      </div>
      
      <div className="border-b pb-4 space-y-2">
        <h3 className="text-sm font-semibold text-gray-600">Tools</h3>
        <div className="flex gap-2">
            <button onClick={() => addElement('text')} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300 transition duration-150 text-sm">
                <AddTextIcon /> Add Text
            </button>
            <button onClick={() => addElement('image')} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300 transition duration-150 text-sm">
                <AddImageIcon /> Add Image
            </button>
        </div>
         <div className="flex gap-2">
            <button onClick={handleUndo} disabled={!canUndo} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300 disabled:opacity-50 transition duration-150 text-sm">
                <UndoIcon /> Undo
            </button>
            <button onClick={handleRedo} disabled={!canRedo} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300 disabled:opacity-50 transition duration-150 text-sm">
                <RedoIcon /> Redo
            </button>
        </div>
      </div>


      {selectedElement && (
        <div className="border-b pb-4 space-y-3 animate-fade-in">
          <h3 className="text-sm font-semibold text-gray-600 mb-2">Edit Element</h3>
          
          {selectedElement.type === 'text' && renderTextEditor()}
          
          {selectedElement.type === 'image' && (
             <div>
                <label className="text-xs text-gray-500 block mb-1">Image Source</label>
                <button onClick={() => document.getElementById('image-upload')?.click()} className="w-full text-sm bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300 transition duration-150">
                    Upload Image
                </button>
                <input type="file" id="image-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
             </div>
          )}
           
           <div className="p-3 bg-gray-50 rounded-lg">
              <label className="text-xs text-gray-500 flex justify-between items-center mb-1"><span>Rotation</span> <span>{selectedElement.rotation}°</span></label>
              <input
                type="range"
                min="0"
                max="360"
                value={selectedElement.rotation}
                onChange={(e) => updateElement(selectedElement.id, { rotation: parseInt(e.target.value) })}
                className="w-full"
              />
            </div>

          <button onClick={() => deleteElement(selectedElement.id)} className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2 px-3 rounded-md hover:bg-red-600 transition duration-150 text-sm">
                <DeleteIcon /> Delete Element
          </button>
        </div>
      )}

      <div className="flex-grow"></div>

      <div className="pt-4">
        <button onClick={handleDownload} className="w-full bg-green-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-green-700 flex items-center justify-center gap-2 transition duration-150">
           <DownloadIcon /> Download as PDF
        </button>
      </div>
    </div>
  );
};

export default ControlsSidebar;
