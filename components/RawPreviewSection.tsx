import React from 'react';
import { RawMeetingData } from '../types';
import { ArrowRight, Edit3 } from 'lucide-react';

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
    <>
      <div className="w-full max-w-3xl mx-auto pb-24">
        <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-bold text-slate-800">Dữ liệu thô</h2>
            <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded-full text-xs font-medium flex items-center">
                <Edit3 size={12} className="mr-1"/> Chỉnh sửa
            </div>
        </div>

        <div className="space-y-4">
            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Thông tin chung</label>
                <div className="space-y-3">
                    <input 
                        type="text" 
                        placeholder="Chủ đề cuộc họp"
                        value={data.title} 
                        onChange={(e) => handleChange('title', e.target.value)}
                        className="w-full p-3 bg-slate-50 border-0 rounded-xl text-slate-900 font-semibold focus:ring-2 focus:ring-indigo-500/20 placeholder-slate-400"
                    />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        <input 
                            type="text" 
                            placeholder="Thời gian"
                            value={data.dateTime} 
                            onChange={(e) => handleChange('dateTime', e.target.value)}
                            className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                        />
                        <input 
                            type="text" 
                            placeholder="Địa điểm"
                            value={data.location} 
                            onChange={(e) => handleChange('location', e.target.value)}
                            className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>
            </div>

            <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Chi tiết</label>
                <div className="space-y-4">
                    <div>
                        <span className="text-xs text-slate-400 mb-1 block">Thành phần</span>
                        <textarea 
                            value={data.attendees} 
                            onChange={(e) => handleChange('attendees', e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                     <div>
                        <span className="text-xs text-slate-400 mb-1 block">Nội dung thảo luận</span>
                        <textarea 
                            value={data.discussions} 
                            onChange={(e) => handleChange('discussions', e.target.value)}
                            rows={6}
                            className="w-full p-3 bg-slate-50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500/20"
                        />
                    </div>
                </div>
            </div>
            
             <div className="bg-white p-4 rounded-2xl shadow-sm border border-slate-200">
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2">Kết luận</label>
                 <div className="space-y-4">
                    <div>
                        <span className="text-xs text-slate-400 mb-1 block">Quyết định</span>
                        <textarea 
                            value={data.decisions} 
                            onChange={(e) => handleChange('decisions', e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-green-50/50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-green-500/20 text-green-900"
                        />
                    </div>
                    <div>
                        <span className="text-xs text-slate-400 mb-1 block">Hành động (Action Items)</span>
                        <textarea 
                            value={data.actionItems} 
                            onChange={(e) => handleChange('actionItems', e.target.value)}
                            rows={3}
                            className="w-full p-3 bg-orange-50/50 border-0 rounded-xl text-sm focus:ring-2 focus:ring-orange-500/20 text-orange-900"
                        />
                    </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Bottom Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/90 backdrop-blur-md border-t border-slate-200 z-40 safe-pb">
         <div className="max-w-3xl mx-auto">
            <button 
                onClick={onNext} 
                className="w-full py-3.5 bg-indigo-600 active:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center transition-transform active:scale-95"
            >
              Tiếp tục <ArrowRight size={18} className="ml-2" />
            </button>
         </div>
      </div>
    </>
  );
};