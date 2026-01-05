import React, { useState, useEffect } from 'react';
import { UploadedFile, FileType } from '../types';
import { processUploadedFile, formatFileSize } from '../utils/fileHelpers';
import { FileText, FileAudio, RotateCcw, ArrowRight, ArrowLeft, Upload, FileType2, X, AlertCircle, Wand2, ShieldCheck, Info } from 'lucide-react';

interface TemplateSectionProps {
  uploadedFile: UploadedFile;
  template: string; 
  templateFile: UploadedFile | null; 
  setTemplate: (t: string) => void;
  setTemplateFile: (f: UploadedFile | null) => void;
  setTemplateFileRaw: (f: File | null) => void; // New prop to save raw file
  onNext: () => void;
  onBack: () => void;
}

export const TemplateSection: React.FC<TemplateSectionProps> = ({ 
  uploadedFile, 
  template,
  templateFile,
  setTemplate, 
  setTemplateFile,
  setTemplateFileRaw,
  onNext, 
  onBack 
}) => {
  const [localTemplate, setLocalTemplate] = useState(template);

  useEffect(() => {
    setLocalTemplate(template);
  }, [template]);

  const handleTemplateChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setLocalTemplate(e.target.value);
    setTemplate(e.target.value);
    if (templateFile) {
      setTemplateFile(null);
      setTemplateFileRaw(null);
    }
  };

  const handleTemplateUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const fileType = file.name.split('.').pop()?.toLowerCase();
      
      try {
        if (fileType === 'txt' || fileType === 'md') {
           const reader = new FileReader();
           reader.onload = (event) => {
             if (event.target?.result) {
               const content = event.target.result as string;
               setTemplate(content);
               setLocalTemplate(content);
               setTemplateFile(null);
               setTemplateFileRaw(null);
             }
           };
           reader.readAsText(file);
        } else {
          // Process for AI analysis
          const processed = await processUploadedFile(file);
          setTemplateFile(processed);
          // Save Raw for DocxTemplater
          setTemplateFileRaw(file);
        }
      } catch (err) {
        console.error("Error reading template file", err);
        alert("Không thể đọc file mẫu. Vui lòng thử lại.");
      }
    }
  };

  const clearTemplateFile = () => {
    setTemplateFile(null);
    setTemplateFileRaw(null);
  };

  const getFileIcon = (type: FileType) => {
    switch(type) {
      case FileType.AUDIO: return <FileAudio className="text-pink-500" />;
      case FileType.TEXT: return <FileText className="text-blue-500" />;
      default: return <FileText className="text-orange-500" />;
    }
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col md:flex-row gap-6 h-full">
      {/* Sidebar */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">File Nguồn</h3>
          <div className="flex items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="mr-3 mt-1 p-2 bg-white rounded-md shadow-sm border border-slate-100">
              {getFileIcon(uploadedFile.type)}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-slate-800 truncate" title={uploadedFile.name}>{uploadedFile.name}</p>
              <div className="flex items-center text-xs text-slate-500 mt-1 space-x-2">
                <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono">{uploadedFile.type}</span>
                <span>{formatFileSize(uploadedFile.size)}</span>
              </div>
            </div>
          </div>
          <button onClick={onBack} className="mt-4 w-full flex items-center justify-center py-2 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors">
            <RotateCcw size={16} className="mr-2" /> Chọn file khác
          </button>
        </div>

        <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-5 rounded-2xl border border-indigo-100">
          <h3 className="text-indigo-900 font-bold mb-3 flex items-center"><Info size={18} className="mr-2 text-indigo-600"/> Chế độ xử lý</h3>
          
          <div className="mb-4">
            <div className="flex items-center text-sm font-bold text-green-700 mb-1">
                <ShieldCheck size={16} className="mr-1.5"/> Chế độ Chính Xác (Khuyên dùng)
            </div>
            <p className="text-xs text-slate-600 pl-6">
                Giữ nguyên 100% Logo, Header, Footer.
                <br/>Yêu cầu: File Word có từ khóa như <code>{`{noi_dung}`}</code>.
            </p>
          </div>

          <div>
            <div className="flex items-center text-sm font-bold text-orange-700 mb-1">
                <Wand2 size={16} className="mr-1.5"/> Chế độ Thông Minh (Tự động)
            </div>
            <p className="text-xs text-slate-600 pl-6">
                Dùng khi file Word <strong>không có từ khóa</strong>.
                AI sẽ đọc file và viết lại nội dung theo cấu trúc mẫu (Bố cục có thể thay đổi nhẹ).
            </p>
          </div>
        </div>
      </div>

      {/* Main */}
      <div className="w-full md:w-2/3 flex flex-col">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-grow min-h-[500px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <h3 className="font-semibold text-slate-800">Cấu hình Biên Bản (Template)</h3>
            <label className="cursor-pointer flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                <Upload size={14} className="mr-1.5" />
                Upload Mẫu Word/PDF
                <input type="file" className="hidden" accept=".txt,.md,.pdf,.doc,.docx" onChange={handleTemplateUpload} />
            </label>
          </div>
          
          {templateFile ? (
            <div className="flex-grow flex flex-col items-center justify-center p-8 bg-slate-50/50">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-4 shadow-sm">
                <FileType2 size={32} />
              </div>
              <h4 className="text-lg font-semibold text-slate-800 mb-1">Đã chọn File Mẫu</h4>
              <p className="text-slate-500 mb-6 text-center max-w-xs break-words">{templateFile.name}</p>
              
              <div className="flex flex-col gap-3 w-full max-w-xs">
                {templateFile.type === FileType.DOCX && (
                  <div className="p-3 bg-white text-slate-600 text-xs rounded-lg border border-slate-200 shadow-sm">
                    <strong>Gợi ý:</strong> Hệ thống sẽ tự động kiểm tra xem file có chứa <code>{`{...}`}</code> không để chọn chế độ xử lý phù hợp nhất.
                  </div>
                )}
                <button 
                  onClick={clearTemplateFile}
                  className="w-full py-2 bg-white border border-red-200 text-red-600 hover:bg-red-50 rounded-lg text-sm font-medium transition-colors flex items-center justify-center"
                >
                  <X size={14} className="mr-2" /> Gỡ bỏ file mẫu
                </button>
              </div>
            </div>
          ) : (
            <textarea
              value={localTemplate}
              onChange={handleTemplateChange}
              className="flex-grow w-full p-4 focus:outline-none focus:bg-slate-50 text-sm font-mono text-slate-700 resize-none rounded-b-2xl"
              placeholder="Nhập cấu trúc Markdown hoặc tải lên file Word mẫu..."
            />
          )}
        </div>

        <div className="mt-6 flex justify-end">
            <button onClick={onBack} className="mr-3 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 md:hidden">Quay lại</button>
            <button onClick={onNext} className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 flex items-center transition-all transform hover:scale-105">
              Tạo Biên Bản <ArrowRight size={18} className="ml-2" />
            </button>
        </div>
      </div>
    </div>
  );
};