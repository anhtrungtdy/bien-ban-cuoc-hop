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
      <div className="w-full max-w-3xl mx-auto pb-32">
        <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-slate-800 tracking-tight">Dữ liệu thô</h2>
            <div className="bg-white border border-slate-200 text-slate-600 px-4 py-1.5 rounded-full text-xs font-bold flex items-center shadow-sm">
                <Edit3 size={12} className="mr-1.5"/> Chỉnh sửa
            </div>
        </div>

        <div className="space-y-6">
            <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-6 bg-indigo-500 rounded-full"></span>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Thông tin chung</h3>
                </div>
                
                <div className="space-y-4">
                    <div className="group">
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Chủ đề</label>
                        <input 
                            type="text" 
                            value={data.title} 
                            onChange={(e) => handleChange('title', e.target.value)}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-slate-900 font-bold text-lg focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all placeholder-slate-400"
                        />
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                             <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Thời gian</label>
                            <input 
                                type="text" 
                                value={data.dateTime} 
                                onChange={(e) => handleChange('dateTime', e.target.value)}
                                className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                        <div>
                             <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Địa điểm</label>
                            <input 
                                type="text" 
                                value={data.location} 
                                onChange={(e) => handleChange('location', e.target.value)}
                                className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm font-medium focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                            />
                        </div>
                    </div>
                </div>
            </div>

            <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-6 bg-blue-500 rounded-full"></span>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Nội dung chính</h3>
                </div>
                
                <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Thành phần tham dự</label>
                        <textarea 
                            value={data.attendees} 
                            onChange={(e) => handleChange('attendees', e.target.value)}
                            rows={3}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm leading-relaxed focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                     <div>
                        <label className="block text-xs font-semibold text-slate-500 mb-1.5 ml-1">Chi tiết thảo luận</label>
                        <textarea 
                            value={data.discussions} 
                            onChange={(e) => handleChange('discussions', e.target.value)}
                            rows={8}
                            className="w-full p-4 bg-slate-50 border-none rounded-2xl text-sm leading-relaxed focus:bg-white focus:ring-2 focus:ring-indigo-500/20 transition-all"
                        />
                    </div>
                </div>
            </div>
            
             <div className="bg-white p-5 rounded-[1.5rem] shadow-sm border border-slate-100">
                <div className="flex items-center gap-2 mb-4">
                    <span className="w-1 h-6 bg-green-500 rounded-full"></span>
                    <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide">Kết luận</h3>
                </div>
                 <div className="space-y-6">
                    <div>
                        <label className="block text-xs font-semibold text-green-700 mb-1.5 ml-1">Quyết định</label>
                        <textarea 
                            value={data.decisions} 
                            onChange={(e) => handleChange('decisions', e.target.value)}
                            rows={3}
                            className="w-full p-4 bg-green-50 border-none rounded-2xl text-sm leading-relaxed text-slate-800 focus:bg-white focus:ring-2 focus:ring-green-500/30 transition-all"
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-semibold text-orange-700 mb-1.5 ml-1">Hành động tiếp theo</label>
                        <textarea 
                            value={data.actionItems} 
                            onChange={(e) => handleChange('actionItems', e.target.value)}
                            rows={3}
                            className="w-full p-4 bg-orange-50 border-none rounded-2xl text-sm leading-relaxed text-slate-800 focus:bg-white focus:ring-2 focus:ring-orange-500/30 transition-all"
                        />
                    </div>
                 </div>
            </div>
        </div>
      </div>

      {/* Bottom Floating Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 p-4 bg-white/80 backdrop-blur-xl border-t border-slate-200 z-40 safe-pb">
         <div className="max-w-3xl mx-auto">
            <button 
                onClick={onNext} 
                className="w-full h-14 bg-indigo-600 active:bg-indigo-700 active:scale-95 text-white rounded-full font-bold shadow-xl shadow-indigo-200 flex items-center justify-center transition-all text-lg"
            >
              Tiếp tục <ArrowRight size={20} className="ml-2" />
            </button>
         </div>
      </div>
    </>
  );
};