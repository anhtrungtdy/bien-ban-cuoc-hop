import React, { useState, useEffect } from 'react';
import { UploadedFile, FileType } from '../types';
import { FileText, FileAudio, RotateCcw, ArrowRight, ArrowLeft, Upload } from 'lucide-react';
import { formatFileSize } from '../utils/fileHelpers';

interface TemplateSectionProps {
  uploadedFile: UploadedFile;
  template: string;
  setTemplate: (t: string) => void;
  onNext: () => void;
  onBack: () => void;
}

export const TemplateSection: React.FC<TemplateSectionProps> = ({ 
  uploadedFile, 
  template, 
  setTemplate, 
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
  };

  const handleTemplateUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          const content = event.target.result as string;
          setTemplate(content);
          setLocalTemplate(content);
        }
      };
      reader.readAsText(file);
    }
  };

  const getFileIcon = () => {
    switch(uploadedFile.type) {
      case FileType.AUDIO: return <FileAudio className="text-pink-500" />;
      case FileType.TEXT: return <FileText className="text-blue-500" />;
      default: return <FileText className="text-orange-500" />;
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto flex flex-col md:flex-row gap-6 h-full">
      {/* Sidebar: File Info */}
      <div className="w-full md:w-1/3 flex flex-col gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <h3 className="text-sm font-semibold text-slate-500 uppercase tracking-wider mb-4">File Nguồn</h3>
          <div className="flex items-start p-3 bg-slate-50 rounded-lg border border-slate-100">
            <div className="mr-3 mt-1 p-2 bg-white rounded-md shadow-sm border border-slate-100">
              {getFileIcon()}
            </div>
            <div className="overflow-hidden">
              <p className="font-medium text-slate-800 truncate" title={uploadedFile.name}>{uploadedFile.name}</p>
              <div className="flex items-center text-xs text-slate-500 mt-1 space-x-2">
                <span className="bg-slate-200 px-1.5 py-0.5 rounded text-slate-700 font-mono">{uploadedFile.type}</span>
                <span>{formatFileSize(uploadedFile.size)}</span>
              </div>
            </div>
          </div>
          <button 
            onClick={onBack}
            className="mt-4 w-full flex items-center justify-center py-2 text-sm text-slate-600 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors"
          >
            <RotateCcw size={16} className="mr-2" /> Chọn file khác
          </button>
        </div>

        <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100 hidden md:block">
          <h3 className="text-indigo-900 font-semibold mb-2">Mẹo viết Template</h3>
          <ul className="text-sm text-indigo-800 space-y-2 list-disc list-inside">
            <li>Dùng định dạng <strong>Markdown</strong> để cấu trúc đẹp hơn (#, ##, -).</li>
            <li>Xác định rõ các mục cần trích xuất (Thời gian, Địa điểm).</li>
            <li>Sử dụng bảng (Table) cho danh sách nhiệm vụ (Action Items).</li>
            <li>Ghi chú rõ ngôn ngữ mong muốn nếu cần.</li>
          </ul>
        </div>
      </div>

      {/* Main: Template Editor */}
      <div className="w-full md:w-2/3 flex flex-col">
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col flex-grow h-[500px]">
          <div className="p-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 rounded-t-2xl">
            <h3 className="font-semibold text-slate-800">Cấu hình Biên Bản (Template)</h3>
            <div className="flex items-center space-x-3">
              <label className="cursor-pointer flex items-center px-3 py-1.5 text-xs font-medium text-indigo-600 bg-indigo-50 hover:bg-indigo-100 rounded-lg transition-colors">
                <Upload size={14} className="mr-1.5" />
                Tải mẫu lên
                <input type="file" className="hidden" accept=".txt,.md" onChange={handleTemplateUpload} />
              </label>
              <span className="text-xs text-slate-400 hidden sm:inline">Markdown supported</span>
            </div>
          </div>
          <textarea
            value={localTemplate}
            onChange={handleTemplateChange}
            className="flex-grow w-full p-4 focus:outline-none focus:bg-slate-50 text-sm font-mono text-slate-700 resize-none rounded-b-2xl"
            placeholder="Nhập cấu trúc biên bản cuộc họp mong muốn tại đây..."
          />
        </div>

        <div className="mt-6 flex justify-end">
             <button 
              onClick={onBack}
              className="mr-3 px-6 py-3 rounded-xl border border-slate-300 text-slate-700 font-medium hover:bg-slate-50 transition-all flex items-center md:hidden"
            >
              <ArrowLeft size={18} className="mr-2" /> Quay lại
            </button>
            <button 
              onClick={onNext}
              className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 flex items-center transition-all transform hover:scale-105"
            >
              Tạo Biên Bản <ArrowRight size={18} className="ml-2" />
            </button>
        </div>
      </div>
    </div>
  );
};