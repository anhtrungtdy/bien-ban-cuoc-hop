import React from 'react';
import { AppStep } from '../types';
import { Check } from 'lucide-react';

interface StepsProps {
  currentStep: AppStep;
  onStepClick?: (step: AppStep) => void;
}

const steps = [
  { id: AppStep.UPLOAD, title: 'Tải tài liệu' },
  { id: AppStep.RAW_PREVIEW, title: 'Nội dung thô' }, // New Step UI
  { id: AppStep.TEMPLATE, title: 'Chọn Mẫu' },
  { id: AppStep.PROCESSING, title: 'Xử lý' },
  { id: AppStep.RESULT, title: 'Kết quả' },
];

export const Steps: React.FC<StepsProps> = ({ currentStep, onStepClick }) => {
  return (
    <div className="w-full py-6">
      <div className="flex items-center justify-between w-full relative">
        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 w-full h-1 bg-slate-200 -z-10 rounded-full"></div>
        <div 
            className="absolute left-0 top-1/2 transform -translate-y-1/2 h-1 bg-indigo-600 -z-10 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${(currentStep / (steps.length - 1)) * 100}%` }}
        ></div>

        {steps.map((step) => {
          const isCompleted = currentStep > step.id;
          const isCurrent = currentStep === step.id;
          const isClickable = onStepClick && step.id < currentStep;

          return (
            <div 
              key={step.id} 
              className={`flex flex-col items-center bg-transparent group ${isClickable ? 'cursor-pointer' : 'cursor-default'}`}
              onClick={() => isClickable && onStepClick(step.id)}
            >
              <div 
                className={`w-8 h-8 md:w-10 md:h-10 rounded-full flex items-center justify-center border-2 transition-all duration-300 relative
                  ${isCompleted ? 'bg-indigo-600 border-indigo-600 text-white' : 
                    isCurrent ? 'bg-white border-indigo-600 text-indigo-600 shadow-md scale-110' : 
                    'bg-slate-100 border-slate-300 text-slate-400'}
                  ${isClickable ? 'hover:scale-110 hover:border-indigo-400' : ''}
                `}
              >
                {isCompleted ? <Check size={16} /> : <span className="text-xs md:text-sm font-bold">{step.id + 1}</span>}
              </div>
              <span className={`mt-2 text-[10px] md:text-sm font-medium transition-colors duration-300 select-none ${isCurrent ? 'text-indigo-700' : 'text-slate-500 group-hover:text-indigo-500'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
};