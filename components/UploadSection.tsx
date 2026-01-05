import React, { useCallback, useState, useEffect } from 'react';
import { UploadedFile, FileType, Participant } from '../types';
import { processUploadedFile, formatFileSize } from '../utils/fileHelpers';
import { identifyParticipants, getSystemApiKey } from '../services/geminiService';
import { UploadCloud, FileAudio, FileText, File as FileIcon, AlertCircle, Loader2, ArrowRight, X, UserCheck, Users, Plus, AlertTriangle } from 'lucide-react';

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
    setIsAnalyzing(true);
    const apiKey = getSystemApiKey();
    if (apiKey) {
        const foundParticipants = await identifyParticipants(file, apiKey);
        setParticipants(foundParticipants);
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
            // If user manually edits, remove ambiguous flag
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
        // Compile context string from structured data
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
      case FileType.AUDIO: return <FileAudio size={24} className="text-pink-500" />;
      case FileType.PDF: return <FileText size={24} className="text-red-500" />;
      case FileType.DOCX: return <FileIcon size={24} className="text-blue-500" />;
      default: return <FileText size={24} className="text-slate-500" />;
    }
  };

  // --- RENDER STAGED VIEW (Initial Scan & Edit) ---
  if (stagedFile) {
      return (
        <div className="w-full max-w-2xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-300 pb-20">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
                {/* Header File Info */}
                <div className="p-4 bg-slate-50 border-b border-slate-100 flex items-center justify-between sticky top-0 z-10">
                    <div className="flex items-center space-x-3">
                        <div className="p-2 bg-white rounded-lg shadow-sm">
                            {getFileIcon(stagedFile.type)}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-800 truncate max-w-[180px] md:max-w-xs">{stagedFile.name}</h3>
                            <p className="text-xs text-slate-500">{formatFileSize(stagedFile.size)}</p>
                        </div>
                    </div>
                    <button onClick={handleCancel} className="text-slate-400 hover:text-red-500 transition-colors p-2 rounded-full hover:bg-red-50">
                        <X size={20} />
                    </button>
                </div>
                
                <div className="p-0">
                    {isAnalyzing ? (
                        <div className="p-12 flex flex-col items-center justify-center text-center">
                            <Loader2 className="w-10 h-10 text-indigo-600 animate-spin mb-4" />
                            <h4 className="text-lg font-bold text-slate-800">Đang quét người tham gia...</h4>
                            <p className="text-sm text-slate-500">AI đang phân tích file để tìm tên và chức vụ.</p>
                        </div>
                    ) : (
                        <div className="bg-slate-50/50">
                            <div className="p-4 pb-2">
                                <h4 className="text-sm font-bold text-indigo-900 uppercase tracking-wider flex items-center">
                                    <Users size={16} className="mr-2"/> Xác nhận thành phần ({participants.length})
                                </h4>
                                <p className="text-xs text-slate-500 mt-1">Vui lòng kiểm tra kỹ giới tính (Ông/Bà) và chức vụ.</p>
                            </div>

                            <div className="space-y-2 px-2 pb-4">
                                {participants.map((p) => (
                                    <div 
                                        key={p.id} 
                                        className={`group bg-white p-3 rounded-xl border shadow-sm flex items-start gap-3 transition-all hover:shadow-md
                                            ${p.isAmbiguous ? 'border-amber-300 ring-2 ring-amber-100' : 'border-slate-200 hover:border-indigo-300'}
                                        `}
                                    >
                                        <div className={`mt-1 w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors
                                            ${p.gender === 'Ông' ? 'bg-blue-100 text-blue-600' : p.gender === 'Bà' ? 'bg-pink-100 text-pink-600' : 'bg-slate-100 text-slate-500'}
                                        `}>
                                            {p.gender === 'Ông' ? 'Mr' : p.gender === 'Bà' ? 'Ms' : '?'}
                                        </div>
                                        
                                        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-2 relative">
                                            {p.isAmbiguous && (
                                                <div className="absolute -top-4 -right-2 bg-amber-100 text-amber-700 text-[10px] px-2 py-0.5 rounded-full font-bold flex items-center">
                                                    <AlertTriangle size={10} className="mr-1"/> Cần kiểm tra
                                                </div>
                                            )}
                                            <div className="md:col-span-2">
                                                <select 
                                                    className={`w-full text-sm font-medium border rounded-lg px-2 py-2 focus:ring-1 focus:ring-indigo-500
                                                        ${!p.gender ? 'bg-amber-50 border-amber-300 text-amber-800' : 'bg-slate-50 border-slate-200'}
                                                    `}
                                                    value={p.gender}
                                                    onChange={(e) => handleUpdateParticipant(p.id, 'gender', e.target.value)}
                                                >
                                                    <option value="">--</option>
                                                    <option value="Ông">Ông</option>
                                                    <option value="Bà">Bà</option>
                                                </select>
                                            </div>
                                            <div className="md:col-span-4">
                                                <input 
                                                    className="w-full text-sm font-bold text-slate-800 bg-transparent border-b border-transparent hover:border-slate-300 focus:border-indigo-500 focus:bg-white rounded px-2 py-2 placeholder-slate-400"
                                                    value={p.name}
                                                    placeholder="Tên người tham gia"
                                                    onChange={(e) => handleUpdateParticipant(p.id, 'name', e.target.value)}
                                                />
                                            </div>
                                            <div className="md:col-span-6">
                                                <input 
                                                    className={`w-full text-sm bg-slate-50 border rounded-lg px-3 py-2 placeholder-slate-400 focus:ring-1 focus:ring-indigo-500
                                                        ${!p.role ? 'border-amber-200 bg-amber-50/50' : 'border-slate-200'}
                                                    `}
                                                    value={p.role}
                                                    placeholder="Chức vụ (VD: Giám đốc)"
                                                    onChange={(e) => handleUpdateParticipant(p.id, 'role', e.target.value)}
                                                />
                                            </div>
                                        </div>

                                        <button onClick={() => handleRemoveParticipant(p.id)} className="text-slate-300 hover:text-red-500 p-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <X size={16} />
                                        </button>
                                    </div>
                                ))}

                                <button onClick={handleAddParticipant} className="w-full py-3 border border-dashed border-indigo-300 rounded-xl text-indigo-600 text-sm font-medium hover:bg-indigo-50 flex items-center justify-center transition-colors mt-2">
                                    <Plus size={16} className="mr-1" /> Thêm người tham gia
                                </button>
                            </div>

                            <div className="p-4 border-t border-slate-100 bg-white">
                                <label className="block text-xs font-bold text-slate-500 uppercase mb-2">Ghi chú thêm cho AI</label>
                                <textarea 
                                    value={analysisNote}
                                    onChange={(e) => setAnalysisNote(e.target.value)}
                                    placeholder="Ví dụ: Cuộc họp này bàn về dự án X, Ông A là chủ trì..."
                                    className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 min-h-[80px]"
                                />
                            </div>
                        </div>
                    )}
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-white border-t border-slate-100 sticky bottom-0 z-10 flex gap-3">
                     <button 
                        onClick={handleCancel}
                        className="flex-1 py-3 bg-white border border-slate-300 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
                    >
                        Hủy
                    </button>
                    <button 
                        onClick={handleStart}
                        disabled={isAnalyzing}
                        className="flex-[2] py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 flex items-center justify-center transition-all transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        Tiếp tục <ArrowRight size={18} className="ml-2" />
                    </button>
                </div>
            </div>
        </div>
      );
  }

  // --- RENDER UPLOAD VIEW ---
  return (
    <div className="w-full max-w-lg mx-auto flex flex-col items-center justify-center h-full">
      <div className="text-center mb-6">
        <h2 className="text-xl font-bold text-slate-800">Bắt đầu phiên họp</h2>
        <p className="text-sm text-slate-500 mt-1">Tải lên file để AI nhận diện người tham gia</p>
      </div>

      <div 
        className={`relative w-full aspect-square md:aspect-[4/3] max-h-80 rounded-3xl border-2 border-dashed transition-all duration-300 flex flex-col items-center justify-center overflow-hidden cursor-pointer group active:scale-95
          ${dragActive ? 'border-indigo-500 bg-indigo-50' : 'border-slate-200 bg-white shadow-sm hover:border-indigo-300'}
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
            <p className="text-indigo-900 font-medium">Đang đọc file...</p>
          </div>
        ) : (
          <div className="flex flex-col items-center z-10 p-6 text-center pointer-events-none">
            <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform duration-300">
              <UploadCloud size={36} strokeWidth={1.5} />
            </div>
            <p className="text-lg font-bold text-slate-700 mb-2">Chạm để tải lên</p>
            <p className="text-xs text-slate-400 mb-6">Hỗ trợ MP3, M4A, PDF, DOCX</p>
            
            <div className="flex gap-3">
               <div className="flex flex-col items-center">
                 <div className="w-8 h-8 rounded-lg bg-pink-50 flex items-center justify-center text-pink-500 mb-1"><FileAudio size={16}/></div>
                 <span className="text-[10px] text-slate-400">Audio</span>
               </div>
               <div className="flex flex-col items-center">
                 <div className="w-8 h-8 rounded-lg bg-blue-50 flex items-center justify-center text-blue-500 mb-1"><FileIcon size={16}/></div>
                 <span className="text-[10px] text-slate-400">Doc</span>
               </div>
               <div className="flex flex-col items-center">
                 <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 mb-1"><FileText size={16}/></div>
                 <span className="text-[10px] text-slate-400">Text</span>
               </div>
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="mt-4 w-full p-3 bg-red-50 border border-red-100 rounded-xl flex items-center text-red-600 text-sm animate-in fade-in slide-in-from-top-2">
          <AlertCircle size={18} className="mr-2 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
};