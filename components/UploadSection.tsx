import React, { useCallback, useState } from 'react';
import { UploadedFile } from '../types';
import { processUploadedFile, formatFileSize } from '../utils/fileHelpers';
import { UploadCloud, FileAudio, FileText, File as FileIcon, X, AlertCircle } from 'lucide-react';

interface UploadSectionProps {
  onFileSelected: (file: UploadedFile) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onFileSelected }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files[0]);
    }
  }, []);

  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    e.preventDefault();
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files[0]);
    }
  };

  const handleFiles = async (file: File) => {
    setError(null);
    setIsProcessing(true);

    // Basic validation
    const validTypes = [
      'audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/x-m4a',
      'application/pdf', 
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'text/plain'
    ];
    
    // Check extension for files that might not have standard MIME types in all browsers
    const validExtensions = ['.mp3', '.wav', '.m4a', '.pdf', '.docx', '.txt', '.md'];
    const hasValidExt = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!validTypes.includes(file.type) && !hasValidExt) {
      setError("Định dạng file không hỗ trợ. Vui lòng tải lên MP3, PDF, DOCX hoặc Text.");
      setIsProcessing(false);
      return;
    }

    // Increased limit to 500MB. 
    // Browsers may crash with files larger than this due to memory limits when converting to Base64.
    const LIMIT_MB = 500;
    if (file.size > LIMIT_MB * 1024 * 1024) {
      setError(`File quá lớn (>${LIMIT_MB}MB). Vui lòng giảm dung lượng để tránh lỗi trình duyệt.`);
      setIsProcessing(false);
      return;
    }

    try {
      const processedFile = await processUploadedFile(file);
      onFileSelected(processedFile);
    } catch (err) {
      console.error(err);
      setError("Không thể đọc file. Có thể file bị lỗi hoặc quá lớn so với bộ nhớ trình duyệt.");
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="mb-6 text-center">
        <h2 className="text-2xl font-bold text-slate-800 mb-2">Tải lên nội dung cuộc họp</h2>
        <p className="text-slate-500">Hỗ trợ file ghi âm (MP3), tài liệu (PDF, DOCX) hoặc văn bản thô.</p>
      </div>

      <div 
        className={`relative flex flex-col items-center justify-center w-full h-72 border-2 border-dashed rounded-2xl transition-all duration-200
          ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-300 bg-white hover:bg-slate-50'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragEnter={handleDrag} 
        onDragLeave={handleDrag} 
        onDragOver={handleDrag} 
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" 
          onChange={handleChange}
          accept=".mp3,.wav,.m4a,.pdf,.docx,.txt,.md"
        />

        {isProcessing ? (
          <div className="flex flex-col items-center animate-pulse">
            <div className="w-12 h-12 rounded-full border-4 border-indigo-200 border-t-indigo-600 animate-spin mb-4"></div>
            <p className="text-slate-600 font-medium">Đang xử lý file lớn...</p>
            <p className="text-xs text-slate-400 mt-2">Vui lòng không tắt trình duyệt</p>
          </div>
        ) : (
          <>
            <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4 shadow-sm">
              <UploadCloud size={32} />
            </div>
            <p className="text-lg font-semibold text-slate-700 mb-1">Kéo thả file vào đây</p>
            <p className="text-sm text-slate-500 mb-6">hoặc click để chọn file từ máy tính</p>
            
            <div className="flex space-x-4 text-xs text-slate-400">
              <span className="flex items-center"><FileAudio size={14} className="mr-1" /> MP3/WAV</span>
              <span className="flex items-center"><FileIcon size={14} className="mr-1" /> PDF/DOCX</span>
              <span className="flex items-center"><FileText size={14} className="mr-1" /> TXT</span>
            </div>
          </>
        )}
      </div>

      {error && (
        <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start text-red-700">
          <AlertCircle size={20} className="mr-2 mt-0.5 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
      
      <div className="mt-6 p-4 bg-blue-50 rounded-xl border border-blue-100 text-sm text-blue-700">
        <p className="font-semibold mb-1">💡 Lưu ý cho file lớn:</p>
        <p>Ứng dụng đã được tối ưu để xử lý file ghi âm dài hoặc tài liệu lớn (lên tới 500MB). Tốc độ xử lý sẽ phụ thuộc vào đường truyền mạng và tốc độ máy chủ AI.</p>
      </div>
    </div>
  );
};
