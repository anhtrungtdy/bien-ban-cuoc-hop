import React from 'react';
import { RawMeetingData } from '../types';
import { ArrowRight, Edit3, Save } from 'lucide-react';

interface RawPreviewSectionProps {
  data: RawMeetingData;
  onUpdateData: (newData: RawMeetingData) => void;
  onNext: () => void;
}

export const RawPreviewSection: React.FC<RawPreviewSectionProps> = ({ data, onUpdateData, onNext }) => {
  
  const handleChange = (key: keyof RawMeetingData, value: string) => {
    onUpdateData({ ...data, [key]: value });
  };

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col gap-6">
      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="flex justify-between items-center mb-6 border-b border-slate-100 pb-4">
            <div>
                <h2 className="text-xl font-bold text-slate-800">Nội Dung Biên Bản Thô</h2>
                <p className="text-sm text-slate-500">AI đã trích xuất thông tin. Hãy kiểm tra và chỉnh sửa trước khi áp dụng vào mẫu.</p>
            </div>
            <div className="bg-yellow-50 text-yellow-700 px-3 py-1 rounded-full text-xs font-semibold flex items-center">
                <Edit3 size={12} className="mr-1"/> Chế độ chỉnh sửa
            </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Chủ đề cuộc họp</label>
                    <input 
                        type="text" 
                        value={data.title} 
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Thời gian</label>
                        <input 
                            type="text" 
                            value={data.dateTime} 
                            onChange={(e) => handleChange('dateTime', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-slate-700 mb-1">Địa điểm</label>
                        <input 
                            type="text" 
                            value={data.location} 
                            onChange={(e) => handleChange('location', e.target.value)}
                            className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                        />
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Thành phần tham dự</label>
                    <textarea 
                        value={data.attendees} 
                        onChange={(e) => handleChange('attendees', e.target.value)}
                        rows={4}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Tóm tắt (Summary)</label>
                    <textarea 
                        value={data.summary} 
                        onChange={(e) => handleChange('summary', e.target.value)}
                        rows={3}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm"
                    />
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Nội dung thảo luận chi tiết</label>
                    <textarea 
                        value={data.discussions} 
                        onChange={(e) => handleChange('discussions', e.target.value)}
                        rows={8}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm bg-slate-50"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Các quyết định (Decisions)</label>
                    <textarea 
                        value={data.decisions} 
                        onChange={(e) => handleChange('decisions', e.target.value)}
                        rows={4}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm border-l-4 border-l-green-400"
                    />
                </div>
                <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">Hành động tiếp theo (Action Items)</label>
                    <textarea 
                        value={data.actionItems} 
                        onChange={(e) => handleChange('actionItems', e.target.value)}
                        rows={4}
                        className="w-full p-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 text-sm border-l-4 border-l-orange-400"
                    />
                </div>
            </div>
        </div>

        <div className="mt-8 flex justify-end">
            <button 
                onClick={onNext} 
                className="px-8 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-medium shadow-lg shadow-indigo-200 flex items-center transition-all transform hover:scale-105"
            >
              Lưu & Chọn Template <ArrowRight size={18} className="ml-2" />
            </button>
        </div>
      </div>
    </div>
  );
};