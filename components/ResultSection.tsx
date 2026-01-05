import React, { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, Copy, Check, RotateCcw, FileText, FileType2, Type, Minus, Plus, FileSignature, Eye, PenLine, Share2 } from 'lucide-react';
// @ts-ignore
import html2pdf from 'html2pdf.js';
import Docxtemplater from 'docxtemplater';
import PizZip from 'pizzip';
import { GenerationResult, ProcessingMode } from '../types';

interface ResultSectionProps {
  result: GenerationResult;
  templateFileRaw: File | null;
  onReset: () => void;
}

const FONTS = [
  { name: 'Times New Roman', value: "'Times New Roman', serif" },
  { name: 'Arial', value: "Arial, sans-serif" },
  { name: 'Calibri', value: "Calibri, sans-serif" },
  { name: 'Roboto', value: "'Inter', sans-serif" },
];

export const ResultSection: React.FC<ResultSectionProps> = ({ result, templateFileRaw, onReset }) => {
  const [copied, setCopied] = useState(false);
  const [selectedFont, setSelectedFont] = useState(FONTS[0].value);
  const [fontSize, setFontSize] = useState(14); 
  const contentRef = useRef<HTMLDivElement>(null);
  
  // State for Fill Mode
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isPreviewMode, setIsPreviewMode] = useState(true);

  useEffect(() => {
    if (result.mode === ProcessingMode.FILL_TEMPLATE && result.jsonData) {
      setFormData(result.jsonData);
    }
  }, [result]);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleDownloadDocxFilled = async () => {
    if (!templateFileRaw) return alert("Không tìm thấy file mẫu gốc.");
    try {
      const reader = new FileReader();
      reader.readAsBinaryString(templateFileRaw);
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content !== 'string') return;
        const zip = new PizZip(content);
        const doc = new Docxtemplater(zip, { paragraphLoop: true, linebreaks: true, parser: (tag: string) => ({ get: (scope: any) => scope[tag] || scope[tag.trim()] }) });
        doc.render(formData);
        const out = doc.getZip().generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
        const url = URL.createObjectURL(out);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Bien_Ban_${new Date().toISOString().slice(0, 10)}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    } catch (error) {
      alert("Lỗi khi tạo file Word.");
    }
  };

  const renderScientificPreview = (text: string) => {
    if (!text) return <p className="text-slate-400 italic">Chưa có nội dung...</p>;
    const lines = text.split('\n');
    return lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-4"></div>;
        if (/^[IVX]+\.\s/.test(trimmed)) {
            return <h3 key={index} className="text-[#1F4E79] font-bold text-lg mt-6 mb-3 uppercase tracking-wide border-b border-blue-50 pb-1" style={{ fontFamily: selectedFont }}>{line}</h3>;
        }
        if (/^\d+\.\s/.test(trimmed)) {
            return <h4 key={index} className="text-slate-900 font-bold text-base mt-3 mb-2" style={{ fontFamily: selectedFont }}>{line}</h4>;
        }
        if (trimmed.startsWith('•')) {
             return <p key={index} className="text-slate-800 mb-1 pl-4 relative leading-relaxed" style={{ fontFamily: selectedFont }}><span className="absolute left-0 text-slate-400">•</span>{line.replace(/^•\s*/, '')}</p>;
        }
        if (trimmed.startsWith('-') || trimmed.startsWith('o ')) {
           return <p key={index} className="text-slate-800 mb-1 pl-8 relative leading-relaxed" style={{ fontFamily: selectedFont }}><span className="absolute left-4 text-slate-300">-</span>{line.replace(/^[-o]\s*/, '')}</p>;
        }
        return <p key={index} className="text-slate-800 mb-2 leading-relaxed text-justify" style={{ fontFamily: selectedFont }}>{line}</p>;
    });
  };

  if (result.mode === ProcessingMode.FILL_TEMPLATE) {
    return (
      <div className="w-full max-w-4xl mx-auto pb-32">
        {/* Floating Toggle & Reset */}
        <div className="flex justify-between items-center mb-4 sticky top-0 bg-slate-50 py-2 z-20">
           <button onClick={onReset} className="text-slate-500 bg-white p-2 rounded-full shadow-sm border border-slate-200">
              <RotateCcw size={18} />
           </button>
           <div className="flex bg-white p-1 rounded-full shadow-sm border border-slate-200">
               <button onClick={() => setIsPreviewMode(false)} className={`p-2 rounded-full transition-all ${!isPreviewMode ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}><PenLine size={18}/></button>
               <button onClick={() => setIsPreviewMode(true)} className={`p-2 rounded-full transition-all ${isPreviewMode ? 'bg-indigo-100 text-indigo-600' : 'text-slate-400'}`}><Eye size={18}/></button>
           </div>
        </div>

        <div className="bg-white rounded-3xl shadow-sm border border-slate-100 overflow-hidden min-h-[60vh]">
            {isPreviewMode ? (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 border-b border-blue-100 flex items-center justify-between">
                         <h3 className="font-bold text-indigo-900 flex items-center"><FileSignature size={18} className="mr-2"/> Xem trước</h3>
                         <div className="flex items-center space-x-1 bg-white/50 rounded-lg p-1">
                             <button onClick={() => setFontSize(s => Math.max(10, s-1))} className="p-1"><Minus size={14}/></button>
                             <span className="text-xs font-mono w-4 text-center">{fontSize}</span>
                             <button onClick={() => setFontSize(s => Math.min(24, s+1))} className="p-1"><Plus size={14}/></button>
                         </div>
                    </div>
                    <div className="p-4 md:p-8 space-y-8">
                        {Object.keys(formData).map((key) => (
                            <div key={key}>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 border-b border-slate-100 pb-1">{key.replace(/_/g, ' ')}</div>
                                <div className="text-slate-900">
                                    {key === 'noi_dung_cuoc_hop' 
                                        ? <div style={{fontSize: `${fontSize}px`}}>{renderScientificPreview(formData[key])}</div>
                                        : <p className="whitespace-pre-line leading-relaxed" style={{fontFamily: selectedFont, fontSize: `${fontSize}px`}}>{formData[key]}</p>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                <div className="p-4 space-y-6 animate-in fade-in duration-300">
                    {Object.keys(formData).map((key) => (
                        <div key={key}>
                            <label className="block text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2 bg-indigo-50 inline-block px-2 py-1 rounded">{key}</label>
                            <textarea 
                                value={formData[key]} 
                                onChange={(e) => handleInputChange(key, e.target.value)}
                                rows={Math.max(3, formData[key]?.split('\n').length || 3)}
                                className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 text-base leading-relaxed"
                                placeholder={`Nhập nội dung...`}
                                style={{fontFamily: selectedFont}}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        {/* Bottom Floating Action Button (FAB) */}
        <div className="fixed bottom-6 right-6 z-50">
             <button 
                onClick={handleDownloadDocxFilled}
                className="h-14 px-6 bg-indigo-600 active:bg-indigo-700 text-white rounded-full shadow-xl shadow-indigo-300 flex items-center justify-center font-bold transition-transform active:scale-95"
            >
                <Download size={20} className="mr-2" /> Tải về
            </button>
        </div>
      </div>
    );
  }

  // Legacy Markdown Mode
  return (
    <div className="w-full max-w-4xl mx-auto pb-24">
       <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200 mb-4 sticky top-0 z-10 flex justify-between items-center">
          <button onClick={onReset} className="p-2 bg-slate-100 rounded-full"><RotateCcw size={18}/></button>
          <div className="flex space-x-2">
             <button className="px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-lg text-sm font-medium">Word</button>
             <button className="px-3 py-1.5 bg-pink-50 text-pink-600 rounded-lg text-sm font-medium">PDF</button>
          </div>
       </div>
       <div className="bg-white p-6 rounded-2xl shadow-sm min-h-[50vh] prose prose-slate max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{result.markdown || ''}</ReactMarkdown>
       </div>
    </div>
  );
};