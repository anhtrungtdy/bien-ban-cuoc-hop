import React, { useState } from 'react';
import { Steps } from './components/Steps';
import { UploadSection } from './components/UploadSection';
import { TemplateSection } from './components/TemplateSection';
import { ProcessingSection } from './components/ProcessingSection';
import { ResultSection } from './components/ResultSection';
import { AppStep, UploadedFile, DEFAULT_TEMPLATE, ProcessingStatus } from './types';
import { generateMinutes } from './services/geminiService';
import { Bot, Info } from 'lucide-react';

function App() {
  const [currentStep, setCurrentStep] = useState<AppStep>(AppStep.UPLOAD);
  const [file, setFile] = useState<UploadedFile | null>(null);
  const [template, setTemplate] = useState<string>(DEFAULT_TEMPLATE);
  const [processingStatus, setProcessingStatus] = useState<ProcessingStatus>({
    isProcessing: false,
    message: '',
    progress: 0
  });
  const [result, setResult] = useState<string>('');

  const handleFileSelected = (selectedFile: UploadedFile) => {
    setFile(selectedFile);
    setCurrentStep(AppStep.TEMPLATE);
  };

  const handleStartProcessing = async () => {
    if (!file) return;

    setCurrentStep(AppStep.PROCESSING);
    setProcessingStatus({ isProcessing: true, message: 'Đang khởi tạo...', progress: 5 });

    try {
      const apiKey = process.env.API_KEY; 
      if (!apiKey) {
        throw new Error("MISSING_API_KEY");
      }

      // Start the generation
      const minutes = await generateMinutes(file, template, apiKey);
      
      setResult(minutes);
      setProcessingStatus({ isProcessing: false, message: 'Hoàn tất!', progress: 100 });
      setCurrentStep(AppStep.RESULT);

    } catch (error: any) {
      console.error(error);
      
      let errorMsg = error.message || "Không thể xử lý yêu cầu.";
      
      if (errorMsg === "MISSING_API_KEY") {
        errorMsg = "Lỗi cấu hình Hosting: Không tìm thấy API Key. Hãy đảm bảo bạn đã thiết lập biến môi trường `API_KEY` trên server hoặc platform hosting của mình.";
      }

      setProcessingStatus({
        isProcessing: false,
        message: 'Lỗi',
        progress: 0,
        error: errorMsg
      });
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult('');
    setTemplate(DEFAULT_TEMPLATE);
    setProcessingStatus({ isProcessing: false, message: '', progress: 0 });
    setCurrentStep(AppStep.UPLOAD);
  };

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 font-sans text-slate-900">
      {/* Header */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg">
              <Bot className="text-white w-6 h-6" />
            </div>
            <h1 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-violet-600">
              MinuteMaster AI
            </h1>
          </div>
          <div className="flex items-center space-x-4">
             <div className="hidden md:flex items-center text-xs text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                <Info size={12} className="mr-1" />
                <span>Hosting Ready</span>
             </div>
             <div className="text-sm text-slate-500 hidden sm:block">
              Trợ lý họp thông minh
             </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-6xl mx-auto">
          {/* Progress Steps */}
          <div className="mb-8">
            <Steps currentStep={currentStep} />
          </div>

          {/* Dynamic Content based on Step */}
          <div className="transition-all duration-500 ease-in-out">
            {currentStep === AppStep.UPLOAD && (
              <UploadSection onFileSelected={handleFileSelected} />
            )}

            {currentStep === AppStep.TEMPLATE && file && (
              <TemplateSection 
                uploadedFile={file}
                template={template}
                setTemplate={setTemplate}
                onNext={handleStartProcessing}
                onBack={() => setCurrentStep(AppStep.UPLOAD)}
              />
            )}

            {currentStep === AppStep.PROCESSING && (
              <ProcessingSection 
                status={processingStatus} 
                onRetry={handleStartProcessing}
              />
            )}

            {currentStep === AppStep.RESULT && (
              <ResultSection 
                content={result} 
                onReset={handleReset}
              />
            )}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-6 mt-auto">
        <div className="max-w-6xl mx-auto px-4 text-center text-slate-400 text-sm">
          <p>© {new Date().getFullYear()} MinuteMaster AI. Powered by Google Gemini 2.5 Flash.</p>
        </div>
      </footer>
    </div>
  );
}

export default App;
