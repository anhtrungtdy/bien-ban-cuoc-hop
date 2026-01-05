import React, { useRef, useState, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Download, Copy, Check, RotateCcw, FileText, FileType2, Type, Minus, Plus, Save, FileSignature, Eye, PenLine } from 'lucide-react';
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
  const [fontSize, setFontSize] = useState(13); // Default font size increased slightly
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
        
        const doc = new Docxtemplater(zip, {
          paragraphLoop: true,
          linebreaks: true,
          parser: (tag: string) => {
            return {
              get: (scope: any) => {
                const trimmedTag = tag.trim();
                if (scope[tag] !== undefined) return scope[tag];
                return scope[trimmedTag];
              }
            };
          }
        });

        doc.render(formData);

        const out = doc.getZip().generate({
          type: "blob",
          mimeType: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        });

        const url = URL.createObjectURL(out);
        const link = document.createElement('a');
        link.href = url;
        link.download = `Bien_Ban_Hoan_Chinh_${new Date().toISOString().slice(0, 10)}.docx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      };
    } catch (error) {
      console.error("Error generating docx:", error);
      alert("Lỗi khi tạo file Word. Vui lòng kiểm tra file mẫu.");
    }
  };

  const handleCopy = () => {
    if (result.markdown) {
      navigator.clipboard.writeText(result.markdown);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleDownloadDocxGen = () => {
    if (!contentRef.current) return;
    
    // Simple HTML to Doc export
    const preHtml = "<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'><head><meta charset='utf-8'><title>Export HTML to Word Document with JavaScript</title></head><body>";
    const postHtml = "</body></html>";
    const html = preHtml + contentRef.current.innerHTML + postHtml;

    const blob = new Blob(['\ufeff', html], {
        type: 'application/msword'
    });
    
    const url = 'data:application/vnd.ms-word;charset=utf-8,' + encodeURIComponent(html);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = 'Bien_Ban_Cuoc_Hop.doc';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadPDF = () => {
    if (!contentRef.current) return;
    const element = contentRef.current;
    element.classList.add('exporting-pdf');
    
    const opt = {
      margin:       20,
      filename:     'Bien_Ban_Cuoc_Hop.pdf',
      image:        { type: 'jpeg', quality: 0.98 },
      html2canvas:  { scale: 2, useCORS: true },
      jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };

    html2pdf().from(element).set(opt).save().then(() => {
         element.classList.remove('exporting-pdf');
    });
  };

  // Helper to render text with SCIENTIFIC formatting (Blue Uppercase headers, 1.5 Spacing)
  const renderScientificPreview = (text: string) => {
    if (!text) return <p className="text-slate-400 italic">Chưa có nội dung...</p>;
    
    const lines = text.split('\n');
    
    return lines.map((line, index) => {
        const trimmed = line.trim();
        if (!trimmed) return <div key={index} className="h-6"></div>; // Spacer for paragraphs

        // 1. Level 1 Header: I., II., III. -> BLUE, BOLD, UPPERCASE, UNDERLINE
        // Regex looks for Roman Numerals at start
        if (/^[IVX]+\.\s/.test(trimmed)) {
            return (
              <h3 key={index} className="text-[#1F4E79] font-bold text-lg mt-8 mb-4 uppercase tracking-wide border-b border-blue-100 pb-1" style={{ fontFamily: selectedFont }}>
                {line}
              </h3>
            );
        }

        // 2. Level 2 Header: 1., 2., 3. -> BOLD
        // Regex looks for Number dot at start
        if (/^\d+\.\s/.test(trimmed)) {
            return (
              <h4 key={index} className="text-slate-900 font-bold text-base mt-4 mb-2" style={{ fontFamily: selectedFont }}>
                {line}
              </h4>
            );
        }

        // 3. Attendees / Bullet points starting with •
        // Format: • Ông A (Giám đốc)
        if (trimmed.startsWith('•')) {
             return (
               <p key={index} className="text-slate-800 mb-2 pl-6 relative leading-[1.8]" style={{ fontFamily: selectedFont }}>
                 <span className="absolute left-0 text-slate-500">•</span>
                 {line.replace(/^•\s*/, '')}
               </p>
             );
        }
        
        // 4. Sub-bullets (-) or (o)
        if (trimmed.startsWith('-') || trimmed.startsWith('o ')) {
           return (
             <p key={index} className="text-slate-800 mb-2 pl-10 relative leading-[1.6]" style={{ fontFamily: selectedFont }}>
               <span className="absolute left-4 text-slate-400">-</span>
               {line.replace(/^[-o]\s*/, '')}
             </p>
           );
        }

        // 5. Normal Paragraph - 1.5 Spacing (Leading Loose)
        return (
          <p key={index} className="text-slate-800 mb-2 leading-[1.8] text-justify" style={{ fontFamily: selectedFont }}>
            {line}
          </p>
        );
    });
  };

  // --- RENDER ---

  if (result.mode === ProcessingMode.FILL_TEMPLATE) {
    return (
      <div className="w-full max-w-5xl mx-auto">
        <div className="bg-indigo-900 text-white p-6 rounded-t-xl shadow-lg flex flex-col md:flex-row justify-between items-center gap-4 sticky top-16 z-40">
            <div className="flex items-center">
                <div className="bg-white/10 p-2 rounded-lg mr-3">
                  <FileSignature size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">Kết Quả & Kiểm Tra</h2>
                  <p className="text-indigo-200 text-sm opacity-90">Review nội dung trước khi xuất ra file Word.</p>
                </div>
            </div>
            <div className="flex items-center gap-2 bg-indigo-800 p-1.5 rounded-lg border border-indigo-700">
               <Type size={16} className="ml-2 text-indigo-300" />
               <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none pr-2 mr-2 cursor-pointer text-white border-none outline-none ring-0">
                  {FONTS.map(f => <option key={f.name} value={f.value} className="text-black">{f.name}</option>)}
               </select>
            </div>
            <div className="flex gap-3 w-full md:w-auto">
                <div className="flex bg-indigo-800 rounded-lg p-1">
                    <button 
                        onClick={() => setIsPreviewMode(false)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors ${!isPreviewMode ? 'bg-white text-indigo-900 shadow-sm' : 'text-indigo-300 hover:text-white'}`}
                    >
                        <PenLine size={14} className="mr-1.5"/> Sửa
                    </button>
                    <button 
                        onClick={() => setIsPreviewMode(true)}
                        className={`px-3 py-1.5 rounded-md text-sm font-medium flex items-center transition-colors ${isPreviewMode ? 'bg-white text-indigo-900 shadow-sm' : 'text-indigo-300 hover:text-white'}`}
                    >
                        <Eye size={14} className="mr-1.5"/> Xem
                    </button>
                </div>
                <button onClick={onReset} className="px-3 py-2 bg-white/10 hover:bg-white/20 text-white rounded-lg text-sm font-medium transition-colors">
                  Tạo mới
                </button>
                <button onClick={handleDownloadDocxFilled} className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg flex items-center justify-center shadow-lg font-bold transition-transform transform hover:scale-105">
                    <Download size={18} className="mr-2"/> Tải File
                </button>
            </div>
        </div>

        <div className="bg-white rounded-b-xl shadow-md border border-t-0 border-slate-200 p-8 min-h-[60vh]">
            {isPreviewMode ? (
                // PREVIEW MODE
                <div className="animate-in fade-in duration-300">
                    <div className="mb-6 bg-blue-50 border border-blue-200 p-4 rounded-lg flex items-start">
                        <span className="text-blue-600 mr-2 text-xl">👀</span>
                        <div>
                            <p className="text-sm text-blue-800 font-semibold">Chế độ Xem Trước (Khoa học)</p>
                            <p className="text-xs text-blue-700 mt-1">
                                Hiển thị mô phỏng dãn cách dòng 1.5 và các đề mục màu xanh. 
                                <br/>Khi tải file Word, nếu muốn định dạng y hệt, hãy đảm bảo File Mẫu của bạn đã set style cho placeholder <code>{`{...}`}</code>.
                            </p>
                        </div>
                    </div>
                    
                    <div className="space-y-10">
                        {Object.keys(formData).map((key) => (
                            <div key={key} className="border border-slate-200 rounded-xl overflow-hidden shadow-sm">
                                <div className="bg-slate-50 px-4 py-2 border-b border-slate-200 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider font-mono">{`{ ${key} }`}</span>
                                </div>
                                <div className="p-8 bg-white text-slate-900">
                                    {key === 'noi_dung_cuoc_hop' 
                                        ? renderScientificPreview(formData[key])
                                        : <p className="whitespace-pre-line leading-loose" style={{fontFamily: selectedFont}}>{formData[key]}</p>
                                    }
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            ) : (
                // EDIT MODE
                <div className="animate-in fade-in duration-300">
                    <div className="mb-6 bg-yellow-50 border border-yellow-200 p-4 rounded-lg flex items-start">
                       <span className="text-yellow-600 mr-2 text-xl">✏️</span>
                       <p className="text-sm text-yellow-800">
                         Chỉnh sửa nội dung thô. Dùng <code>\n\n</code> (Enter 2 lần) để tạo khoảng cách lớn giữa các phần.
                       </p>
                    </div>

                    <div className="grid gap-6">
                        {Object.keys(formData).map((key) => (
                            <div key={key} className="bg-slate-50 p-4 rounded-xl border border-slate-200 hover:border-indigo-300 transition-colors">
                                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">
                                   Nội dung điền vào: <span className="text-indigo-600 bg-indigo-50 px-1 py-0.5 rounded border border-indigo-100 font-mono normal-case">{`{ ${key} }`}</span>
                                </label>
                                <textarea 
                                    value={formData[key]} 
                                    onChange={(e) => handleInputChange(key, e.target.value)}
                                    rows={Math.max(6, formData[key]?.split('\n').length || 6)}
                                    className="w-full p-4 bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 text-slate-800 text-base leading-relaxed shadow-sm"
                                    placeholder={`Nhập nội dung cho ${key}...`}
                                    style={{ lineHeight: '1.6', fontFamily: selectedFont }}
                                />
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>
    );
  }

  // Fallback to Generate Mode (Markdown) - No Changes Here
  return (
    <div className="w-full max-w-6xl mx-auto h-full flex flex-col">
      <div className="bg-white p-3 rounded-xl shadow-sm border border-slate-200 mb-6 sticky top-20 z-40 flex flex-col md:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2">
          <button onClick={onReset} className="px-3 py-2 text-slate-600 bg-slate-50 border border-slate-300 hover:bg-slate-100 rounded-lg text-sm font-medium flex items-center"><RotateCcw size={16} className="mr-2" /> Tạo mới</button>
          <button onClick={handleCopy} className="px-3 py-2 text-indigo-700 bg-indigo-50 border-indigo-100 hover:bg-indigo-100 rounded-lg text-sm font-medium flex items-center">{copied ? <Check size={16} className="mr-2" /> : <Copy size={16} className="mr-2" />} Copy</button>
        </div>
        <div className="flex items-center gap-2 bg-slate-100 p-1.5 rounded-lg border border-slate-200">
           <Type size={16} className="ml-2 text-slate-500" />
           <select value={selectedFont} onChange={(e) => setSelectedFont(e.target.value)} className="bg-transparent text-sm font-medium focus:outline-none pr-2 mr-2 cursor-pointer">{FONTS.map(f => <option key={f.name} value={f.value}>{f.name}</option>)}</select>
           <button onClick={() => setFontSize(s => Math.max(8, s - 1))} className="p-1 hover:bg-white rounded"><Minus size={14} /></button>
           <span className="text-xs font-mono w-6 text-center">{fontSize}</span>
           <button onClick={() => setFontSize(s => Math.min(24, s + 1))} className="p-1 hover:bg-white rounded"><Plus size={14} /></button>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleDownloadDocxGen} className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg shadow-sm text-sm font-medium flex items-center"><FileText size={16} className="mr-2" /> Word</button>
          <button onClick={handleDownloadPDF} className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg shadow-sm text-sm font-medium flex items-center"><FileType2 size={16} className="mr-2" /> PDF</button>
        </div>
      </div>
      <div className="flex-grow flex justify-center bg-slate-100 p-4 md:p-8 rounded-2xl overflow-y-auto border border-slate-200 shadow-inner">
        <div className="bg-white shadow-xl min-h-[297mm] w-full max-w-[210mm] p-[2.54cm] mx-auto text-slate-900" style={{ fontFamily: selectedFont, fontSize: `${fontSize}pt`, lineHeight: '1.5' }}>
          <div ref={contentRef}>
            <ReactMarkdown remarkPlugins={[remarkGfm]} components={{
                h1: ({node, ...props}) => <h1 style={{fontSize:'1.5em', textAlign:'center', fontWeight:'bold', marginBottom:'1em'}} {...props} />,
                h2: ({node, ...props}) => <h2 style={{fontSize:'1.25em', fontWeight:'bold', marginTop:'1.5em', marginBottom:'0.5em', borderBottom:'1px solid #eee'}} {...props} />,
                h3: ({node, ...props}) => <h3 style={{fontSize:'1.1em', fontWeight:'bold', marginTop:'1em'}} {...props} />,
                p: ({node, ...props}) => <p style={{marginBottom:'1em', textAlign:'justify'}} {...props} />,
                ul: ({node, ...props}) => <ul className="list-disc ml-6 mb-4" {...props} />,
                table: ({node, ...props}) => <table className="w-full border-collapse border border-black mb-6" {...props} />,
                th: ({node, ...props}) => <th className="border border-black px-3 py-2 text-center font-bold bg-gray-100" {...props} />,
                td: ({node, ...props}) => <td className="border border-black px-3 py-2 align-top" {...props} />
            }}>{result.markdown || ''}</ReactMarkdown>
            <div className="mt-16 flex justify-between"><div className="text-center w-1/3"><p className="font-bold mb-16">Thư ký</p></div><div className="text-center w-1/3"><p className="font-bold mb-16">Chủ tọa</p></div></div>
          </div>
        </div>
      </div>
      <style>{`.exporting-pdf table, .exporting-pdf th, .exporting-pdf td { border: 1px solid #000 !important; }`}</style>
    </div>
  );
};