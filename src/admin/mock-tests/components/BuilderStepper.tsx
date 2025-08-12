import React from 'react';
import { Check, FileText, Search, Eye } from 'lucide-react';

interface BuilderStepperProps {
  currentStep: number;
  steps: { title: string; description: string }[];
}

export default function BuilderStepper({ currentStep, steps }: BuilderStepperProps) {
  const getStepIcon = (index: number, isCompleted: boolean, isCurrent: boolean) => {
    if (isCompleted) {
      return <Check className="h-5 w-5 text-white" />;
    }
    
    const icons = [FileText, Search, Eye];
    const Icon = icons[index] || FileText;
    
    return (
      <Icon 
        className={`h-5 w-5 ${
          isCurrent ? 'text-blue-600' : 'text-gray-400'
        }`} 
      />
    );
  };

  return (
    <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b border-blue-200 px-6 py-8">
      <div className="max-w-4xl mx-auto">
        <nav aria-label="Progress">
          <ol className="flex items-center justify-center">
            {steps.map((step, index) => {
              const stepNumber = index + 1;
              const isCompleted = stepNumber < currentStep;
              const isCurrent = stepNumber === currentStep;
              
              return (
                <li key={step.title} className={`relative ${index !== steps.length - 1 ? 'pr-16 sm:pr-32' : ''}`}>
                  {index !== steps.length - 1 && (
                    <div
                      className="absolute top-6 left-12 right-4 flex items-center"
                      aria-hidden="true"
                    >
                      <div className={`h-1 w-full rounded-full transition-all duration-500 ${
                        isCompleted || (isCurrent && index < currentStep - 1) 
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600' 
                          : 'bg-gray-200'
                      }`} />
                    </div>
                  )}
                  <div className="relative flex flex-col items-center">
                    <div
                      className={`flex h-12 w-12 items-center justify-center rounded-full transition-all duration-300 shadow-lg ${
                        isCompleted
                          ? 'bg-gradient-to-r from-blue-500 to-blue-600 border-2 border-blue-600 transform scale-110'
                          : isCurrent
                          ? 'border-4 border-blue-500 bg-white shadow-blue-200 transform scale-105'
                          : 'border-2 border-gray-300 bg-white'
                      }`}
                    >
                      {getStepIcon(index, isCompleted, isCurrent)}
                    </div>
                    <div className="mt-4 text-center">
                      <div
                        className={`text-sm font-semibold transition-colors duration-200 ${
                          isCurrent 
                            ? 'text-blue-700' 
                            : isCompleted 
                            ? 'text-blue-600' 
                            : 'text-gray-500'
                        }`}
                      >
                        {step.title}
                      </div>
                      <div className={`text-xs mt-1 transition-colors duration-200 ${
                        isCurrent 
                          ? 'text-blue-600' 
                          : isCompleted 
                          ? 'text-blue-500' 
                          : 'text-gray-400'
                      }`}>
                        {step.description}
                      </div>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </nav>
        
        {/* Progress bar */}
        <div className="mt-8">
          <div className="bg-gray-200 rounded-full h-2 max-w-md mx-auto">
            <div 
              className="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${((currentStep - 1) / (steps.length - 1)) * 100}%` }}
            />
          </div>
          <div className="text-center mt-2 text-sm text-blue-600 font-medium">
            Step {currentStep} of {steps.length}
          </div>
        </div>
      </div>
    </div>
  );
}
