import React, { useState, useCallback, useRef } from 'react';
import { Element, TextElement, CertificateElement, BorderStyle, CertificateTemplate, CertificateSize } from '../types';
import { generateCertificateTemplate } from '../services/geminiService';
import { AddImageIcon, AddTextIcon, DeleteIcon, DownloadIcon, LoaderIcon, RedoIcon, UndoIcon, AlignCenterIcon, AlignLeftIcon, AlignRightIcon, AlignJustifyIcon, BoldIcon, ItalicIcon, UnderlineIcon, ImportIcon, PresentationIcon, BringForwardIcon, SendBackwardIcon, BringToFrontIcon, SendToBackIcon } from './icons';

// Fix for window.jspdf and window.html2canvas TypeScript errors
declare global {
  interface Window {
    jspdf: any;
    html2canvas: any;
    PptxGenJS: any;
  }
}

interface ControlsSidebarProps {
  selectedElement: Element | null;
  updateElement: (id: string, newProps: Partial<Element>) => void;
  addElement: (type: 'text' | 'image') => void;
  deleteElement: (id: string) => void;
  handleLayerChange: (id: string, direction: 'forward' | 'backward' | 'front' | 'back') => void;
  certificateRef: React.RefObject<HTMLDivElement>;
  setSelectedElementId: (id: string | null) => void;
  handleUndo: () => void;
  handleRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  onTemplateGenerated: (template: CertificateElement) => void;
  onTemplateImported: (template: CertificateTemplate) => void;
  elements: Element[];
  certificateSize: CertificateSize;
  setCertificateSize: (size: CertificateSize) => void;
  certificateBgColor: string;
  certificateBorderStyle: BorderStyle;
  setCertificateBorderStyle: (style: BorderStyle) => void;
  certificateBorderColor: string;
  setCertificateBorderColor: (color: string) => void;
}

const FONT_FACES = ['Roboto', 'Merriweather', 'Montserrat', 'Playfair Display', 'Open Sans', 'Lato'];
const SIZES: CertificateSize[] = [
    { name: 'A4 Landscape', width: 1123, height: 794, displayName: 'A4 Landscape (11.7" x 8.3")' },
    { name: 'A4 Portrait', width: 794, height: 1123, displayName: 'A4 Portrait (8.3" x 11.7")' },
    { name: 'Letter Landscape', width: 1056, height: 816, displayName: 'Letter Landscape (11" x 8.5")' },
    { name: 'Letter Portrait', width: 816, height: 1056, displayName: 'Letter Portrait (8.5" x 11")' },
];
const PDF_FORMATS: { [key: string]: { format: string, orientation: 'l' | 'p'} } = {
    'A4 Landscape': { format: 'a4', orientation: 'l' },
    'A4 Portrait': { format: 'a4', orientation: 'p' },
    'Letter Landscape': { format: 'letter', orientation: 'l' },
    'Letter Portrait': { format: 'letter', orientation: 'p' },
};
const BORDER_STYLES: { id: BorderStyle, name: string }[] = [
    { id: 'classic', name: 'Classic Ornate' },
    { id: 'double', name: 'Double Line' },
    { id: 'minimal', name: 'Minimalist' },
    { id: 'none', name: 'None' },
];
const SUGGESTIONS = [
    'Certificate of Completion',
    'Employee of the Month',
    'Sports Achievement Award',
    'Workshop Attendance',
    'Certificate of Recognition'
];


const ControlsSidebar: React.FC<ControlsSidebarProps> = ({
  selectedElement,
  updateElement,
  addElement,
  deleteElement,
  handleLayerChange,
  certificateRef,
  setSelectedElementId,
  handleUndo,
  handleRedo,
  canUndo,
  canRedo,
  onTemplateGenerated,
  onTemplateImported,
  elements,
  certificateSize,
  setCertificateSize,
  certificateBgColor,
  certificateBorderStyle,
  setCertificateBorderStyle,
  certificateBorderColor,
  setCertificateBorderColor
}) => {
  const [prompt, setPrompt] = useState('Certificate of Appreciation');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const importInputRef = useRef<HTMLInputElement>(null);

  const handleGenerate = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const template = await generateCertificateTemplate(prompt, certificateSize.width, certificateSize.height);
      onTemplateGenerated(template);
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

            const selectedSizeFormat = PDF_FORMATS[certificateSize.name];
            if (!selectedSizeFormat) return;

            window.html2canvas(certificateNode, { scale: 2, useCORS: true }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pdf = new jsPDF({
                    orientation: selectedSizeFormat.orientation,
                    unit: 'px',
                    format: selectedSizeFormat.format
                });
                const pdfWidth = pdf.internal.pageSize.getWidth();
                const pdfHeight = pdf.internal.pageSize.getHeight();

                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
                pdf.save("certificate.pdf");
            });
        }, 100);
    }
  }, [certificateRef, setSelectedElementId, certificateSize.name]);

  const handlePptxDownload = useCallback(() => {
    if (certificateRef.current) {
        setSelectedElementId(null);
        // Allow state to update and UI to re-render without selection box
        setTimeout(() => {
            const PptxGenJS = window.PptxGenJS;
            if (!PptxGenJS) {
                console.error("PptxGenJS not loaded");
                alert("Could not export to PPTX. The required library is missing.");
                return;
            }
            const certificateNode = certificateRef.current;
            if (!certificateNode) return;

            window.html2canvas(certificateNode, { scale: 2, useCORS: true }).then(canvas => {
                const imgData = canvas.toDataURL('image/png');
                const pres = new PptxGenJS();

                const isLandscape = certificateSize.width > certificateSize.height;
                pres.layout = isLandscape ? 'LAYOUT_16x9' : 'LAYOUT_9x16';
                
                const slide = pres.addSlide();
                
                slide.addImage({
                    data: imgData,
                    x: 0,
                    y: 0,
                    w: '100%',
                    h: '100%',
                });

                pres.writeFile({ fileName: 'certificate.pptx' });
            });
        }, 100);
    }
  }, [certificateRef, setSelectedElementId, certificateSize]);

  const handleExport = useCallback(() => {
    const template: CertificateTemplate = {
        size: certificateSize,
        backgroundColor: certificateBgColor,
        borderColor: certificateBorderColor,
        borderStyle: certificateBorderStyle,
        elements: elements,
    };
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(template, null, 2));
    const downloadAnchorNode = document.createElement('a');
    downloadAnchorNode.setAttribute("href", dataStr);
    downloadAnchorNode.setAttribute("download", `certificate-template-${Date.now()}.json`);
    document.body.appendChild(downloadAnchorNode);
    downloadAnchorNode.click();
    downloadAnchorNode.remove();
  }, [elements, certificateSize, certificateBgColor, certificateBorderColor, certificateBorderStyle]);

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
        try {
            const result = event.target?.result;
            if (typeof result === 'string') {
                const template = JSON.parse(result) as CertificateTemplate;
                if (template.elements && template.size && template.backgroundColor && template.borderColor && template.borderStyle) {
                    onTemplateImported(template);
                } else {
                    alert('Invalid template file format.');
                }
            }
        } catch (error) {
            console.error("Error importing template:", error);
            alert('Failed to read or parse template file.');
        }
    };
    reader.readAsText(file);
    if (e.target) e.target.value = ''; // Allow re-importing same file
  };

    const handleSizeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const newSize = SIZES.find(s => s.name === e.target.value);
        if (newSize) {
            setCertificateSize(newSize);
        }
    };

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

  const renderLayerControls = () => {
    if (!selectedElement) return null;
    const currentIndex = elements.findIndex(el => el.id === selectedElement.id);
    const isAtBack = currentIndex === 0;
    const isAtFront = currentIndex === elements.length - 1;

    return (
        <div className="p-3 bg-gray-50 rounded-lg">
            <label className="text-xs text-gray-500 block mb-2">Layer Order</label>
            <div className="grid grid-cols-2 gap-2">
                <button
                    onClick={() => handleLayerChange(selectedElement.id, 'forward')}
                    disabled={isAtFront}
                    className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300 disabled:opacity-50 transition duration-150 text-sm">
                    <BringForwardIcon /> Forward
                </button>
                <button
                    onClick={() => handleLayerChange(selectedElement.id, 'backward')}
                    disabled={isAtBack}
                    className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300 disabled:opacity-50 transition duration-150 text-sm">
                    <SendBackwardIcon /> Backward
                </button>
                <button
                    onClick={() => handleLayerChange(selectedElement.id, 'front')}
                    disabled={isAtFront}
                    className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300 disabled:opacity-50 transition duration-150 text-sm">
                    <BringToFrontIcon /> To Front
                </button>
                 <button
                    onClick={() => handleLayerChange(selectedElement.id, 'back')}
                    disabled={isAtBack}
                    className="flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300 disabled:opacity-50 transition duration-150 text-sm">
                    <SendToBackIcon /> To Back
                </button>
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

       <div className="border-b pb-4 space-y-3">
          <div>
            <label htmlFor="size-select" className="text-sm font-semibold text-gray-600 mb-2 block">Page Size</label>
            <select id="size-select" value={certificateSize.name} onChange={handleSizeChange} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 transition duration-150 bg-white text-sm">
                {SIZES.map(s => <option key={s.name} value={s.name}>{s.displayName}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="border-style-select" className="text-sm font-semibold text-gray-600 mb-2 block">Border Style</label>
            <select id="border-style-select" value={certificateBorderStyle} onChange={(e) => setCertificateBorderStyle(e.target.value as BorderStyle)} className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 transition duration-150 bg-white text-sm">
                {BORDER_STYLES.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
            </select>
          </div>
          {certificateBorderStyle !== 'none' && (
              <div>
                  <label htmlFor="border-color-picker" className="text-sm font-semibold text-gray-600 mb-2 block">Border Color</label>
                  <input
                      id="border-color-picker"
                      type="color"
                      value={certificateBorderColor}
                      onChange={(e) => setCertificateBorderColor(e.target.value)}
                      className="w-full h-10 p-1 border rounded-md"
                  />
              </div>
          )}
          <div>
            <label htmlFor="prompt" className="text-sm font-semibold text-gray-600 mb-2 block">Certificate Type</label>
            <textarea
              id="prompt"
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="w-full p-2 border rounded-md focus:ring-2 focus:ring-indigo-500 transition duration-150"
              rows={2}
              placeholder="e.g., Employee of the Month"
            />
            <div className="flex flex-wrap gap-1 mt-2">
                {SUGGESTIONS.map(s => (
                    <button key={s} onClick={() => setPrompt(s)} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded-full hover:bg-gray-300 transition duration-150">
                        {s}
                    </button>
                ))}
            </div>
          </div>
        <button
          onClick={handleGenerate}
          disabled={isLoading}
          className="w-full bg-indigo-600 text-white font-semibold py-2 px-4 rounded-md hover:bg-indigo-700 disabled:bg-indigo-300 flex items-center justify-center transition duration-150"
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
            
            {renderLayerControls()}

          <button onClick={() => deleteElement(selectedElement.id)} className="w-full flex items-center justify-center gap-2 bg-red-500 text-white py-2 px-3 rounded-md hover:bg-red-600 transition duration-150 text-sm">
                <DeleteIcon /> Delete Element
          </button>
        </div>
      )}

      <div className="flex-grow"></div>

      <div className="pt-4 space-y-2">
        <div className="grid grid-cols-2 gap-2">
            <button onClick={handleDownload} className="w-full bg-green-600 text-white font-semibold py-2 px-2 rounded-md hover:bg-green-700 flex items-center justify-center gap-2 transition duration-150 text-sm">
               <DownloadIcon /> PDF
            </button>
            <button onClick={handlePptxDownload} className="w-full bg-orange-500 text-white font-semibold py-2 px-2 rounded-md hover:bg-orange-600 flex items-center justify-center gap-2 transition duration-150 text-sm">
               <PresentationIcon /> PPTX
            </button>
        </div>
        <div className="flex gap-2">
            <button onClick={() => importInputRef.current?.click()} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300 transition duration-150 text-sm">
                <ImportIcon /> Import Template
            </button>
            <button onClick={handleExport} className="flex-1 flex items-center justify-center gap-2 bg-gray-200 text-gray-700 py-2 px-3 rounded-md hover:bg-gray-300 transition duration-150 text-sm">
                <DownloadIcon /> Export Template
            </button>
        </div>
        <input
            type="file"
            ref={importInputRef}
            onChange={handleFileSelected}
            className="hidden"
            accept="application/json"
        />
      </div>
    </div>
  );
};

export default ControlsSidebar;