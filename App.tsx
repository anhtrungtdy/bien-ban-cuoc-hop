import React, { useState, useEffect } from 'react';
import { Steps } from './components/Steps';
import { UploadedFile, AppStep, ProcessingStatus, GenerationResult, RawMeetingData } from './types';
import { UploadSection } from './components/UploadSection';
import { ProcessingSection } from './components/ProcessingSection';
import { ResultSection } from './components/ResultSection';
import { RawPreviewSection } from './components/RawPreviewSection'; 
import { ApiKeyModal } from './components/ApiKeyModal';
import { extractRawMeetingData, mapContentToTemplate, generateFinalMinutes, getSystemApiKey } from './services/geminiService';
import { extractPlaceholders, fetchTemplateFromUrl } from './utils/fileHelpers';
import { Bot, MoreVertical } from 'lucide-react';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(() => {
    const saved = localStorage.getItem('mm_currentStep');
    return saved ? parseInt(saved) : AppStep.UPLOAD;
  });

  const [furthestStep, setFurthestStep] = useState<AppStep>(() => {
    const saved = localStorage.getItem('mm_furthestStep');
    return saved ? parseInt(saved) : AppStep.UPLOAD;
  });

  const [result, setResult] = useState<GenerationResult | null>(null);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [rawMeetingData, setRawMeetingData] = useState<RawMeetingData | null>(null);

  // Template is now strictly controlled
  const [template, setTemplate] = useState<string>("");
  const [templateFileRaw, setTemplateFileRaw] = useState<File | null>(null);
  const [isTemplateLoaded, setIsTemplateLoaded] = useState(false);

  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    message: '',
    progress: 0
  });
  
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Load the hardcoded template on start
  useEffect(() => {
    const loadDefaultTemplate = async () => {
        try {
            const TEMPLATE_URL = "http://pvikhanhhoa.com/bienbanhop.docx";
            const { text, file } = await fetchTemplateFromUrl(TEMPLATE_URL);
            setTemplate(text);
            setTemplateFileRaw(file);
            setIsTemplateLoaded(true);
            console.log("Template loaded successfully from", TEMPLATE_URL);
        } catch (error) {
            console.error("Failed to load default template:", error);
            // Don't block app, but maybe show a warning if needed. 
            // Users can technically proceed but mapping might be generic.
        }
    };
    if (!isTemplateLoaded) {
        loadDefaultTemplate();
    }
  }, [isTemplateLoaded]);

  useEffect(() => {
    localStorage.setItem('mm_currentStep', currentStep.toString());
    if (currentStep > furthestStep) {
      setFurthestStep(currentStep);
    }
  }, [currentStep]);

  useEffect(() => {
    localStorage.setItem('mm_furthestStep', furthestStep.toString());
  }, [furthestStep]);

  const handleFileSelected = async (selectedFile: UploadedFile, userContext: string) => {
    setFile(selectedFile);
    await startRawExtraction(selectedFile, userContext);
  };

  const startRawExtraction = async (selectedFile: UploadedFile, userContext: string) => {
    setCurrentStep(AppStep.PROCESSING);
    setProcessingStatus({ isProcessing: true, message: 'Đang trích xuất dữ liệu chi tiết...', progress: 20 });

    try {
        const apiKey = getSystemApiKey();
        if (!apiKey) throw new Error("MISSING_API_KEY");

        // apiKey handled internally by service
        const data = await extractRawMeetingData(selectedFile, userContext);
        setRawMeetingData(data);
        
        setProcessingStatus({ isProcessing: false, message: 'Hoàn tất', progress: 100 });
        const nextStep = AppStep.RAW_PREVIEW;
        setCurrentStep(nextStep);
        if (nextStep > furthestStep) setFurthestStep(nextStep);

    } catch (error: any) {
        handleError(error);
    }
  };

  const handleConfirmRawData = async () => {
    // Directly go to processing/mapping, skipping template selection
    await handleStartMapping();
  };

  const handleStartMapping = async () => {
    if (!rawMeetingData) return;

    setCurrentStep(AppStep.PROCESSING);
    setProcessingStatus({ isProcessing: true, message: 'Đang phân tích cấu trúc mẫu...', progress: 30 });

    try {
      const apiKey = getSystemApiKey(); 
      if (!apiKey) throw new Error("MISSING_API_KEY");

      // Use the pre-loaded template text
      let keys: string[] = [];
      let templateContentText = template;
      
      if (template) {
         keys = extractPlaceholders(template);
      }

      if (keys.length > 0) {
        setProcessingStatus({ isProcessing: true, message: `AI đang tổng hợp dữ liệu cho ${keys.length} trường thông tin...`, progress: 60 });
        // apiKey handled internally
        const genResult = await mapContentToTemplate(rawMeetingData, keys);
        setResult(genResult);
      } else {
        setProcessingStatus({ isProcessing: true, message: `Đang tối ưu hóa nội dung biên bản...`, progress: 60 });
        // apiKey handled internally
        const genResult = await generateFinalMinutes(rawMeetingData, templateContentText);
        setResult(genResult);
      }
      
      setProcessingStatus({ isProcessing: false, message: 'Hoàn tất!', progress: 100 });
      const nextStep = AppStep.RESULT;
      setCurrentStep(nextStep);
      if (nextStep > furthestStep) setFurthestStep(nextStep);

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
    if (step <= furthestStep) {
      setCurrentStep(step);
    }
  };

  const handleReset = () => {
    if (confirm("Bạn có chắc chắn muốn làm mới? Dữ liệu hiện tại sẽ bị xóa.")) {
      setFile(null);
      setResult(null);
      setRawMeetingData(null);
      // We don't reset templateFileRaw as it is hardcoded/fetched once
      setProcessingStatus({ isProcessing: false, message: '', progress: 0 });
      setCurrentStep(AppStep.UPLOAD);
      setFurthestStep(AppStep.UPLOAD);
      localStorage.removeItem('mm_currentStep');
      localStorage.removeItem('mm_furthestStep');
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50 font-sans text-slate-900 relative">
      <ApiKeyModal isOpen={showApiKeyModal} onClose={() => setShowApiKeyModal(false)} />
      
      {/* Native-style Top App Bar */}
      <header className="bg-slate-50/80 backdrop-blur-md sticky top-0 z-50 h-16 flex-shrink-0 px-4 flex items-center justify-between border-b border-slate-100">
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => window.location.reload()}>
            <div className="bg-indigo-100 text-indigo-600 p-2 rounded-xl">
              <Bot className="w-5 h-5" strokeWidth={2.5} />
            </div>
            <h1 className="text-lg font-bold text-slate-800 tracking-tight">
              MinuteMaster
            </h1>
          </div>
          <button className="p-2 text-slate-500 hover:bg-slate-100 rounded-full active:bg-slate-200 transition-colors">
             <MoreVertical size={22} />
          </button>
      </header>

      <main className="flex-1 overflow-y-auto no-scrollbar scroll-smooth relative">
        <div className="max-w-3xl mx-auto px-4 py-4 min-h-full pb-20">
          <div className="mb-6 sticky top-0 z-40 bg-slate-50/95 pt-2 pb-2 backdrop-blur-sm -mx-4 px-4 border-b border-slate-100/50">
             <Steps 
                currentStep={currentStep} 
                furthestStep={furthestStep} 
                onStepClick={handleStepClick} 
             />
          </div>
          
          <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 ease-out">
            {currentStep === AppStep.UPLOAD && <UploadSection onFileSelected={handleFileSelected} />}
            
            {currentStep === AppStep.RAW_PREVIEW && rawMeetingData && (
                <RawPreviewSection 
                    data={rawMeetingData} 
                    onUpdateData={setRawMeetingData} 
                    onNext={handleConfirmRawData} 
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
    </div>
  );
}

export default App;