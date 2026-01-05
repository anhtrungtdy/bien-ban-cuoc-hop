import React from 'react';
import { X, Key, Server, Terminal } from 'lucide-react';

interface ApiKeyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ApiKeyModal: React.FC<ApiKeyModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="bg-gradient-to-r from-red-500 to-pink-600 p-6 text-white flex justify-between items-start">
          <div>
            <h3 className="text-xl font-bold flex items-center">
              <Key className="mr-2" size={24} />
              Thiếu API Key
            </h3>
            <p className="text-red-100 text-sm mt-1">Ứng dụng chưa được cấu hình để kết nối với Google Gemini.</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors">
            <X size={24} />
          </button>
        </div>
        
        <div className="p-6 text-slate-700 space-y-4">
          <p className="font-medium">Bạn cần cấu hình biến môi trường <code>API_KEY</code> trên server hoặc hosting của bạn.</p>
          
          <div className="space-y-3">
            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center font-semibold text-slate-800 mb-2">
                <Terminal size={16} className="mr-2 text-indigo-600" />
                <span>Chạy Local (.env)</span>
              </div>
              <code className="block bg-slate-800 text-green-400 p-2 rounded text-xs">
                API_KEY=AIzaSy...
              </code>
            </div>

            <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
              <div className="flex items-center font-semibold text-slate-800 mb-2">
                <Server size={16} className="mr-2 text-indigo-600" />
                <span>Vercel / Netlify / Hosting</span>
              </div>
              <p className="text-sm text-slate-600">
                Vào phần <strong>Settings</strong> &rarr; <strong>Environment Variables</strong>.
                Thêm key tên là <code>API_KEY</code> và giá trị là key từ Google AI Studio.
              </p>
            </div>
          </div>

          <div className="bg-blue-50 text-blue-800 text-sm p-3 rounded-lg">
            <strong>Lưu ý:</strong> Key này được lấy từ Google AI Studio. Nếu bạn là người dùng, hãy liên hệ quản trị viên trang web.
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button 
            onClick={onClose}
            className="px-4 py-2 bg-slate-200 hover:bg-slate-300 text-slate-800 rounded-lg font-medium transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};