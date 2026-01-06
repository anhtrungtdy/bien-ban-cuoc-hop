import React, { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, Copy, Check, RotateCcw, FileText, FileType2, Type, Minus, Plus, FileSignature, Eye, PenLine, Share2, Upload, AlertCircle, X, File as FileIcon } from 'lucide-react';
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
  const [fontSize, setFontSize] = useState(14); 
  const [selectedFont, setSelectedFont] = useState(FONTS[0].value);
  
  // State for Fill Mode
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [isPreviewMode, setIsPreviewMode] = useState(true);

  // Fallback Template State
  const [showMissingTemplateDialog, setShowMissingTemplateDialog] = useState(false);
  const [manualTemplateFile, setManualTemplateFile] = useState<File | null>(null);

  useEffect(() => {
    if (result.mode === ProcessingMode.FILL_TEMPLATE && result.jsonData) {
      setFormData(result.jsonData);
    }
  }, [result]);

  const handleInputChange = (key: string, value: string) => {
    setFormData(prev => ({ ...prev, [key]: value }));
  };

  const handleManualUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
        setManualTemplateFile(e.target.files[0]);
    }
  };

  const handleDownloadDocxFilled = async () => {
    const fileToUse = manualTemplateFile || templateFileRaw;

    if (!fileToUse) {
        setShowMissingTemplateDialog(true);
        return;
    }

    try {
      const reader = new FileReader();
      reader.readAsBinaryString(fileToUse);
      reader.onload = (e) => {
        const content = e.target?.result;
        if (typeof content !== 'string') return;
        
        try {
            const zip = new PizZip(content);
            const doc = new Docxtemplater(zip, { 
                paragraphLoop: true, 
                linebreaks: true, 
                parser: (tag: string) => ({ get: (scope: any) => scope[tag] || scope[tag.trim()] }) 
            });
            
            doc.render(formData);
            
            const out = doc.getZip().generate({ type: "blob", mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document" });
            const url = URL.createObjectURL(out);
            const link = document.createElement('a');
            link.href = url;
            link.download = `Bien_Ban_${new Date().toISOString().slice(0, 10)}.docx`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            
            setShowMissingTemplateDialog(false);
        } catch (renderError) {
            console.error(renderError);
            alert("Lỗi khi điền dữ liệu vào file mẫu. Vui lòng kiểm tra lại file mẫu.");
        }
      };
    } catch (error) {
      alert("Lỗi đọc file mẫu.");
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
      <div className="w-full max-w-4xl mx-auto pb-32 relative">
        {/* Missing Template Dialog */}
        {showMissingTemplateDialog && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-sm p-6">
                    <div className="flex flex-col items-center text-center mb-6">
                        <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
                            <AlertCircle size={32} />
                        </div>
                        <h3 className="text-xl font-bold text-slate-900">Thiếu File Mẫu</h3>
                        <p className="text-sm text-slate-500 mt-2 px-2">
                           Vui lòng tải lên file Word (.docx) để xuất biên bản.
                        </p>
                    </div>

                    <div className="mb-6">
                        <label className={`
                            flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-2xl cursor-pointer transition-colors
                            ${manualTemplateFile ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 hover:border-indigo-400 bg-slate-50'}
                        `}>
                            <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                {manualTemplateFile ? (
                                    <>
                                        <FileIcon className="w-8 h-8 text-indigo-600 mb-2" />
                                        <p className="text-sm font-medium text-indigo-900">{manualTemplateFile.name}</p>
                                    </>
                                ) : (
                                    <>
                                        <Upload className="w-8 h-8 text-slate-400 mb-2" />
                                        <p className="text-sm text-slate-500 font-medium">Chọn file .docx</p>
                                    </>
                                )}
                            </div>
                            <input type="file" className="hidden" accept=".docx" onChange={handleManualUpload} />
                        </label>
                    </div>

                    <div className="flex flex-col gap-3">
                        <button 
                            onClick={handleDownloadDocxFilled}
                            disabled={!manualTemplateFile}
                            className="w-full h-12 bg-indigo-600 disabled:bg-slate-300 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors"
                        >
                            Xác nhận & Tải về
                        </button>
                         <button 
                            onClick={() => setShowMissingTemplateDialog(false)}
                            className="w-full h-12 text-slate-500 font-medium hover:bg-slate-100 rounded-xl"
                        >
                            Hủy
                        </button>
                    </div>
                </div>
            </div>
        )}

        {/* Toolbar */}
        <div className="sticky top-0 z-30 bg-slate-50/95 backdrop-blur-sm py-2 mb-4 -mx-4 px-4 border-b border-slate-200/50 flex justify-between items-center">
            <button onClick={onReset} className="w-10 h-10 flex items-center justify-center bg-white border border-slate-200 text-slate-500 rounded-full shadow-sm hover:text-red-500 active:scale-95 transition-all">
                <RotateCcw size={18} />
            </button>

            {/* Segmented Control */}
            <div className="bg-slate-200/80 p-1 rounded-full flex relative">
                <button 
                    onClick={() => setIsPreviewMode(false)}
                    className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center ${!isPreviewMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <PenLine size={14} className="mr-1.5"/> Sửa
                </button>
                <button 
                    onClick={() => setIsPreviewMode(true)}
                    className={`relative z-10 px-4 py-1.5 rounded-full text-xs font-bold transition-all duration-300 flex items-center ${isPreviewMode ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                >
                    <Eye size={14} className="mr-1.5"/> Xem
                </button>
            </div>
        </div>

        <div className="bg-white rounded-[1.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[60vh] pb-8">
            {isPreviewMode ? (
                <div className="animate-in fade-in duration-300">
                    <div className="bg-slate-50 p-4 border-b border-slate-100 flex items-center justify-between">
                         <div className="flex items-center space-x-2">
                             <span className="w-2 h-2 rounded-full bg-red-400"></span>
                             <span className="w-2 h-2 rounded-full bg-yellow-400"></span>
                             <span className="w-2 h-2 rounded-full bg-green-400"></span>
                         </div>
                         <div className="flex items-center space-x-1 bg-white border border-slate-200 rounded-lg p-1">
                             <button onClick={() => setFontSize(s => Math.max(10, s-1))} className="p-1 hover:bg-slate-100 rounded"><Minus size={14}/></button>
                             <span className="text-xs font-mono w-6 text-center">{fontSize}</span>
                             <button onClick={() => setFontSize(s => Math.min(24, s+1))} className="p-1 hover:bg-slate-100 rounded"><Plus size={14}/></button>
                         </div>
                    </div>
                    <div className="p-5 md:p-10 space-y-8">
                        {Object.keys(formData).map((key) => (
                            <div key={key}>
                                <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2 pb-1 border-b border-dashed border-slate-200">{key.replace(/_/g, ' ')}</div>
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
                <div className="p-5 space-y-6 animate-in fade-in duration-300">
                    {Object.keys(formData).map((key) => (
                        <div key={key}>
                            <label className="block text-xs font-bold text-indigo-500 uppercase tracking-wider mb-2 bg-indigo-50 inline-block px-2 py-1 rounded-md">{key}</label>
                            <textarea 
                                value={formData[key]} 
                                onChange={(e) => handleInputChange(key, e.target.value)}
                                rows={Math.max(3, formData[key]?.split('\n').length || 3)}
                                className="w-full p-4 bg-slate-50 border-none rounded-2xl focus:bg-white focus:ring-2 focus:ring-indigo-500/20 text-base leading-relaxed transition-all"
                                placeholder={`Nhập nội dung...`}
                                style={{fontFamily: selectedFont}}
                            />
                        </div>
                    ))}
                </div>
            )}
        </div>
        
        {/* Floating Action Button (FAB) */}
        <div className="fixed bottom-6 right-6 z-40">
             <button 
                onClick={handleDownloadDocxFilled}
                className="h-16 px-8 bg-indigo-600 active:bg-indigo-700 text-white rounded-full shadow-xl shadow-indigo-300/50 flex items-center justify-center font-bold text-lg transition-transform active:scale-95 hover:scale-105"
            >
                <Download size={24} className="mr-2.5" /> Tải về
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