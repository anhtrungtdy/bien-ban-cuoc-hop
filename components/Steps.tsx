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
  // Template step removed
  { id: AppStep.PROCESSING, title: 'Xử lý', icon: Sparkles },
  { id: AppStep.RESULT, title: 'KQ', icon: CheckCircle2 },
];

export const Steps: React.FC<StepsProps> = ({ currentStep, furthestStep, onStepClick }) => {
  return (
    <div className="w-full">
      <div className="flex items-center justify-between relative px-2">
        {/* Background Line */}
        <div className="absolute left-4 right-4 top-1/2 transform -translate-y-1/2 h-0.5 bg-slate-200 -z-10"></div>
        {/* Progress Line */}
        <div 
            className="absolute left-4 top-1/2 transform -translate-y-1/2 h-0.5 bg-indigo-600 -z-10 transition-all duration-500 ease-out"
            style={{ width: `calc(${Math.min((currentStep / (steps.length - 1)) * 100, 100)}% - 2rem)` }}
        ></div>

        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isReachable = step.id <= furthestStep;
          const Icon = step.icon;
          const isClickable = onStepClick && isReachable && step.id !== AppStep.PROCESSING; 

          return (
            <div 
              key={step.id} 
              className={`flex flex-col items-center group ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              onClick={() => isClickable && onStepClick && onStepClick(step.id)}
            >
              <div 
                className={`w-8 h-8 rounded-full flex items-center justify-center border transition-all duration-300 z-10
                  ${isCompleted 
                    ? 'bg-indigo-600 border-indigo-600 text-white shadow-md' 
                    : isCurrent 
                      ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-50 shadow-lg scale-110' 
                      : isReachable
                        ? 'bg-indigo-50 border-indigo-200 text-indigo-400'
                        : 'bg-slate-50 border-slate-300 text-slate-300'}
                `}
              >
                {isCompleted ? <Check size={14} strokeWidth={3} /> : <Icon size={14} strokeWidth={isCurrent ? 2.5 : 2} />}
              </div>
              <span 
                className={`absolute mt-10 text-[10px] font-medium tracking-wide transition-all duration-300 transform
                  ${isCurrent ? 'opacity-100 translate-y-0 text-indigo-600' : 'opacity-0 -translate-y-2 pointer-events-none md:opacity-100 md:translate-y-0 md:text-slate-400'}
                `}
              >
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};