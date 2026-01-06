import React from 'react';
import { AppStep } from '../types';
import { Check, UploadCloud, FileText, Sparkles, CheckCircle2 } from 'lucide-react';

interface StepsProps {
  currentStep: AppStep;
  furthestStep: AppStep;
  onStepClick?: (step: AppStep) => void;
}

const steps = [
  { id: AppStep.UPLOAD, title: 'Upload', icon: UploadCloud },
  { id: AppStep.RAW_PREVIEW, title: 'Review', icon: FileText },
  { id: AppStep.PROCESSING, title: 'Xử lý', icon: Sparkles },
  { id: AppStep.RESULT, title: 'Kết quả', icon: CheckCircle2 },
];

export const Steps: React.FC<StepsProps> = ({ currentStep, furthestStep, onStepClick }) => {
  return (
    <div className="w-full flex justify-between items-center bg-white p-1.5 rounded-2xl shadow-sm border border-slate-100">
        {steps.map((step) => {
          const isCurrent = currentStep === step.id;
          const isCompleted = currentStep > step.id;
          const isReachable = step.id <= furthestStep;
          const Icon = step.icon;
          const isClickable = onStepClick && isReachable && step.id !== AppStep.PROCESSING; 

          return (
            <div 
              key={step.id} 
              className={`flex-1 flex items-center justify-center py-2.5 rounded-xl transition-all duration-300 relative
                ${isCurrent ? 'bg-indigo-50 text-indigo-700 shadow-sm' : ''}
                ${isClickable ? 'cursor-pointer active:scale-95' : 'cursor-default opacity-50'}
              `}
              onClick={() => isClickable && onStepClick && onStepClick(step.id)}
            >
                <div className="flex flex-col items-center gap-1">
                    <Icon 
                        size={20} 
                        strokeWidth={isCurrent ? 2.5 : 2}
                        className={isCurrent ? 'text-indigo-600' : isCompleted ? 'text-indigo-400' : 'text-slate-400'}
                    />
                    {isCurrent && (
                        <span className="text-[10px] font-bold tracking-wide animate-in fade-in slide-in-from-bottom-1 leading-none">
                            {step.title}
                        </span>
                    )}
                </div>
            </div>
          );
        })}
    </div>
  );
};