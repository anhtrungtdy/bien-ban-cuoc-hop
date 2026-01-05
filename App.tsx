import React, { useState, useEffect } from 'react';
import { Steps } from './components/Steps';
import { UploadedFile, AppStep, ProcessingStatus, DEFAULT_TEMPLATE, GenerationResult, ProcessingMode, RawMeetingData } from './types';
import { UploadSection } from './components/UploadSection';
import { TemplateSection } from './components/TemplateSection';
import { ProcessingSection } from './components/ProcessingSection';
import { ResultSection } from './components/ResultSection';
import { RawPreviewSection } from './components/RawPreviewSection'; // New Import
import { ApiKeyModal } from './components/ApiKeyModal';
import { extractRawMeetingData, mapContentToTemplate, generateFinalMinutes } from './services/geminiService'; // Updated Imports
import { extractPlaceholders } from './utils/fileHelpers';
import { Bot, Info } from 'lucide-react';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(() => {
    const saved = localStorage.getItem('mm_currentStep');
    return saved ? parseInt(saved) : AppStep.UPLOAD;
  });

  const [result, setResult] = useState<GenerationResult | null>(null);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [rawMeetingData, setRawMeetingData] = useState<RawMeetingData | null>(null); // State for Raw Data

  const [template, setTemplate] = useState<string>(() => {
    return localStorage.getItem('minuteMaster_template') || DEFAULT_TEMPLATE;
  });

  const [templateFile, setTemplateFile] = useState<UploadedFile | null>(null);
  const [templateFileRaw, setTemplateFileRaw] = useState<File | null>(null);

  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    message: '',
    progress: 0
  });
  
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  useEffect(() => {
    localStorage.setItem('mm_currentStep', currentStep.toString());
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem('minuteMaster_template', template);
  }, [template]);

  const getApiKey = () => {
    const envKey = process.env.API_KEY;
    if (!envKey) return null;
    const keys = envKey.split(',').map(k => k.trim()).filter(k => k);
    return keys.length > 0 ? keys[Math.floor(Math.random() * keys.length)] : null;
  };

  // Step 1: Handle File Upload -> Go to Raw Extraction
  const handleFileSelected = async (selectedFile: UploadedFile) => {
    setFile(selectedFile);
    await startRawExtraction(selectedFile);
  };

  // Step 1.5: Raw Extraction Logic
  const startRawExtraction = async (selectedFile: UploadedFile) => {
    setCurrentStep(AppStep.PROCESSING);
    setProcessingStatus({ isProcessing: true, message: 'Đang chuyển đổi nội dung sang dữ liệu thô...', progress: 20 });

    try {
        const apiKey = getApiKey();
        if (!apiKey) throw new Error("MISSING_API_KEY");

        const data = await extractRawMeetingData(selectedFile, apiKey);
        setRawMeetingData(data);
        
        setProcessingStatus({ isProcessing: false, message: 'Hoàn tất', progress: 100 });
        setCurrentStep(AppStep.RAW_PREVIEW);

    } catch (error: any) {
        handleError(error);
    }
  };

  // Step 2: Confirm Raw Data -> Go to Template
  const handleConfirmRawData = () => {
    setCurrentStep(AppStep.TEMPLATE);
  };

  // Step 3: Handle Final Processing (Smart Mapping)
  const handleStartMapping = async () => {
    if (!rawMeetingData) return;

    setCurrentStep(AppStep.PROCESSING);
    setProcessingStatus({ isProcessing: true, message: 'Đang phân tích cấu trúc Template...', progress: 30 });

    try {
      const apiKey = getApiKey(); 
      if (!apiKey) throw new Error("MISSING_API_KEY");

      // Strategy:
      // 1. Try to find explicit placeholders {key}
      // 2. If found -> Use strict "Fill Template" mode (Preserves Word layout exactly)
      // 3. If NOT found -> Use smart "Generate" mode (AI mimics structure)
      
      let keys: string[] = [];
      let templateContentText = template;

      if (templateFile && templateFile.data) {
        keys = extractPlaceholders(templateFile.data); // .data is Raw Text for DOCX extraction
        templateContentText = templateFile.data;
      } else if (!templateFile) {
        keys = extractPlaceholders(template);
      }

      if (keys.length > 0) {
        // --- STRICT MODE (Preserve Layout) ---
        setProcessingStatus({ 
            isProcessing: true, 
            message: `Đã tìm thấy ${keys.length} vị trí điền. Đang xử lý chế độ Chính xác...`, 
            progress: 60 
        });
        const genResult = await mapContentToTemplate(rawMeetingData, keys, apiKey);
        setResult(genResult);

      } else {
        // --- SMART FALLBACK MODE (AI Mimic) ---
        setProcessingStatus({ 
            isProcessing: true, 
            message: `Không tìm thấy từ khóa {...}. Đang chuyển sang chế độ Tự động viết biên bản theo mẫu...`, 
            progress: 60 
        });

        // Use AI to generate a full markdown document using the template text as a style guide
        const genResult = await generateFinalMinutes(rawMeetingData, templateContentText, apiKey);
        setResult(genResult);
      }
      
      setProcessingStatus({ isProcessing: false, message: 'Hoàn tất!', progress: 100 });
      setCurrentStep(AppStep.RESULT);

    } catch (error: any) {
      handleError(error);
    }
  };

  const handleError = (error: any) => {
    console.error(error);
    let errorMsg = error.message || "Lỗi không xác định.";
    if (errorMsg === "MISSING_API_KEY") {
        setShowApiKeyModal(true);
        errorMsg = "Thiếu API Key.";
    }
    setProcessingStatus({ isProcessing: false, message: 'Lỗi', progress: 0, error: errorMsg });
  };

  const handleStepClick = (step: AppStep) => {
    if (step > currentStep) return; // Prevent jumping forward
    setCurrentStep(step);
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setRawMeetingData(null);
    setTemplateFile(null); 
    setTemplateFileRaw(null);
    setProcessingStatus({ isProcessing: false, message: '', progress: 0 });
    setCurrentStep(AppStep.UPLOAD);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      <ApiKeyModal isOpen={showApiKeyModal} onClose={() => setShowApiKeyModal(false)} />
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Bot className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              MinuteMaster AI
            </h1>
          </div>
          <div className="hidden md:flex items-center text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
            <Info size={12} className="mr-1" /> Enterprise Edition
          </div>
        </div>
      </header>

      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="mb-8"><Steps currentStep={currentStep} onStepClick={handleStepClick} /></div>
          <div className="transition-all duration-500 ease-in-out">
            {currentStep === AppStep.UPLOAD && <UploadSection onFileSelected={handleFileSelected} />}
            
            {currentStep === AppStep.RAW_PREVIEW && rawMeetingData && (
                <RawPreviewSection 
                    data={rawMeetingData} 
                    onUpdateData={setRawMeetingData} 
                    onNext={handleConfirmRawData} 
                />
            )}

            {currentStep === AppStep.TEMPLATE && (
              <TemplateSection 
                uploadedFile={file || { name: 'File đã tải', type: 'UNKNOWN', size: 0, data: '', mimeType: '' } as any}
                template={template}
                templateFile={templateFile}
                setTemplate={setTemplate}
                setTemplateFile={setTemplateFile}
                setTemplateFileRaw={setTemplateFileRaw}
                onNext={handleStartMapping}
                onBack={() => setCurrentStep(AppStep.RAW_PREVIEW)}
              />
            )}
            
            {currentStep === AppStep.PROCESSING && <ProcessingSection status={processingStatus} onRetry={() => setCurrentStep(AppStep.UPLOAD)} />}
            
            {currentStep === AppStep.RESULT && result && (
              <ResultSection 
                result={result} 
                templateFileRaw={templateFileRaw}
                onReset={handleReset} 
              />
            )}
          </div>
        </div>
      </main>
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">© {new Date().getFullYear()} MinuteMaster AI.</div>
      </footer>
    </div>
  );
}

export default App;