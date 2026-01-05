import React from 'react';
import { ProcessingStatus } from '../types';
import { Loader2, AlertTriangle, RefreshCcw } from 'lucide-react';

interface ProcessingSectionProps {
  status: ProcessingStatus;
  onRetry: () => void;
}

export const ProcessingSection: React.FC<ProcessingSectionProps> = ({ status, onRetry }) => {
  if (status.error) {
    return (
      <div className="w-full max-w-lg mx-auto text-center p-8 bg-red-50 rounded-2xl border border-red-100">
        <div className="w-16 h-16 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-4">
          <AlertTriangle size={32} />
        </div>
        <h3 className="text-xl font-bold text-red-800 mb-2">Đã xảy ra lỗi</h3>
        <p className="text-red-600 mb-6">{status.error}</p>
        <button 
          onClick={onRetry}
          className="px-6 py-2 bg-white border border-red-200 text-red-700 rounded-lg hover:bg-red-50 font-medium flex items-center mx-auto transition-colors shadow-sm"
        >
          <RefreshCcw size={16} className="mr-2" /> Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-2xl mx-auto flex flex-col items-center justify-center py-12">
      <div className="relative">
        <div className="w-24 h-24 rounded-full border-8 border-indigo-100 border-t-indigo-600 animate-spin"></div>
        <div className="absolute inset-0 flex items-center justify-center">
            <Loader2 className="text-indigo-600 animate-pulse" size={32} />
        </div>
      </div>
      
      <h3 className="mt-8 text-2xl font-bold text-slate-800 animate-pulse">
        AI đang phân tích cuộc họp...
      </h3>
      
      <div className="mt-4 w-full max-w-md bg-slate-100 h-2 rounded-full overflow-hidden">
        <div 
          className="h-full bg-indigo-600 animate-progress origin-left"
          style={{ width: '100%', animation: 'progress 15s ease-in-out infinite' }}
        ></div>
      </div>
      
      <p className="mt-4 text-slate-500 text-center max-w-md">
        Quá trình này có thể mất từ 30 giây đến vài phút tùy thuộc vào độ dài của file ghi âm hoặc tài liệu.
      </p>

      <style>{`
        @keyframes progress {
          0% { width: 0%; }
          50% { width: 70%; }
          100% { width: 95%; }
        }
      `}</style>
    </div>
  );
};
