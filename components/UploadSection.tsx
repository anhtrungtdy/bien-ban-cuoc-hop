import React, { useCallback, useState, useEffect } from 'react';
import { UploadedFile, FileType, Participant } from '../types';
import { processUploadedFile, formatFileSize } from '../utils/fileHelpers';
import { identifyParticipants, getSystemApiKey } from '../services/geminiService';
import { UploadCloud, FileAudio, FileText, File as FileIcon, AlertCircle, Loader2, ArrowRight, X, User, Plus, AlertTriangle, FileUp } from 'lucide-react';

interface UploadSectionProps {
  onFileSelected: (file: UploadedFile, userContext: string) => void;
}

export const UploadSection: React.FC<UploadSectionProps> = ({ onFileSelected }) => {
  const [dragActive, setDragActive] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isProcessingFile, setIsProcessingFile] = useState(false);
  
  // Staged File State
  const [stagedFile, setStagedFile] = useState<UploadedFile | null>(null);
  
  // Context Analysis State
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [analysisNote, setAnalysisNote] = useState(""); // General note

  // Trigger analysis when file is staged
  useEffect(() => {
    if (stagedFile) {
        performInitialScan(stagedFile);
    }
  }, [stagedFile]);

  const performInitialScan = async (file: UploadedFile) => {
    const apiKey = getSystemApiKey();
    if (!apiKey) return;

    setIsAnalyzing(true);
    try {
        const foundParticipants = await identifyParticipants(file);
        setParticipants(foundParticipants);
    } catch (e) {
        console.warn("Scan failed", e);
    }
    setIsAnalyzing(false);
  };

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
    setIsProcessingFile(true);

    const LIMIT_MB = 500;
    if (file.size > LIMIT_MB * 1024 * 1024) {
      setError(`File quá lớn (>${LIMIT_MB}MB).`);
      setIsProcessingFile(false);
      return;
    }

    try {
      const processedFile = await processUploadedFile(file);
      setStagedFile(processedFile); 
    } catch (err) {
      console.error(err);
      setError("Lỗi đọc file. Vui lòng thử lại.");
    } finally {
      setIsProcessingFile(false);
    }
  };

  const handleUpdateParticipant = (id: string, field: keyof Participant, value: string) => {
    setParticipants(prev => prev.map(p => {
        if (p.id === id) {
            return { ...p, [field]: value, isAmbiguous: false };
        }
        return p;
    }));
  };

  const handleAddParticipant = () => {
    const newId = `manual-${Date.now()}`;
    setParticipants(prev => [...prev, { id: newId, name: "", gender: "", role: "", isAmbiguous: true }]);
  };

  const handleRemoveParticipant = (id: string) => {
    setParticipants(prev => prev.filter(p => p.id !== id));
  };

  const handleStart = () => {
    if (stagedFile) {
        const participantLines = participants
            .filter(p => p.name.trim() !== "")
            .map(p => `• ${p.gender || '(Chưa rõ)'} ${p.name} - ${p.role || 'Chưa rõ chức vụ'}`);
        
        const finalContext = `DANH SÁCH THÀNH PHẦN:\n${participantLines.join('\n')}\n\nGHI CHÚ CHUNG:\n${analysisNote}`;
        
        onFileSelected(stagedFile, finalContext);
    }
  };

  const handleCancel = () => {
    setStagedFile(null);
    setParticipants([]);
    setAnalysisNote("");
    setError(null);
  };

  const getFileIcon = (type: FileType) => {
    switch(type) {
      case FileType.AUDIO: return <FileAudio size={24} className="text-pink-600" />;
      case FileType.PDF: return <FileText size={24} className="text-red-600" />;
      case FileType.DOCX: return <FileIcon size={24} className="text-blue-600" />;
      default: return <FileText size={24} className="text-slate-600" />;
    }
  };

  // --- RENDER STAGED VIEW (Initial Scan & Edit) ---
  if (stagedFile) {
      return (
        <div className="w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Native Card Container */}
            <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                
                {/* Header File Info */}
                <div className="p-5 bg-slate-50 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-white rounded-2xl shadow-sm flex items-center justify-center border border-slate-50">
                            {getFileIcon(stagedFile.type)}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 truncate max-w-[160px] md:max-w-xs text-base">{stagedFile.name}</h3>
                            <p className="text-xs font-medium text-slate-400 mt-0.5">{formatFileSize(stagedFile.size)}</p>
                        </div>
                    </div>
                    <button onClick={handleCancel} className="text-slate-400 hover:text-red-500 p-2 bg-white rounded-full border border-slate-100 shadow-sm transition-colors">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-0">
                    {isAnalyzing ? (
                        <div className="py-20 flex flex-col items-center justify-center text-center">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                            <h4 className="text-lg font-bold text-slate-800">Đang nhận diện...</h4>
                            <p className="text-sm text-slate-500 mt-1">AI đang tìm người tham gia</p>
                        </div>
                    ) : (
                        <div>
                            <div className="p-5 pb-2">
                                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">Người tham gia</h4>
                            </div>

                            <div className="space-y-0 divide-y divide-slate-100">
                                {participants.map((p) => (
                                    <div key={p.id} className="p-4 bg-white flex items-center gap-4 transition-colors hover:bg-slate-50">
                                        {/* Avatar / Gender */}
                                        <div 
                                            className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 shadow-sm border
                                                ${p.gender === 'Ông' ? 'bg-indigo-100 text-indigo-700 border-indigo-200' : p.gender === 'Bà' ? 'bg-pink-100 text-pink-700 border-pink-200' : 'bg-slate-100 text-slate-500 border-slate-200'}
                                                ${p.isAmbiguous ? 'ring-2 ring-offset-1 ring-amber-400' : ''}
                                            `}
                                        >
                                            {p.gender === 'Ông' ? 'Mr' : p.gender === 'Bà' ? 'Ms' : '?'}
                                        </div>

                                        {/* Inputs */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex gap-2 mb-1">
                                                 <input 
                                                    className="flex-1 font-semibold text-slate-800 bg-transparent placeholder-slate-300 text-sm focus:text-indigo-600 p-0 border-none focus:ring-0"
                                                    value={p.name}
                                                    placeholder="Tên..."
                                                    onChange={(e) => handleUpdateParticipant(p.id, 'name', e.target.value)}
                                                />
                                                <select 
                                                    className="w-16 text-xs bg-slate-50 rounded-md border-none py-0.5 px-1 text-slate-600 focus:ring-0 font-medium"
                                                    value={p.gender}
                                                    onChange={(e) => handleUpdateParticipant(p.id, 'gender', e.target.value)}
                                                >
                                                    <option value="">G.tính</option>
                                                    <option value="Ông">Ông</option>
                                                    <option value="Bà">Bà</option>
                                                </select>
                                            </div>
                                            <input 
                                                className="w-full text-xs text-slate-500 bg-transparent placeholder-slate-300 p-0 border-none focus:ring-0"
                                                value={p.role}
                                                placeholder="Chức vụ (VD: Giám đốc)"
                                                onChange={(e) => handleUpdateParticipant(p.id, 'role', e.target.value)}
                                            />
                                        </div>

                                        <button onClick={() => handleRemoveParticipant(p.id)} className="text-slate-300 hover:text-red-500 p-2">
                                            <X size={18} />
                                        </button>
                                    </div>
                                ))}
                            </div>
                            
                            <div className="p-4">
                                <button onClick={handleAddParticipant} className="w-full py-3 bg-slate-50 text-indigo-600 rounded-xl text-sm font-semibold flex items-center justify-center hover:bg-slate-100 transition-colors">
                                    <Plus size={18} className="mr-2" /> Thêm người
                                </button>
                            </div>

                            <div className="p-5 border-t border-slate-100 bg-slate-50/50">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-3">Ghi chú ngữ cảnh</label>
                                <textarea 
                                    value={analysisNote}
                                    onChange={(e) => setAnalysisNote(e.target.value)}
                                    placeholder="VD: Cuộc họp dự án X, Ông A chủ trì..."
                                    className="w-full p-4 bg-white border-none rounded-2xl text-sm shadow-sm focus:ring-2 focus:ring-indigo-500/20 min-h-[100px] resize-none"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-slate-100 flex gap-3 sticky bottom-0 z-20">
                     <button 
                        onClick={handleCancel}
                        className="w-14 h-14 flex items-center justify-center bg-slate-100 text-slate-600 rounded-full font-bold hover:bg-slate-200 transition-colors"
                    >
                        <X size={24}/>
                    </button>
                    <button 
                        onClick={handleStart}
                        disabled={isAnalyzing}
                        className="flex-1 h-14 bg-indigo-600 hover:bg-indigo-700 active:scale-95 text-white rounded-full font-bold shadow-lg shadow-indigo-200 flex items-center justify-center transition-all disabled:opacity-50 disabled:scale-100"
                    >
                        Tiếp tục <ArrowRight size={20} className="ml-2" />
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // --- RENDER UPLOAD VIEW ---
  return (
    <div className="w-full h-full flex flex-col items-center pt-6">
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Tải lên file họp</h2>
        <p className="text-slate-500 mt-2 text-base">Hỗ trợ âm thanh hoặc tài liệu văn bản</p>
      </div>

      <div 
        className={`relative w-full aspect-[4/3] rounded-[2rem] border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden cursor-pointer group active:scale-95 bg-white
          ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300'}
          ${error ? 'border-red-300 bg-red-50' : ''}
        `}
        onDragEnter={handleDrag} 
        onDragLeave={handleDrag} 
        onDragOver={handleDrag} 
        onDrop={handleDrop}
      >
        <input 
          type="file" 
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20" 
          onChange={handleChange}
          accept=".mp3,.wav,.m4a,.pdf,.docx,.txt,.md"
        />

        {isProcessingFile ? (
          <div className="flex flex-col items-center animate-pulse">
            <Loader2 className="w-12 h-12 text-indigo-600 animate-spin mb-4" />
            <p className="text-indigo-900 font-medium">Đang xử lý file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center z-10 p-6 text-center pointer-events-none">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <FileUp size={36} strokeWidth={1.5} />
            </div>
            <p className="text-lg font-bold text-slate-700 mb-1">Chạm để chọn file</p>
            <p className="text-sm text-slate-400">hoặc kéo thả vào đây</p>
          </div>
        )}
      </div>

      <div className="flex justify-center gap-6 mt-8">
           <div className="flex flex-col items-center gap-2">
             <div className="w-12 h-12 rounded-2xl bg-pink-50 flex items-center justify-center text-pink-500 shadow-sm border border-pink-100"><FileAudio size={20}/></div>
             <span className="text-xs font-medium text-slate-500">Audio</span>
           </div>
           <div className="flex flex-col items-center gap-2">
             <div className="w-12 h-12 rounded-2xl bg-blue-50 flex items-center justify-center text-blue-500 shadow-sm border border-blue-100"><FileIcon size={20}/></div>
             <span className="text-xs font-medium text-slate-500">Word</span>
           </div>
           <div className="flex flex-col items-center gap-2">
             <div className="w-12 h-12 rounded-2xl bg-emerald-50 flex items-center justify-center text-emerald-500 shadow-sm border border-emerald-100"><FileText size={20}/></div>
             <span className="text-xs font-medium text-slate-500">PDF</span>
           </div>
      </div>

      {error && (
        <div className="mt-6 w-full p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center text-red-600 text-sm animate-in fade-in slide-in-from-top-2 shadow-sm">
          <AlertCircle size={20} className="mr-3 flex-shrink-0" />
          <span className="font-medium">{error}</span>
        </div>
      )}
    </div>
  );
};